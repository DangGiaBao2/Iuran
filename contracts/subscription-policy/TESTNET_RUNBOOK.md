# Project 022 Testnet runbook

This is a preparation-only runbook. It does not use a private key or submit a
transaction. The wallet owner must review and sign each assembled operation.

## Build and inspect

```bash
rustup target add wasm32v1-none
cargo fmt --check --manifest-path contracts/subscription-policy/Cargo.toml
cargo test --manifest-path contracts/subscription-policy/Cargo.toml
cargo build --manifest-path contracts/subscription-policy/Cargo.toml \
  --target wasm32v1-none --release
stellar contract info hash \
  --wasm contracts/subscription-policy/target/wasm32v1-none/release/iuran_subscription_policy_contract.wasm
stellar contract info interface \
  --wasm contracts/subscription-policy/target/wasm32v1-none/release/iuran_subscription_policy_contract.wasm
```

## Native XLM SAC

Use the network-specific native XLM SAC address, not an issuer account:

```text
Testnet: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
Mainnet: CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
```


## Smoke flow

After a separately reviewed deployment, use the same asset address in
`create_plan` and run:

```text
create_plan -> subscribe -> charge(charge_id=1) -> cancel
```

Verify merchant balance, subscription `charge_count`, `next_charge_ledger`,
and the rejected post-cancel charge before recording deployment evidence.
