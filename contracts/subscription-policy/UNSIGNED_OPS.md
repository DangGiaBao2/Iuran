# Unsigned build-only operations

These commands prepare XDR only. They do not sign or broadcast. Use placeholders
in the shell and never commit secrets.

```bash
export TESTNET_PUBLIC_KEY=<TESTNET_PUBLIC_KEY>
export TESTNET_ASSET_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
export SUBSCRIPTION_WASM=contracts/subscription-policy/target/wasm32v1-none/release/iuran_subscription_policy_contract.wasm
```

```bash
stellar contract upload \
  --wasm "$SUBSCRIPTION_WASM" \
  --source-account "$TESTNET_PUBLIC_KEY" \
  --network testnet \
  --build-only > upload-wasm.xdr

stellar contract deploy \
  --wasm "$SUBSCRIPTION_WASM" \
  --source-account "$TESTNET_PUBLIC_KEY" \
  --network testnet \
  --build-only > deploy-instance.xdr
```

After the instance ID is known, create unsigned invocation XDR with the same
`stellar contract invoke --build-only -- ...` pattern for `create_plan`,
`subscribe`, `charge`, and `cancel`. Assemble Soroban resource data before
wallet signing.
