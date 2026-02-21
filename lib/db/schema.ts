import { pgTable, uuid, text, timestamp, pgEnum, integer, jsonb, boolean, unique } from 'drizzle-orm/pg-core';

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
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
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

// Analytics event types
export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  'gap_signal', 'pattern_reference', 'entry_point', 'translation_moment', 'engagement_metric'
]);

// Guide analytics events - stores extracted signals from conversations
export const guideAnalyticsEvents = pgTable('guide_analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  eventType: analyticsEventTypeEnum('event_type').notNull(),
  patternReadingOrder: integer('pattern_reading_order'),
  patternId: integer('pattern_id'),
  gapTopic: text('gap_topic'),
  gapPhrase: text('gap_phrase'),
  userQueryText: text('user_query_text'),
  messageIndex: integer('message_index'),
  isEntryPoint: boolean('is_entry_point').default(false),
  coOccurringPatterns: jsonb('co_occurring_patterns').$type<number[]>().default([]),
  timestamp: timestamp('timestamp'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Guide analytics summary - materialized aggregations for fast dashboard queries
// CRITICAL: Unique constraint on (summary_type, summary_key) enables upsert on reprocess
export const guideAnalyticsSummary = pgTable('guide_analytics_summary', {
  id: uuid('id').defaultRandom().primaryKey(),
  summaryType: text('summary_type').notNull(),
  summaryKey: text('summary_key').notNull(),
  summaryValue: jsonb('summary_value').notNull(),
  count: integer('count').notNull().default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  uniqueTypeKey: unique().on(table.summaryType, table.summaryKey),
}));

// Guide analytics metadata - tracks processing state
export const guideAnalyticsMetadata = pgTable('guide_analytics_metadata', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analytics type exports
export type GuideAnalyticsEvent = typeof guideAnalyticsEvents.$inferSelect;
export type NewGuideAnalyticsEvent = typeof guideAnalyticsEvents.$inferInsert;
export type GuideAnalyticsSummary = typeof guideAnalyticsSummary.$inferSelect;
export type NewGuideAnalyticsSummary = typeof guideAnalyticsSummary.$inferInsert;
export type GuideAnalyticsMetadata = typeof guideAnalyticsMetadata.$inferSelect;
export type NewGuideAnalyticsMetadata = typeof guideAnalyticsMetadata.$inferInsert;
