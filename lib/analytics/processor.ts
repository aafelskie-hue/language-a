import { db } from '@/lib/db';
import {
  conversations,
  guideAnalyticsEvents,
  guideAnalyticsSummary,
  guideAnalyticsMetadata,
  type ConversationMessage,
} from '@/lib/db/schema';
import { eq, gt } from 'drizzle-orm';
import { getPatternByReadingOrder, getPatternById } from '@/lib/patterns';
import {
  extractPatternReferences,
  detectGapSignals,
  extractGapTopic,
} from './pattern-extractor';

interface ProcessingResult {
  conversationsProcessed: number;
  eventsCreated: number;
  errors: string[];
}

interface PatternCoOccurrence {
  pattern1: number;
  pattern2: number;
  count: number;
  isConnectedInNetwork: boolean;
}

interface GapSummary {
  topic: string;
  phrase: string;
  count: number;
  sampleConversationIds: string[];
}

interface EntryPointSummary {
  readingOrder: number;
  patternId: number;
  patternName: string;
  count: number;
  percentage: number;
}

interface TranslationMoment {
  userQuery: string;
  patterns: number[];
  count: number;
}

/**
 * Get the last processed timestamp from metadata.
 */
async function getLastProcessedAt(): Promise<Date | null> {
  const [meta] = await db
    .select()
    .from(guideAnalyticsMetadata)
    .where(eq(guideAnalyticsMetadata.key, 'last_processed_at'));

  return meta ? new Date(meta.value) : null;
}

/**
 * Update the last processed timestamp.
 */
async function setLastProcessedAt(timestamp: Date): Promise<void> {
  await db
    .insert(guideAnalyticsMetadata)
    .values({
      key: 'last_processed_at',
      value: timestamp.toISOString(),
    })
    .onConflictDoUpdate({
      target: guideAnalyticsMetadata.key,
      set: {
        value: timestamp.toISOString(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Process a single conversation and extract analytics events.
 */
function processConversation(
  conversationId: string,
  messages: ConversationMessage[]
): Omit<typeof guideAnalyticsEvents.$inferInsert, 'id' | 'createdAt'>[] {
  const events: Omit<typeof guideAnalyticsEvents.$inferInsert, 'id' | 'createdAt'>[] = [];
  let firstPatternFound = false;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const timestamp = message.timestamp ? new Date(message.timestamp) : undefined;

    if (message.role === 'assistant') {
      // Extract pattern references
      const patternReadingOrders = extractPatternReferences(message.content);

      for (const readingOrder of patternReadingOrders) {
        const pattern = getPatternByReadingOrder(readingOrder);
        const patternId = pattern?.id || null;
        const isEntryPoint = !firstPatternFound;

        if (!firstPatternFound && patternReadingOrders.length > 0) {
          firstPatternFound = true;
        }

        // Get co-occurring patterns (other patterns in same message)
        const coOccurring = patternReadingOrders
          .filter(ro => ro !== readingOrder)
          .map(ro => {
            const p = getPatternByReadingOrder(ro);
            return p?.id || null;
          })
          .filter((id): id is number => id !== null);

        events.push({
          conversationId,
          eventType: isEntryPoint ? 'entry_point' : 'pattern_reference',
          patternReadingOrder: readingOrder,
          patternId,
          messageIndex: i,
          isEntryPoint,
          coOccurringPatterns: coOccurring,
          timestamp,
        });
      }

      // Detect gap signals
      const gapPhrases = detectGapSignals(message.content);
      for (const phrase of gapPhrases) {
        const topic = extractGapTopic(message.content, phrase);

        events.push({
          conversationId,
          eventType: 'gap_signal',
          gapPhrase: phrase,
          gapTopic: topic,
          messageIndex: i,
          timestamp,
        });
      }

      // Translation moments: look for user query that preceded this response
      if (i > 0 && messages[i - 1].role === 'user' && patternReadingOrders.length > 0) {
        const userQuery = messages[i - 1].content.slice(0, 500);

        events.push({
          conversationId,
          eventType: 'translation_moment',
          userQueryText: userQuery,
          coOccurringPatterns: patternReadingOrders.map(ro => {
            const p = getPatternByReadingOrder(ro);
            return p?.id || null;
          }).filter((id): id is number => id !== null),
          messageIndex: i,
          timestamp,
        });
      }
    }
  }

  // Add engagement metric for conversation
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  const allPatterns = new Set<number>();

  messages.forEach(m => {
    if (m.role === 'assistant') {
      extractPatternReferences(m.content).forEach(ro => {
        const p = getPatternByReadingOrder(ro);
        if (p) allPatterns.add(p.id);
      });
    }
  });

  events.push({
    conversationId,
    eventType: 'engagement_metric',
    messageIndex: messages.length,
    coOccurringPatterns: Array.from(allPatterns),
    timestamp: messages[messages.length - 1]?.timestamp
      ? new Date(messages[messages.length - 1].timestamp)
      : undefined,
  });

  return events;
}

/**
 * Rebuild summary tables from events.
 */
async function rebuildSummaries(): Promise<void> {
  // Get all events
  const events = await db.select().from(guideAnalyticsEvents);

  // 1. Gap topic summaries
  const gapMap = new Map<string, GapSummary>();
  for (const event of events) {
    if (event.eventType === 'gap_signal' && event.gapPhrase) {
      const key = event.gapPhrase.toLowerCase();
      const existing = gapMap.get(key);
      if (existing) {
        existing.count++;
        if (!existing.sampleConversationIds.includes(event.conversationId)) {
          existing.sampleConversationIds.push(event.conversationId);
        }
      } else {
        gapMap.set(key, {
          topic: event.gapTopic || event.gapPhrase,
          phrase: event.gapPhrase,
          count: 1,
          sampleConversationIds: [event.conversationId],
        });
      }
    }
  }

  // 2. Entry point summaries
  const entryPointMap = new Map<number, number>();
  let totalEntryPoints = 0;
  for (const event of events) {
    if (event.eventType === 'entry_point' && event.patternId) {
      totalEntryPoints++;
      entryPointMap.set(event.patternId, (entryPointMap.get(event.patternId) || 0) + 1);
    }
  }

  const entryPoints: EntryPointSummary[] = [];
  const entryPointEntries = Array.from(entryPointMap.entries());
  for (const [patternId, count] of entryPointEntries) {
    const pattern = getPatternById(patternId);
    if (pattern) {
      entryPoints.push({
        readingOrder: pattern.reading_order,
        patternId,
        patternName: pattern.name,
        count,
        percentage: totalEntryPoints > 0 ? (count / totalEntryPoints) * 100 : 0,
      });
    }
  }

  // 3. Co-occurrence summaries
  const coOccurrenceMap = new Map<string, PatternCoOccurrence>();
  for (const event of events) {
    if (
      (event.eventType === 'pattern_reference' || event.eventType === 'entry_point') &&
      event.patternId &&
      event.coOccurringPatterns &&
      Array.isArray(event.coOccurringPatterns)
    ) {
      for (const otherId of event.coOccurringPatterns) {
        if (typeof otherId !== 'number') continue;

        // Create consistent key (smaller id first)
        const key = event.patternId < otherId
          ? `${event.patternId}-${otherId}`
          : `${otherId}-${event.patternId}`;

        const pattern1 = getPatternById(Math.min(event.patternId, otherId));
        const pattern2 = getPatternById(Math.max(event.patternId, otherId));

        // Check if connected in the pattern network
        let isConnected = false;
        if (pattern1 && pattern2) {
          isConnected =
            pattern1.connections_up.includes(pattern2.id) ||
            pattern1.connections_down.includes(pattern2.id) ||
            pattern2.connections_up.includes(pattern1.id) ||
            pattern2.connections_down.includes(pattern1.id);
        }

        const existing = coOccurrenceMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          coOccurrenceMap.set(key, {
            pattern1: Math.min(event.patternId, otherId),
            pattern2: Math.max(event.patternId, otherId),
            count: 1,
            isConnectedInNetwork: isConnected,
          });
        }
      }
    }
  }

  // 4. Translation moments
  const translationMap = new Map<string, TranslationMoment>();
  for (const event of events) {
    if (event.eventType === 'translation_moment' && event.userQueryText) {
      // Normalize query for grouping (lowercase, trim)
      const normalizedQuery = event.userQueryText.toLowerCase().trim().slice(0, 200);
      const existing = translationMap.get(normalizedQuery);
      if (existing) {
        existing.count++;
        // Merge patterns
        const patternIds = event.coOccurringPatterns as number[] || [];
        for (const id of patternIds) {
          if (!existing.patterns.includes(id)) {
            existing.patterns.push(id);
          }
        }
      } else {
        translationMap.set(normalizedQuery, {
          userQuery: event.userQueryText.slice(0, 200),
          patterns: (event.coOccurringPatterns as number[]) || [],
          count: 1,
        });
      }
    }
  }

  // 5. Engagement metrics
  const engagementEvents = events.filter(e => e.eventType === 'engagement_metric');
  const conversationIdSet = new Set(events.map(e => e.conversationId));
  const totalConversations = conversationIdSet.size;
  const avgPatterns = engagementEvents.length > 0
    ? engagementEvents.reduce((sum, e) => sum + ((e.coOccurringPatterns as number[])?.length || 0), 0) / engagementEvents.length
    : 0;

  // Clear existing summaries and insert new ones
  await db.delete(guideAnalyticsSummary);

  const summariesToInsert: typeof guideAnalyticsSummary.$inferInsert[] = [];

  // Gap summaries
  const gapEntries = Array.from(gapMap.entries());
  for (const [key, gap] of gapEntries) {
    summariesToInsert.push({
      summaryType: 'gap',
      summaryKey: key,
      summaryValue: gap,
      count: gap.count,
    });
  }

  // Entry point summaries
  for (const entry of entryPoints) {
    summariesToInsert.push({
      summaryType: 'entry_point',
      summaryKey: String(entry.patternId),
      summaryValue: entry,
      count: entry.count,
    });
  }

  // Co-occurrence summaries
  const coOccurrenceEntries = Array.from(coOccurrenceMap.entries());
  for (const [key, coOccurrence] of coOccurrenceEntries) {
    summariesToInsert.push({
      summaryType: 'co_occurrence',
      summaryKey: key,
      summaryValue: coOccurrence,
      count: coOccurrence.count,
    });
  }

  // Translation summaries (top 100 by count)
  const topTranslations = Array.from(translationMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  for (const translation of topTranslations) {
    summariesToInsert.push({
      summaryType: 'translation',
      summaryKey: translation.userQuery.slice(0, 100),
      summaryValue: translation,
      count: translation.count,
    });
  }

  // Overall engagement summary
  summariesToInsert.push({
    summaryType: 'engagement',
    summaryKey: 'overall',
    summaryValue: {
      totalConversations,
      avgPatternsPerConversation: Math.round(avgPatterns * 100) / 100,
      totalGapsDetected: gapMap.size,
      totalEntryPoints: entryPoints.length,
    },
    count: totalConversations,
  });

  if (summariesToInsert.length > 0) {
    await db.insert(guideAnalyticsSummary).values(summariesToInsert);
  }
}

/**
 * Main processing function.
 * @param fullReprocess If true, clears existing data and reprocesses all conversations.
 */
export async function processConversations(
  fullReprocess = false
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    conversationsProcessed: 0,
    eventsCreated: 0,
    errors: [],
  };

  try {
    const lastProcessed = fullReprocess ? null : await getLastProcessedAt();

    // If full reprocess, clear existing events
    if (fullReprocess) {
      await db.delete(guideAnalyticsEvents);
    }

    // Fetch conversations to process
    const conversationsToProcess = lastProcessed
      ? await db
          .select()
          .from(conversations)
          .where(gt(conversations.updatedAt, lastProcessed))
      : await db.select().from(conversations);

    // Process each conversation
    for (const conversation of conversationsToProcess) {
      try {
        // For incremental processing, delete existing events for this conversation
        if (!fullReprocess && lastProcessed) {
          await db
            .delete(guideAnalyticsEvents)
            .where(eq(guideAnalyticsEvents.conversationId, conversation.id));
        }

        const messages = conversation.messages as ConversationMessage[];
        if (!messages || messages.length === 0) continue;

        const events = processConversation(conversation.id, messages);

        if (events.length > 0) {
          await db.insert(guideAnalyticsEvents).values(events);
          result.eventsCreated += events.length;
        }

        result.conversationsProcessed++;
      } catch (err) {
        result.errors.push(
          `Error processing conversation ${conversation.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Rebuild summaries
    await rebuildSummaries();

    // Update last processed timestamp
    await setLastProcessedAt(new Date());
  } catch (err) {
    result.errors.push(
      `Fatal error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return result;
}

/**
 * Get aggregated dashboard data from summaries.
 */
export async function getDashboardData() {
  const summaries = await db.select().from(guideAnalyticsSummary);
  const [metadata] = await db
    .select()
    .from(guideAnalyticsMetadata)
    .where(eq(guideAnalyticsMetadata.key, 'last_processed_at'));

  // Group summaries by type
  const gaps = summaries
    .filter(s => s.summaryType === 'gap')
    .map(s => s.summaryValue as GapSummary)
    .sort((a, b) => b.count - a.count);

  const entryPoints = summaries
    .filter(s => s.summaryType === 'entry_point')
    .map(s => s.summaryValue as EntryPointSummary)
    .sort((a, b) => b.count - a.count);

  const coOccurrence = summaries
    .filter(s => s.summaryType === 'co_occurrence')
    .map(s => s.summaryValue as PatternCoOccurrence)
    .sort((a, b) => b.count - a.count);

  const translations = summaries
    .filter(s => s.summaryType === 'translation')
    .map(s => s.summaryValue as TranslationMoment)
    .sort((a, b) => b.count - a.count);

  const [engagementSummary] = summaries.filter(
    s => s.summaryType === 'engagement' && s.summaryKey === 'overall'
  );

  return {
    gapTopics: gaps,
    coOccurrence,
    entryPoints,
    translationMap: translations,
    engagement: engagementSummary?.summaryValue || {
      totalConversations: 0,
      avgPatternsPerConversation: 0,
      totalGapsDetected: 0,
      totalEntryPoints: 0,
    },
    meta: {
      lastProcessedAt: metadata?.value || null,
      totalSummaries: summaries.length,
    },
  };
}
