# manyface

> Race incompatible builders and hostile reviewers in isolation; the first
> artifact to survive the shared proof graph wins.

## 1. The pain

Parallel agents usually vote, chat, or average. None of that is a proof. A
candidate can be eloquent, well-typed, and wrong. Without an independent gate,
the prettiest answer wins.

## 2. The promise

`manyface` runs isolated candidate builders against the same claim while
adversaries generate counterexamples. A deterministic gate scores every
artifact. The winner keeps the proof; losers keep their failure receipts so
nothing useful is thrown away.

## 3. Quick start (local)

```bash
cd /Users/jcoeyman/cloudflare/manyface
bun install
bun test
bun run demo
```

The demo runs a public sorting claim with four incompatible candidates and three
hostile reviewers. The gate emits a portable receipt in `proof/`.

## 4. How it works

```text
claim
 ├─ Candidate A  (isolated cell) ──> artifact + self-tests
 ├─ Candidate B  (isolated cell) ──> artifact + self-tests
 ├─ Candidate C  (isolated cell) ──> artifact + self-tests
 └─ Adversary 1/2/3 ──> counterexamples

        deterministic gate
         pass / fail on every pair
            |
      winner (proof bundle)
      losers (retained with counterexamples)
```

Load-bearing primitives:

- **Workflow** — tournament lifecycle and checkpoints.
- **Queues** — fan-out for candidates and adversaries.
- **Durable Object + SQLite** — event-sourced tournament state.
- **AI Gateway** — model routing and per-role policy/cost.
- **Containers / Sandbox** — isolated candidate execution cells.
- **R2** — immutable artifacts, counterexamples, and receipts.

Adapters live under `src/adapters/` with `local` implementations for tests and
`cloudflare` stubs for deploy.

## 5. How do I know it worked?

Run the test suite:

```bash
bun test
```

It verifies:

- the gate is deterministic across repeated runs,
- a correct candidate wins and a broken candidate loses,
- when every candidate fails the gate returns `winner: null`,
- loser receipts include the counterexample that disproved them.

A replayable example receipt is committed to `proof/example-receipt.json`.

## 6. What it deliberately does not do

- It is not a general agent orchestrator. It only answers the claim you feed it.
- It does not access live model APIs unless you wire the AI Gateway adapter.
- It does not deploy itself. `alchemy.run.ts` and `wrangler.toml` are present but
  deployment is gated by human approval.
- It does not invent a baseline win. If every candidate fails, the tournament
  reports no winner.

## 7. Where to edit behavior

Edit `policy.json` to change candidate budgets, gate thresholds, adversary
policies, and retention rules. No code changes required for normal tuning.

## 8. What this makes possible next

The tournament emits a proven artifact plus losing architectures, adversarial
tests, and model-routing evidence. Those are consumed by the `loopup` stage as
proven hammers and counterexamples.

## License

MIT — see `LICENSE`.
