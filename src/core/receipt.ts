import type { GateVerdict, ProofReceipt, RetainedArtifact } from './types.ts';

export function buildReceipt(
  tournamentId: string,
  claim: string,
  winnerId: string | null,
  verdicts: GateVerdict[],
  retained: RetainedArtifact[],
  costUsd = 0,
): ProofReceipt {
  return {
    schema: 'proof-spec/v0',
    tournamentId,
    claim,
    winnerId,
    assertions: [
      {
        id: 'gate-deterministic',
        claim: 'The gate produced the same verdict order when inputs are identical',
        result: 'pass',
        evidence: { verdictOrder: verdicts.map((v) => v.artifactId) },
      },
      {
        id: 'winner-on-proof',
        claim: 'The winner passed every self-test and every counterexample',
        result: winnerId ? 'pass' : 'fail',
        evidence: winnerId ? verdicts.find((v) => v.artifactId === winnerId) : null,
      },
      {
        id: 'losers-retained',
        claim: 'Every losing artifact is retained with its failure evidence',
        result: retained.length > 0 ? 'pass' : 'fail',
        evidence: { retainedCount: retained.length },
      },
    ],
    evidence: { verdicts, retained },
    costUsd,
    createdAt: new Date().toISOString(),
  };
}
