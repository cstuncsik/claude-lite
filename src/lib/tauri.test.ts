import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Chat, Message, MessageImage, MessageDocument, Project, ProjectSettings, StreamChunk } from './types';
import * as tauriModule from './tauri';

// Mock the Tauri API functions
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/event', () => ({
  listen: jest.fn(),
}));

const mockedInvoke = invoke as jest.MockedFunction<typeof invoke>;
const mockedListen = listen as jest.MockedFunction<typeof listen>;

describe('tauri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project functions', () => {
    describe('listProjects', () => {
      it('should call invoke with list_projects command', async () => {
        const mockProjects: Project[] = [
          { id: '1', name: 'Test Project', createdAt: new Date(), settings: {} as ProjectSettings },
        ];
        mockedInvoke.mockResolvedValue(mockProjects);

        const result = await tauriModule.listProjects();

        expect(invoke).toHaveBeenCalledWith('list_projects');
        expect(result).toEqual(mockProjects);
      });
    });

    describe('createProject', () => {
      it('should call invoke with create_project command and name parameter', async () => {
        const mockProject: Project = { 
          id: '1', 
          name: 'New Project', 
          createdAt: new Date(), 
          settings: {} as ProjectSettings 
        };
        const projectName = 'New Project';
        mockedInvoke.mockResolvedValue(mockProject);

        const result = await tauriModule.createProject(projectName);

        expect(invoke).toHaveBeenCalledWith('create_project', { name: projectName });
        expect(result).toEqual(mockProject);
      });
    });

    describe('getProject', () => {
      it('should call invoke with get_project command and projectId parameter', async () => {
        const mockProject: Project = { 
          id: '1', 
          name: 'Test Project', 
          createdAt: new Date(), 
          settings: {} as ProjectSettings 
        };
        const projectId = '1';
        mockedInvoke.mockResolvedValue(mockProject);

        const result = await tauriModule.getProject(projectId);

        expect(invoke).toHaveBeenCalledWith('get_project', { projectId });
        expect(result).toEqual(mockProject);
      });
    });

    describe('getProjectSettings', () => {
      it('should call invoke with get_project_settings command and projectId parameter', async () => {
        const mockSettings: ProjectSettings = { 
          model: 'gpt-4',
          temperature: 0.7
        };
        const projectId = '1';
        mockedInvoke.mockResolvedValue(mockSettings);

        const result = await tauriModule.getProjectSettings(projectId);

        expect(invoke).toHaveBeenCalledWith('get_project_settings', { projectId });
        expect(result).toEqual(mockSettings);
      });
    });

    describe('updateProjectSettings', () => {
      it('should call invoke with update_project_settings command and parameters', async () => {
        const projectId = '1';
        const settings: ProjectSettings = { model: 'claude', temperature: 0.5 };
        
        await tauriModule.updateProjectSettings(projectId, settings);

        expect(invoke).toHaveBeenCalledWith('update_project_settings', { projectId, settings });
      });
    });

    describe('deleteProject', () => {
      it('should call invoke with delete_project command and projectId parameter', async () => {
        const projectId = '1';
        
        await tauriModule.deleteProject(projectId);

        expect(invoke).toHaveBeenCalledWith('delete_project', { projectId });
      });
    });
  });

  describe('Chat functions', () => {
    describe('listChats', () => {
      it('should call invoke with list_chats command and null projectId when not provided', async () => {
        const mockChats: Chat[] = [
          { id: '1', title: 'Test Chat', createdAt: new Date(), projectId: '1' },
        ];
        mockedInvoke.mockResolvedValue(mockChats);

        const result = await tauriModule.listChats();

        expect(invoke).toHaveBeenCalledWith('list_chats', { projectId: null });
        expect(result).toEqual(mockChats);
      });

      it('should call invoke with list_chats command and provided projectId', async () => {
        const mockChats: Chat[] = [
          { id: '1', title: 'Test Chat', createdAt: new Date(), projectId: '1' },
        ];
        const projectId = '1';
        mockedInvoke.mockResolvedValue(mockChats);

        const result = await tauriModule.listChats(projectId);

        expect(invoke).toHaveBeenCalledWith('list_chats', { projectId });
        expect(result).toEqual(mockChats);
      });
    });

    describe('createChat', () => {
      it('should call invoke with create_chat command and null projectId when not provided', async () => {
        const mockChat: Chat = { 
          id: '1', 
          title: 'New Chat', 
          createdAt: new Date(), 
          projectId: '1' 
        };
        mockedInvoke.mockResolvedValue(mockChat);

        const result = await tauriModule.createChat();

        expect(invoke).toHaveBeenCalledWith('create_chat', { projectId: null });
        expect(result).toEqual(mockChat);
      });

      it('should call invoke with create_chat command and provided projectId', async () => {
        const mockChat: Chat = { 
          id: '1', 
          title: 'New Chat', 
          createdAt: new Date(), 
          projectId: '1' 
        };
        const projectId = '1';
        mockedInvoke.mockResolvedValue(mockChat);

        const result = await tauriModule.createChat(projectId);

        expect(invoke).toHaveBeenCalledWith('create_chat', { projectId });
        expect(result).toEqual(mockChat);
      });
    });

    describe('getChat', () => {
      it('should call invoke with get_chat command and chatId parameter', async () => {
        const mockChat: Chat = { 
          id: '1', 
          title: 'Test Chat', 
          createdAt: new Date(), 
          projectId: '1' 
        };
        const chatId = '1';
        mockedInvoke.mockResolvedValue(mockChat);

        const result = await tauriModule.getChat(chatId);

        expect(invoke).toHaveBeenCalledWith('get_chat', { chatId });
        expect(result).toEqual(mockChat);
      });
    });

    describe('updateChatTitle', () => {
      it('should call invoke with update_chat_title command and parameters', async () => {
        const chatId = '1';
        const title = 'Updated Title';
        
        await tauriModule.updateChatTitle(chatId, title);

        expect(invoke).toHaveBeenCalledWith('update_chat_title', { chatId, title });
      });
    });

    describe('deleteChat', () => {
      it('should call invoke with delete_chat command and chatId parameter', async () => {
        const chatId = '1';
        
        await tauriModule.deleteChat(chatId);

        expect(invoke).toHaveBeenCalledWith('delete_chat', { chatId });
      });
    });
  });

  describe('Message functions', () => {
    describe('listMessages', () => {
      it('should call invoke with list_messages command and chatId parameter', async () => {
        const mockMessages: Message[] = [
          { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        ];
        const chatId = '1';
        mockedInvoke.mockResolvedValue(mockMessages);

        const result = await tauriModule.listMessages(chatId);

        expect(invoke).toHaveBeenCalledWith('list_messages', { chatId });
        expect(result).toEqual(mockMessages);
      });
    });

    describe('sendMessage', () => {
      it('should call invoke with send_message command and all parameters', async () => {
        const chatId = '1';
        const content = 'Test message';
        const projectId = '1';
        const model = 'gpt-4';
        const images: MessageImage[] = [{ id: 'img1', url: 'image.jpg', alt: 'test image' }];
        const extendedThinking = true;
        const documents: MessageDocument[] = [{ id: 'doc1', name: 'document.pdf', size: 1000 }];

        const mockMessage: Message = { 
          id: 'msg1', 
          role: 'assistant', 
          content: 'Response', 
          timestamp: new Date() 
        };
        
        mockedInvoke.mockResolvedValue(mockMessage);

        const result = await tauriModule.sendMessage(
          chatId, 
          content, 
          projectId, 
          model, 
          images, 
          extendedThinking, 
          documents
        );

        expect(invoke).toHaveBeenCalledWith('send_message', {
          chatId,
          content,
          projectId,
          model,
          images,
          extendedThinking,
          documents
        });
        expect(result).toEqual(mockMessage);
      });

      it('should handle optional parameters with defaults when not provided', async () => {
        const chatId = '1';
        const content = 'Test message';

        const mockMessage: Message = { 
          id: 'msg1', 
          role: 'user', 
          content: 'Test message', 
          timestamp: new Date() 
        };
        
        mockedInvoke.mockResolvedValue(mockMessage);

        const result = await tauriModule.sendMessage(chatId, content);

        expect(invoke).toHaveBeenCalledWith('send_message', {
          chatId,
          content,
          projectId: null,
          model: null,
          images: null,
          extendedThinking: false,
          documents: null
        });
        expect(result).toEqual(mockMessage);
      });
    });
  });

  describe('Streaming functions', () => {
    describe('onStreamChunk', () => {
      it('should call listen with stream_chunk event and handle callback', async () => {
        const mockCallback = jest.fn();
        const mockUnlistenFn = jest.fn();
        const mockStreamChunk: StreamChunk = {
          id: 'chunk1',
          content: 'test chunk',
          index: 0
        };

        mockedListen.mockResolvedValue(mockUnlistenFn);

        const result = tauriModule.onStreamChunk(mockCallback);

        expect(listen).toHaveBeenCalledWith('stream_chunk', expect.any(Function));

        // Wait for the promise to resolve and check the result
        const unlistenResult = await result;
        expect(unlistenResult).toBe(mockUnlistenFn);

        // Simulate the event handler being called
        const eventHandler = mockedListen.mock.calls[0][1];
        eventHandler({ payload: mockStreamChunk } as any);

        expect(mockCallback).toHaveBeenCalledWith(mockStreamChunk);
      });
    });
  });

  describe('AI Title Generation functions', () => {
    describe('generateTitle', () => {
      it('should call invoke with generate_title command and message parameters', async () => {
        const userMessage = 'What is the meaning of life?';
        const assistantResponse = 'The meaning of life is 42.';
        const expectedTitle = 'Meaning of Life Discussion';
        
        mockedInvoke.mockResolvedValue(expectedTitle);

        const result = await tauriModule.generateTitle(userMessage, assistantResponse);

        expect(invoke).toHaveBeenCalledWith('generate_title', { 
          userMessage, 
          assistantResponse 
        });
        expect(result).toBe(expectedTitle);
      });
    });
  });
});