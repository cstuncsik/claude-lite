import {
  Project,
  ProjectSettings,
  Chat,
  MessageImage,
  MessageDocument,
  Message,
  StreamChunk,
} from './types';

describe('Types Validation', () => {
  describe('Project', () => {
    it('should have the correct shape', () => {
      const project: Project = {
        id: '1',
        name: 'Test Project',
        settings_json: '{"key": "value"}',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(project).toHaveProperty('id');
      expect(typeof project.id).toBe('string');
      expect(project).toHaveProperty('name');
      expect(typeof project.name).toBe('string');
      expect(project).toHaveProperty('settings_json');
      expect(typeof project.settings_json).toBe('string');
      expect(project).toHaveProperty('created_at');
      expect(typeof project.created_at).toBe('string');
      expect(project).toHaveProperty('updated_at');
      expect(typeof project.updated_at).toBe('string');
    });
  });

  describe('ProjectSettings', () => {
    it('should have the correct shape', () => {
      const projectSettings: ProjectSettings = {
        model: 'gpt-4',
        max_tokens: 1000,
        temperature: 0.7,
      };

      expect(projectSettings).toHaveProperty('model');
      expect(typeof projectSettings.model).toBe('string');
      expect(projectSettings).toHaveProperty('max_tokens');
      expect(typeof projectSettings.max_tokens).toBe('number');
      expect(projectSettings).toHaveProperty('temperature');
      expect(typeof projectSettings.temperature).toBe('number');
      // Optional property check - it should either be undefined or a string
      expect(
        projectSettings.hasOwnProperty('system_prompt') === false ||
        typeof projectSettings.system_prompt === 'string' ||
        projectSettings.system_prompt === undefined
      ).toBe(true);
    });

    it('should allow optional system_prompt', () => {
      const projectSettingsWithPrompt: ProjectSettings = {
        model: 'gpt-4',
        system_prompt: 'You are a helpful assistant',
        max_tokens: 1000,
        temperature: 0.7,
      };

      expect(projectSettingsWithPrompt.system_prompt).toBe('You are a helpful assistant');
    });
  });

  describe('Chat', () => {
    it('should have the correct shape', () => {
      const chat: Chat = {
        id: '1',
        project_id: 'project-1',
        title: 'Test Chat',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(chat).toHaveProperty('id');
      expect(typeof chat.id).toBe('string');
      expect(chat).toHaveProperty('project_id');
      expect(typeof chat.project_id).toBe('string'); // Optional but present in example
      expect(chat).toHaveProperty('title');
      expect(typeof chat.title).toBe('string');
      expect(chat).toHaveProperty('created_at');
      expect(typeof chat.created_at).toBe('string');
      expect(chat).toHaveProperty('updated_at');
      expect(typeof chat.updated_at).toBe('string');
    });

    it('should allow optional project_id', () => {
      const chatWithoutProject: Chat = {
        id: '1',
        title: 'Standalone Chat',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      expect(chatWithoutProject.project_id).toBeUndefined();
    });
  });

  describe('MessageImage', () => {
    it('should have the correct shape', () => {
      const messageImage: MessageImage = {
        data: 'base64encodeddata',
        media_type: 'image/jpeg',
      };

      expect(messageImage).toHaveProperty('data');
      expect(typeof messageImage.data).toBe('string');
      expect(messageImage).toHaveProperty('media_type');
      expect(typeof messageImage.media_type).toBe('string');
    });
  });

  describe('MessageDocument', () => {
    it('should have the correct shape', () => {
      const messageDocument: MessageDocument = {
        data: 'base64encodeddata',
        media_type: 'application/pdf',
        name: 'document.pdf',
      };

      expect(messageDocument).toHaveProperty('data');
      expect(typeof messageDocument.data).toBe('string');
      expect(messageDocument).toHaveProperty('media_type');
      expect(typeof messageDocument.media_type).toBe('string');
      expect(messageDocument).toHaveProperty('name');
      expect(typeof messageDocument.name).toBe('string');
    });
  });

  describe('Message', () => {
    it('should have the correct shape', () => {
      const message: Message = {
        id: '1',
        chat_id: 'chat-1',
        role: 'user',
        content: 'Hello, world!',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(message).toHaveProperty('id');
      expect(typeof message.id).toBe('string');
      expect(message).toHaveProperty('chat_id');
      expect(typeof message.chat_id).toBe('string');
      expect(message).toHaveProperty('role');
      expect(['user', 'assistant']).toContain(message.role);
      expect(message).toHaveProperty('content');
      expect(typeof message.content).toBe('string');
      expect(message).toHaveProperty('created_at');
      expect(typeof message.created_at).toBe('string');
      // Optional properties check - they should either be undefined or have correct type
      expect(
        message.hasOwnProperty('images') === false ||
        Array.isArray(message.images) ||
        message.images === undefined
      ).toBe(true);

      expect(
        message.hasOwnProperty('documents') === false ||
        Array.isArray(message.documents) ||
        message.documents === undefined
      ).toBe(true);

      expect(
        message.hasOwnProperty('model') === false ||
        typeof message.model === 'string' ||
        message.model === undefined
      ).toBe(true);

      expect(
        message.hasOwnProperty('extended_thinking') === false ||
        typeof message.extended_thinking === 'boolean' ||
        message.extended_thinking === undefined
      ).toBe(true);
    });

    it('should allow optional properties', () => {
      const messageWithExtras: Message = {
        id: '1',
        chat_id: 'chat-1',
        role: 'assistant',
        content: 'Hello! How can I assist you?',
        images: [
          {
            data: 'base64data',
            media_type: 'image/png',
          }
        ],
        documents: [
          {
            data: 'base64data',
            media_type: 'application/pdf',
            name: 'doc.pdf',
          }
        ],
        model: 'gpt-4',
        extended_thinking: true,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(messageWithExtras.images).toBeDefined();
      expect(messageWithExtras.documents).toBeDefined();
      expect(messageWithExtras.model).toBe('gpt-4');
      expect(messageWithExtras.extended_thinking).toBe(true);
    });

    it('should validate role values', () => {
      const userMessage: Message = {
        id: '1',
        chat_id: 'chat-1',
        role: 'user',
        content: 'Test message',
        created_at: '2023-01-01T00:00:00Z',
      };

      const assistantMessage: Message = {
        id: '2',
        chat_id: 'chat-1',
        role: 'assistant',
        content: 'Test response',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userMessage.role).toBe('user');
      expect(assistantMessage.role).toBe('assistant');
    });
  });

  describe('StreamChunk', () => {
    it('should have the correct shape', () => {
      const streamChunk: StreamChunk = {
        delta: 'some text',
        done: false,
      };

      expect(streamChunk).toHaveProperty('delta');
      expect(typeof streamChunk.delta).toBe('string');
      expect(streamChunk).toHaveProperty('done');
      expect(typeof streamChunk.done).toBe('boolean');
    });
  });
});