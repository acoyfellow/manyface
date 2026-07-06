import type { DurableObjectsAdapter, TournamentState } from '../adapter.contract.ts';

export class LocalDurableObjectsAdapter implements DurableObjectsAdapter {
  private states = new Map<string, TournamentState>();
  private subs = new Map<string, Array<(state: TournamentState) => void>>();

  async getState(tournamentId: string): Promise<TournamentState> {
    const state = this.states.get(tournamentId);
    if (!state) throw new Error(`No state for tournament ${tournamentId}`);
    return state;
  }

  async setState(tournamentId: string, state: TournamentState): Promise<void> {
    this.states.set(tournamentId, state);
    const handlers = this.subs.get(tournamentId) ?? [];
    for (const handler of handlers) {
      handler(state);
    }
  }

  subscribe(tournamentId: string, handler: (state: TournamentState) => void): void {
    const handlers = this.subs.get(tournamentId) ?? [];
    handlers.push(handler);
    this.subs.set(tournamentId, handlers);
  }
}
