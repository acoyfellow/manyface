// alchemy.run.ts — validated deploy path for manyface.
//
// This file declares the production deploy surface for one Worker that serves
// the AX PWA tournament site plus the labeled local adapters. Running it
// executes `wrangler deploy --dry-run` as the finite acceptance gate; a real
// `wrangler deploy` is still gated by human approval and Cloudflare Access.
//
// Labeled local seams:
//   - Workflow/Queues/DO/R2 bindings are declared in wrangler.toml.
//   - AI Gateway and Containers/Loader seams stay local-only in this path.
//   - src/index.ts uses in-process Local* adapters, so no live API keys or
//     container hosts are required for the validated dry-run.

import { spawnSync } from 'node:child_process';

export interface DeploySurface {
  name: string;
  main: string;
  compatibility_date: string;
  compatibility_flags: string[];
  workers_dev: boolean;
  routes: Array<{ pattern: string; custom_domain: boolean }>;
  vars: Record<string, string>;
  assets: { directory: string; binding: string };
  bindings: {
    durableObjects: Array<{ name: string; class_name: string }>;
    workflows: Array<{ binding: string; name: string; class_name: string }>;
    queues: Array<{ binding: string; queue: string }>;
    r2: Array<{ binding: string; bucket_name: string }>;
    analytics: Array<{ binding: string; dataset: string }>;
  };
}

export const surface: DeploySurface = {
  name: 'manyface',
  main: 'src/index.ts',
  compatibility_date: '2025-06-01',
  compatibility_flags: ['nodejs_compat'],
  workers_dev: false,
  routes: [{ pattern: 'manyface.coey.dev', custom_domain: true }],
  vars: {
    ENVIRONMENT: 'production',
    POLICY_PATH: './policy.json',
  },
  assets: {
    directory: 'site/dist',
    binding: 'ASSETS',
  },
  bindings: {
    durableObjects: [{ name: 'TOURNAMENT_DO', class_name: 'TournamentDO' }],
    workflows: [
      {
        binding: 'TOURNAMENT_WORKFLOW',
        name: 'manyface-tournament-workflow',
        class_name: 'TournamentWorkflow',
      },
    ],
    queues: [{ binding: 'TOURNAMENT_QUEUE', queue: 'manyface-tournament' }],
    r2: [{ binding: 'ARTIFACTS', bucket_name: 'manyface-artifacts' }],
    analytics: [{ binding: 'GATE_METRICS', dataset: 'manyface-gate-metrics' }],
  },
};

export function deployDryRun(): void {
  const result = spawnSync('wrangler', ['deploy', '--dry-run'], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`wrangler deploy --dry-run exited with code ${result.status ?? 'unknown'}`);
  }
}

if (import.meta.main) {
  deployDryRun();
}
