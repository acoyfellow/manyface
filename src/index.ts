import { Hono } from 'hono';
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

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true, service: 'manyface' }));

app.post('/api/tournament', async (c) => {
  const body = await c.req.json();
  const tournamentId = body.tournamentId ?? `t-${Date.now()}`;
  const claim = body.claim ?? 'Sort an array of numbers in ascending order.';
  const candidates = body.candidates ?? defaultSortingCandidates;
  const adversaries = body.adversaries ?? defaultSortingAdversaries;

  const adapters = createAdapters();
  const tournament = new Tournament(adapters, new LocalContainersAdapter(sortingCellRegistry));
  const result = await tournament.run({
    tournamentId,
    claim,
    candidates,
    adversaries,
    policy,
  });

  return c.json(result);
});

app.get('/api/tournament/:id', async (c) => {
  const id = c.req.param('id');
  const adapters = createAdapters();
  try {
    const state = await adapters.durableObjects.getState(id);
    return c.json(state);
  } catch {
    return c.json({ error: 'not found' }, 404);
  }
});

app.get('/api/replay/:id', async (c) => {
  const id = c.req.param('id');
  const adapters = createAdapters();
  const receipt = await adapters.r2.get(`receipts/${id}.json`);
  if (!receipt) return c.json({ error: 'not found' }, 404);
  return c.json(JSON.parse(receipt.body));
});

// Static site (PWA/SEO surface) served from site/dist when running locally.
// In production on Workers, static assets are served via the [assets] binding
// declared in wrangler.toml; the local adapter path below only runs under Bun.
declare const Bun: { main: boolean } | undefined;
if (typeof Bun !== 'undefined' && Bun.main) {
  const { existsSync, readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  app.get('/*', async (c) => {
    const path = c.req.path === '/' ? '/index.html' : c.req.path;
    const filePath = join(process.cwd(), 'site/dist', path);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      const ext = path.split('.').pop() ?? '';
      const mime: Record<string, string> = {
        html: 'text/html',
        css: 'text/css',
        js: 'application/javascript',
        json: 'application/json',
        svg: 'image/svg+xml',
        png: 'image/png',
        ico: 'image/x-icon',
      };
      return c.html(content, 200, { 'Content-Type': mime[ext] ?? 'text/plain' });
    }
    return c.notFound();
  });

  const port = Number(process.env.PORT ?? 3000);
  console.log(`manyface running on http://localhost:${port}`);
}

export { TournamentDO, TournamentWorkflow } from './do.ts';
export default app;
