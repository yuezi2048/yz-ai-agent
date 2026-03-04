<script setup lang="ts">
import ChatExperience from '@/components/ChatExperience.vue';

const config = {
  title: 'AI 恋爱大师',
  subtitle: '以对话方式提供情感咨询、聊天脚本与约会策略。',
  placeholder: '输入你想讨论的情感问题或聊天内容...',
  helperText: '每次进入页面都会自动创建新的会话 ID，你也可以点击“新建会话”重置。',
  suggestionKey: 'love'
} as const;

const streamOptions = {
  path: '/ai/love_app/chat/sse',
  requiresChatId: true
} as const;
</script>

<template>
  <ChatExperience :config="config" :stream-options="streamOptions" />
</template>

