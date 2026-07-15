import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { charges, events, merchants, plans, subscriptions } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { eventBus } from '@/server/lib/eventBus';

export async function getSubscriptionsForMerchant(merchantId: string) {
  const rows = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(plans.merchantId, merchantId))
    .orderBy(desc(subscriptions.createdAt));

  return rows;
}

export async function getSubscriptionById(id: string) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.id, id))
    .limit(1);
  if (!row) throw new AppError('NOT_FOUND', 'Subscription not found', 404);
  return row;
}

export async function getChargesForSubscription(subscriptionId: string) {
  return db
    .select()
    .from(charges)
    .where(eq(charges.subscriptionId, subscriptionId))
    .orderBy(desc(charges.createdAt));
}

export async function runBillingCycle(merchantId: string) {
  // Get all active subscriptions for merchant
  const rows = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(plans.merchantId, merchantId), eq(subscriptions.status, 'active')));

  const cycleId = `cycle-${Date.now()}`;
  const newCharges = [];

  for (const { subscription, plan } of rows) {
    // Check for existing pending charge for this cycle
    const existing = await db
      .select()
      .from(charges)
      .where(and(eq(charges.subscriptionId, subscription.id), eq(charges.cycleId, cycleId)))
      .limit(1);

    if (existing.length > 0) continue;

    // Create pending charge (Soroban SAC transfer simulation)
    const [charge] = await db
      .insert(charges)
      .values({
        subscriptionId: subscription.id,
        cycleId,
        amountUsdc: plan.amountUsdc,
        status: 'pending',
      })
      .returning();

    // Create event for charge_pending
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

    // Publish SSE event
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
  const [charge] = await db.select().from(charges).where(eq(charges.id, chargeId)).limit(1);
  if (!charge) throw new AppError('NOT_FOUND', 'Charge not found', 404);
  if (charge.status !== 'pending') {
    throw new AppError('CONFLICT', 'Charge is not in pending state', 409);
  }

  // Simulate Soroban SAC approve_charge transaction
  const fakeTxHash = `sim-${Date.now()}-${chargeId.slice(0, 8)}`;

  const [updated] = await db
    .update(charges)
    .set({
      status: 'approved',
      stellarTxHash: fakeTxHash,
      approvedAt: new Date(),
    })
    .where(eq(charges.id, chargeId))
    .returning();

  // Get subscription for context
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, charge.subscriptionId))
    .limit(1);

  if (sub) {
    // Update next charge date
    const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
    if (plan) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + plan.intervalDays);
      await db
        .update(subscriptions)
        .set({ nextChargeAt: nextDate })
        .where(eq(subscriptions.id, sub.id));
    }

    // Log event
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

    // SSE push — both dashboards update simultaneously
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
  const rows = await db
    .select({
      charge: charges,
      subscription: subscriptions,
    })
    .from(charges)
    .innerJoin(subscriptions, eq(charges.subscriptionId, subscriptions.id))
    .where(
      and(
        eq(subscriptions.subscriberAddress, subscriberAddress),
        eq(charges.status, 'pending'),
      ),
    )
    .orderBy(desc(charges.createdAt));
  return rows;
}

export async function getAllMerchants() {
  return db.select().from(merchants).orderBy(desc(merchants.createdAt));
}

export async function getAllPlans(merchantId?: string) {
  if (merchantId) {
    return db.select().from(plans).where(eq(plans.merchantId, merchantId));
  }
  return db.select().from(plans);
}

export async function getRecentEvents(limit = 20) {
  return db.select().from(events).orderBy(desc(events.createdAt)).limit(limit);
}

export async function getPendingChargesForMerchant(merchantId: string) {
  const rows = await db
    .select({
      charge: charges,
      subscription: subscriptions,
      plan: plans,
    })
    .from(charges)
    .innerJoin(subscriptions, eq(charges.subscriptionId, subscriptions.id))
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(plans.merchantId, merchantId), eq(charges.status, 'pending')))
    .orderBy(desc(charges.createdAt));
  return rows;
}
