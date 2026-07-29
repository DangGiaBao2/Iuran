# Configuration Guide

## Network

Mainnet integrations must use the Public network passphrase and a Mainnet Soroban RPC endpoint. Testnet and Mainnet transaction envelopes are not interchangeable.

## Contract

Canonical Contract ID:

`CBL2TOIOA4LDYKCSZR4VLQPJBFJJMOEXVJYRZ7GRYJJK7R7RNLPLOEQJ`

Keep the identifier in one server-safe configuration source and compare it with `contracts/subscription-policy/deployment.json` during release.

## Database

Database variables are optional for the in-memory demo. A production database stores application projections and idempotency metadata; it does not replace contract state.

## Secrets

Only public network and contract configuration may reach the browser. Wallet secret keys must never be configured in Vercel or committed to Git.
