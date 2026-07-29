# Architecture

Iuran separates the user experience from the ledger policy.

## Components

1. The Next.js application presents merchant and subscriber views.
2. Freighter provides account selection and transaction authorization.
3. The `subscription-policy` Soroban contract owns plan, subscription, and charge state.
4. Stellar RPC simulates and submits contract invocations.
5. Horizon or Stellar Expert provides independent transaction confirmation.

## Trust boundary

The browser prepares an invocation but cannot sign on behalf of a member. The contract verifies the required address authorization and rejects invalid state transitions. A UI response is not treated as settlement evidence until the transaction is confirmed on Mainnet.

## Data path

`merchant input → transaction preparation → wallet signature → RPC submission → contract event → reconciliation`

The public demo can render sample data without a database. Mainnet evidence remains anchored to the contract and hashes in the deployment manifest.
