// TournamentDO — Durable Object stub for event-sourced tournament state.
// The production implementation would use DO SQLite for persistence and WebSocket
// subscriptions for live replay. This stub satisfies the wrangler binding contract.

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
}

interface DurableObjectContext {
  storage?: DurableObjectStorage;
}

export class TournamentDO {
  private state: Record<string, unknown> = {};
  readonly ctx: DurableObjectContext;

  constructor(ctx: DurableObjectContext, _env: unknown) {
    this.ctx = ctx;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tournamentId = url.pathname.split('/').pop() ?? 'unknown';

    if (request.method === 'POST') {
      this.state = (await request.json()) as Record<string, unknown>;
      await this.ctx.storage?.put('state', this.state);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stored = await this.ctx.storage?.get<Record<string, unknown>>('state');
    return new Response(JSON.stringify(stored ?? this.state), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// TournamentWorkflow stub — placeholder for the durable workflow lifecycle.
// Production implementation would use Workflows API for checkpoint/retry.
export class TournamentWorkflow {
  async run(_event: unknown) {
    return { ok: true };
  }
}
