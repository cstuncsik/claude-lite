import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { StreamChunk } from './types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

import { listChats, createChat, sendMessage, onStreamChunk } from './tauri';

const invokeMock = vi.mocked(invoke);
const listenMock = vi.mocked(listen);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tauri IPC wrappers', () => {
  it('listChats() passes projectId: null when omitted', () => {
    listChats();
    expect(invokeMock).toHaveBeenCalledWith('list_chats', { projectId: null });
  });

  it('listChats(id) forwards the project id', () => {
    listChats('proj-1');
    expect(invokeMock).toHaveBeenCalledWith('list_chats', { projectId: 'proj-1' });
  });

  it('createChat() passes projectId: null when omitted', () => {
    createChat();
    expect(invokeMock).toHaveBeenCalledWith('create_chat', { projectId: null });
  });

  it('sendMessage() applies null/false defaults for optional args', () => {
    sendMessage('chat-1', 'hi');
    expect(invokeMock).toHaveBeenCalledWith('send_message', {
      chatId: 'chat-1',
      content: 'hi',
      projectId: null,
      model: null,
      images: null,
      extendedThinking: false,
      documents: null,
    });
  });

  it('sendMessage() forwards every provided argument', () => {
    const images = [{ data: 'aaa', media_type: 'image/png' }];
    const documents = [{ data: 'bbb', media_type: 'application/pdf', name: 'f.pdf' }];
    sendMessage('chat-1', 'hi', 'proj-1', 'claude-x', images, true, documents);
    expect(invokeMock).toHaveBeenCalledWith('send_message', {
      chatId: 'chat-1',
      content: 'hi',
      projectId: 'proj-1',
      model: 'claude-x',
      images,
      extendedThinking: true,
      documents,
    });
  });

  it('onStreamChunk delivers the event payload to the callback', () => {
    const cb = vi.fn();
    onStreamChunk(cb);

    expect(listenMock).toHaveBeenCalledWith('stream_chunk', expect.any(Function));
    const handler = listenMock.mock.calls[0][1] as (e: { payload: StreamChunk }) => void;
    handler({ payload: { delta: 'hello', done: false } });

    expect(cb).toHaveBeenCalledWith({ delta: 'hello', done: false });
  });
});
