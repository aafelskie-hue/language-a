import { pgTable, uuid, text, timestamp, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';

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
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Project pattern status enum
export const projectPatternStatusEnum = pgEnum('project_pattern_status', [
  'not_started', 'considering', 'applied', 'rejected'
]);

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ProjectPatterns join table
export const projectPatterns = pgTable('project_patterns', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  patternId: integer('pattern_id').notNull(),
  status: projectPatternStatusEnum('status').notNull().default('not_started'),
  notes: text('notes'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectPattern = typeof projectPatterns.$inferSelect;
export type NewProjectPattern = typeof projectPatterns.$inferInsert;

// Conversation message type for JSONB storage
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

// Conversations table for authenticated users
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  messages: jsonb('messages').$type<ConversationMessage[]>().notNull().default([]),
  totalOutputTokens: integer('total_output_tokens').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Conversation type exports
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
