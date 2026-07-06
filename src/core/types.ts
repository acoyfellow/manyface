export interface TestCase {
  id: string;
  input: unknown;
  expected: unknown;
  tags?: string[];
}

export interface CandidateConfig {
  id: string;
  name: string;
  codeRef: string;
  selfTests: TestCase[];
  model?: string;
}

export interface Artifact {
  candidateId: string;
  codeRef: string;
  selfTests: TestCase[];
}

export interface AdversaryConfig {
  id: string;
  name: string;
  counterexamples: TestCase[];
  model?: string;
}

export interface Counterexample extends TestCase {
  adversaryId: string;
}

export interface GateVerdict {
  artifactId: string;
  candidateId: string;
  passed: boolean;
  selfTestsPassed: number;
  selfTestsTotal: number;
  counterexamplesPassed: number;
  counterexamplesTotal: number;
  failures: Failure[];
  score: number;
}

export interface Failure {
  testId: string;
  kind: 'self-test' | 'counterexample';
  input: unknown;
  expected: unknown;
  actual: unknown;
}

export interface RetainedArtifact {
  candidateId: string;
  codeRef: string;
  passed: boolean;
  failures: Failure[];
}

export interface ProofReceipt {
  schema: 'proof-spec/v0';
  tournamentId: string;
  claim: string;
  winnerId: string | null;
  assertions: ReceiptAssertion[];
  evidence: {
    verdicts: GateVerdict[];
    retained: RetainedArtifact[];
  };
  costUsd: number;
  createdAt: string;
}

export interface ReceiptAssertion {
  id: string;
  claim: string;
  result: 'pass' | 'fail';
  evidence: unknown;
}

export interface TournamentResult {
  tournamentId: string;
  claim: string;
  winnerId: string | null;
  verdicts: GateVerdict[];
  retained: RetainedArtifact[];
  receipt: ProofReceipt;
}
