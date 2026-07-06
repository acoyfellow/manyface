# manyface contract

## Invariants

1. **Isolation.** A candidate artifact is evaluated only through the container
   adapter. The gate never inspects source code or provenance when scoring.
2. **Determinism.** The same claim, candidates, adversaries, and policy must
   produce the same ordered verdicts when run twice.
3. **No invented win.** If no artifact passes the gate, `winnerId` is `null`. A
   baseline candidate has no special privilege.
4. **Retention.** Every loser is retained with the counterexamples it failed
   and its self-test manifest.
5. **Receipt portability.** Every tournament writes a `proof-spec` receipt with
   inputs, outputs, gate assertions, and cost labels.

## Inputs

```ts
interface TournamentRequest {
  tournamentId: string;
  claim: string;
  candidates: CandidateConfig[];
  adversaries: AdversaryConfig[];
  policy: Policy;
}
```

## Outputs

```ts
interface TournamentResult {
  tournamentId: string;
  claim: string;
  winnerId: string | null;
  verdicts: GateVerdict[];
  retained: RetainedArtifact[];
  receipt: ProofReceipt;
}
```

## Gate rules

1. Run the artifact against every candidate-supplied self-test.
2. Run the artifact against every adversary-supplied counterexample.
3. An artifact passes iff all self-tests pass and all counterexamples pass.
4. Order candidates by pass/fail, then by normalized score (passing tests /
   total tests), then by deterministic `candidateId` lexical order.
5. The winner is the first artifact in the ordered list; `null` if the list is
   empty.

## Adapters

Each adapter is labeled and implements a contract in `src/adapters/adapter.contract.ts`:

- `WorkflowAdapter` — durable tournament lifecycle.
- `QueuesAdapter` — fan-out / fan-in.
- `DurableObjectsAdapter` — stateful tournament identity.
- `AiGatewayAdapter` — model routing and cost labels.
- `ContainersAdapter` — isolated candidate execution.
- `R2Adapter` — immutable artifact and receipt storage.

Local implementations are used for tests and the local demo. Cloudflare stubs
declare the expected binding surface.
