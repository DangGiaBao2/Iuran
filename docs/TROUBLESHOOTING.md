# Troubleshooting

## Wallet does not connect

Unlock Freighter, refresh the page, and confirm the extension is allowed for the site.

## Wrong network

Switch Freighter to Stellar Mainnet before preparing a transaction. Rebuild the transaction after changing networks.

## Simulation fails

Check the Contract ID, account balance, current plan state, and method arguments. A missing plan or duplicate identifier is an application error, not an RPC retry condition.

## Transaction is too late

The transaction time bounds expired. Prepare and simulate a fresh transaction; do not reuse the old XDR.

## Submitted but UI did not update

Open the hash in a Mainnet explorer. If it succeeded, refresh application state. If it failed, read the contract error before retrying.

## Duplicate charge

Use a new charge identifier only after confirming the previous charge was not accepted.
