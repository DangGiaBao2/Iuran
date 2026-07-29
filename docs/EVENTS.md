# Contract Events

Iuran emits events for important lifecycle transitions.

## Event types

- Plan creation records the new plan identifier.
- Subscription start records the plan and subscriber.
- Charge records the subscriber and unique charge identifier.
- Cancellation records the affected subscriber.

## Consumer guidance

Event consumers should:

1. Filter by the exact Mainnet Contract ID.
2. Store transaction hash and ledger sequence.
3. Process events idempotently.
4. Reconcile event data with a direct contract read.
5. Resume from the last finalized ledger after downtime.

Events support indexing and notifications, but they do not replace authorization checks or current-state reads.
