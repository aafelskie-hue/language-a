'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ChatMessage } from './ChatMessage';
import { ConversationHistory } from './ConversationHistory';
import { GatePrompt } from './GatePrompt';
import { useProjectStore } from '@/store/useProjectStore';
import { useConversationStore, type ConversationMessage } from '@/store/useConversationStore';

// Generate a unique session ID for anonymous conversations
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface RateLimitInfo {
  reason?: 'message_limit' | 'conversation_limit_anonymous' | 'conversation_limit_free';
  message?: string;
}

export function ChatInterface() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAuthLoading = status === 'loading';

  // Conversation store for authenticated users
  const {
    activeConversationId,
    messages: storedMessages,
    loadConversations,
    appendMessages,
    startNewConversation: resetConversation,
    setLocalMessages,
  } = useConversationStore();

  // Local state for anonymous users
  const [localMessages, setLocalMessagesState] = useState<ChatMessageType[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());

  // Shared state
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [spendLimitReached, setSpendLimitReached] = useState(false);
  const [gatePromptDismissed, setGatePromptDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  // Get messages based on auth state
  const messages: ChatMessageType[] = isAuthenticated
    ? storedMessages.map((m, i) => ({
        id: `${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))
    : localMessages;

  // Load conversations for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartNewConversation = useCallback(() => {
    if (isAuthenticated) {
      resetConversation();
    } else {
      setLocalMessagesState([]);
      setSessionId(generateSessionId());
    }
    setRateLimitInfo(null);
    setSpendLimitReached(false);
    setGatePromptDismissed(false);
  }, [isAuthenticated, resetConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Clear any previous limits
    setRateLimitInfo(null);
    setSpendLimitReached(false);

    const userContent = input.trim();
    const now = new Date().toISOString();

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: now,
    };

    // Optimistically add user message
    if (isAuthenticated) {
      setLocalMessages([...storedMessages, { role: 'user', content: userContent, timestamp: now }]);
    } else {
      setLocalMessagesState((prev) => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const currentMessages = isAuthenticated ? storedMessages : localMessages;
      const conversationHistory = [
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userContent },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          projectPatternIds: activeProject?.patterns.map((p) => p.patternId),
          projectName: activeProject?.name,
          projectDescription: activeProject?.description,
          projectPatterns: activeProject?.patterns.map((p) => ({
            patternId: p.patternId,
            status: p.status,
            notes: p.notes,
          })),
          conversationId: isAuthenticated ? activeConversationId : undefined,
          sessionId: isAuthenticated ? undefined : sessionId,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      // --- JSON response path (errors, fallback, rate limits) ---
      if (contentType.includes('application/json')) {
        const data = await response.json();

        if (response.status === 429) {
          setRateLimitInfo({
            reason: data.reason,
            message: data.message,
          });
          if (isAuthenticated) {
            setLocalMessages(storedMessages);
          } else {
            setLocalMessagesState(localMessages);
          }
          return;
        }

        if (response.status === 503 && data.error === 'spend_limit') {
          setSpendLimitReached(true);
          if (isAuthenticated) {
            setLocalMessages(storedMessages);
          } else {
            setLocalMessagesState(localMessages);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Request failed');
        }

        // Fallback JSON response (non-streaming)
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'I apologize, but I had trouble processing that. Please try again.',
          timestamp: new Date().toISOString(),
        };

        if (isAuthenticated) {
          const userMsg: ConversationMessage = { role: 'user', content: userContent, timestamp: now };
          const assistantMsg: ConversationMessage = { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp };
          appendMessages(userMsg, assistantMsg);
          if (data.conversationId && !activeConversationId) {
            loadConversations();
          }
        } else {
          setLocalMessagesState((prev) => [...prev, assistantMessage]);
        }
        return;
      }

      // --- SSE streaming response path ---
      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      // Create a placeholder assistant message that we'll update as chunks arrive
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantTimestamp = new Date().toISOString();
      let streamedContent = '';

      // Add empty assistant message to display
      if (isAuthenticated) {
        setLocalMessages([
          ...storedMessages,
          { role: 'user', content: userContent, timestamp: now },
          { role: 'assistant', content: '', timestamp: assistantTimestamp },
        ]);
      } else {
        setLocalMessagesState((prev) => [
          ...prev,
          { id: assistantMessageId, role: 'assistant', content: '', timestamp: assistantTimestamp },
        ]);
      }
      setIsLoading(false); // Hide spinner — streaming message is now visible

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let streamConversationId: string | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const event of events) {
            if (!event.trim()) continue;

            const dataLine = event.split('\n').find(line => line.startsWith('data: '));
            if (!dataLine) continue;

            try {
              const parsed = JSON.parse(dataLine.slice(6));

              if (parsed.type === 'metadata') {
                streamConversationId = parsed.conversationId;
              } else if (parsed.type === 'text') {
                streamedContent += parsed.text;
                // Update the assistant message in place
                if (isAuthenticated) {
                  setLocalMessages([
                    ...storedMessages,
                    { role: 'user', content: userContent, timestamp: now },
                    { role: 'assistant', content: streamedContent, timestamp: assistantTimestamp },
                  ]);
                } else {
                  setLocalMessagesState((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                      updated[lastIdx] = { ...updated[lastIdx], content: streamedContent };
                    }
                    return updated;
                  });
                }
              } else if (parsed.type === 'done') {
                // Stream complete — finalize
                if (isAuthenticated) {
                  const userMsg: ConversationMessage = { role: 'user', content: userContent, timestamp: now };
                  const assistantMsg: ConversationMessage = { role: 'assistant', content: streamedContent, timestamp: assistantTimestamp };
                  appendMessages(userMsg, assistantMsg);
                  if (streamConversationId && !activeConversationId) {
                    loadConversations();
                  }
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Stream error');
              }
            } catch (parseError) {
              // Skip unparseable SSE events
              if (parseError instanceof Error && parseError.message !== 'Stream error') {
                continue;
              }
              throw parseError;
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        // If we have partial content, keep it
        if (!streamedContent) {
          throw streamError;
        }
      }
      return; // Streaming path complete
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      if (isAuthenticated) {
        const msg: ConversationMessage = {
          role: 'assistant',
          content: errorMessage.content,
          timestamp: errorMessage.timestamp,
        };
        setLocalMessages([...storedMessages, { role: 'user', content: userContent, timestamp: now }, msg]);
      } else {
        setLocalMessagesState((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'How do I design a home office for cold climates?',
    'What patterns work well for neighborhood planning?',
    'How should I approach a heritage building renovation?',
    'What are the key patterns for aging in place?',
  ];

  // Render rate limit messages based on type
  const renderRateLimitMessage = () => {
    if (!rateLimitInfo) return null;

    if (rateLimitInfo.reason === 'conversation_limit_anonymous') {
      return (
        <div className="mx-4 mb-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">
            You&apos;ve used your free preview conversations. Create a free profile to continue — your projects and conversations will be saved across devices.
          </p>
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent('/guide')}`}
            className="inline-block px-4 py-2 bg-copper text-white rounded-lg hover:bg-copper/90 transition-colors text-sm font-medium"
          >
            Create Free Profile
          </Link>
        </div>
      );
    }

    if (rateLimitInfo.reason === 'conversation_limit_free') {
      // Gate prompt is shown in messages area instead
      return null;
    }

    // message_limit or fallback
    return (
      <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">{rateLimitInfo.message}</p>
      </div>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex items-center gap-2 text-steel">
          <div className="spinner"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Conversation History for authenticated users */}
      {isAuthenticated && <ConversationHistory />}

      {/* Header with new conversation button for anonymous users */}
      {!isAuthenticated && messages.length > 0 && (
        <div className="flex justify-end px-4 py-2 border-b border-slate/10">
          <button
            onClick={handleStartNewConversation}
            className="text-sm text-steel hover:text-copper transition-colors"
          >
            New conversation
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-copper-pale rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-2">Pattern Guide</h2>
            <p className="text-slate mb-6 max-w-md mx-auto">
              I can help you apply Language A&apos;s 254 patterns to your design projects.
              Describe your situation, and I&apos;ll suggest relevant patterns.
            </p>

            {activeProject && (
              <p className="text-sm text-steel mb-6">
                Project context: <span className="text-copper">{activeProject.name}</span> ({activeProject.patterns.length} patterns)
              </p>
            )}

            {!isAuthenticated && (
              <p className="text-xs text-steel mb-4">
                <Link href="/auth/signin" className="text-copper hover:underline">Sign in</Link> to save conversations across devices
              </p>
            )}

            <div className="space-y-2 max-w-lg mx-auto">
              <p className="text-sm text-steel mb-2">Try asking:</p>
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setInput(question)}
                  className="block w-full text-left px-4 py-2 text-sm text-slate bg-white border border-slate/10 rounded-lg hover:border-copper/30 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {rateLimitInfo?.reason === 'conversation_limit_free' && !gatePromptDismissed && (
              <GatePrompt onDismiss={() => setGatePromptDismissed(true)} />
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-steel">
                <div className="spinner"></div>
                <span className="text-sm">Analyzing your question...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Spend Limit Warning */}
      {spendLimitReached && (
        <div className="mx-4 mb-2 p-4 bg-slate/5 border border-slate/20 rounded-lg">
          <p className="text-sm text-slate">
            The AI Guide is taking a brief rest. All patterns, the network, and your projects are still available.
          </p>
        </div>
      )}

      {/* Rate Limit Warning */}
      {renderRateLimitMessage()}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-slate/10 p-4 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your project or ask about patterns..."
            className="flex-1"
            disabled={isLoading || spendLimitReached || rateLimitInfo?.reason === 'conversation_limit_anonymous' || rateLimitInfo?.reason === 'conversation_limit_free'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || spendLimitReached}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-steel mt-2">
          {activeProject
            ? `Using project "${activeProject.name}" for context`
            : 'No active project - select one in Projects to get contextual suggestions'}
        </p>
      </form>
    </div>
  );
}
