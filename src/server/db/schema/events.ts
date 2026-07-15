import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { subscriptions } from './subscriptions';

export const eventTypeEnum = pgEnum('event_type', [
  'charge_approved',
  'charge_pending',
  'subscription_created',
]);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  type: eventTypeEnum('type').notNull(),
  payloadJson: text('payload_json').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
