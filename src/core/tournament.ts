import type { AdapterBundle } from '../adapters/adapter.contract.ts';
import type { LocalContainersAdapter } from '../adapters/local/containers.local.ts';
import type { Policy } from '../policy.ts';
import { buildCounterexamples, evaluateArtifact, pickWinner } from './gate.ts';
import { buildReceipt } from './receipt.ts';
import type {
  AdversaryConfig,
  Artifact,
  CandidateConfig,
  Counterexample,
  GateVerdict,
  RetainedArtifact,
  TournamentResult,
} from './types.ts';

export interface TournamentConfig {
  tournamentId: string;
  claim: string;
  candidates: CandidateConfig[];
  adversaries: AdversaryConfig[];
  policy: Policy;
}

export class Tournament {
  constructor(
    private readonly adapters: AdapterBundle,
    private readonly cellRegistry: LocalContainersAdapter,
  ) {}

  async run(config: TournamentConfig): Promise<TournamentResult> {
    const { tournamentId, claim, candidates, adversaries, policy } = config;

    const runId = await this.adapters.workflow.start(tournamentId, claim);

    const counterexamples: Counterexample[] = buildCounterexamples(adversaries);

    // Fan-out: produce artifacts in isolation (simulated via the container adapter).
    const artifactJobs = candidates.map((c) => ({
      candidateId: c.id,
      artifact: {
        candidateId: c.id,
        codeRef: c.codeRef,
        selfTests: c.selfTests,
      } satisfies Artifact,
    }));

    await this.adapters.queues.enqueue(
      artifactJobs.map((job) => ({
        id: `candidate-${job.candidateId}`,
        kind: 'candidate' as const,
        payload: job,
      })),
    );

    await this.adapters.queues.consume(async (job) => {
      // Local queue is synchronous for tests; real queue consumer would run
      // candidates in parallel Workers/Containers.
      void job;
    });

    // Evaluate every artifact against self-tests and adversarial counterexamples.
    const verdicts: GateVerdict[] = [];
    for (const candidate of candidates) {
      const artifact: Artifact = {
        candidateId: candidate.id,
        codeRef: candidate.codeRef,
        selfTests: candidate.selfTests,
      };
      const containerResult = await this.cellRegistry.execute({
        artifactId: artifact.candidateId,
        codeRef: artifact.codeRef,
        inputs: [],
      });
      const fn = (input: unknown) => {
        if (containerResult.error) throw new Error(containerResult.error);
        // Re-execute through the registry for each input; the local cell already
        // validated that the codeRef exists.
        return this.cellRegistry.execute({
          artifactId: artifact.candidateId,
          codeRef: artifact.codeRef,
          inputs: [input],
        });
      };
      // The gate needs a unary function; unwrap from the container result.
      const wrapper = async (input: unknown) => {
        const result = await fn(input);
        return (result.outputs as unknown[])[0];
      };
      const verdict = await evaluateArtifact(artifact, candidate, wrapper, counterexamples, policy);
      verdicts.push(verdict);
    }

    const winner = pickWinner(verdicts, policy);
    const retained: RetainedArtifact[] = verdicts.map((v) => ({
      candidateId: v.candidateId,
      codeRef: candidates.find((c) => c.id === v.candidateId)?.codeRef ?? '',
      passed: v.passed,
      failures: v.failures,
    }));

    const receipt = buildReceipt(
      tournamentId,
      claim,
      winner?.artifactId ?? null,
      verdicts,
      retained,
    );

    if (policy.retention.keepReceipts) {
      await this.adapters.r2.put({
        key: `receipts/${tournamentId}.json`,
        body: JSON.stringify(receipt, null, 2),
        contentType: 'application/json',
      });
    }

    if (policy.retention.keepLoserArtifacts) {
      for (const candidate of candidates) {
        await this.adapters.r2.put({
          key: `artifacts/${tournamentId}/${candidate.id}.json`,
          body: JSON.stringify({
            candidateId: candidate.id,
            codeRef: candidate.codeRef,
            selfTests: candidate.selfTests,
          }),
          contentType: 'application/json',
        });
      }
    }

    const result: TournamentResult = {
      tournamentId,
      claim,
      winnerId: winner?.artifactId ?? null,
      verdicts,
      retained,
      receipt,
    };

    await this.adapters.workflow.complete(runId, result);
    await this.adapters.durableObjects.setState(tournamentId, {
      tournamentId,
      claim,
      candidateOutputs: verdicts,
      adversaryOutputs: counterexamples,
      status: 'done',
    });

    return result;
  }
}
