import policy from '../policy.json' with { type: 'json' };

export interface CandidateBudget {
  maxSelfTests: number;
  maxWallMs: number;
  maxMemoryMb: number;
}

export interface AdversaryBudget {
  maxCounterexamples: number;
  maxWallMs: number;
}

export interface GatePolicy {
  requireAllSelfTests: boolean;
  requireAllCounterexamples: boolean;
  tieBreaker: 'lexical' | 'score';
}

export interface RetentionPolicy {
  keepLoserArtifacts: boolean;
  keepFailedCounterexamples: boolean;
  keepReceipts: boolean;
}

export interface AiGatewayPolicy {
  defaultModel: string;
  candidateModels: string[];
  adversaryModels: string[];
  costCeilingUsd: number;
}

export interface Policy {
  maxCandidates: number;
  maxAdversaries: number;
  candidateBudget: CandidateBudget;
  adversaryBudget: AdversaryBudget;
  gate: GatePolicy;
  retention: RetentionPolicy;
  aiGateway: AiGatewayPolicy;
}

export function loadPolicy(): Policy {
  return policy as Policy;
}
