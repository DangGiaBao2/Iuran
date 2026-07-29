# Monitoring

## Availability

Check that the Vercel application returns a successful response and that static assets load.

## Ledger health

Track the most recent successful contract invocation, RPC availability, and the age of the last reconciled ledger.

## Business signals

Useful counters include plans created, active subscriptions, successful charges, failed simulations, cancelled subscriptions, and duplicate-charge rejections.

## Alert conditions

- Repeated RPC submission failures.
- Application state diverges from contract reads.
- Charge attempts use duplicate identifiers.
- Mainnet events stop while user actions continue.
- Production configuration points to a different Contract ID.

Monitoring must avoid logging wallet secrets, full signed XDR unnecessarily, or personal billing details.
