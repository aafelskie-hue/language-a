import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const providerEnum = pgEnum('provider', ['credentials', 'google']);
export const tierEnum = pgEnum('tier', ['free', 'premium']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  provider: providerEnum('provider').notNull().default('credentials'),
  image: text('image'),
  tier: tierEnum('tier').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
