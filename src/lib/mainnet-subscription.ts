import {
  Address,
  Contract,
  Networks,
  nativeToScVal,
  rpc,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export const SUBSCRIPTION_POLICY_CONTRACT =
  'CBL2TOIOA4LDYKCSZR4VLQPJBFJJMOEXVJYRZ7GRYJJK7R7RNLPLOEQJ';
export const MAINNET_RPC_URL = 'https://soroban-rpc.mainnet.stellar.gateway.fm';
export const MAINNET_PASSPHRASE = Networks.PUBLIC;

const server = new rpc.Server(MAINNET_RPC_URL);
const contract = new Contract(SUBSCRIPTION_POLICY_CONTRACT);

export async function prepareSubscriptionCharge(sourceAddress: string, chargeId: bigint) {
  const account = await server.getAccount(sourceAddress);
  const raw = new TransactionBuilder(account, { fee: '100', networkPassphrase: MAINNET_PASSPHRASE })
    .addOperation(
      contract.call(
        'charge',
        new Address(sourceAddress).toScVal(),
        nativeToScVal(chargeId, { type: 'u64' }),
      ),
    )
    .setTimeout(300)
    .build();
  const simulation = await server.simulateTransaction(raw);
  if ('error' in simulation && simulation.error) throw new Error(simulation.error);
  return rpc.assembleTransaction(raw, simulation).build();
}

export async function submitSubscriptionCharge(signedXdr: string) {
  return server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, MAINNET_PASSPHRASE));
}
