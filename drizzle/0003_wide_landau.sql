CREATE TYPE "public"."analytics_event_type" AS ENUM('gap_signal', 'pattern_reference', 'entry_point', 'translation_moment', 'engagement_metric');--> statement-breakpoint
CREATE TABLE "guide_analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"pattern_reading_order" integer,
	"pattern_id" integer,
	"gap_topic" text,
	"gap_phrase" text,
	"user_query_text" text,
	"message_index" integer,
	"is_entry_point" boolean DEFAULT false,
	"co_occurring_patterns" jsonb DEFAULT '[]'::jsonb,
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guide_analytics_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guide_analytics_metadata_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "guide_analytics_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_type" text NOT NULL,
	"summary_key" text NOT NULL,
	"summary_value" jsonb NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guide_analytics_summary_summary_type_summary_key_unique" UNIQUE("summary_type","summary_key")
);
--> statement-breakpoint
ALTER TABLE "guide_analytics_events" ADD CONSTRAINT "guide_analytics_events_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;