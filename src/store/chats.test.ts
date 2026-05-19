import { useChatsStore } from './chats';
import type { Chat, Message, MessageImage, MessageDocument } from '../lib/types';
import * as api from '../lib/tauri';

// Mock the API module
jest.mock('../lib/tauri', () => ({
  listChats: jest.fn(),
  listMessages: jest.fn(),
  createChat: jest.fn(),
  deleteChat: jest.fn(),
  sendMessage: jest.fn(),
  generateTitle: jest.fn(),
  updateChatTitle: jest.fn(),
}));

describe('Chats Store', () => {
  let mockChat: Chat;
  let mockMessage: Message;
  let mockImages: MessageImage[];
  let mockDocuments: MessageDocument[];

  beforeEach(() => {
    // Reset the store state before each test
    useChatsStore.setState({
      chats: [],
      currentChat: null,
      messages: [],
      isLoading: false,
      isSending: false,
      isThinking: false,
      streamingContent: '',
      error: null,
    });

    mockChat = {
      id: 'chat-1',
      project_id: 'project-1',
      title: 'Test Chat',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    mockMessage = {
      id: 'msg-1',
      chat_id: 'chat-1',
      role: 'user',
      content: 'Hello world',
      created_at: '2023-01-01T00:00:00Z',
    };

    mockImages = [{
      id: 'img-1',
      url: 'https://example.com/image.jpg',
      name: 'test-image.jpg',
    }];

    mockDocuments = [{
      id: 'doc-1',
      url: 'https://example.com/document.pdf',
      name: 'test-document.pdf',
    }];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const state = useChatsStore.getState();
      expect(state.chats).toEqual([]);
      expect(state.currentChat).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isSending).toBe(false);
      expect(state.isThinking).toBe(false);
      expect(state.streamingContent).toBe('');
      expect(state.error).toBeNull();
    });
  });

  describe('loadChats', () => {
    it('should load chats successfully', async () => {
      const mockChats = [mockChat];
      const listChatsMock = jest.spyOn(api, 'listChats').mockResolvedValue(mockChats);

      await useChatsStore.getState().loadChats('project-1');

      expect(listChatsMock).toHaveBeenCalledWith('project-1');
      expect(useChatsStore.getState().chats).toEqual(mockChats);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toBeNull();
    });

    it('should handle loading chats error', async () => {
      const errorMessage = 'Failed to load chats';
      const listChatsMock = jest.spyOn(api, 'listChats').mockRejectedValue(new Error(errorMessage));

      await useChatsStore.getState().loadChats('project-1');

      expect(listChatsMock).toHaveBeenCalledWith('project-1');
      expect(useChatsStore.getState().chats).toEqual([]);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toContain(errorMessage);
    });

    it('should set loading state during chat loading', async () => {
      const mockChats = [mockChat];
      const listChatsMock = jest.spyOn(api, 'listChats').mockResolvedValue(mockChats);

      useChatsStore.getState().loadChats('project-1');
      
      // Check that isLoading is true immediately after calling loadChats
      expect(useChatsStore.getState().isLoading).toBe(true);
    });
  });

  describe('selectChat', () => {
    it('should select a chat and load its messages', async () => {
      const mockMessages = [mockMessage];
      const listMessagesMock = jest.spyOn(api, 'listMessages').mockResolvedValue(mockMessages);

      await useChatsStore.getState().selectChat(mockChat);

      expect(listMessagesMock).toHaveBeenCalledWith(mockChat.id);
      expect(useChatsStore.getState().currentChat).toEqual(mockChat);
      expect(useChatsStore.getState().messages).toEqual(mockMessages);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toBeNull();
    });

    it('should handle selecting null chat', async () => {
      await useChatsStore.getState().selectChat(null);

      expect(useChatsStore.getState().currentChat).toBeNull();
      expect(useChatsStore.getState().messages).toEqual([]);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toBeNull();
    });

    it('should handle selecting chat messages loading error', async () => {
      const errorMessage = 'Failed to load messages';
      const listMessagesMock = jest.spyOn(api, 'listMessages').mockRejectedValue(new Error(errorMessage));

      await useChatsStore.getState().selectChat(mockChat);

      expect(listMessagesMock).toHaveBeenCalledWith(mockChat.id);
      expect(useChatsStore.getState().currentChat).toEqual(mockChat);
      expect(useChatsStore.getState().messages).toEqual([]);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toContain(errorMessage);
    });

    it('should reset streaming content when selecting a chat', async () => {
      // Set some streaming content first
      useChatsStore.setState({ streamingContent: 'some streaming content' });
      
      const listMessagesMock = jest.spyOn(api, 'listMessages').mockResolvedValue([mockMessage]);

      await useChatsStore.getState().selectChat(mockChat);

      expect(useChatsStore.getState().streamingContent).toBe('');
    });
  });

  describe('createChat', () => {
    it('should create a new chat successfully', async () => {
      const newChat = { ...mockChat, id: 'chat-2', title: 'New Chat' };
      const createChatMock = jest.spyOn(api, 'createChat').mockResolvedValue(newChat);

      const result = await useChatsStore.getState().createChat('project-1');

      expect(createChatMock).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(newChat);
      expect(useChatsStore.getState().chats).toContainEqual(newChat);
      expect(useChatsStore.getState().currentChat).toEqual(newChat);
      expect(useChatsStore.getState().messages).toEqual([]);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toBeNull();
    });

    it('should prepend the new chat to the chats list', async () => {
      const existingChats = [mockChat];
      useChatsStore.setState({ chats: existingChats });
      
      const newChat = { ...mockChat, id: 'chat-2', title: 'New Chat' };
      const createChatMock = jest.spyOn(api, 'createChat').mockResolvedValue(newChat);

      await useChatsStore.getState().createChat('project-1');

      const currentState = useChatsStore.getState();
      expect(currentState.chats[0]).toEqual(newChat);
      expect(currentState.chats[1]).toEqual(mockChat);
    });

    it('should handle create chat error', async () => {
      const errorMessage = 'Failed to create chat';
      const createChatMock = jest.spyOn(api, 'createChat').mockRejectedValue(new Error(errorMessage));

      await expect(useChatsStore.getState().createChat('project-1')).rejects.toThrow(errorMessage);

      expect(createChatMock).toHaveBeenCalledWith('project-1');
      expect(useChatsStore.getState().chats).toEqual([]);
      expect(useChatsStore.getState().currentChat).toBeNull();
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toContain(errorMessage);
    });
  });

  describe('deleteChat', () => {
    it('should delete a chat successfully', async () => {
      const testChat = { ...mockChat, id: 'chat-to-delete' };
      useChatsStore.setState({ chats: [mockChat, testChat] });

      const deleteChatMock = jest.spyOn(api, 'deleteChat').mockResolvedValue();

      await useChatsStore.getState().deleteChat(testChat.id);

      expect(deleteChatMock).toHaveBeenCalledWith(testChat.id);
      expect(useChatsStore.getState().chats).toEqual([mockChat]);
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toBeNull();
    });

    it('should remove the deleted chat from state', async () => {
      const chatToDelete = { ...mockChat, id: 'chat-3' };
      useChatsStore.setState({ chats: [mockChat, chatToDelete] });

      jest.spyOn(api, 'deleteChat').mockResolvedValue();

      await useChatsStore.getState().deleteChat(chatToDelete.id);

      expect(useChatsStore.getState().chats).not.toContainEqual(chatToDelete);
    });

    it('should clear currentChat and messages if deleted chat is current', async () => {
      useChatsStore.setState({ 
        currentChat: mockChat,
        messages: [mockMessage]
      });

      jest.spyOn(api, 'deleteChat').mockResolvedValue();

      await useChatsStore.getState().deleteChat(mockChat.id);

      expect(useChatsStore.getState().currentChat).toBeNull();
      expect(useChatsStore.getState().messages).toEqual([]);
    });

    it('should not clear currentChat and messages if deleted chat is not current', async () => {
      const otherChat = { ...mockChat, id: 'other-chat' };
      useChatsStore.setState({ 
        currentChat: otherChat,
        messages: [mockMessage],
        chats: [mockChat, otherChat]
      });

      jest.spyOn(api, 'deleteChat').mockResolvedValue();

      await useChatsStore.getState().deleteChat(mockChat.id);

      expect(useChatsStore.getState().currentChat).toEqual(otherChat);
      expect(useChatsStore.getState().messages).toEqual([mockMessage]);
    });

    it('should handle delete chat error', async () => {
      // Set up the store state with the chat to be deleted
      useChatsStore.setState({ chats: [mockChat] });

      const errorMessage = 'Failed to delete chat';
      const deleteChatMock = jest.spyOn(api, 'deleteChat').mockRejectedValue(new Error(errorMessage));

      await expect(useChatsStore.getState().deleteChat(mockChat.id)).rejects.toThrow(errorMessage);

      expect(deleteChatMock).toHaveBeenCalledWith(mockChat.id);
      expect(useChatsStore.getState().chats).toEqual([mockChat]); // Chat should remain since we're handling the error in the action
      expect(useChatsStore.getState().isLoading).toBe(false);
      expect(useChatsStore.getState().error).toContain(errorMessage);
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      useChatsStore.setState({ currentChat: mockChat });
      
      const sendMessageMock = jest.spyOn(api, 'sendMessage').mockResolvedValue();

      await useChatsStore.getState().sendMessage('Hello', 'project-1', 'model-1', mockImages, true, mockDocuments);

      expect(sendMessageMock).toHaveBeenCalledWith(
        mockChat.id,
        'Hello',
        'project-1',
        'model-1',
        mockImages,
        true,
        mockDocuments
      );
      expect(useChatsStore.getState().messages.length).toBe(1); // User message added optimistically
      expect(useChatsStore.getState().messages[0].role).toBe('user');
      expect(useChatsStore.getState().messages[0].content).toBe('Hello');
      expect(useChatsStore.getState().isSending).toBe(true);
      expect(useChatsStore.getState().isThinking).toBe(true);
    });

    it('should not send a message if no current chat is selected', async () => {
      useChatsStore.setState({ currentChat: null });
      
      const sendMessageMock = jest.spyOn(api, 'sendMessage').mockResolvedValue();

      await useChatsStore.getState().sendMessage('Hello');

      expect(sendMessageMock).not.toHaveBeenCalled();
    });

    it('should add user message optimistically', async () => {
      useChatsStore.setState({ currentChat: mockChat });
      
      jest.spyOn(api, 'sendMessage').mockResolvedValue();

      await useChatsStore.getState().sendMessage('Test message');

      const state = useChatsStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('Test message');
      expect(state.messages[0].chat_id).toBe(mockChat.id);
    });

    it('should handle sending error', async () => {
      useChatsStore.setState({ currentChat: mockChat });
      
      const errorMessage = 'Failed to send message';
      jest.spyOn(api, 'sendMessage').mockRejectedValue(new Error(errorMessage));

      await useChatsStore.getState().sendMessage('Hello');

      expect(useChatsStore.getState().error).toContain(errorMessage);
      expect(useChatsStore.getState().isSending).toBe(false);
      expect(useChatsStore.getState().isThinking).toBe(false);
    });

    it('should set isThinking based on extendedThinking parameter', async () => {
      useChatsStore.setState({ currentChat: mockChat });

      jest.spyOn(api, 'sendMessage').mockResolvedValue();

      // Without extended thinking
      await useChatsStore.getState().sendMessage('Hello', undefined, undefined, undefined, false);
      expect(useChatsStore.getState().isThinking).toBe(false);

      // With extended thinking
      await useChatsStore.getState().sendMessage('Hello', undefined, undefined, undefined, true);
      expect(useChatsStore.getState().isThinking).toBe(true);
    });
  });

  describe('appendStreamDelta', () => {
    it('should append stream delta to streaming content', () => {
      useChatsStore.getState().appendStreamDelta('Hello');
      useChatsStore.getState().appendStreamDelta(' World');

      expect(useChatsStore.getState().streamingContent).toBe('Hello World');
    });

    it('should set isThinking to false when appending delta', () => {
      useChatsStore.setState({ isThinking: true });
      
      useChatsStore.getState().appendStreamDelta('Hello');

      expect(useChatsStore.getState().isThinking).toBe(false);
    });
  });

  describe('finalizeStreamedMessage', () => {
    it('should finalize streamed message when streaming content exists', async () => {
      useChatsStore.setState({
        currentChat: mockChat,
        streamingContent: 'Finalized response',
        messages: [mockMessage], // User message is already present
      });

      await useChatsStore.getState().finalizeStreamedMessage();

      const state = useChatsStore.getState();
      expect(state.messages.length).toBe(2); // User + Assistant message
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toBe('Finalized response');
      expect(state.streamingContent).toBe('');
      expect(state.isSending).toBe(false);
      expect(state.isThinking).toBe(false);
    });

    it('should not finalize if no streaming content', async () => {
      useChatsStore.setState({
        currentChat: mockChat,
        streamingContent: '',
        messages: [mockMessage],
      });

      await useChatsStore.getState().finalizeStreamedMessage();

      expect(useChatsStore.getState().messages.length).toBe(1); // No assistant message added
    });

    it('should not finalize if no current chat', async () => {
      useChatsStore.setState({
        currentChat: null,
        streamingContent: 'Finalized response',
        messages: [mockMessage],
      });

      await useChatsStore.getState().finalizeStreamedMessage();

      expect(useChatsStore.getState().messages.length).toBe(1); // No assistant message added
    });

    it('should generate title for new chat after first exchange', async () => {
      const generateTitleMock = jest.spyOn(api, 'generateTitle').mockResolvedValue('Generated Title');
      const updateChatTitleMock = jest.spyOn(api, 'updateChatTitle').mockResolvedValue();

      useChatsStore.setState({
        currentChat: { ...mockChat, title: 'New Chat' },
        streamingContent: 'Assistant response',
        messages: [{ ...mockMessage, role: 'user', content: 'User query' }],
      });

      await useChatsStore.getState().finalizeStreamedMessage();

      expect(generateTitleMock).toHaveBeenCalledWith('User query', 'Assistant response');
      expect(updateChatTitleMock).toHaveBeenCalledWith(mockChat.id, 'Generated Title');
    });

    it('should update chat title in state after title generation', async () => {
      jest.spyOn(api, 'generateTitle').mockResolvedValue('Generated Title');
      jest.spyOn(api, 'updateChatTitle').mockResolvedValue();

      useChatsStore.setState({
        currentChat: { ...mockChat, title: 'New Chat' },
        chats: [mockChat],
        streamingContent: 'Assistant response',
        messages: [{ ...mockMessage, role: 'user', content: 'User query' }],
      });

      await useChatsStore.getState().finalizeStreamedMessage();

      expect(useChatsStore.getState().currentChat?.title).toBe('Generated Title');
      expect(useChatsStore.getState().chats[0].title).toBe('Generated Title');
    });

    it('should handle title generation error gracefully', async () => {
      jest.spyOn(api, 'generateTitle').mockRejectedValue(new Error('Title generation failed'));

      useChatsStore.setState({
        currentChat: { ...mockChat, title: 'New Chat' },
        streamingContent: 'Assistant response',
        messages: [{ ...mockMessage, role: 'user', content: 'User query' }],
      });

      // Mock console.error to prevent logging expected errors during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await useChatsStore.getState().finalizeStreamedMessage();

      // Restore console.error
      consoleSpy.mockRestore();

      // Should still finalize the message even if title generation fails
      expect(useChatsStore.getState().messages.length).toBe(2);
    });
  });

  describe('clearMessages', () => {
    it('should clear messages and streaming content', () => {
      useChatsStore.setState({
        messages: [mockMessage],
        streamingContent: 'Some content to clear',
      });

      useChatsStore.getState().clearMessages();

      expect(useChatsStore.getState().messages).toEqual([]);
      expect(useChatsStore.getState().streamingContent).toBe('');
    });
  });
});