import { getPatternByReadingOrder, getPatternById } from '@/lib/patterns';
import type { Pattern } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface SelectionResult {
  patternIds: number[];
  rationales: string[];
  usage: { input_tokens: number; output_tokens: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern Content Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Takes an array of reading-order IDs and returns formatted full-content
 * blocks for injection into the Stage 2 reasoning prompt.
 */
export function formatPatternsForContext(readingOrderIds: number[]): string {
  const blocks: string[] = [];

  for (const ro of readingOrderIds) {
    const p = getPatternByReadingOrder(ro);
    if (!p) continue;

    const confidence = '★'.repeat(p.confidence) + '☆'.repeat(2 - p.confidence);

    const connectionsUp = p.connections_up
      .map(id => getPatternById(id))
      .filter((cp): cp is Pattern => cp !== undefined)
      .map(cp => `${cp.reading_order}: ${cp.name}`)
      .join(', ');

    const connectionsDown = p.connections_down
      .map(id => getPatternById(id))
      .filter((cp): cp is Pattern => cp !== undefined)
      .map(cp => `${cp.reading_order}: ${cp.name}`)
      .join(', ');

    blocks.push(
`--- Pattern ${p.reading_order}: ${p.name} [${p.scale}] ${confidence} ---
Category: ${p.categoryLabel}
Problem: ${p.problem}
Body: ${p.body}
Solution: ${p.solution}
Connections up (context): ${connectionsUp || 'none'}
Connections down (detail): ${connectionsDown || 'none'}
---`
    );
  }

  if (blocks.length === 0) return '';

  return `\n\n--- SELECTED PATTERN CONTENT (${blocks.length} patterns) ---\n\n${blocks.join('\n\n')}\n\n--- END SELECTED PATTERN CONTENT ---\n`;
}

/**
 * Formats Stage 1 selection rationales as readable text for the Stage 2 prompt.
 */
export function formatRationales(
  patternIds: number[],
  rationales: string[],
): string {
  return patternIds
    .map((id, i) => {
      const p = getPatternByReadingOrder(id);
      const name = p ? p.name : `Unknown (${id})`;
      const rationale = rationales[i] || 'No rationale provided';
      return `- Pattern ${id}: ${name} — ${rationale}`;
    })
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1: Pattern Selection (non-streaming)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the Anthropic API to select relevant patterns from the compressed index.
 * Returns structured selection results. Falls back gracefully on parse failures.
 */
export async function selectPatterns(
  apiKey: string,
  messages: Message[],
  selectionSystemPrompt: string,
): Promise<SelectionResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      system: selectionSystemPrompt,
      max_tokens: 500,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stage 1 API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const usage = data.usage || { input_tokens: 0, output_tokens: 0 };

  const rawText = data.content
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { text: string }) => block.text)
    .join('');

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(rawText);
    const patternsArray = parsed.patterns || parsed.selected_patterns || [];

    const patternIds: number[] = [];
    const rationales: string[] = [];

    for (const entry of patternsArray) {
      const id = typeof entry.id === 'number' ? entry.id : parseInt(entry.id, 10);
      if (id >= 1 && id <= 254 && getPatternByReadingOrder(id)) {
        patternIds.push(id);
        rationales.push(entry.rationale || '');
      }
    }

    return { patternIds, rationales, usage };
  } catch {
    // JSON parse failed — try regex extraction as fallback
    console.warn('[Guide] Stage 1 JSON parse failed, attempting regex extraction');
    const idMatches = rawText.match(/"id"\s*:\s*(\d+)/g);
    if (idMatches) {
      const patternIds = idMatches
        .map((m: string) => parseInt(m.replace(/"id"\s*:\s*/, ''), 10))
        .filter((id: number) => id >= 1 && id <= 254 && getPatternByReadingOrder(id));

      return { patternIds, rationales: patternIds.map(() => ''), usage };
    }

    // Complete failure — return empty
    console.warn('[Guide] Stage 1 extraction failed completely');
    return { patternIds: [], rationales: [], usage };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2: Reasoning (streaming)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starts a streaming Anthropic API call for the reasoning stage.
 * Returns the raw fetch Response for stream processing.
 */
export async function createReasoningStream(
  apiKey: string,
  messages: Message[],
  reasoningSystemPrompt: string,
): Promise<Response> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      system: reasoningSystemPrompt,
      max_tokens: 2048,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stage 2 API error ${response.status}: ${errorText}`);
  }

  return response;
}

/**
 * Transforms an Anthropic SSE stream into a client-friendly SSE stream.
 *
 * Emits events:
 *   data: {"type":"metadata","conversationId":"...","remaining":{...}}
 *   data: {"type":"text","text":"..."}
 *   data: {"type":"done","usage":{...}}
 *
 * Calls onComplete with the full accumulated text and usage when the stream ends.
 */
export function parseAnthropicStream(
  anthropicResponse: Response,
  metadata: { conversationId?: string; remaining?: Record<string, unknown> },
  onComplete: (text: string, usage: { input_tokens: number; output_tokens: number }) => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let fullText = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      // Send metadata event first
      const metadataEvent = `data: ${JSON.stringify({ type: 'metadata', ...metadata })}\n\n`;
      controller.enqueue(encoder.encode(metadataEvent));

      const reader = anthropicResponse.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            // Parse SSE event lines
            let eventType = '';
            let eventData = '';

            for (const line of event.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              }
            }

            if (!eventData || eventData === '[DONE]') continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === 'message_start' && parsed.message?.usage) {
                inputTokens = parsed.message.usage.input_tokens || 0;
              } else if (eventType === 'content_block_delta' && parsed.delta?.text) {
                fullText += parsed.delta.text;
                const textEvent = `data: ${JSON.stringify({ type: 'text', text: parsed.delta.text })}\n\n`;
                controller.enqueue(encoder.encode(textEvent));
              } else if (eventType === 'message_delta' && parsed.usage) {
                outputTokens = parsed.usage.output_tokens || 0;
              }
            } catch {
              // Skip unparseable event data
            }
          }
        }

        // Send done event with usage
        const usage = { input_tokens: inputTokens, output_tokens: outputTokens };
        const doneEvent = `data: ${JSON.stringify({ type: 'done', usage })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));

        controller.close();

        // Fire async completion callback (persistence, usage recording)
        onComplete(fullText, usage);
      } catch (error) {
        console.error('[Guide] Stream processing error:', error);
        const errorEvent = `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();

        // Still fire completion with what we have
        onComplete(fullText, { input_tokens: inputTokens, output_tokens: outputTokens });
      }
    },
  });
}
