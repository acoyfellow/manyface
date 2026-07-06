import { writeFileSync } from 'node:fs';
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

const result = await tournament.run({
  tournamentId: `demo-${Date.now()}`,
  claim: 'Sort an array of numbers in ascending order.',
  candidates: defaultSortingCandidates,
  adversaries: defaultSortingAdversaries,
  policy,
});

console.log('Claim:', result.claim);
console.log('Winner:', result.winnerId ?? 'none');
console.log('Verdicts:');
for (const v of result.verdicts) {
  console.log(`  ${v.candidateId}: passed=${v.passed} score=${v.score.toFixed(2)}`);
}

writeFileSync('proof/example-receipt.json', JSON.stringify(result.receipt, null, 2));
console.log('\nReceipt written to proof/example-receipt.json');
