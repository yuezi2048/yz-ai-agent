export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

export interface ChatExperienceConfig {
  title: string;
  subtitle: string;
  placeholder: string;
  helperText?: string;
  suggestionKey?: string;
}

export interface ChatStreamOptions {
  path: string;
  requiresChatId?: boolean;
  withCredentials?: boolean;
  paramsBuilder?: (payload: { message: string; chatId: string }) => Record<string, string>;
}

