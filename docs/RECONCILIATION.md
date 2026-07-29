# Reconciliation Procedure

## Input

Store the submitted transaction hash, expected method, actor address, plan identifier, and charge identifier.

## Confirm

1. Query the hash on Stellar Mainnet.
2. Require a successful transaction result.
3. Confirm the invoked contract equals the Iuran Contract ID.
4. Read the plan or subscription state after confirmation.
5. Match the emitted event to the expected actor and identifier.

## Persist

Mark the application operation confirmed once. Save the ledger sequence and confirmation time. Reprocessing the same hash must not create a second business record.

## Recover

If submission timed out, run reconciliation before preparing another transaction. If the transaction failed, retain the failure reason and build a fresh envelope with current sequence and time bounds.
