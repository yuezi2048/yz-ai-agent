<script setup lang="ts">
import ChatExperience from '@/components/ChatExperience.vue';

const config = {
  title: 'AI 超级智能体',
  subtitle: '调用工具链执行复杂任务，适合多步骤推理与规划。',
  placeholder: '描述你想要解决的问题或需要的计划...',
  helperText: '在对话中可以连续提问，系统会持续记忆当前会话。',
  suggestionKey: 'manus'
} as const;

const streamOptions = {
  path: '/ai/manus/chat',
  requiresChatId: false
} as const;
</script>

<template>
  <ChatExperience :config="config" :stream-options="streamOptions" />
</template>

