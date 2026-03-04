import { onBeforeUnmount, ref } from 'vue';
import type { ChatMessage, ChatStreamOptions } from '@/types/chat';
import { generateChatId, generateMessageId } from '@/utils/id';

const API_BASE_URL = (
  import.meta.env.PROD
    ? '/api'
    : import.meta.env.VITE_API_BASE ?? 'http://localhost:8123/api'
).replace(/\/$/, '');

export function useChatStream(options: ChatStreamOptions) {
  const chatId = ref(generateChatId());
  const messages = ref<ChatMessage[]>([]);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);
  const streamingMessageId = ref<string | null>(null);
  const currentSource = ref<EventSource | null>(null);

  const sendMessage = (raw: string) => {
    const content = raw.trim();
    if (!content || isStreaming.value) {
      return;
    }
    error.value = null;

    messages.value.push({
      id: generateMessageId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    });

    startStream(content);
  };

  const startStream = (content: string) => {
    stopStream();
    isStreaming.value = true;

    const params = new URLSearchParams({ message: content });

    if (options.requiresChatId !== false) {
      params.set('chatId', chatId.value);
    }

    if (options.paramsBuilder) {
      const extra = options.paramsBuilder({ message: content, chatId: chatId.value });
      Object.entries(extra).forEach(([key, value]) => {
        if (value != null) {
          params.set(key, value);
        }
      });
    }

    const endpoint = options.path.startsWith('/') ? options.path : `/${options.path}`;
    const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;

    const source = new EventSource(url, {
      withCredentials: options.withCredentials ?? false
    });

    currentSource.value = source;

    source.onmessage = (event) => {
      if (!event.data) {
        return;
      }
      if (event.data === '[DONE]') {
        finalizeStream();
        return;
      }
      const chunk = normalizeChunk(event.data);
      if (chunk) {
        appendAssistantChunk(chunk);
      }
    };

    source.onerror = () => {
      error.value = '对话连接中断，请稍后重试';
      finalizeStream();
    };
  };

  const appendAssistantChunk = (chunk: string) => {
    if (!streamingMessageId.value) {
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: chunk,
        createdAt: new Date().toISOString(),
        isStreaming: true
      };
      streamingMessageId.value = assistantMessage.id;
      messages.value.push(assistantMessage);
      return;
    }

    const streamingMessage = messages.value.find((message) => message.id === streamingMessageId.value);
    if (streamingMessage) {
      streamingMessage.content += chunk;
    }
  };

  const finalizeStream = () => {
    if (streamingMessageId.value) {
      const streamingMessage = messages.value.find((message) => message.id === streamingMessageId.value);
      if (streamingMessage) {
        streamingMessage.isStreaming = false;
      }
    }
    streamingMessageId.value = null;
    isStreaming.value = false;
    if (currentSource.value) {
      currentSource.value.close();
      currentSource.value = null;
    }
  };

  const stopStream = () => {
    finalizeStream();
  };

  const resetChat = () => {
    stopStream();
    chatId.value = generateChatId();
    messages.value = [];
    error.value = null;
  };

  onBeforeUnmount(stopStream);

  return {
    chatId,
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStream,
    resetChat
  };
}

function normalizeChunk(raw: string): string {
  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      return parsed;
    }

    if (typeof (parsed as any).content === 'string') {
      return (parsed as any).content;
    }

    if (Array.isArray((parsed as any).choices)) {
      const choice = (parsed as any).choices[0];
      if (choice?.delta?.content) {
        return choice.delta.content as string;
      }
    }

    return '';
  } catch {
    return raw;
  }
}

