import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Chat, Message } from '../lib/types';

vi.mock('../lib/tauri', () => ({
  listChats: vi.fn(),
  listMessages: vi.fn(),
  createChat: vi.fn(),
  deleteChat: vi.fn(),
  sendMessage: vi.fn(),
  generateTitle: vi.fn(),
  updateChatTitle: vi.fn(),
}));

import * as api from '../lib/tauri';
import { useChatsStore } from './chats';

const initialState = useChatsStore.getState();

const makeChat = (over: Partial<Chat> = {}): Chat => ({
  id: 'chat-1',
  title: 'New Chat',
  created_at: '',
  updated_at: '',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  useChatsStore.setState(initialState, true);
});

describe('useChatsStore', () => {
  it('loadChats populates chats and clears loading', async () => {
    const chats = [makeChat({ id: 'a' }), makeChat({ id: 'b' })];
    vi.mocked(api.listChats).mockResolvedValue(chats);

    await useChatsStore.getState().loadChats();

    const s = useChatsStore.getState();
    expect(s.chats).toEqual(chats);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('loadChats records an error on failure', async () => {
    vi.mocked(api.listChats).mockRejectedValue(new Error('boom'));

    await useChatsStore.getState().loadChats();

    const s = useChatsStore.getState();
    expect(s.error).toContain('boom');
    expect(s.isLoading).toBe(false);
  });

  it('createChat prepends the new chat and selects it', async () => {
    useChatsStore.setState({ chats: [makeChat({ id: 'old' })] });
    const fresh = makeChat({ id: 'new' });
    vi.mocked(api.createChat).mockResolvedValue(fresh);

    const returned = await useChatsStore.getState().createChat();

    const s = useChatsStore.getState();
    expect(returned).toEqual(fresh);
    expect(s.chats.map((c) => c.id)).toEqual(['new', 'old']);
    expect(s.currentChat).toEqual(fresh);
  });

  it('deleteChat removes the chat and clears the selection when it was current', async () => {
    const chat = makeChat({ id: 'x' });
    useChatsStore.setState({
      chats: [chat, makeChat({ id: 'y' })],
      currentChat: chat,
      messages: [{ id: 'm', chat_id: 'x', role: 'user', content: 'hi', created_at: '' }],
    });
    vi.mocked(api.deleteChat).mockResolvedValue(undefined);

    await useChatsStore.getState().deleteChat('x');

    const s = useChatsStore.getState();
    expect(s.chats.map((c) => c.id)).toEqual(['y']);
    expect(s.currentChat).toBeNull();
    expect(s.messages).toEqual([]);
  });

  it('appendStreamDelta accumulates content and ends the thinking state', () => {
    useChatsStore.setState({ streamingContent: 'Hel', isThinking: true });

    useChatsStore.getState().appendStreamDelta('lo');

    const s = useChatsStore.getState();
    expect(s.streamingContent).toBe('Hello');
    expect(s.isThinking).toBe(false);
  });

  it('sendMessage is a no-op without a current chat', async () => {
    await useChatsStore.getState().sendMessage('hi');

    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(useChatsStore.getState().messages).toEqual([]);
  });

  it('sendMessage optimistically adds the user message and calls the API', async () => {
    useChatsStore.setState({ currentChat: makeChat({ id: 'c1' }) });
    vi.mocked(api.sendMessage).mockResolvedValue({} as Message);

    await useChatsStore.getState().sendMessage('hello', undefined, 'model-x');

    const s = useChatsStore.getState();
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0]).toMatchObject({ role: 'user', content: 'hello', chat_id: 'c1' });
    expect(s.isSending).toBe(true);
    expect(api.sendMessage).toHaveBeenCalledWith(
      'c1',
      'hello',
      undefined,
      'model-x',
      undefined,
      undefined,
      undefined,
    );
  });
});
