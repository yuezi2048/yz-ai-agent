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

