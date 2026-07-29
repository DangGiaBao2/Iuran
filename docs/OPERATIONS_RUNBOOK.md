# Operations Runbook

## Before a billing cycle

- Confirm the application is configured for Mainnet.
- Confirm the connected account matches the intended actor.
- Read the current plan and subscription state.
- Allocate a new charge identifier.
- Simulate the invocation and review the fee.

## After signing

- Record the transaction hash.
- Poll until the transaction is successful or failed.
- Confirm the event targets the expected subscription.
- Update the application only after reconciliation.

## If submission is uncertain

Do not immediately recreate the charge. Query the original hash and inspect the subscription state first. Reusing an identifier should be rejected, but reconciliation avoids unnecessary fees and confusing duplicate attempts.

## Escalation

Pause billing if RPC responses are inconsistent, the plan cannot be read, or the connected network is not Mainnet.
