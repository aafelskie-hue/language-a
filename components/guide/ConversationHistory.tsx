'use client';

import { useState } from 'react';
import { useConversationStore, type ConversationSummary } from '@/store/useConversationStore';

export function ConversationHistory() {
  const {
    conversations,
    activeConversationId,
    loadConversation,
    deleteConversation,
    startNewConversation,
    isLoading,
    isSyncing,
  } = useConversationStore();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Show max 10 recent conversations
  const recentConversations = conversations.slice(0, 10);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="border-b border-slate/10 p-3">
        <div className="flex items-center gap-2 text-sm text-steel">
          <div className="spinner"></div>
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  const handleSelect = (conv: ConversationSummary) => {
    if (conv.id === activeConversationId) return;
    loadConversation(conv.id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      await deleteConversation(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="border-b border-slate/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-steel uppercase tracking-wider">
          Conversations
        </span>
        <button
          onClick={startNewConversation}
          disabled={isSyncing || (!activeConversationId && conversations.length === 0)}
          className="text-xs text-copper hover:text-copper/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>

      {recentConversations.length === 0 ? (
        <p className="text-xs text-slate py-2">
          No conversations yet. Start a new one below.
        </p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv)}
              className={`
                group flex items-center justify-between p-2 rounded cursor-pointer text-sm
                ${conv.id === activeConversationId
                  ? 'bg-copper/10 text-charcoal'
                  : 'hover:bg-slate/5 text-slate'
                }
              `}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="truncate font-medium">{conv.title}</div>
                <div className="text-xs text-steel">
                  {conv.messageCount} messages
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className={`
                  flex-shrink-0 p-1 rounded transition-colors
                  ${deleteConfirm === conv.id
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'opacity-0 group-hover:opacity-100 text-steel hover:text-charcoal hover:bg-slate/10'
                  }
                `}
                title={deleteConfirm === conv.id ? 'Click again to confirm' : 'Delete conversation'}
              >
                {deleteConfirm === conv.id ? (
                  <span className="text-xs px-1">Delete?</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {conversations.length > 10 && (
        <p className="text-xs text-steel mt-2 text-center">
          Showing 10 most recent
        </p>
      )}
    </div>
  );
}
