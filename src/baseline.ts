import type { AdapterBundle } from './adapters/adapter.contract.ts';
import { LocalAiGatewayAdapter } from './adapters/local/aiGateway.local.ts';
import { LocalContainersAdapter } from './adapters/local/containers.local.ts';
import { LocalDurableObjectsAdapter } from './adapters/local/durableObjects.local.ts';
import { LocalQueuesAdapter } from './adapters/local/queues.local.ts';
import { LocalR2Adapter } from './adapters/local/r2.local.ts';
import { LocalWorkflowAdapter } from './adapters/local/workflow.local.ts';
import { defaultSortingAdversaries } from './core/adversaries.ts';
import { defaultSortingCandidates } from './core/candidates.ts';
import { sortingCellRegistry } from './core/cells.ts';
import { Tournament } from './core/tournament.ts';
import { loadPolicy } from './policy.ts';

export interface BaselineMeasurement {
  label: string;
  sequentialWallMs: number;
  candidateCount: number;
  adversaryCount: number;
  totalTests: number;
  winnerId: string | null;
}

export async function measureSequentialBaseline(): Promise<BaselineMeasurement> {
  const policy = loadPolicy();
  const adapters: AdapterBundle = {
    workflow: new LocalWorkflowAdapter(),
    queues: new LocalQueuesAdapter<unknown>(),
    durableObjects: new LocalDurableObjectsAdapter(),
    aiGateway: new LocalAiGatewayAdapter(policy.aiGateway.defaultModel),
    containers: new LocalContainersAdapter(new Map()),
    r2: new LocalR2Adapter(),
  };
  const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));

  const start = performance.now();
  const result = await tournament.run({
    tournamentId: `baseline-seq-${Date.now()}`,
    claim: 'Sort an array of numbers in ascending order.',
    candidates: defaultSortingCandidates,
    adversaries: defaultSortingAdversaries,
    policy,
  });
  const elapsed = performance.now() - start;

  return {
    label: 'sequential-sorting-baseline',
    sequentialWallMs: elapsed,
    candidateCount: defaultSortingCandidates.length,
    adversaryCount: defaultSortingAdversaries.length,
    totalTests: result.verdicts.reduce(
      (sum, v) => sum + v.selfTestsTotal + v.counterexamplesTotal,
      0,
    ),
    winnerId: result.winnerId,
  };
}

declare const Bun: { main: boolean };
if (Bun.main) {
  const measurement = await measureSequentialBaseline();
  console.log(JSON.stringify(measurement, null, 2));
}
