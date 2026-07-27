# Iuran subscription policy contract

Minimal Soroban policy contract for recurring subscription billing using the
native XLM Stellar Asset Contract (SAC) address supplied at initialization.
The UI remains a demo; this directory is the on-chain technical boundary.

## Flow

```text
create_plan -> subscribe -> charge -> charge ... -> cancel
```

- `create_plan(plan_id, merchant, asset, price, period_ledgers)` creates an
  active merchant plan.
- `subscribe(plan_id, subscriber)` creates one active subscription per
  subscriber.
- `charge(subscriber, charge_id)` transfers one plan price from the subscriber
  to the merchant when the ledger is due.
- `cancel(subscriber)` stops future charges.

Each charge requires subscriber authorization. A successful `charge_id` is
stored as an idempotency key, and the next due ledger prevents double charging
with a different ID in the same period. The contract is not deployed and has
no secrets or network actions.

## Local verification

```bash
cargo fmt --check --manifest-path contracts/subscription-policy/Cargo.toml
cargo test --offline --manifest-path contracts/subscription-policy/Cargo.toml
```

See [`TESTNET_RUNBOOK.md`](TESTNET_RUNBOOK.md) and
[`UNSIGNED_OPS.md`](UNSIGNED_OPS.md) for build-only preparation.
