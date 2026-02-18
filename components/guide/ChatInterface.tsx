'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ChatMessage } from './ChatMessage';
import { useProjectStore } from '@/store/useProjectStore';

// Generate a unique session ID for this conversation
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message?: string;
    upgradeHint?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setSessionId(generateSessionId());
    setRateLimitInfo(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Clear any previous rate limit info
    setRateLimitInfo(null);

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn support
      const conversationHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          projectPatternIds: activeProject?.patterns.map(p => p.patternId),
          sessionId,
        }),
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        setRateLimitInfo({
          message: data.message,
          upgradeHint: data.upgradeHint,
        });
        // Remove the user message since it wasn't processed
        setMessages(messages);
        return;
      }

      // Handle service unavailable
      if (response.status === 503) {
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || 'The Pattern Guide is temporarily unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I had trouble processing that. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Header with new conversation button */}
      {messages.length > 0 && (
        <div className="flex justify-end px-4 py-2 border-b border-slate/10">
          <button
            onClick={startNewConversation}
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
            {isLoading && (
              <div className="flex items-center gap-2 text-steel">
                <div className="spinner"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Rate Limit Warning */}
      {rateLimitInfo && (
        <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">{rateLimitInfo.message}</p>
          {rateLimitInfo.upgradeHint && (
            <p className="text-xs text-amber-600 mt-1">{rateLimitInfo.upgradeHint}</p>
          )}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-slate/10 p-4 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your project or ask about patterns..."
            className="flex-1"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
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
