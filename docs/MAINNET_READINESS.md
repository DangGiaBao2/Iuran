# Mainnet readiness

## Intended contract state

This app intends to use a Soroban SAC transfer flow for recurring USDC charges. A charge should remain pending until a real, signed Soroban transaction is submitted and verified on the configured network; the database should not be the source of truth for payment settlement.

## Current evidence

- `@stellar/stellar-sdk` is present and the test setup names Stellar Testnet.
- The schema has fields for a Soroban contract ID and Stellar transaction hash.
- `src/server/service/subscription.service.ts` currently creates a `sim-*` hash and moves a charge to `approved` in Postgres.
- `scripts/seed-demo.ts` inserts placeholder contract data and simulated charge history.
- No Soroban contract source, build artifact, deployment manifest, verified contract ID, or verified mainnet transaction evidence is present in this copy.

## Missing IDs and artifacts

- Soroban contract source and reproducible build/release artifact: missing.
- Mainnet contract ID and deployment transaction: missing.
- SAC asset/network configuration and a real submit-and-confirm implementation: missing.
- Verified testnet/mainnet transaction hashes for the seeded records: missing; seeded hashes are demo-only.

## Manual gates

1. Implement and review the contract/client integration, including authorization, replay/idempotency, fees, and error handling.
2. Deploy and verify the exact WASM and record the network, contract ID, deployment transaction, and SAC asset issuer.
3. Replace DB-only approval with submit, wait for confirmation, and independently verify the transaction/event before updating status.
4. Run funded testnet lifecycle tests, then obtain operational, security, and financial approval before enabling public network traffic.

Mainnet settlement is fail-closed in this copy; the demo seed is testnet-only.
