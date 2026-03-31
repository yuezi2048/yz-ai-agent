export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMode = 'quick' | 'thinking';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt?: string;
}

export interface SendMessagePayload {
  content: string;
  mode: ChatMode;
  tool_calls?: string[];
  rag_enabled?: boolean;
}

export interface ChatStreamOptions {
  path: string;
  requiresChatId?: boolean;
  withCredentials?: boolean;
  paramsBuilder?: (payload: { message: string; chatId: string }) => Record<string, string>;
}

