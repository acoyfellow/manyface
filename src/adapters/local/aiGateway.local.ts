import type { AiGatewayAdapter, ModelRequest, ModelResponse } from '../adapter.contract.ts';

export class LocalAiGatewayAdapter implements AiGatewayAdapter {
  constructor(private readonly policyModel = 'local/no-op') {}

  async route(request: ModelRequest): Promise<string> {
    return request.model ?? this.policyModel;
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    return {
      text: `[local-ai] ${request.role}: ${request.prompt.slice(0, 80)}...`,
      model: request.model ?? this.policyModel,
      costUsd: 0,
      tokens: { prompt: 0, completion: 0 },
    };
  }
}
