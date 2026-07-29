# Local Development

## Web application

```sh
npm install
npm run dev
```

The default development port is `3002`. Without database variables, the public-demo path uses in-memory data.

## Quality checks

```sh
npm test
npm run lint
npm run build
```

## Contract

```sh
cd contracts/subscription-policy
cargo test
cargo build --release --target wasm32v1-none
```

Use `.env.example` as a variable reference. Never copy a wallet secret into an environment file used by the browser.
