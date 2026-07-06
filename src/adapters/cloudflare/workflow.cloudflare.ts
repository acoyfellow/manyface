// Cloudflare Workflow binding for durable tournament lifecycle.
// The concrete binding is injected at runtime by the platform; this module only
// declares the expected interface.

export interface CloudflareWorkflow {
  create(id: string): Promise<{ id: string }>;
}

export function createWorkflowAdapter(_binding: CloudflareWorkflow) {
  return {
    start: async (tournamentId: string) => {
      const run = await _binding.create(tournamentId);
      return run.id;
    },
    checkpoint: async (_runId: string, checkpoint: unknown) => {
      // Persisted by the Workflow engine; no-op here.
      void checkpoint;
    },
    complete: async (_runId: string, result: unknown) => {
      void result;
    },
  };
}
