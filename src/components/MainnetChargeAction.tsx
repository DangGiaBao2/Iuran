'use client';

import { getAddress, setAllowed, signTransaction } from '@stellar/freighter-api';
import { CheckCircle2, ExternalLink, Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';
import {
  MAINNET_PASSPHRASE,
  SUBSCRIPTION_POLICY_CONTRACT,
  prepareSubscriptionCharge,
  submitSubscriptionCharge,
} from '@/src/lib/mainnet-subscription';

export default function MainnetChargeAction() {
  const [wallet, setWallet] = useState('');
  const [chargeId, setChargeId] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [hash, setHash] = useState('');

  async function connect() {
    try {
      const allowed = await setAllowed();
      if (allowed.error || !allowed.isAllowed)
        throw new Error(allowed.error?.message ?? 'Freighter access was not allowed');
      const address = await getAddress();
      if (address.error || !address.address)
        throw new Error(address.error?.message ?? 'No wallet address returned');
      setWallet(address.address);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not connect Freighter');
    }
  }

  async function charge() {
    if (!wallet) return setStatus('Connect Freighter first.');
    if (!/^\d+$/.test(chargeId)) return setStatus('Charge ID must be a positive integer.');
    setBusy(true);
    setStatus('Preparing Mainnet Soroban charge…');
    setHash('');
    try {
      const prepared = await prepareSubscriptionCharge(wallet, BigInt(chargeId));
      const signed = await signTransaction(prepared.toXDR(), {
        address: wallet,
        networkPassphrase: MAINNET_PASSPHRASE,
      });
      if (signed.error || !signed.signedTxXdr)
        throw new Error(signed.error?.message ?? 'Freighter did not return a signature');
      const submitted = await submitSubscriptionCharge(signed.signedTxXdr);
      if (submitted.status === 'ERROR')
        throw new Error('Stellar rejected the Mainnet subscription charge');
      setHash(submitted.hash);
      setStatus(`Charge ${chargeId} submitted on Stellar Mainnet.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Mainnet charge failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Stellar Mainnet
          </p>
          <p className="font-semibold text-emerald-950">Approve a live subscription charge</p>
          <p className="text-xs text-emerald-800 mt-1">
            Soroban subscription policy · Freighter review required
          </p>
        </div>
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Wallet className="w-3.5 h-3.5" />
          {wallet ? `${wallet.slice(0, 5)}…${wallet.slice(-4)}` : 'Connect Freighter'}
        </button>
      </div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="mainnet-charge-id">
          Charge ID
        </label>
        <input
          id="mainnet-charge-id"
          value={chargeId}
          onChange={(e) => setChargeId(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={charge}
          disabled={busy || !wallet}
          className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {busy ? 'Waiting for wallet…' : 'Charge on Mainnet'}
        </button>
      </div>
      {status && <p className="text-xs text-emerald-900">{status}</p>}
      {hash && (
        <p className="flex items-center gap-1 text-xs text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <a
            className="underline"
            href={`https://stellar.expert/explorer/public/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            View Mainnet transaction <ExternalLink className="inline w-3 h-3" />
          </a>
        </p>
      )}
      <p className="text-[11px] font-mono text-emerald-800 truncate">
        Contract: {SUBSCRIPTION_POLICY_CONTRACT}
      </p>
    </section>
  );
}
