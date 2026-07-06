// alchemy.run.ts — deploy path for manyface
// Usage: alchemy deploy (requires Cloudflare account, Access, and secrets)
// This file declares the deploy surface; actual deployment is gated by human approval.

export const config = {
  name: 'manyface',
  type: 'worker',
  compatibility_date: '2025-06-01',
  compatibility_flags: ['nodejs_compat'],
  vars: {
    ENVIRONMENT: 'production',
    POLICY_PATH: './policy.json',
  },
  r2_buckets: [
    {
      binding: 'ARTIFACTS',
      bucket_name: 'manyface-artifacts',
    },
  ],
  queues: [
    {
      binding: 'TOURNAMENT_QUEUE',
      queue_name: 'manyface-tournament',
    },
  ],
  durable_objects: [
    {
      name: 'TOURNAMENT_DO',
      class_name: 'TournamentDO',
    },
  ],
  workflows: [
    {
      binding: 'TOURNAMENT_WORKFLOW',
      name: 'manyface-tournament-workflow',
      class_name: 'TournamentWorkflow',
    },
  ],
  ai: {
    binding: 'AI_GATEWAY',
    gateway_id: 'manyface-gateway',
  },
  analytics_engine_datasets: [
    {
      binding: 'GATE_METRICS',
      dataset: 'manyface-gate-metrics',
    },
  ],
  routes: [
    {
      pattern: 'manyface.coey.dev',
      zone: 'coey.dev',
    },
  ],
} as const;

export const deploy = async () => {
  console.log('manyface deploy path declared.');
  console.log('Run: alchemy deploy --config alchemy.run.ts');
  console.log(
    'Requires: wrangler, Cloudflare API token, R2 bucket, Queue, DO namespace, Workflow, AI Gateway.',
  );
};
