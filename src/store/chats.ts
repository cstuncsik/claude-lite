import { create } from 'zustand';
import type { Chat, Message, MessageImage } from '../lib/types';
import * as api from '../lib/tauri';

interface ChatsState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  isThinking: boolean;
  streamingContent: string;
  error: string | null;

  loadChats: (projectId?: string) => Promise<void>;
  selectChat: (chat: Chat | null) => Promise<void>;
  createChat: (projectId?: string) => Promise<Chat>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, projectId?: string, model?: string, images?: MessageImage[], extendedThinking?: boolean) => Promise<void>;
  appendStreamDelta: (delta: string) => void;
  finalizeStreamedMessage: () => void;
  clearMessages: () => void;
}

export const useChatsStore = create<ChatsState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  isSending: false,
  isThinking: false,
  streamingContent: '',
  error: null,

  loadChats: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const chats = await api.listChats(projectId);
      set({ chats, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectChat: async (chat) => {
    set({ currentChat: chat, isLoading: true, error: null, messages: [], streamingContent: '' });
    if (chat) {
      try {
        const messages = await api.listMessages(chat.id);
        set({ messages, isLoading: false });
      } catch (error) {
        set({ error: String(error), isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  createChat: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const chat = await api.createChat(projectId);
      set((state) => ({
        chats: [chat, ...state.chats],
        currentChat: chat,
        messages: [],
        isLoading: false,
        streamingContent: '',
      }));
      return chat;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteChat: async (chatId) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteChat(chatId);
      set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
        messages: state.currentChat?.id === chatId ? [] : state.messages,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  sendMessage: async (content, projectId, model, images, extendedThinking) => {
    const { currentChat } = get();
    if (!currentChat) return;

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: currentChat.id,
      role: 'user',
      content,
      images,
      model,
      extended_thinking: extendedThinking,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      isThinking: extendedThinking || false,
      streamingContent: '',
      error: null,
    }));

    try {
      await api.sendMessage(currentChat.id, content, projectId, model, images, extendedThinking);
      // Title will be auto-generated in finalizeStreamedMessage after assistant responds
    } catch (error) {
      set({ error: String(error), isSending: false, isThinking: false });
    }
  },

  appendStreamDelta: (delta) => {
    set((state) => ({
      streamingContent: state.streamingContent + delta,
      isThinking: false, // Once we start getting content, thinking is done
    }));
  },

  finalizeStreamedMessage: async () => {
    const { streamingContent, currentChat, messages } = get();
    if (streamingContent && currentChat) {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        chat_id: currentChat.id,
        role: 'assistant',
        content: streamingContent,
        created_at: new Date().toISOString(),
      };

      const updatedMessages = [...messages, assistantMessage];

      set({
        messages: updatedMessages,
        streamingContent: '',
        isSending: false,
        isThinking: false,
      });

      // Auto-generate title after first exchange (user + assistant message)
      if (updatedMessages.length === 2 && currentChat.title === 'New Chat') {
        const firstUserMessage = updatedMessages.find(m => m.role === 'user');
        if (firstUserMessage) {
          try {
            // Use AI to generate title based on conversation
            const title = await api.generateTitle(firstUserMessage.content, streamingContent);
            await api.updateChatTitle(currentChat.id, title);

            // Update local state
            set((state) => ({
              currentChat: state.currentChat ? { ...state.currentChat, title } : null,
              chats: state.chats.map(c =>
                c.id === currentChat.id ? { ...c, title } : c
              ),
            }));
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
        }
      }
    }
  },

  clearMessages: () => {
    set({ messages: [], streamingContent: '' });
  },
}));
