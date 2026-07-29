# Contract API

Mainnet contract: `CBL2TOIOA4LDYKCSZR4VLQPJBFJJMOEXVJYRZ7GRYJJK7R7RNLPLOEQJ`

## Write methods

- `create_plan(plan_id, merchant, amount, interval, grace_period)` creates a billing policy. The merchant authorizes the call.
- `subscribe(plan_id, subscriber)` starts a subscription for the selected plan. The subscriber authorizes the call.
- `charge(subscriber, charge_id)` records a due charge and prevents reuse of the charge identifier.
- `cancel(subscriber)` changes an active subscription to cancelled.

## Read methods

- `get_plan(plan_id)` returns the plan configuration.
- `get_subscription(subscriber)` returns the subscriber state and next due ledger.

## Important invariants

- A plan identifier is unique.
- A subscriber can only reference an existing plan.
- The same charge identifier cannot be applied twice.
- Authorization is required for state-changing user actions.

Amounts use integer contract units; callers must apply the asset decimal convention consistently.
