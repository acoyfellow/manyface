// Cloudflare Durable Object stub for event-sourced tournament state.

export interface CloudflareDurableObjectNamespace {
  get(id: DurableObjectId): CloudflareDurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface CloudflareDurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

export function createDurableObjectsAdapter(_ns: CloudflareDurableObjectNamespace) {
  return {
    getState: async (tournamentId: string) => {
      const id = tournamentId as unknown as DurableObjectId;
      const stub = _ns.get(id);
      const response = await stub.fetch(new Request(`https://manyface/tournament/${tournamentId}`));
      return (await response.json()) as import('../adapter.contract.ts').TournamentState;
    },
    setState: async (
      tournamentId: string,
      state: import('../adapter.contract.ts').TournamentState,
    ) => {
      const id = tournamentId as unknown as DurableObjectId;
      const stub = _ns.get(id);
      await stub.fetch(
        new Request(`https://manyface/tournament/${tournamentId}`, {
          method: 'POST',
          body: JSON.stringify(state),
        }),
      );
    },
    subscribe: () => {
      // WebSocket subscription would be wired to the DO here.
    },
  };
}
