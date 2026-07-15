import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { merchants } from './merchants';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id),
  name: text('name').notNull(),
  amountUsdc: text('amount_usdc').notNull(), // bigint as text string, 6 decimals
  intervalDays: integer('interval_days').notNull().default(30),
  sorobanContractId: text('soroban_contract_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
