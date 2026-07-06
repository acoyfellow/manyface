// Cloudflare AI Gateway binding stub.

export interface CloudflareAiGateway {
  fetch(input: Request): Promise<Response>;
}

export function createAiGatewayAdapter(_binding: CloudflareAiGateway) {
  return {
    route: async (request: import('../adapter.contract.ts').ModelRequest) => {
      return request.model ?? 'openai/gpt-4o-mini';
    },
    invoke: async (request: import('../adapter.contract.ts').ModelRequest) => {
      const response = await _binding.fetch(
        new Request('https://manyface.ai-gateway.cloudflare.com', {
          method: 'POST',
          body: JSON.stringify(request),
        }),
      );
      return (await response.json()) as import('../adapter.contract.ts').ModelResponse;
    },
  };
}
