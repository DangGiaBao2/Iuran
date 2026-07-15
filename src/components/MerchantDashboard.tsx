'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionRow {
  subscription: {
    id: string;
    subscriberName: string;
    subscriberAddress: string;
    status: string;
    nextChargeAt: string;
  };
  plan: {
    name: string;
    amountUsdc: string;
    intervalDays: number;
  };
}

interface PendingCharge {
  charge: {
    id: string;
    status: string;
    amountUsdc: string;
    cycleId: string;
    approvedAt: string | null;
  };
  subscription: { subscriberName: string; id: string };
  plan: { name: string };
}

interface BillingEvent {
  type: string;
  chargeId?: string;
  subscriptionId?: string;
  subscriberName?: string;
  amountUsdc?: string;
  stellarTxHash?: string;
}

interface Props {
  merchantId: string;
}

function formatUsdc(amountStr: string): string {
  const num = Number(amountStr) / 1_000_000;
  return `${num.toFixed(2)} USDC`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MerchantDashboard({ merchantId }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [subRes, chargeRes] = await Promise.all([
        fetch(`/api/subscriptions?merchantId=${merchantId}`),
        fetch(`/api/billing?merchantId=${merchantId}`),
      ]);
      const subJson = await subRes.json();
      const chargeJson = await chargeRes.json();
      if (subJson.ok) setSubscriptions(subJson.data);
      if (chargeJson.ok) setPendingCharges(chargeJson.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SSE subscription
  useEffect(() => {
    const evtSource = new EventSource('/api/events/stream');
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data) as BillingEvent;
      if (data.type === 'charge_approved' && data.chargeId) {
        setApprovedIds((prev) => new Set([...prev, data.chargeId!]));
        setPendingCharges((prev) =>
          prev.map((pc) =>
            pc.charge.id === data.chargeId
              ? { ...pc, charge: { ...pc.charge, status: 'approved' } }
              : pc,
          ),
        );
        toast.success(
          `✓ CHARGED — ${data.subscriberName} | ${formatUsdc(data.amountUsdc ?? '0')}`,
          { duration: 5000 },
        );
      }
      if (data.type === 'charge_pending') {
        fetchData();
      }
    };
    return () => evtSource.close();
  }, [fetchData]);

  const runBilling = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      toast.success(`Billing cycle run — ${json.data.chargesCreated} charges prepared`);
      await fetchData();
    } catch (err) {
      toast.error(`Billing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  const activeCount = subscriptions.filter((s) => s.subscription.status === 'active').length;
  const pendingCount = pendingCharges.filter((c) => c.charge.status === 'pending').length;
  const approvedCount = pendingCharges.filter((c) => c.charge.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-sky-600" />} label="Active Members" value={activeCount} />
        <StatCard icon={<Wallet className="w-5 h-5 text-amber-500" />} label="Pending Charges" value={pendingCount} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Approved" value={approvedCount} />
        <StatCard
          icon={<Zap className="w-5 h-5 text-purple-500" />}
          label="Plan Rate"
          value="20 USDC/mo"
        />
      </div>

      {/* Subscription table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'var(--font-raleway)' }}>
              FitLife Monthly Subscriptions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan: FitLife Monthly — 20 USDC / 30 days · Soroban SAC contract
            </p>
          </div>
          <button
            type="button"
            onClick={runBilling}
            disabled={running}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running…' : 'Run Billing Cycle'}
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading subscriptions…</div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No subscriptions yet. Run the seed script first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Member</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Next Charge</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Charge Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map(({ subscription, plan }) => {
                  const pending = pendingCharges.find(
                    (c) => c.subscription.id === subscription.id,
                  );
                  const isApproved =
                    pending && (pending.charge.status === 'approved' || approvedIds.has(pending.charge.id));
                  return (
                    <tr
                      key={subscription.id}
                      className={`transition-colors ${isApproved ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{subscription.subscriberName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {subscription.subscriberAddress.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={subscription.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(subscription.nextChargeAt)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {formatUsdc(plan.amountUsdc)}
                      </td>
                      <td className="px-6 py-4">
                        {pending ? (
                          isApproved ? (
                            <span className="flex items-center gap-1.5 text-green-700 font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              ✓ CHARGED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                              <Clock className="w-4 h-4" />
                              Pending Approval
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Soroban info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
        <div className="text-xs text-purple-700">
          <span className="font-bold">Soroban SAC transfer</span> — approve_charge(subscriber, merchant, amount, cycle_id) simulated via Soroban RPC.{' '}
          <span className="italic">(simulated in demo)</span>
          {' · '}
          <span className="font-semibold">Sponsored reserves (CAP-33)</span>: new subscriber trustlines are gasless.
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-slate-800" style={{ fontFamily: 'var(--font-raleway)' }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
