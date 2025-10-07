import { pgTable, serial, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  appName: varchar('app_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stats = pgTable('stats', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id),
  avgLatency: integer('avg_latency'),
  totalTokens: integer('total_tokens'),
  totalCost: integer('total_cost'), // cents
  updatedAt: timestamp('updated_at').defaultNow(),
});