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

