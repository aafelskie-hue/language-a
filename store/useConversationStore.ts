import { create } from 'zustand';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FullConversation extends ConversationSummary {
  messages: ConversationMessage[];
}

interface ConversationStore {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (firstMessage: string) => Promise<string | null>;
  appendMessages: (userMsg: ConversationMessage, assistantMsg: ConversationMessage) => void;
  syncMessages: (conversationId: string, userMsg: ConversationMessage, assistantMsg: ConversationMessage) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  setLocalMessages: (messages: ConversationMessage[]) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isSyncing: false,

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const conversations: ConversationSummary[] = await response.json();
        set({ conversations, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loadConversation: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (response.ok) {
        const conversation: FullConversation = await response.json();
        set({
          activeConversationId: conversation.id,
          messages: conversation.messages,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createConversation: async (firstMessage: string) => {
    set({ isSyncing: true });
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage }),
      });

      if (response.ok) {
        const conversation: ConversationSummary = await response.json();
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
          messages: [],
          isSyncing: false,
        }));
        return conversation.id;
      } else if (response.status === 429) {
        // Rate limited - let the caller handle this
        set({ isSyncing: false });
        return null;
      }
    } catch {
      set({ isSyncing: false });
    }
    return null;
  },

  appendMessages: (userMsg: ConversationMessage, assistantMsg: ConversationMessage) => {
    set((state) => ({
      messages: [...state.messages, userMsg, assistantMsg],
    }));

    // Update conversation summary in list
    const { activeConversationId, conversations } = get();
    if (activeConversationId) {
      set({
        conversations: conversations.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messageCount: c.messageCount + 2,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      });
    }
  },

  syncMessages: async (conversationId: string, userMsg: ConversationMessage, assistantMsg: ConversationMessage) => {
    // Messages are persisted by the chat API, so we just update local state
    get().appendMessages(userMsg, assistantMsg);
  },

  deleteConversation: async (id: string) => {
    set({ isSyncing: true });
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const { activeConversationId } = get();
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: activeConversationId === id ? null : activeConversationId,
          messages: activeConversationId === id ? [] : state.messages,
          isSyncing: false,
        }));
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  startNewConversation: () => {
    set({
      activeConversationId: null,
      messages: [],
    });
  },

  setLocalMessages: (messages: ConversationMessage[]) => {
    set({ messages });
  },

  clearMessages: () => {
    set({ messages: [], activeConversationId: null });
  },
}));
