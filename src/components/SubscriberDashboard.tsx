'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import MainnetChargeAction from './MainnetChargeAction';

interface PendingCharge {
  charge: {
    id: string;
    status: string;
    amountUsdc: string;
    cycleId: string;
    createdAt: string;
    approvedAt: string | null;
    stellarTxHash: string | null;
  };
  subscription: {
    id: string;
    subscriberName: string;
    subscriberAddress: string;
    status: string;
    nextChargeAt: string;
    planId: string;
  };
}

interface BillingEvent {
  type: string;
  chargeId?: string;
  subscriptionId?: string;
  amountUsdc?: string;
  stellarTxHash?: string;
}

interface Props {
  subscriberAddress: string;
}

function formatUsdc(amountStr: string): string {
  const num = Number(amountStr) / 1_000_000;
  return `${num.toFixed(2)} USDC`;
}

export default function SubscriberDashboard({ subscriberAddress }: Props) {
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const fetchCharges = useCallback(async () => {
    try {
      const res = await fetch(`/api/charges?subscriberAddress=${subscriberAddress}`);
      const json = await res.json();
      if (json.ok) setPendingCharges(json.data);
    } catch {
      toast.error('Failed to load charges');
    } finally {
      setLoading(false);
    }
  }, [subscriberAddress]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // SSE subscription — live updates
  useEffect(() => {
    const evtSource = new EventSource('/api/events/stream');
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data) as BillingEvent;
      if (data.type === 'charge_approved' && data.chargeId) {
        setApprovedIds((prev) => new Set([...prev, data.chargeId!]));
        setPendingCharges((prev) =>
          prev.map((pc) =>
            pc.charge.id === data.chargeId
              ? {
                  ...pc,
                  charge: {
                    ...pc.charge,
                    status: 'approved',
                    stellarTxHash: data.stellarTxHash ?? null,
                    approvedAt: new Date().toISOString(),
                  },
                }
              : pc,
          ),
        );
      }
      if (data.type === 'charge_pending') {
        fetchCharges();
      }
    };
    return () => evtSource.close();
  }, [fetchCharges]);

  const approveCharge = async (chargeId: string) => {
    setApprovingId(chargeId);
    try {
      const res = await fetch('/api/charges/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      setApprovedIds((prev) => new Set([...prev, chargeId]));
      toast.success('Charge approved! USDC transferred via Soroban SAC.', { duration: 6000 });
      await fetchCharges();
    } catch (err) {
      toast.error(`Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setApprovingId(null);
    }
  };

  const pendingList = pendingCharges.filter(
    (c) => c.charge.status === 'pending' && !approvedIds.has(c.charge.id),
  );
  const approvedList = pendingCharges.filter(
    (c) => c.charge.status === 'approved' || approvedIds.has(c.charge.id),
  );

  return (
    <div className="space-y-6">
      <MainnetChargeAction />
      {/* Member info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 sm:px-6 py-5 flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
          <BadgeCheck className="w-6 h-6 text-sky-600" />
        </div>
        <div>
          <div className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'var(--font-raleway)' }}>
            Jariya Nakamura
          </div>
          <div className="text-xs text-slate-400 font-mono">{subscriberAddress.slice(0, 18)}…</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              Active Member
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
              Gasless Signup (CAP-33)
            </span>
          </div>
        </div>
        <div className="ml-auto text-right w-full sm:w-auto">
          <div className="text-xs text-slate-400">Subscribed to</div>
          <div className="font-bold text-slate-700">FitLife Bangkok</div>
          <div className="text-sky-600 font-bold text-lg">20 USDC / month</div>
        </div>
      </div>

      {/* Pending approvals */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading charges…</div>
      ) : pendingList.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-700" style={{ fontFamily: 'var(--font-raleway)' }}>
            Pending Approval
          </h2>
          {pendingList.map(({ charge, subscription }) => (
            <div
              key={charge.id}
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4"
            >
              <Clock className="w-6 h-6 text-amber-500 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  Monthly charge — {subscription.subscriberName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Cycle: {charge.cycleId} · demo approval (not a blockchain transaction)
                </div>
              </div>
              <div className="text-right ml-auto">
                <div className="text-2xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-raleway)' }}>
                  {formatUsdc(charge.amountUsdc)}
                </div>
                <div className="text-xs text-slate-400">≈ ฿720</div>
              </div>
              <button
                type="button"
                onClick={() => approveCharge(charge.id)}
                disabled={approvingId === charge.id}
                className="w-full sm:w-auto flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-60 shadow-sm sm:min-w-[160px] justify-center"
              >
                {approvingId === charge.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Approving…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Approve 20 USDC
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-8 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm">No pending charges. You're all caught up!</p>
          <p className="text-slate-400 text-xs mt-1">
            Go to the Merchant tab and click "Run Billing Cycle" to generate a charge.
          </p>
        </div>
      )}

      {/* Approved charges */}
      {approvedList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-700" style={{ fontFamily: 'var(--font-raleway)' }}>
            Payment History
          </h2>
          {approvedList.map(({ charge }) => (
            <div
              key={charge.id}
              className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 flex items-center gap-4 transition-all"
            >
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-green-800">✓ CHARGED — Payment Confirmed</div>
                {charge.stellarTxHash && (
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Tx: {charge.stellarTxHash}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-0.5">
                  Soroban SAC transfer · Horizon confirmed
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-green-700" style={{ fontFamily: 'var(--font-raleway)' }}>
                  {formatUsdc(charge.amountUsdc)}
                </div>
                {charge.approvedAt && (
                  <div className="text-xs text-slate-400">
                    {new Date(charge.approvedAt).toLocaleDateString('th-TH')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
