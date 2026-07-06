import type { Policy } from '../policy.ts';
import type {
  AdversaryConfig,
  Artifact,
  CandidateConfig,
  Counterexample,
  Failure,
  GateVerdict,
} from './types.ts';

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keysA = Object.keys(ao);
  const keysB = Object.keys(bo);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(ao[key], bo[key])) return false;
  }
  return true;
}

async function runTest(
  fn: (input: unknown) => Promise<unknown> | unknown,
  test: { input: unknown; expected: unknown },
): Promise<unknown> {
  return await fn(test.input);
}

export function buildCounterexamples(adversaries: AdversaryConfig[]): Counterexample[] {
  return adversaries.flatMap((adv) =>
    adv.counterexamples.map((cx) => ({ ...cx, adversaryId: adv.id })),
  );
}

export async function evaluateArtifact(
  artifact: Artifact,
  candidate: CandidateConfig,
  fn: (input: unknown) => Promise<unknown> | unknown,
  counterexamples: Counterexample[],
  _policy: Policy,
): Promise<GateVerdict> {
  const failures: Failure[] = [];
  let selfTestsPassed = 0;
  for (const test of candidate.selfTests) {
    const actual = await runTest(fn, test);
    if (deepEqual(actual, test.expected)) {
      selfTestsPassed += 1;
    } else {
      failures.push({
        testId: test.id,
        kind: 'self-test',
        input: test.input,
        expected: test.expected,
        actual,
      });
    }
  }

  let counterexamplesPassed = 0;
  for (const cx of counterexamples) {
    const actual = await runTest(fn, cx);
    if (deepEqual(actual, cx.expected)) {
      counterexamplesPassed += 1;
    } else {
      failures.push({
        testId: cx.id,
        kind: 'counterexample',
        input: cx.input,
        expected: cx.expected,
        actual,
      });
    }
  }

  const selfTestsTotal = candidate.selfTests.length;
  const counterexamplesTotal = counterexamples.length;
  const total = selfTestsTotal + counterexamplesTotal;
  const passedTests = selfTestsPassed + counterexamplesPassed;
  const score = total === 0 ? 0 : passedTests / total;

  const passed = failures.length === 0 && selfTestsTotal > 0 && counterexamplesTotal > 0;

  return {
    artifactId: artifact.candidateId,
    candidateId: candidate.id,
    passed,
    selfTestsPassed,
    selfTestsTotal,
    counterexamplesPassed,
    counterexamplesTotal,
    failures,
    score,
  };
}

export function pickWinner(verdicts: GateVerdict[], policy: Policy): GateVerdict | null {
  const sorted = [...verdicts].sort((a, b) => {
    if (a.passed && !b.passed) return -1;
    if (!a.passed && b.passed) return 1;
    if (b.score !== a.score) return b.score - a.score;
    if (policy.gate.tieBreaker === 'lexical') {
      return a.artifactId.localeCompare(b.artifactId);
    }
    return 0;
  });
  const first = sorted[0];
  return first?.passed ? first : null;
}
