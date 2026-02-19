'use client';

import Link from 'next/link';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { getPatternById, getConfidenceStars } from '@/lib/patterns';
import { AddToProjectButton } from './AddToProjectButton';
import { AddAllPatternsBar } from './AddAllPatternsBar';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Extract pattern IDs from message content
export function extractPatternIds(content: string): number[] {
  const regex = /\*\*Pattern (\d+):?\s*([^*]+)\*\*/g;
  const ids: number[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const id = parseInt(match[1], 10);
    if (!isNaN(id) && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

// Render an inline pattern card
function PatternCard({ patternId }: { patternId: number }) {
  const pattern = getPatternById(patternId);
  if (!pattern) return null;

  // Truncate problem to first sentence or 80 chars
  const firstSentence = pattern.problem.split(/[.!?]/)[0];
  const truncatedProblem = firstSentence.length > 80
    ? firstSentence.slice(0, 77) + '...'
    : firstSentence + '.';

  return (
    <div className="my-2 p-3 bg-copper-pale/30 border border-copper/20 rounded-lg hover:border-copper/40 hover:bg-copper-pale/50 transition-all group flex items-start gap-3">
      <Link
        href={`/patterns/${pattern.reading_order}`}
        className="flex-1 min-w-0 flex items-start gap-3"
      >
        <span className="font-mono text-lg font-medium text-copper flex-shrink-0">
          {pattern.reading_order}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-charcoal group-hover:text-copper transition-colors">
              {pattern.name}
            </h4>
            <span className="text-copper text-sm flex-shrink-0" title={`Confidence: ${getConfidenceStars(pattern.confidence)}`}>
              {getConfidenceStars(pattern.confidence)}
            </span>
          </div>
          <p className="text-sm text-slate">
            {truncatedProblem}
          </p>
        </div>
        <svg
          className="w-4 h-4 text-copper opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      <AddToProjectButton patternId={patternId} />
    </div>
  );
}

// Parse pattern references like "**Pattern 6: The Fifteen-Minute Shed**" into rich cards
function parsePatternReferences(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*Pattern (\d+):?\s*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push(<span key={`text-${lastIndex}`}>{textBefore}</span>);
      }
    }

    // Add the pattern card
    const patternId = parseInt(match[1], 10);
    parts.push(<PatternCard key={`pattern-${match.index}-${patternId}`} patternId={patternId} />);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim();
    if (remainingText) {
      parts.push(<span key={`text-${lastIndex}`}>{remainingText}</span>);
    }
  }

  return parts.length > 0 ? parts : [content];
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Split content by double newlines to create paragraphs
  const paragraphs = message.content.split('\n\n');

  // Extract pattern IDs for assistant messages
  const patternIds = !isUser ? extractPatternIds(message.content) : [];

  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}>
      {isUser ? (
        <p>{message.content}</p>
      ) : (
        <div className="space-y-3">
          {paragraphs.map((paragraph, i) => (
            <div key={i}>
              {parsePatternReferences(paragraph)}
            </div>
          ))}
          {patternIds.length > 0 && (
            <AddAllPatternsBar patternIds={patternIds} />
          )}
        </div>
      )}
    </div>
  );
}
