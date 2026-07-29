# Security Boundaries

## Wallet custody

Iuran does not require an application-held secret key. Freighter signs from the user-controlled account.

## Authorization

Contract methods request authorization from the actor responsible for the change. The UI must not present a successful local response as proof that authorization reached the ledger.

## Replay and duplication

Charge identifiers provide an application-level idempotency boundary. Operators must still reconcile uncertain submissions before generating a replacement.

## Input handling

Plan identifiers, intervals, amounts, and charge identifiers must be validated before transaction preparation. Amount conversion must use one documented decimal convention.

## Out of scope

The current contract records billing policy and charge state. Integrations that transfer issued assets require separate asset trustline, issuer, compliance, and reconciliation controls.
