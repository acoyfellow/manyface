import { describe, expect, it } from 'bun:test';
import type { AdapterBundle } from '../src/adapters/adapter.contract.ts';
import { LocalAiGatewayAdapter } from '../src/adapters/local/aiGateway.local.ts';
import { LocalContainersAdapter } from '../src/adapters/local/containers.local.ts';
import { LocalDurableObjectsAdapter } from '../src/adapters/local/durableObjects.local.ts';
import { LocalQueuesAdapter } from '../src/adapters/local/queues.local.ts';
import { LocalR2Adapter } from '../src/adapters/local/r2.local.ts';
import { LocalWorkflowAdapter } from '../src/adapters/local/workflow.local.ts';
import { defaultSortingAdversaries } from '../src/core/adversaries.ts';
import { defaultSortingCandidates } from '../src/core/candidates.ts';
import { sortingCellRegistry } from '../src/core/cells.ts';
import { buildCounterexamples, evaluateArtifact, pickWinner } from '../src/core/gate.ts';
import { buildReceipt } from '../src/core/receipt.ts';
import { Tournament } from '../src/core/tournament.ts';
import type { Artifact, CandidateConfig } from '../src/core/types.ts';
import { loadPolicy } from '../src/policy.ts';
import type { Policy } from '../src/policy.ts';

const policy = loadPolicy();

function createAdapters(): AdapterBundle {
  return {
    workflow: new LocalWorkflowAdapter(),
    queues: new LocalQueuesAdapter<unknown>(),
    durableObjects: new LocalDurableObjectsAdapter(),
    aiGateway: new LocalAiGatewayAdapter(policy.aiGateway.defaultModel),
    containers: new LocalContainersAdapter(new Map()),
    r2: new LocalR2Adapter(),
  };
}

describe('manyface', () => {
  describe('gate determinism', () => {
    it('produces same verdict order on repeated runs', async () => {
      const adapters = createAdapters();
      const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

      const result1 = await tournament.run({
        tournamentId: 'det-test-1',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      const result2 = await tournament.run({
        tournamentId: 'det-test-2',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      expect(result1.verdicts.map((v) => v.candidateId)).toEqual(
        result2.verdicts.map((v) => v.candidateId),
      );
      expect(result1.verdicts.map((v) => v.score)).toEqual(result2.verdicts.map((v) => v.score));
    });
  });

  describe('winner selection', () => {
    it('correct candidate wins, broken candidate loses', async () => {
      const adapters = createAdapters();
      const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

      const result = await tournament.run({
        tournamentId: 'winner-test',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      expect(result.winnerId).toBe('correct-sort');
      const correctVerdict = result.verdicts.find((v) => v.candidateId === 'correct-sort');
      expect(correctVerdict?.passed).toBe(true);

      const brokenVerdict = result.verdicts.find((v) => v.candidateId === 'broken-sort');
      expect(brokenVerdict?.passed).toBe(false);
    });

    it('returns null winner when every candidate fails', async () => {
      const adapters = createAdapters();
      const impossibleCellRegistry = new Map<string, (input: unknown) => unknown>([
        [
          'alwaysWrong',
          (_input: unknown) => {
            return [999];
          },
        ],
      ]);
      const tournament = new Tournament(
        adapters,
        new LocalContainersAdapter(impossibleCellRegistry),
      );

      const badCandidates: CandidateConfig[] = [
        {
          id: 'always-wrong',
          name: 'Always wrong',
          codeRef: 'alwaysWrong',
          selfTests: [{ id: 'st-1', input: [1, 2], expected: [1, 2] }],
        },
      ];

      const result = await tournament.run({
        tournamentId: 'null-winner-test',
        claim: 'Sort ascending.',
        candidates: badCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      expect(result.winnerId).toBeNull();
    });
  });

  describe('loser retention', () => {
    it('retains losers with failure evidence', async () => {
      const adapters = createAdapters();
      const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

      const result = await tournament.run({
        tournamentId: 'retention-test',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      expect(result.retained.length).toBe(defaultSortingCandidates.length);
      for (const r of result.retained) {
        expect(r.candidateId).toBeTruthy();
        if (!r.passed) {
          expect(r.failures.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('receipt shape', () => {
    it('writes a valid proof-spec receipt', async () => {
      const adapters = createAdapters();
      const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

      const result = await tournament.run({
        tournamentId: 'receipt-test',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });

      expect(result.receipt.schema).toBe('proof-spec/v0');
      expect(result.receipt.tournamentId).toBe('receipt-test');
      expect(result.receipt.claim).toBeTruthy();
      expect(result.receipt.assertions.length).toBeGreaterThan(0);
      expect(result.receipt.createdAt).toBeTruthy();
    });
  });

  describe('adversary counterexamples', () => {
    it('builds counterexamples from adversary configs', () => {
      const counterexamples = buildCounterexamples(defaultSortingAdversaries);
      expect(counterexamples.length).toBeGreaterThan(0);
      for (const cx of counterexamples) {
        expect(cx.adversaryId).toBeTruthy();
      }
    });
  });

  describe('baseline sequential measurement', () => {
    it('measures sequential execution time for comparison', async () => {
      const adapters = createAdapters();
      const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

      const start = performance.now();
      await tournament.run({
        tournamentId: 'baseline-seq',
        claim: 'Sort an array of numbers in ascending order.',
        candidates: defaultSortingCandidates,
        adversaries: defaultSortingAdversaries,
        policy,
      });
      const elapsed = performance.now() - start;

      expect(elapsed).toBeGreaterThan(0);
      expect(typeof elapsed).toBe('number');
    });
  });
});
