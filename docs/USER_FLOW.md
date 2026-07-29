# Subscription Flow

## Merchant

1. Connect a Mainnet wallet.
2. Choose a unique plan identifier.
3. Enter the amount, billing interval, and grace period.
4. Review and sign `create_plan`.
5. Save the confirmed transaction hash.

## Subscriber

1. Open the plan shared by the merchant.
2. Confirm the plan amount and interval.
3. Sign `subscribe` from the subscriber account.
4. Wait for Mainnet confirmation.

## Billing

1. Determine that the subscription is due.
2. Generate a unique `charge_id`.
3. Simulate and sign `charge`.
4. Reconcile the transaction before updating the application status.

The verified Mainnet sequence is recorded in `contracts/subscription-policy/deployment.json`.
