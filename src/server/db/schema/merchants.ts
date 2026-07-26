import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stellarAddress: text('stellar_address').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
