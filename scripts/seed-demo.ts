import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/server/db/schema';

if (process.env.DEMO_MODE !== 'true' || process.env.STELLAR_NETWORK === 'public') {
  throw new Error('seed-demo requires DEMO_MODE=true and a non-mainnet STELLAR_NETWORK');
}

const pool = new Pool({
  connectionString: process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding Iuran demo data…');

  // Clear existing data
  await db.delete(schema.events);
  await db.delete(schema.charges);
  await db.delete(schema.subscriptions);
  await db.delete(schema.plans);
  await db.delete(schema.merchants);

  // 1. Merchant — FitLife Bangkok
  const [merchant] = await db
    .insert(schema.merchants)
    .values({
      name: 'FitLife Bangkok',
      stellarAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGFCVI3TEEIUVDKRQHY4BC',
    })
    .returning();

  console.log('✓ Merchant:', merchant.name);

  // 2. Plan — FitLife Monthly 20 USDC
  const [plan] = await db
    .insert(schema.plans)
    .values({
      merchantId: merchant.id,
      name: 'FitLife Monthly',
      amountUsdc: '20000000', // 20 USDC × 10^6
      intervalDays: 30,
      sorobanContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN',
    })
    .returning();

  console.log('✓ Plan:', plan.name, '— 20 USDC / 30 days');

  // 3. Subscribers — 5 gym members (SEA names, Thai context)
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setDate(now.getDate() + 30);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const overdue = new Date(now);
  overdue.setDate(now.getDate() - 5);

  const subscriberData = [
    {
      subscriberName: 'Jariya Nakamura',
      subscriberAddress: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGFCVI3TEEIUVDKRQHY4BC',
      status: 'active' as const,
      nextChargeAt: nextMonth,
    },
    {
      subscriberName: 'Thida Wiriyapan',
      subscriberAddress: 'GAKPKJR4ACWF6VTPZ6HBHM7BCVLCF47MFZXBQJY5GHQVJZ2K7XNPDT',
      status: 'active' as const,
      nextChargeAt: nextWeek,
    },
    {
      subscriberName: 'Somchai Buakhaw',
      subscriberAddress: 'GDQOQP6WGF7L4XJMJGXJZ5LPQJDM5KXHRNVW5UEQCXZLPQHKNWUATB',
      status: 'active' as const,
      nextChargeAt: nextMonth,
    },
    {
      subscriberName: 'Nattakarn Srisuk',
      subscriberAddress: 'GBDVJMEZ6ACY2Q2JZ2FCTLFQHYQ6Y5TVBNFCW4LCKXMMAQCEFNZJQBP',
      status: 'paused' as const,
      nextChargeAt: nextMonth,
    },
    {
      subscriberName: 'Kasem Teerawut',
      subscriberAddress: 'GCLQEQ2BBSN5RKLXUQCFKEWVFGBLKZNNZXMZWW7GOHPQFM5LMCLMZZN',
      status: 'active' as const,
      nextChargeAt: overdue,
    },
  ];

  const subs = await db
    .insert(schema.subscriptions)
    .values(subscriberData.map((s) => ({ ...s, planId: plan.id })))
    .returning();

  console.log('✓ Subscriptions:', subs.length);

  // 4. Historical charges (3 approved)
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 30);

  const historicalCharges = [
    { subscriptionId: subs[0].id, cycleId: 'cycle-jan-2026' },
    { subscriptionId: subs[1].id, cycleId: 'cycle-jan-2026' },
    { subscriptionId: subs[2].id, cycleId: 'cycle-jan-2026' },
  ];

  for (const hc of historicalCharges) {
    const [charge] = await db
      .insert(schema.charges)
      .values({
        ...hc,
        amountUsdc: plan.amountUsdc,
        status: 'approved',
        stellarTxHash: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        approvedAt: pastDate,
        createdAt: pastDate,
      })
      .returning();

    await db.insert(schema.events).values({
      subscriptionId: hc.subscriptionId,
      type: 'charge_approved',
      payloadJson: JSON.stringify({
        chargeId: charge.id,
        cycleId: hc.cycleId,
        amountUsdc: plan.amountUsdc,
        sorobanLabel: 'Soroban SAC transfer (simulated in demo)',
      }),
      createdAt: pastDate,
    });
  }

  console.log('✓ Historical charges: 3');

  // 5. subscription_created events
  for (const sub of subs) {
    await db.insert(schema.events).values({
      subscriptionId: sub.id,
      type: 'subscription_created',
      payloadJson: JSON.stringify({
        subscriberName: sub.subscriberName,
        sponsoredReserve: true,
        gaslessBadge: 'CAP-33 sponsored trustline',
      }),
    });
  }

  console.log('✓ Events created');
  console.log('');
  console.log('🚀 Seed complete! Run: npm run dev');
  console.log('   Merchant ID:', merchant.id);
  console.log('   Subscriber address (demo): GCEZWKCA…');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
