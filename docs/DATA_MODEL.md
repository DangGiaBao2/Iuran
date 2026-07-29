# Contract Data Model

## Plan

A plan identifies the merchant policy. It stores the merchant address, amount, interval, and grace-period configuration under a unique numeric identifier.

## Subscription

A subscription links one subscriber to a plan and records status, the next due ledger, and charge-related state.

## Status

Subscription status distinguishes active and cancelled records. State-changing methods validate the current status before writing.

## Storage keys

The contract uses explicit keys for plans, subscriber records, and processed charge identifiers. This makes duplicate detection deterministic.

## Application projection

The web application may cache friendly names and display values, but the contract record is authoritative for plan and subscription state. Cached data should be refreshed after every confirmed transaction.
