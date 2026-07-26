# Iuran — Recurring Subscription Billing

Iuran is a focused hackathon demo for recurring USDC membership billing. A merchant runs a billing cycle, a member reviews the due charge, and the simulated Soroban approval updates both views.

## Demo

- Live demo: https://iuran-022.vercel.app
- Repository: https://github.com/DangGiaBao2/Iuran
- Demo data is intentionally in-memory so the public preview works without a database.

## Product flow

1. Open the Merchant view for FitLife Bangkok.
2. Click **Run Billing Cycle** to create pending monthly charges.
3. Switch to **Subscriber — Member View**.
4. Click **Approve 20 USDC** and see the simulated transaction confirmation.

This public demo is UI/API simulation only. It does not sign a wallet transaction or claim a mainnet settlement.

## Screenshots

![Merchant dashboard](screen-shot/01-merchant-dashboard.png)

![Subscriber approval](screen-shot/02-subscriber-approval.png)

![Mobile dashboard](screen-shot/03-mobile-dashboard.png)

## Stellar surface

- Soroban contract authorization for recurring charge policy
- Horizon payment preparation and reconciliation
- Keeper-friendly due-schedule and expiry state machine

## Readiness status

This repository is in hackathon readiness hardening. Demo settlement is disabled on public network configuration. No deployed contract or mainnet proof is claimed yet.

See [`docs/MAINNET_READINESS.md`](docs/MAINNET_READINESS.md).

## Local demo

Install dependencies and run `npm run dev`. Without database variables, the app automatically uses the safe in-memory demo store. For a database-backed local testnet demo, configure `.env.example` and use the scripts in `package.json`.

## Mainnet gate

Mainnet requires a deployed contract ID, verified WASM/build hash, external signer, idempotent charge intents, and Horizon/Soroban reconciliation before a subscription is marked paid.
