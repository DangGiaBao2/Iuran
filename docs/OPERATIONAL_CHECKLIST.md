# Operational Checklist

## Release

- [ ] Production URL returns HTTP 200.
- [ ] Mainnet Contract ID matches the deployment manifest.
- [ ] No secret key is present in client or server variables.
- [ ] Wallet prompts identify the expected method.
- [ ] Explorer links use the Public network.

## Billing cycle

- [ ] Plan exists and is active.
- [ ] Subscriber state is readable.
- [ ] Charge is due.
- [ ] Charge identifier is unique.
- [ ] Simulation succeeds.
- [ ] User approves the expected fee.
- [ ] Transaction is reconciled before status changes.

## Incident

- [ ] Preserve the hash and RPC response.
- [ ] Avoid blind retries.
- [ ] Compare on-chain state with application state.
- [ ] Document the resolution.
