import type {
  Charge,
  Event,
  Merchant,
  Plan,
  Subscription,
} from '@/server/db/schema';

export const DEMO_SUBSCRIBER_ADDRESS =
  'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGFCVI3TEEIUVDKRQHY4BC';

const merchantId = '11111111-1111-4111-8111-111111111111';
const planId = '22222222-2222-4222-8222-222222222221';
const planId2 = '22222222-2222-4222-8222-222222222222';

const inDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value;
};

const merchant: Merchant = {
  id: merchantId,
  name: 'FitLife Bangkok',
  stellarAddress: DEMO_SUBSCRIBER_ADDRESS,
  createdAt: new Date('2026-01-15T09:00:00.000Z'),
};

const plans: Plan[] = [
  {
    id: planId,
    merchantId,
    name: 'FitLife Monthly',
    amountUsdc: '20000000',
    intervalDays: 30,
    sorobanContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN',
    createdAt: new Date('2026-01-15T09:00:00.000Z'),
  },
  {
    id: planId2,
    merchantId,
    name: 'FitLife Weekly Pass',
    amountUsdc: '6000000',
    intervalDays: 7,
    sorobanContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN',
    createdAt: new Date('2026-01-15T09:00:00.000Z'),
  },
];

const subscriptions: Subscription[] = [
  {
    id: '33333333-3333-4333-8333-333333333331',
    planId,
    subscriberAddress: DEMO_SUBSCRIBER_ADDRESS,
    subscriberName: 'Jariya Nakamura',
    status: 'active',
    nextChargeAt: inDays(2),
    createdAt: new Date('2026-02-01T09:00:00.000Z'),
  },
  {
    id: '33333333-3333-4333-8333-333333333332',
    planId,
    subscriberAddress: 'GAKPKJR4ACWF6VTPZ6HBHM7BCVLCF47MFZXBQJY5GHQVJZ2K7XNPDT',
    subscriberName: 'Thida Wiriyapan',
    status: 'active',
    nextChargeAt: inDays(7),
    createdAt: new Date('2026-02-05T09:00:00.000Z'),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    planId,
    subscriberAddress: 'GDQOQP6WGF7L4XJMJGXJZ5LPQJDM5KXHRNVW5UEQCXZLPQHKNWUATB',
    subscriberName: 'Somchai Buakhaw',
    status: 'active',
    nextChargeAt: inDays(12),
    createdAt: new Date('2026-02-08T09:00:00.000Z'),
  },
  {
    id: '33333333-3333-4333-8333-333333333334',
    planId: planId2,
    subscriberAddress: 'GBDVJMEZ6ACY2Q2JZ2FCTLFQHYQ6Y5TVBNFCW4LCKXMMAQCEFNZJQBP',
    subscriberName: 'Nattakarn Srisuk',
    status: 'paused',
    nextChargeAt: inDays(30),
    createdAt: new Date('2026-02-12T09:00:00.000Z'),
  },
];

const charges: Charge[] = [
  {
    id: '44444444-4444-4444-8444-444444444441',
    subscriptionId: subscriptions[0].id,
    cycleId: 'demo-cycle-july-2026',
    amountUsdc: '20000000',
    status: 'pending',
    stellarTxHash: null,
    approvedAt: null,
    createdAt: new Date(),
  },
];

const events: Event[] = [
  ...subscriptions.map((subscription) => ({
    id: crypto.randomUUID(),
    subscriptionId: subscription.id,
    type: 'subscription_created' as const,
    payloadJson: JSON.stringify({
      subscriberName: subscription.subscriberName,
      sponsoredReserve: true,
      gaslessBadge: 'CAP-33 sponsored trustline',
    }),
    createdAt: subscription.createdAt,
  })),
];

export const demoStore = {
  merchant,
  plans,
  subscriptions,
  charges,
  events,
};
