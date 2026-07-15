import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { subscriptions } from './subscriptions';

export const chargeStatusEnum = pgEnum('charge_status', ['pending', 'approved', 'failed']);

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  cycleId: text('cycle_id').notNull(),
  amountUsdc: text('amount_usdc').notNull(), // bigint as text string, 6 decimals
  status: chargeStatusEnum('status').notNull().default('pending'),
  stellarTxHash: text('stellar_tx_hash'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Charge = typeof charges.$inferSelect;
export type NewCharge = typeof charges.$inferInsert;
