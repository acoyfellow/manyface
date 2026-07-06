// Labeled adapter contracts for Cloudflare primitives.
// Each adapter has a local implementation (tests/demo) and a cloudflare stub
// that accepts the platform binding at runtime.

export interface Checkpoint {
  phase: string;
  payload: unknown;
  ts: number;
}

export interface WorkflowAdapter {
  start(tournamentId: string, claim: string): Promise<string>;
  checkpoint(runId: string, checkpoint: Checkpoint): Promise<void>;
  complete(runId: string, result: unknown): Promise<void>;
}

export interface Job<T> {
  id: string;
  kind: 'candidate' | 'adversary';
  payload: T;
}

export interface QueuesAdapter<T> {
  enqueue(jobs: Job<T>[]): Promise<void>;
  consume(handler: (job: Job<T>) => Promise<unknown>): Promise<void>;
}

export interface TournamentState {
  tournamentId: string;
  claim: string;
  candidateOutputs: unknown[];
  adversaryOutputs: unknown[];
  status: 'running' | 'gating' | 'done';
}

export interface DurableObjectsAdapter {
  getState(tournamentId: string): Promise<TournamentState>;
  setState(tournamentId: string, state: TournamentState): Promise<void>;
  subscribe(tournamentId: string, handler: (state: TournamentState) => void): void;
}

export interface ModelRequest {
  role: 'candidate' | 'adversary';
  prompt: string;
  model?: string;
}

export interface ModelResponse {
  text: string;
  model: string;
  costUsd?: number;
  tokens?: { prompt: number; completion: number };
}

export interface AiGatewayAdapter {
  route(request: ModelRequest): Promise<string>;
  invoke(request: ModelRequest): Promise<ModelResponse>;
}

export interface ContainerSpec {
  artifactId: string;
  codeRef: string;
  inputs: unknown[];
}

export interface ContainerResult {
  artifactId: string;
  outputs: unknown[];
  error?: string;
  wallMs: number;
}

export interface ContainersAdapter {
  execute(spec: ContainerSpec): Promise<ContainerResult>;
}

export interface R2Object {
  key: string;
  body: string;
  contentType: string;
}

export interface R2Adapter {
  put(object: R2Object): Promise<void>;
  get(key: string): Promise<R2Object | null>;
  list(prefix: string): Promise<string[]>;
}

export interface AdapterBundle {
  workflow: WorkflowAdapter;
  queues: QueuesAdapter<unknown>;
  durableObjects: DurableObjectsAdapter;
  aiGateway: AiGatewayAdapter;
  containers: ContainersAdapter;
  r2: R2Adapter;
}
