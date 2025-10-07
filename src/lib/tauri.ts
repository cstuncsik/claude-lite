import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Chat, Message, MessageImage, MessageDocument, Project, ProjectSettings, StreamChunk } from './types';

// Projects
export const listProjects = () => invoke<Project[]>('list_projects');
export const createProject = (name: string) => invoke<Project>('create_project', { name });
export const getProject = (projectId: string) => invoke<Project>('get_project', { projectId });
export const getProjectSettings = (projectId: string) =>
  invoke<ProjectSettings>('get_project_settings', { projectId });
export const updateProjectSettings = (projectId: string, settings: ProjectSettings) =>
  invoke('update_project_settings', { projectId, settings });
export const deleteProject = (projectId: string) => invoke('delete_project', { projectId });

// Chats
export const listChats = (projectId?: string) =>
  invoke<Chat[]>('list_chats', { projectId: projectId || null });
export const createChat = (projectId?: string) =>
  invoke<Chat>('create_chat', { projectId: projectId || null });
export const getChat = (chatId: string) => invoke<Chat>('get_chat', { chatId });
export const updateChatTitle = (chatId: string, title: string) =>
  invoke('update_chat_title', { chatId, title });
export const deleteChat = (chatId: string) => invoke('delete_chat', { chatId });

// Messages
export const listMessages = (chatId: string) => invoke<Message[]>('list_messages', { chatId });
export const sendMessage = (chatId: string, content: string, projectId?: string, model?: string, images?: MessageImage[], extendedThinking?: boolean, documents?: MessageDocument[]) =>
  invoke<Message>('send_message', {
    chatId,
    content,
    projectId: projectId || null,
    model: model || null,
    images: images || null,
    extendedThinking: extendedThinking || false,
    documents: documents || null
  });

// Streaming
export const onStreamChunk = (callback: (chunk: StreamChunk) => void) => {
  return listen<StreamChunk>('stream_chunk', (event: { payload: StreamChunk }) => {
    callback(event.payload);
  });
};

// AI Title Generation
export const generateTitle = (userMessage: string, assistantResponse: string) =>
  invoke<string>('generate_title', { userMessage, assistantResponse });
