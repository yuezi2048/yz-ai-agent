import { computed, ref } from 'vue';
import type {
  ChatMessage,
  ChatMode,
  ConversationDetail,
  ConversationSummary,
  SendMessagePayload
} from '@/types/chat';
import { generateChatId, generateMessageId } from '@/utils/id';

const API_BASE_URL = (
  import.meta.env.PROD
    ? '/api'
    : import.meta.env.VITE_API_BASE ?? 'http://localhost:8123/api'
).replace(/\/$/, '');
const STORAGE_KEY = 'yz_ai_agent_local_conversations';

export function useConversationChat() {
  const conversations = ref<ConversationSummary[]>([]);
  const activeConversationId = ref<string>('');
  const messages = ref<ChatMessage[]>([]);
  const currentTitle = ref('新对话');
  const mode = ref<ChatMode>('quick');
  const ragEnabled = ref(false);
  const toolCallingEnabled = ref(false);
  const loadingConversations = ref(false);
  const loadingMessages = ref(false);
  const sending = ref(false);
  const isStreaming = ref(false);
  const error = ref<string>('');
  const currentSource = ref<EventSource | null>(null);
  const streamingMessageId = ref('');
  const stopRequested = ref(false);
  const activeConversationCreatedAt = ref<string>('');

  const hasActiveConversation = computed(() => Boolean(activeConversationId.value));

  const loadConversations = async () => {
    loadingConversations.value = true;
    error.value = '';
    try {
      const list = loadConversationsFromStorage();
      conversations.value = list;

      if (!list.length) {
        await createConversation();
        return;
      }

      const latestId = list[0]?.id;
      if (latestId) {
        await openConversation(latestId);
      }
    } catch (err) {
      error.value = toErrorMessage(err, '加载历史会话失败');
    } finally {
      loadingConversations.value = false;
    }
  };

  const createConversation = async () => {
    error.value = '';
    try {
      const now = new Date().toISOString();
      const detail: StoredConversation = {
        id: generateChatId(),
        title: '新对话',
        createdAt: now,
        messages: []
      };
      saveConversationDetailToStorage(detail);
      conversations.value = loadConversationsFromStorage();
      await openConversation(detail.id);
    } catch (err) {
      error.value = toErrorMessage(err, '创建会话失败');
    }
  };

  const addConversationById = async (conversationId: string) => {
    const id = conversationId.trim();
    if (!id) {
      return;
    }
    const existing = conversations.value.find((conversation) => conversation.id === id);
    if (existing) {
      await openConversation(existing.id);
      return;
    }
    const now = new Date().toISOString();
    const detail: StoredConversation = {
      id,
      title: `会话 ${id.slice(0, 8)}`,
      createdAt: now,
      messages: []
    };
    saveConversationDetailToStorage(detail);
    conversations.value = loadConversationsFromStorage();
    await openConversation(id);
  };

  const deleteConversationById = async (conversationId: string) => {
    const id = conversationId.trim();
    if (!id) {
      return;
    }

    if (activeConversationId.value === id) {
      stopStream();
    }

    const list = readStorageList().filter((item) => item.id !== id);
    writeStorageList(list);
    conversations.value = loadConversationsFromStorage();

    if (activeConversationId.value === id) {
      const next = conversations.value[0]?.id;
      if (next) {
        await openConversation(next);
      } else {
        activeConversationId.value = '';
        activeConversationCreatedAt.value = '';
        currentTitle.value = '新对话';
        messages.value = [];
      }
    }
  };

  const openConversation = async (conversationId: string) => {
    if (!conversationId) {
      return;
    }
    loadingMessages.value = true;
    error.value = '';
    try {
      const detail = loadConversationDetailFromStorage(conversationId);
      activeConversationId.value = detail.id;
      currentTitle.value = detail.title;
      messages.value = detail.messages;
      activeConversationCreatedAt.value = detail.createdAt ?? '';
    } catch (err) {
      error.value = toErrorMessage(err, '加载会话详情失败');
    } finally {
      loadingMessages.value = false;
    }
  };

  const sendMessage = async (content: string) => {
    const input = content.trim();
    if (!input || sending.value) {
      return;
    }
    if (!activeConversationId.value) {
      await createConversation();
      if (!activeConversationId.value) {
        return;
      }
    }
    stopStream();
    sending.value = true;
    isStreaming.value = true;
    stopRequested.value = false;
    error.value = '';

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };
    messages.value.push(userMessage);

    const payload: SendMessagePayload = {
      content: input,
      mode: mode.value,
      rag_enabled: ragEnabled.value
    };
    if (toolCallingEnabled.value) {
      // DDD 契约：通过 `tool_calls` 数组携带工具调用意图。
      // 由于 UI 只提供“工具调用”开关，这里使用固定标记让后端做开关语义判断。
      payload.tool_calls = ['all'];
    }

    const assistantMessageId = generateMessageId();
    streamingMessageId.value = assistantMessageId;
    messages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    });

    try {
      await streamAssistantText(
        payload,
        activeConversationId.value,
        appendAssistantChunk,
        currentSource,
        stopRequested
      );
      trimEmptyAssistant();
      if (!currentTitle.value || currentTitle.value === '新对话') {
        currentTitle.value = makeTitleFromMessage(input);
      }
      persistActiveConversation();
    } catch (err) {
      error.value = toErrorMessage(err, '消息发送失败');
      trimEmptyAssistant();
    } finally {
      sending.value = false;
      isStreaming.value = false;
      streamingMessageId.value = '';
      currentSource.value = null;
    }
  };

  const setMode = (next: ChatMode) => {
    mode.value = next;
  };

  const setToolCallingEnabled = (enabled: boolean) => {
    toolCallingEnabled.value = enabled;
  };

  const stopStream = () => {
    if (currentSource.value) {
      currentSource.value.close();
      currentSource.value = null;
    }
    stopRequested.value = true;
    isStreaming.value = false;
    sending.value = false;
  };

  return {
    conversations,
    activeConversationId,
    messages,
    currentTitle,
    mode,
    ragEnabled,
    toolCallingEnabled,
    loadingConversations,
    loadingMessages,
    hasActiveConversation,
    sending,
    isStreaming,
    error,
    loadConversations,
    createConversation,
    openConversation,
    sendMessage,
    setMode,
    setToolCallingEnabled,
    addConversationById,
    deleteConversationById,
    stopStream
  };

  function upsertConversationSummary(item: ConversationSummary) {
    const targetTitle = item.title || '新对话';
    const list = conversations.value.filter((conversation) => conversation.id !== item.id);
    conversations.value = [{ ...item, title: targetTitle }, ...list];
    if (activeConversationId.value === item.id) {
      currentTitle.value = targetTitle;
    }
    saveConversationsToStorage(conversations.value);
  }

  function persistActiveConversation() {
    if (!activeConversationId.value) {
      return;
    }
    const createdAt = activeConversationCreatedAt.value || new Date().toISOString();
    const detail: StoredConversation = {
      id: activeConversationId.value,
      title: currentTitle.value || '新对话',
      createdAt,
      messages: messages.value
    };
    saveConversationDetailToStorage(detail);
    conversations.value = loadConversationsFromStorage();
  }

  function appendAssistantChunk(chunk: string) {
    if (!chunk || !streamingMessageId.value) {
      return;
    }
    const target = messages.value.find((message) => message.id === streamingMessageId.value);
    if (!target) {
      return;
    }
    target.content += chunk;
  }

  function trimEmptyAssistant() {
    if (!streamingMessageId.value) {
      return;
    }
    const idx = messages.value.findIndex((message) => message.id === streamingMessageId.value);
    if (idx < 0) {
      return;
    }
    if (!messages.value[idx].content.trim()) {
      messages.value.splice(idx, 1);
    }
  }
}

async function streamAssistantText(
  payload: SendMessagePayload,
  conversationId: string,
  onChunk: (chunk: string) => void,
  sourceRef: { value: EventSource | null },
  stopRequestedRef: { value: boolean }
): Promise<void> {
  const endpoint = payload.mode === 'thinking' ? '/ai/manus/chat' : '/ai/love_app/chat/sse';
  const params = new URLSearchParams({
    message: payload.content
  });
  if (payload.mode === 'quick') {
    params.set('chatId', conversationId);
  }
  if (payload.rag_enabled) {
    params.set('rag_enabled', 'true');
  }
  if (payload.tool_calls?.length) {
    params.set('tool_calls', payload.tool_calls.join(','));
  }

  const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
  await new Promise<void>((resolve, reject) => {
    const source = new EventSource(url);
    sourceRef.value = source;
    let received = false;

    source.onmessage = (event) => {
      if (!event.data) {
        return;
      }
      if (event.data === '[DONE]') {
        source.close();
        sourceRef.value = null;
        resolve();
        return;
      }
      const chunk = normalizeChunk(event.data);
      if (!chunk) {
        return;
      }
      received = true;
      onChunk(chunk);
    };

    source.onerror = () => {
      source.close();
      sourceRef.value = null;
      if (stopRequestedRef.value) {
        resolve();
        return;
      }
      if (received) {
        resolve();
      } else {
        reject(new Error('SSE 连接中断'));
      }
    };
  });
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return `${fallback}：${error.message}`;
  }
  return fallback;
}

function makeTitleFromMessage(content: string): string {
  return content.length > 18 ? `${content.slice(0, 18)}...` : content;
}

function normalizeChunk(raw: string): string {
  if (!raw) {
    return '';
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      'content' in parsed &&
      typeof (parsed as Record<string, unknown>).content === 'string'
    ) {
      return (parsed as Record<string, string>).content;
    }
    return '';
  } catch {
    return raw;
  }
}

interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

function loadConversationsFromStorage(): ConversationSummary[] {
  const list = readStorageList();
  return list
    .map((item) => ({
      id: item.id,
      title: item.title || '新对话',
      createdAt: item.createdAt
    }))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

function loadConversationDetailFromStorage(id: string): ConversationDetail {
  const list = readStorageList();
  const target = list.find((item) => item.id === id);
  if (!target) {
    return { id, title: '新对话', messages: [], createdAt: '' };
  }
  return {
    id: target.id,
    title: target.title || '新对话',
    messages: Array.isArray(target.messages) ? target.messages : [],
    createdAt: target.createdAt
  };
}

function saveConversationsToStorage(summaries: ConversationSummary[]) {
  const current = readStorageList();
  const merged = summaries.map((summary) => {
    const existing = current.find((item) => item.id === summary.id);
    return {
      id: summary.id,
      title: summary.title,
      createdAt: existing?.createdAt ?? summary.createdAt ?? new Date().toISOString(),
      messages: existing?.messages ?? []
    } satisfies StoredConversation;
  });
  writeStorageList(merged);
}

function saveConversationDetailToStorage(detail: StoredConversation) {
  const list = readStorageList().filter((item) => item.id !== detail.id);
  writeStorageList([detail, ...list]);
}

function readStorageList(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .filter((item) => isStoredConversation(item))
      .map((item) => {
        const target = item as unknown as { createdAt?: unknown; messages: ChatMessage[] };
        const fallbackCreatedAt =
          item.messages?.[0]?.createdAt ?? item.messages?.[item.messages.length - 1]?.createdAt;
        const createdAt =
          typeof target.createdAt === 'string' && target.createdAt
            ? target.createdAt
            : fallbackCreatedAt || new Date().toISOString();
        return {
          id: item.id,
          title: item.title,
          createdAt,
          messages: item.messages
        } satisfies StoredConversation;
      });
  } catch {
    return [];
  }
}

function writeStorageList(list: StoredConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isStoredConversation(value: unknown): value is StoredConversation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const target = value as Record<string, unknown>;
  return typeof target.id === 'string' && typeof target.title === 'string' && Array.isArray(target.messages);
}
