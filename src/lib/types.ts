export interface Project {
  id: string;
  name: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSettings {
  model: string;
  system_prompt?: string;
  max_tokens: number;
  temperature: number;
}

export interface Chat {
  id: string;
  project_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageImage {
  data: string; // base64 encoded
  media_type: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: MessageImage[];
  model?: string;
  extended_thinking?: boolean;
  created_at: string;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}
