<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useConversationChat } from '@/composables/useConversationChat';
import type { ChatMode } from '@/types/chat';

const props = withDefaults(
  defineProps<{
    pageTitle?: string;
    defaultMode?: ChatMode;
  }>(),
  {
    pageTitle: '论文DOI检索与解读',
    defaultMode: 'quick'
  }
);

const messageInput = ref('');
const toolPanelVisible = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const {
  conversations,
  activeConversationId,
  messages,
  currentTitle,
  mode,
  ragEnabled,
  toolCallingEnabled,
  loadingConversations,
  loadingMessages,
  sending,
  isStreaming,
  error,
  loadConversations,
  createConversation,
  openConversation,
  sendMessage,
  setMode,
  setToolCallingEnabled,
  stopStream,
  deleteConversationById
} = useConversationChat();

const handleSend = async () => {
  if (!messageInput.value.trim()) {
    return;
  }
  const payload = messageInput.value;
  messageInput.value = '';
  await sendMessage(payload);
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
  await loadConversations();
  setMode(props.defaultMode);
});

watch(
  () => props.defaultMode,
  (next) => {
    if (next) setMode(next);
  }
);

const handleDeleteConversation = async (conversationId: string) => {
  const ok = window.confirm('确定删除该会话吗？');
  if (!ok) {
    return;
  }
  await deleteConversationById(conversationId);
};
</script>

<template>
  <div class="gemini-shell">
    <aside class="sidebar">
      <div class="sidebar-actions">
        <button class="new-session-btn" @click="createConversation">新建会话</button>
      </div>
      <div class="conversation-list">
        <div
          v-for="conversation in conversations"
          :key="conversation.id"
          class="conversation-item"
          :class="{ active: activeConversationId === conversation.id }"
          @click="openConversation(conversation.id)"
        >
          <div class="conversation-title">{{ conversation.title }}</div>
          <div class="conversation-id-row">
            <div class="conversation-id">{{ conversation.id }}</div>
            <button
              class="delete-conversation-btn"
              title="删除会话"
              aria-label="删除会话"
              @click.stop="handleDeleteConversation(conversation.id)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <p v-if="loadingConversations" class="sidebar-tip">会话加载中...</p>
      </div>
    </aside>

    <main class="main-panel">
      <header class="main-header">
        <h1>{{ currentTitle || pageTitle }}</h1>
      </header>

      <section class="message-flow" ref="scrollContainer">
        <article
          v-for="message in messages"
          :key="message.id"
          class="bubble"
          :class="message.role === 'user' ? 'bubble-user' : 'bubble-ai'"
        >
          {{ message.content }}
        </article>

        <div v-if="!messages.length && !loadingMessages" class="empty-state">
          请输入消息开始对话
        </div>
        <div v-if="loadingMessages" class="empty-state">正在加载会话内容...</div>
      </section>

      <footer class="composer">
        <div class="composer-row">
          <div class="tool-buttons">
            <button class="tool-plus" @click="toolPanelVisible = !toolPanelVisible">【+】</button>
            <button class="tool-open" @click="toolPanelVisible = true">【工具】</button>

            <div class="tool-drawer" v-if="toolPanelVisible">
              <button
                class="tool-item"
                :class="{ selected: toolCallingEnabled }"
                @click="setToolCallingEnabled(!toolCallingEnabled)"
              >
                工具调用
              </button>
              <label class="tool-item rag-item" :class="{ selected: ragEnabled }">
                <input type="checkbox" v-model="ragEnabled" />
                <span>RAG知识检索</span>
              </label>
            </div>
          </div>

          <textarea
            v-model="messageInput"
            rows="2"
            placeholder="输入你的问题..."
            @keydown.enter.exact.prevent="handleSend"
          />

          <div class="send-area">
            <div class="mode-switch">
              <button :class="{ active: mode === 'quick' }" @click="setMode('quick')">快速</button>
              <button :class="{ active: mode === 'thinking' }" @click="setMode('thinking')">思考</button>
            </div>

            <button class="send-btn" :disabled="!messageInput.trim() || isStreaming" @click="handleSend">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2 11 13"></path>
                <path d="M22 2 15 22 11 13 2 9 22 2"></path>
              </svg>
            </button>
          </div>
        </div>

        <p class="status-text" v-if="error">{{ error }}</p>
        <div class="status-row" v-else>
          <p class="status-text">{{ sending ? 'AI 正在回复...' : '已就绪' }}</p>
          <button v-if="isStreaming" class="stop-btn" @click="stopStream">停止</button>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.gemini-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  background: #1e1e1e;
  color: #ffffff;
  font-family: Inter, 'SF Pro Display', 'Segoe UI', sans-serif;
  overflow: hidden;
}

.sidebar {
  background: #2d2d2d;
  border-right: 1px solid #3a3a3a;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.sidebar-actions {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.new-session-btn {
  width: 100%;
  background: #3b3f49;
  color: #fff;
  border: 1px solid #4b4f5a;
  border-radius: 10px;
  padding: 8px 10px;
}

.new-session-btn:hover {
  background: #4a4f5e;
}

.session-add {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
}

.session-add input {
  width: 100%;
  border: 1px solid #464646;
  border-radius: 10px;
  background: #252525;
  color: #fff;
  padding: 8px 10px;
  font-size: 12px;
}

.session-add button {
  background: #333;
  color: #fff;
  border: 1px solid #474747;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding-top: 6px;
}

.conversation-item {
  width: 100%;
  background: transparent;
  color: #fff;
  border: none;
  border-radius: 12px;
  text-align: left;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.conversation-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-id {
  color: #9c9c9c;
  font-size: 12px;
  opacity: 0.9;
}

.conversation-id-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.delete-conversation-btn {
  background: transparent;
  border: none;
  color: #9c9c9c;
  padding: 0;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.conversation-item:hover .delete-conversation-btn,
.conversation-item.active .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ff6b6b;
}

.conversation-item:hover,
.conversation-item.active {
  background: #3a3a3a;
}

.conversation-item:hover .conversation-id,
.conversation-item.active .conversation-id {
  opacity: 1;
}

.sidebar-tip {
  color: #9c9c9c;
  font-size: 12px;
  margin: 6px 0 0;
}


.main-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-header {
  padding: 18px 28px 8px;
}

.main-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.message-flow {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 48px 20px;
}

.bubble {
  max-width: 760px;
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.bubble-ai {
  background: #2a2a2a;
  margin-right: auto;
}

.bubble-user {
  background: #3b3f49;
  margin-left: auto;
}

.empty-state {
  color: #9f9f9f;
  text-align: center;
  padding-top: 120px;
}

.composer {
  padding: 8px 24px 16px;
}

.composer-row {
  background: #262626;
  border: 1px solid #3a3a3a;
  border-radius: 18px;
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.tool-buttons {
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.tool-drawer {
  position: absolute;
  left: 0;
  bottom: 46px;
  width: 220px;
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 14px;
  padding: 10px;
  z-index: 10;
}

.tool-item {
  width: 100%;
  background: #333;
  color: #fff;
  border: 1px solid #4a4a4a;
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  display: flex;
  gap: 8px;
  align-items: center;
}

.tool-item.selected {
  background: #4b5b84;
}

.rag-item {
  cursor: pointer;
}

.rag-item input {
  accent-color: #4b5b84;
}

.composer-row textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  resize: none;
  outline: none;
  font-size: 14px;
  padding: 6px 6px;
  min-height: 36px;
}

.mode-switch {
  background: #303030;
  border-radius: 999px;
  padding: 3px;
  display: inline-flex;
  gap: 0;
}

.mode-switch button {
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #d5d5d5;
  padding: 6px 12px;
}

.mode-switch button.active {
  background: #4b5b84;
  color: #fff;
}

.send-area {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tool-plus,
.tool-open,
.send-btn {
  height: 36px;
  border-radius: 12px;
}

.tool-plus {
  width: 36px;
  background: #3a3a3a;
  border: none;
  color: #ffffff;
  font-size: 18px;
  line-height: 36px;
  padding: 0;
}

.tool-open {
  background: #3a3a3a;
  border: none;
  color: #ffffff;
  padding: 0 10px;
  font-size: 12px;
  white-space: nowrap;
}

.tool-plus:hover,
.tool-open:hover {
  background: #4b4b4b;
}

.send-btn {
  background: #4b5b84;
  border: none;
  color: #ffffff;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status-text {
  margin: 8px 4px 0;
  color: #a7a7a7;
  font-size: 12px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stop-btn {
  margin-top: 8px;
  background: transparent;
  color: #bfc7ff;
  border: 1px solid #4b5b84;
  border-radius: 8px;
  font-size: 12px;
  padding: 4px 8px;
}

@media (max-width: 1180px) {
  .gemini-shell {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: 800px) {
  .gemini-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }
}
</style>

