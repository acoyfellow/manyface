// Cloudflare Queue binding stub.
// The production handler is configured in wrangler.toml and receives messages
// via the queue consumer interface.

export interface CloudflareQueue {
  send(batch: unknown[]): Promise<void>;
}

export function createQueuesAdapter<T>(_binding: CloudflareQueue) {
  return {
    enqueue: async (jobs: T[]) => {
      await _binding.send(jobs);
    },
    consume: async (_handler: (job: T) => Promise<unknown>) => {
      // Queue consumers are invoked by the platform; this stub is never called
      // directly in production.
    },
  };
}
