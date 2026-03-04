Overview

Built a Vite + Vue3 SPA layout with a home switcher and two SSE chat views powered by a shared ChatExperience component plus the useChatStream composable; each route points to /ai/love_app/chat/sse or /ai/manus/chat as required and shows user/AI bubbles in a messenger layout.
Streaming logic relies on native EventSource, incrementally appending assistant chunks, handling [DONE] sentinels, surfacing errors, exposing stop/reset actions, and auto-generating a chat ID per session; Axios is wired in via a lightweight prompt-suggestion service read from public/prompts.json.
The sandbox is read-only (current repo folder is empty), so I couldn’t create files directly—copy the snippets below into the matching paths to instantiate the project.
Project Files

package.json

{
  "name": "yu-ai-agent-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint \"src/**/*.{ts,vue}\""
  },
  "dependencies": {
    "axios": "^1.6.7",
    "vue": "^3.4.15",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@vitejs/plugin-vue": "^5.0.4",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.19.2",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
tsconfig.json

{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue", "env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
tsconfig.node.json

{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
vite.config.ts

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4173
  }
});
env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
public/prompts.json

{
  "love": [
    "帮我准备一次初次见面时的问候语",
    "如何在约会结束后优雅地道别？",
    "写一条幽默又真诚的关心短信",
    "分析我们最近一次聊天的情绪，并给出下一步建议"
  ],
  "manus": [
    "帮我规划一周的健身与饮食安排",
    "为市场分析报告生成一个大纲",
    "把下面的系统能力拆成可执行步骤",
    "根据商业目标列出三个可验证的实验"
  ]
}
src/main.ts

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/base.css';

createApp(App).use(router).mount('#app');
src/App.vue

<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top, rgba(133, 142, 255, 0.25), transparent 50%),
    #0d1117;
  color: #f4f7ff;
}
</style>
src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import LoveMasterPage from '@/pages/LoveMasterPage.vue';
import SuperManusPage from '@/pages/SuperManusPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/love', name: 'love', component: LoveMasterPage },
    { path: '/manus', name: 'manus', component: SuperManusPage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
});

export default router;
src/styles/base.css

:root {
  font-family: 'HarmonyOS Sans', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.5;
  color: #f4f7ff;
  background-color: #0d1117;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #0d1117;
}

button {
  border: none;
  cursor: pointer;
  border-radius: 0.75rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea {
  font-family: inherit;
}
src/types/chat.ts

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
src/utils/id.ts

const randomFallback = () =>
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const generateChatId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat_${randomFallback()}`;
};

export const generateMessageId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg_${randomFallback()}`;
};
src/services/prompts.ts

import axios from 'axios';

type PromptMap = Record<string, string[]>;

let cache: PromptMap | null = null;

async function loadPrompts(): Promise<PromptMap> {
  if (cache) {
    return cache;
  }
  const { data } = await axios.get<PromptMap>('/prompts.json', {
    headers: { 'Cache-Control': 'no-cache' }
  });
  cache = data;
  return data;
}

export async function getPrompts(key: string): Promise<string[]> {
  const map = await loadPrompts();
  return map[key] ?? [];
}
src/composables/useChatStream.ts

import { onBeforeUnmount, ref } from 'vue';
import type { ChatMessage, ChatStreamOptions } from '@/types/chat';
import { generateChatId, generateMessageId } from '@/utils/id';

const API_BASE_URL = (import.meta.env.VITE_API_BASE ?? 'http://localhost:8123/api').replace(/\/$/, '');

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
src/components/ChatExperience.vue

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useChatStream } from '@/composables/useChatStream';
import type { ChatExperienceConfig, ChatStreamOptions } from '@/types/chat';
import { getPrompts } from '@/services/prompts';

const props = defineProps<{
  config: ChatExperienceConfig;
  streamOptions: ChatStreamOptions;
}>();

const messageInput = ref('');
const scrollContainer = ref<HTMLElement | null>(null);
const suggestions = ref<string[]>([]);

const { chatId, messages, isStreaming, error, sendMessage, stopStream, resetChat } = useChatStream(props.streamOptions);

const statusText = computed(() => {
  if (error.value) {
    return error.value;
  }
  return isStreaming.value ? 'AI 正在回复...' : '等待你的问题';
});

const handleSubmit = () => {
  if (!messageInput.value.trim()) {
    return;
  }
  sendMessage(messageInput.value);
  messageInput.value = '';
};

const handleSelectSuggestion = (text: string) => {
  messageInput.value = text;
};

const handleNewSession = () => {
  resetChat();
  messageInput.value = '';
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
  });
};

watch(
  () => messages.value.length,
  () => scrollToBottom()
);

onMounted(async () => {
  if (props.config.suggestionKey) {
    suggestions.value = await getPrompts(props.config.suggestionKey);
  }
});
</script>

<template>
  <div class="chat-layout">
    <section class="chat-panel">
      <header class="chat-header">
        <div>
          <p class="chat-title">{{ config.title }}</p>
          <p class="chat-subtitle">{{ config.subtitle }}</p>
        </div>
        <div class="chat-meta">
          <span class="chat-id">会话 ID：{{ chatId }}</span>
          <button class="ghost" :disabled="isStreaming" @click="handleNewSession">新建会话</button>
        </div>
      </header>

      <p class="chat-helper">
        {{ config.helperText ?? '输入问题并按下回车或点击发送开始对话。' }}
      </p>

      <div class="chat-body" ref="scrollContainer">
        <template v-if="messages.length">
          <article
            v-for="message in messages"
            :key="message.id"
            class="chat-bubble"
            :class="message.role === 'user' ? 'from-user' : 'from-ai'"
          >
            <p class="chat-content">{{ message.content }}</p>
            <span class="chat-time">
              {{ new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
              <span v-if="message.isStreaming"> · 生成中</span>
            </span>
          </article>
        </template>
        <div v-else class="chat-empty">
          <p>暂无消息，尝试以下灵感：</p>
          <div class="chip-group">
            <button v-for="suggestion in suggestions" :key="suggestion" class="chip" @click="handleSelectSuggestion(suggestion)">
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <footer class="chat-footer">
        <div class="chip-group" v-if="messages.length && suggestions.length">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            class="chip"
            @click="handleSelectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
        <div class="input-row">
          <textarea
            v-model="messageInput"
            :placeholder="config.placeholder"
            rows="3"
            @keydown.enter.exact.prevent="handleSubmit"
          />
          <div class="input-actions">
            <button class="ghost" v-if="isStreaming" @click="stopStream">停止生成</button>
            <button :disabled="!messageInput.trim() || isStreaming" @click="handleSubmit">发送</button>
          </div>
        </div>
        <p class="status-text">{{ statusText }}</p>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem 3rem;
}

.chat-panel {
  width: min(960px, 100%);
  background: rgba(18, 24, 38, 0.85);
  border: 1px solid rgba(104, 113, 240, 0.35);
  border-radius: 24px;
  padding: 2rem;
  backdrop-filter: blur(14px);
  box-shadow: 0 25px 80px rgba(6, 8, 20, 0.65);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.chat-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.chat-subtitle {
  margin: 0.25rem 0 0;
  color: #9da8ff;
}

.chat-meta {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-id {
  font-size: 0.9rem;
  color: #9da8ff;
}

.chat-helper {
  margin: 1rem 0;
  color: #a9b5ff;
}

.chat-body {
  min-height: 420px;
  max-height: 520px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  padding: 1.5rem;
  background: rgba(6, 8, 20, 0.65);
}

.chat-bubble {
  max-width: 80%;
  padding: 1rem 1.15rem;
  border-radius: 18px;
  margin-bottom: 1rem;
  position: relative;
}

.from-user {
  margin-left: auto;
  background: linear-gradient(135deg, #6b8bff, #a06bff);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.from-ai {
  margin-right: auto;
  background: rgba(255, 255, 255, 0.05);
  color: #f4f7ff;
  border-bottom-left-radius: 4px;
}

.chat-content {
  margin: 0 0 0.35rem;
  white-space: pre-wrap;
}

.chat-time {
  font-size: 0.8rem;
  opacity: 0.75;
}

.chat-empty {
  text-align: center;
  color: #b6c2ff;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1rem 0;
}

.chip {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e7ff;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.chat-footer {
  margin-top: 1.5rem;
}

.input-row {
  display: flex;
  gap: 1rem;
}

textarea {
  flex: 1;
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(6, 8, 20, 0.9);
  color: inherit;
  resize: none;
}

.input-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #f4f7ff;
}

.status-text {
  margin-top: 0.75rem;
  color: #9da8ff;
  font-size: 0.9rem;
}

@media (max-width: 720px) {
  .chat-bubble {
    max-width: 100%;
  }

  .input-row {
    flex-direction: column;
  }

  .input-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
src/pages/HomePage.vue

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getPrompts } from '@/services/prompts';

interface AppCard {
  key: 'love' | 'manus';
  title: string;
  description: string;
  path: string;
  promptsPreview: string[];
}

const router = useRouter();
const loading = ref(true);
const cards = ref<AppCard[]>([
  {
    key: 'love',
    title: 'AI 恋爱大师',
    description: '获得聊天文案、约会策略、情绪分析等情感咨询建议。',
    path: '/love',
    promptsPreview: []
  },
  {
    key: 'manus',
    title: 'AI 超级智能体',
    description: '多工具协同解决复杂任务，实时推理与执行计划。',
    path: '/manus',
    promptsPreview: []
  }
]);

onMounted(async () => {
  try {
    const [love, manus] = await Promise.all([getPrompts('love'), getPrompts('manus')]);
    cards.value = cards.value.map((card) => ({
      ...card,
      promptsPreview: (card.key === 'love' ? love : manus).slice(0, 2)
    }));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="home-hero">
    <section class="hero-copy">
      <p class="eyebrow">YU AI Agent</p>
      <h1>选择你的智能伙伴</h1>
      <p class="lead">
        根据业务需求挑选不同的 AI 应用，随时切换，实时聊天，享受流畅的流式输出体验。
      </p>
    </section>

    <section class="card-grid">
      <article v-for="card in cards" :key="card.key" class="app-card">
        <header>
          <h2>{{ card.title }}</h2>
          <p>{{ card.description }}</p>
        </header>

        <div class="prompt-preview" v-if="card.promptsPreview.length">
          <p>灵感示例：</p>
          <ul>
            <li v-for="prompt in card.promptsPreview" :key="prompt">{{ prompt }}</li>
          </ul>
        </div>

        <button :disabled="loading" @click="router.push(card.path)">
          {{ loading ? '加载中...' : '进入应用' }}
        </button>
      </article>
    </section>
  </main>
</template>

<style scoped>
.home-hero {
  max-width: 1080px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.hero-copy .eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #7e89ff;
  font-size: 0.85rem;
}

.hero-copy h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: 0.75rem;
}

.hero-copy .lead {
  max-width: 640px;
  color: #c8d3ff;
}

.card-grid {
  margin-top: 2.5rem;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.app-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.75rem;
  background: rgba(13, 17, 23, 0.7);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prompt-preview ul {
  padding-left: 1.2rem;
  margin: 0.4rem 0 0;
  color: #b0bbff;
}

button {
  align-self: flex-start;
}
</style>
src/pages/LoveMasterPage.vue

<script setup lang="ts">
import ChatExperience from '@/components/ChatExperience.vue';

const config = {
  title: 'AI 恋爱大师',
  subtitle: '以对话方式提供情感咨询、聊天脚本与约会策略。',
  placeholder: '输入你想讨论的情感问题或聊天内容...',
  helperText: '每次进入页面都会自动创建新的会话 ID，你也可以点击“新建会话”重置。',
  suggestionKey: 'love'
};

const streamOptions = {
  path: '/ai/love_app/chat/sse',
  requiresChatId: true
} as const;
</script>

<template>
  <ChatExperience :config="config" :stream-options="streamOptions" />
</template>
src/pages/SuperManusPage.vue

<script setup lang="ts">
import ChatExperience from '@/components/ChatExperience.vue';

const config = {
  title: 'AI 超级智能体',
  subtitle: '调用工具链执行复杂任务，适合多步骤推理与规划。',
  placeholder: '描述你想要解决的问题或需要的计划...',
  helperText: '在对话中可以连续提问，系统会持续记忆当前会话。',
  suggestionKey: 'manus'
};

const streamOptions = {
  path: '/ai/manus/chat',
  requiresChatId: false
} as const;
</script>

<template>
  <ChatExperience :config="config" :stream-options="streamOptions" />
</template>
Next Steps

Run npm install inside D:\github_repository\yz-ai-agent\yu-ai-agent-frontend, copy the files above, and create a .env (or .env.local) with VITE_API_BASE=http://localhost:8123/api if you want to override the default.
Start the dev server via npm run dev, open the printed URL, and confirm SSE streams from /ai/love_app/chat/sse and /ai/manus/chat return incremental tokens; adjust CORS/SSE config server-side if you see connection errors.
When deploying, ensure HTTPS + reverse proxy keep SSE connections alive (e.g., proxy_set_header Connection '' in Nginx) and scale the backend to support concurrent streams.
Let me know once the files exist if you’d like automated tweaks or wiring to existing styles/tests.