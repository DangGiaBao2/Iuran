import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { plans } from './plans';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'paused',
  'cancelled',
]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  subscriberAddress: text('subscriber_address').notNull(),
  subscriberName: text('subscriber_name').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  nextChargeAt: timestamp('next_charge_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
