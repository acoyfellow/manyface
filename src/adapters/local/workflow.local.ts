import type { Checkpoint, WorkflowAdapter } from '../adapter.contract.ts';

export class LocalWorkflowAdapter implements WorkflowAdapter {
  private runs = new Map<string, { checkpoints: Checkpoint[]; result?: unknown }>();

  async start(tournamentId: string, _claim?: string): Promise<string> {
    const runId = `wf-${tournamentId}-${Date.now()}`;
    this.runs.set(runId, { checkpoints: [] });
    return runId;
  }

  async checkpoint(runId: string, checkpoint: Checkpoint): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Unknown run ${runId}`);
    run.checkpoints.push(checkpoint);
  }

  async complete(runId: string, result: unknown): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Unknown run ${runId}`);
    run.result = result;
  }

  inspect(runId: string) {
    return this.runs.get(runId);
  }
}
