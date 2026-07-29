# Maintenance Guide

## Dependency updates

Update Next.js, wallet libraries, and Soroban SDK separately. Run web and contract checks after each dependency group.

## Contract changes

A changed WASM hash requires a new upload and deployment or an explicitly documented upgrade path. Never overwrite old transaction evidence.

## Documentation changes

Keep the README, deployment manifest, Contract ID, and explorer links synchronized. Record new functional hashes without deleting historical evidence.

## Data reconciliation

Rebuild application projections from contract reads and events when state is uncertain. Preserve transaction hashes as stable audit references.

## Periodic review

Monthly checks should cover app availability, RPC configuration, explorer links, dependency advisories, and whether operational guidance still matches the deployed contract.
