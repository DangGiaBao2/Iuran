'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Toaster } from 'sonner';
import MerchantDashboard from '@/src/components/MerchantDashboard';
import SubscriberDashboard from '@/src/components/SubscriberDashboard';

const DEMO_SUBSCRIBER_ADDRESS = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGFCVI3TEEIUVDKRQHY4BC';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'merchant' | 'subscriber'>('merchant');
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/merchants')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.data.length > 0) setMerchantId(json.data[0].id);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />
      {/* Header */}
      <header className="bg-sky-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <RefreshCw className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-raleway)' }}>
              Iuran
            </h1>
            <p className="text-sky-200 text-xs">Recurring USDC billing. No cards, no friction.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs bg-sky-700 text-sky-100 px-2 py-1 rounded-full font-medium">
              Stellar Mainnet contract
            </span>
            <span className="text-xs bg-sky-500 text-white px-2 py-1 rounded-full font-medium">
              Demo data + Freighter Mainnet action
            </span>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex w-full sm:w-fit flex-wrap gap-1 bg-white rounded-xl shadow-sm p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('merchant')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'merchant'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Merchant — FitLife Bangkok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriber')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'subscriber'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Subscriber — Member View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'merchant' ? (
          merchantId ? (
            <MerchantDashboard merchantId={merchantId} />
          ) : (
            <div className="py-16 text-center text-slate-400">Loading merchant data…</div>
          )
        ) : (
          <SubscriberDashboard subscriberAddress={DEMO_SUBSCRIBER_ADDRESS} />
        )}
      </div>
    </div>
  );
}
