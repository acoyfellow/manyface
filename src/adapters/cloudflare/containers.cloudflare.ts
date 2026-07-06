// Cloudflare Containers / Sandbox binding stub for isolated candidate cells.

export interface CloudflareContainerBinding {
  run(spec: unknown): Promise<unknown>;
}

export function createContainersAdapter(_binding: CloudflareContainerBinding) {
  return {
    execute: async (spec: import('../adapter.contract.ts').ContainerSpec) => {
      return (await _binding.run(spec)) as import('../adapter.contract.ts').ContainerResult;
    },
  };
}
