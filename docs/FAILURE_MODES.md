# Failure Modes

## Invalid state

Creating an existing plan, subscribing to a missing plan, charging an inactive subscription, or cancelling twice should be rejected by contract rules.

## Authorization failure

The wallet account may not match the merchant or subscriber required by the method. Reconnect the correct account and prepare a new transaction.

## Expired transaction

Time bounds can expire between simulation and submission. A fresh simulation and signature are required.

## Ambiguous submission

An RPC timeout does not prove failure. Query the hash and contract state before retrying.

## Indexer delay

An explorer or application feed may lag behind ledger confirmation. Treat the ledger result as authoritative and refresh the projection.

## Configuration mismatch

A Testnet RPC, wrong passphrase, or stale Contract ID will produce invalid or misleading results. Validate all three before signing.
