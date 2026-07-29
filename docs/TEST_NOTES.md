# Test Notes

The Soroban contract includes unit coverage for its core policy.

## Covered behavior

- Create a plan and retrieve its configuration.
- Subscribe an address to an existing plan.
- Record a charge for an active subscription.
- Reject a duplicate charge identifier.
- Cancel a subscription through an authorized address.

## Commands

From `contracts/subscription-policy`:

```sh
cargo test
cargo build --release --target wasm32v1-none
```

From the repository root:

```sh
npm test
npm run build
```

Mainnet hashes supplement local tests by proving that the deployed artifact accepted the documented functional sequence.
