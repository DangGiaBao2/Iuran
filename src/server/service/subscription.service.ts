import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { charges, events, merchants, plans, subscriptions } from '@/server/db/schema';
import type { Charge } from '@/server/db/schema';
import { demoStore } from '@/server/demo-store';
import { AppError } from '@/server/lib/http';
import { eventBus } from '@/server/lib/eventBus';

const useDemoStore = () =>
  process.env.DEMO_MODE === 'true' || !(process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL);

const findDemoPlan = (planId: string) => demoStore.plans.find((plan) => plan.id === planId);
const findDemoSubscription = (subscriptionId: string) =>
  demoStore.subscriptions.find((subscription) => subscription.id === subscriptionId);

export async function getSubscriptionsForMerchant(merchantId: string) {
  if (useDemoStore()) {
    return demoStore.subscriptions
      .filter((subscription) => {
        const plan = findDemoPlan(subscription.planId);
        return plan?.merchantId === merchantId;
      })
      .map((subscription) => ({ subscription, plan: findDemoPlan(subscription.planId)! }))
      .sort((a, b) => b.subscription.createdAt.getTime() - a.subscription.createdAt.getTime());
  }

  return db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(plans.merchantId, merchantId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function getSubscriptionById(id: string) {
  if (useDemoStore()) {
    const subscription = findDemoSubscription(id);
    const plan = subscription ? findDemoPlan(subscription.planId) : undefined;
    if (!subscription || !plan) throw new AppError('NOT_FOUND', 'Subscription not found', 404);
    return { subscription, plan };
  }

  const [row] = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.id, id))
    .limit(1);
  if (!row) throw new AppError('NOT_FOUND', 'Subscription not found', 404);
  return row;
}

export async function getChargesForSubscription(subscriptionId: string) {
  if (useDemoStore()) {
    return demoStore.charges
      .filter((charge) => charge.subscriptionId === subscriptionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db
    .select()
    .from(charges)
    .where(eq(charges.subscriptionId, subscriptionId))
    .orderBy(desc(charges.createdAt));
}

export async function runBillingCycle(merchantId: string) {
  if (useDemoStore()) {
    const cycleId = `demo-cycle-${Date.now()}`;
    const activeRows = demoStore.subscriptions
      .filter((subscription) => subscription.status === 'active')
      .map((subscription) => ({ subscription, plan: findDemoPlan(subscription.planId)! }))
      .filter(({ plan }) => plan.merchantId === merchantId);
    const newCharges: Charge[] = [];

    for (const { subscription, plan } of activeRows) {
      const charge: Charge = {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        cycleId,
        amountUsdc: plan.amountUsdc,
        status: 'pending',
        stellarTxHash: null,
        approvedAt: null,
        createdAt: new Date(),
      };
      demoStore.charges.unshift(charge);
      demoStore.events.unshift({
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        type: 'charge_pending',
        payloadJson: JSON.stringify({
          chargeId: charge.id,
          subscriberName: subscription.subscriberName,
          amountUsdc: plan.amountUsdc,
          cycleId,
          sorobanLabel: 'Soroban SAC transfer (simulated in demo)',
        }),
        createdAt: charge.createdAt,
      });
      eventBus.publish('billing', {
        type: 'charge_pending',
        chargeId: charge.id,
        subscriptionId: subscription.id,
        subscriberName: subscription.subscriberName,
        amountUsdc: plan.amountUsdc,
        cycleId,
      });
      newCharges.push(charge);
    }

    return { cycleId, chargesCreated: newCharges.length, charges: newCharges };
  }

  const rows = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(plans.merchantId, merchantId), eq(subscriptions.status, 'active')));

  const cycleId = `cycle-${Date.now()}`;
  const newCharges = [];

  for (const { subscription, plan } of rows) {
    const existing = await db
      .select()
      .from(charges)
      .where(and(eq(charges.subscriptionId, subscription.id), eq(charges.cycleId, cycleId)))
      .limit(1);
    if (existing.length > 0) continue;

    const [charge] = await db
      .insert(charges)
      .values({ subscriptionId: subscription.id, cycleId, amountUsdc: plan.amountUsdc, status: 'pending' })
      .returning();

    await db.insert(events).values({
      subscriptionId: subscription.id,
      type: 'charge_pending',
      payloadJson: JSON.stringify({
        chargeId: charge.id,
        subscriptionId: subscription.id,
        subscriberName: subscription.subscriberName,
        amountUsdc: plan.amountUsdc,
        cycleId,
        sorobanLabel: 'Soroban SAC transfer (simulated in demo)',
      }),
    });
    eventBus.publish('billing', {
      type: 'charge_pending',
      chargeId: charge.id,
      subscriptionId: subscription.id,
      subscriberName: subscription.subscriberName,
      amountUsdc: plan.amountUsdc,
      cycleId,
    });
    newCharges.push(charge);
  }
  return { cycleId, chargesCreated: newCharges.length, charges: newCharges };
}

export async function approveCharge(chargeId: string) {
  if (process.env.STELLAR_NETWORK === 'public') {
    throw new AppError('CONFLICT', 'Recurring charge requires a real signed Soroban transaction and confirmation', 409);
  }

  if (useDemoStore()) {
    const charge = demoStore.charges.find((item) => item.id === chargeId);
    if (!charge) throw new AppError('NOT_FOUND', 'Charge not found', 404);
    if (charge.status !== 'pending') throw new AppError('CONFLICT', 'Charge is not in pending state', 409);

    const fakeTxHash = `sim-${Date.now()}-${chargeId.slice(0, 8)}`;
    charge.status = 'approved';
    charge.stellarTxHash = fakeTxHash;
    charge.approvedAt = new Date();

    const subscription = findDemoSubscription(charge.subscriptionId);
    const plan = subscription ? findDemoPlan(subscription.planId) : undefined;
    if (subscription && plan) {
      subscription.nextChargeAt = new Date(Date.now() + plan.intervalDays * 24 * 60 * 60 * 1000);
      demoStore.events.unshift({
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        type: 'charge_approved',
        payloadJson: JSON.stringify({
          chargeId: charge.id,
          stellarTxHash: fakeTxHash,
          amountUsdc: charge.amountUsdc,
          sorobanLabel: 'Soroban SAC transfer (simulated in demo)',
          sponsoredReserve: true,
        }),
        createdAt: charge.approvedAt,
      });
      eventBus.publish('billing', {
        type: 'charge_approved',
        chargeId: charge.id,
        subscriptionId: subscription.id,
        subscriberName: subscription.subscriberName,
        amountUsdc: charge.amountUsdc,
        stellarTxHash: fakeTxHash,
      });
    }
    return charge;
  }

  const [charge] = await db.select().from(charges).where(eq(charges.id, chargeId)).limit(1);
  if (!charge) throw new AppError('NOT_FOUND', 'Charge not found', 404);
  if (charge.status !== 'pending') throw new AppError('CONFLICT', 'Charge is not in pending state', 409);

  const fakeTxHash = `sim-${Date.now()}-${chargeId.slice(0, 8)}`;
  const [updated] = await db
    .update(charges)
    .set({ status: 'approved', stellarTxHash: fakeTxHash, approvedAt: new Date() })
    .where(eq(charges.id, chargeId))
    .returning();

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, charge.subscriptionId)).limit(1);
  if (sub) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
    if (plan) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + plan.intervalDays);
      await db.update(subscriptions).set({ nextChargeAt: nextDate }).where(eq(subscriptions.id, sub.id));
    }
    await db.insert(events).values({
      subscriptionId: sub.id,
      type: 'charge_approved',
      payloadJson: JSON.stringify({
        chargeId: updated.id,
        stellarTxHash: fakeTxHash,
        amountUsdc: charge.amountUsdc,
        sorobanLabel: 'Soroban SAC transfer (simulated in demo)',
        sponsoredReserve: true,
      }),
    });
    eventBus.publish('billing', {
      type: 'charge_approved',
      chargeId: updated.id,
      subscriptionId: sub.id,
      subscriberName: sub.subscriberName,
      amountUsdc: charge.amountUsdc,
      stellarTxHash: fakeTxHash,
    });
  }
  return updated;
}

export async function getPendingChargesForSubscriber(subscriberAddress: string) {
  if (useDemoStore()) {
    return demoStore.charges
      .filter((charge) => demoStore.subscriptions.some((subscription) =>
        subscription.id === charge.subscriptionId && subscription.subscriberAddress === subscriberAddress,
      ))
      .map((charge) => ({ charge, subscription: findDemoSubscription(charge.subscriptionId)! }))
      .sort((a, b) => b.charge.createdAt.getTime() - a.charge.createdAt.getTime());
  }

  return db
    .select({ charge: charges, subscription: subscriptions })
    .from(charges)
    .innerJoin(subscriptions, eq(charges.subscriptionId, subscriptions.id))
    .where(eq(subscriptions.subscriberAddress, subscriberAddress))
    .orderBy(desc(charges.createdAt));
}

export async function getAllMerchants() {
  if (useDemoStore()) return [demoStore.merchant];
  return db.select().from(merchants).orderBy(desc(merchants.createdAt));
}

export async function getAllPlans(merchantId?: string) {
  if (useDemoStore()) return merchantId ? demoStore.plans.filter((plan) => plan.merchantId === merchantId) : demoStore.plans;
  if (merchantId) return db.select().from(plans).where(eq(plans.merchantId, merchantId));
  return db.select().from(plans);
}

export async function getRecentEvents(limit = 20) {
  if (useDemoStore()) return demoStore.events.slice(0, limit);
  return db.select().from(events).orderBy(desc(events.createdAt)).limit(limit);
}

export async function getPendingChargesForMerchant(merchantId: string) {
  if (useDemoStore()) {
    return demoStore.charges
      .map((charge) => {
        const subscription = findDemoSubscription(charge.subscriptionId);
        const plan = subscription ? findDemoPlan(subscription.planId) : undefined;
        return subscription && plan ? { charge, subscription, plan } : null;
      })
      .filter((row): row is { charge: Charge; subscription: NonNullable<ReturnType<typeof findDemoSubscription>>; plan: NonNullable<ReturnType<typeof findDemoPlan>> } => Boolean(row && row.plan.merchantId === merchantId))
      .sort((a, b) => b.charge.createdAt.getTime() - a.charge.createdAt.getTime());
  }

  return db
    .select({ charge: charges, subscription: subscriptions, plan: plans })
    .from(charges)
    .innerJoin(subscriptions, eq(charges.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(plans.merchantId, merchantId))
    .orderBy(desc(charges.createdAt));
}
