const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  Address,
  nativeToScVal,
  Networks,
  Operation,
  TransactionBuilder,
  rpc,
} = require('@stellar/stellar-sdk');

const SOURCE = 'GAUROOKKSANT7VYX2IOHVWVYXOII7LXKI7VEDU5LFIRSH6VJHGIJAX2E';
const ROOT = path.resolve(__dirname, '..');
const WASM_PATH = path.resolve(ROOT, 'contracts/subscription-policy/target/wasm32v1-none/release/iuran_subscription_policy_contract.wasm');
const WASM_HASH = '5bf2134aef24c2b04dc54e5a8b139c619494adb5591154f687d00042921d4399';
const NATIVE_XLM_SAC = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
const PLAN_ID = 22022;
const SALT = crypto.createHash('sha256').update('022-iuran-subscription-policy-v1').digest();

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function config() {
  const network = option('network', 'mainnet');
  if (!['mainnet', 'testnet'].includes(network)) throw new Error('Use --network mainnet or testnet');
  return network === 'mainnet'
    ? { rpcUrl: 'https://soroban-rpc.mainnet.stellar.gateway.fm', passphrase: Networks.PUBLIC, timeout: 86400 }
    : { rpcUrl: 'https://soroban-testnet.stellar.org:443', passphrase: Networks.TESTNET, timeout: 1800 };
}

function outputPath(stage, network) {
  return path.resolve(ROOT, `contracts/subscription-policy/${network}-${stage}-assembled.xdr`);
}

async function main() {
  const stage = option('stage');
  const allowed = ['upload', 'deploy', 'create-plan', 'subscribe', 'charge', 'cancel'];
  if (!allowed.includes(stage)) {
    throw new Error(`Usage: node scripts/assemble-contract-tx.cjs --stage ${allowed.join('|')} --network mainnet [--contract-id C...]`);
  }

  const network = option('network', 'mainnet');
  const settings = config();
  const server = new rpc.Server(settings.rpcUrl);
  const account = await server.getAccount(SOURCE);
  const builder = new TransactionBuilder(account, { fee: '100', networkPassphrase: settings.passphrase });

  if (stage === 'upload') {
    builder.addOperation(Operation.uploadContractWasm({ wasm: fs.readFileSync(WASM_PATH) }));
  } else if (stage === 'deploy') {
    builder.addOperation(Operation.createCustomContract({
      address: Address.fromString(SOURCE),
      wasmHash: Buffer.from(WASM_HASH, 'hex'),
      salt: SALT,
    }));
  } else {
    const contractId = option('contract-id');
    if (!contractId) throw new Error(`--contract-id C... is required for ${stage}`);
    const subscriber = option('subscriber', SOURCE);
    if (stage === 'create-plan') {
      builder.addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: 'create_plan',
        args: [
          nativeToScVal(PLAN_ID, { type: 'u64' }),
          Address.fromString(SOURCE).toScVal(),
          Address.fromString(NATIVE_XLM_SAC).toScVal(),
          nativeToScVal(BigInt(option('price', '1000000')), { type: 'i128' }),
          nativeToScVal(Number(option('period-ledgers', '17280')), { type: 'u32' }),
        ],
      }));
    } else if (stage === 'subscribe') {
      builder.addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: 'subscribe',
        args: [nativeToScVal(PLAN_ID, { type: 'u64' }), Address.fromString(subscriber).toScVal()],
      }));
    } else if (stage === 'charge') {
      builder.addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: 'charge',
        args: [Address.fromString(subscriber).toScVal(), nativeToScVal(Number(option('charge-id', '1')), { type: 'u64' })],
      }));
    } else if (stage === 'cancel') {
      builder.addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: 'cancel',
        args: [Address.fromString(subscriber).toScVal()],
      }));
    }
  }

  const raw = builder.setTimeout(settings.timeout).build();
  const simulation = await server.simulateTransaction(raw);
  if (simulation.error) throw new Error(simulation.error);
  const assembled = rpc.assembleTransaction(raw, simulation).build();
  const xdr = assembled.toXDR();
  const destination = outputPath(stage, network);
  fs.writeFileSync(destination, `${xdr}\n`, { mode: 0o600 });
  const result = stage === 'deploy' ? simulation.result?.retval : null;
  console.log(JSON.stringify({
    stage, network, outputPath: destination, xdr,
    hash: assembled.hash().toString('hex'), sequence: assembled.sequence.toString(),
    contractId: result ? Address.fromScVal(result).toString() : null,
    wasmSha256: stage === 'upload' ? WASM_HASH : undefined,
    salt: stage === 'deploy' ? SALT.toString('hex') : undefined,
    minResourceFee: simulation.minResourceFee, latestLedger: simulation.latestLedger,
  }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message || error); process.exitCode = 1; });
