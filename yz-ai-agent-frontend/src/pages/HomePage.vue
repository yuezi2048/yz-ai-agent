<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <main class="home">
    <section class="enter">
      <button class="enter-btn" @click="router.push('/love')">进入对话</button>
      <p class="enter-sub">快速聊天 / 高级智能体推理 / RAG 知识检索 / 工具调用</p>
    </section>

    <section class="cards">
      <article class="info-card">
        <h3>AI 凌语 Agent 智能问答系统</h3>
        <p>基础对话与情感咨询，给出清晰、可执行的建议。</p>
      </article>
      <article class="info-card">
        <h3>智能体（Thinking）</h3>
        <p>更强推理与规划能力，适合复杂问题与多步策略。</p>
      </article>
      <article class="info-card">
        <h3>RAG 知识检索</h3>
        <p>结合检索证据增强回答准确性与可追溯性。</p>
      </article>
      <article class="info-card">
        <h3>工具调用</h3>
        <p>在需要时调用外部能力，完成检索、分析与结构化输出。</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 64px 16px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.enter {
  text-align: center;
  max-width: 720px;
}

.enter-btn {
  background: #4b5b84;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 16px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
}

.enter-btn:hover {
  background: #5a6da0;
}

.enter-sub {
  margin: 14px 0 0;
  color: #a7a7a7;
  font-size: 13px;
}

.cards {
  width: min(1100px, 100%);
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 14px;
}

.info-card {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(13, 17, 23, 0.55);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
}

.info-card h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
}

.info-card p {
  margin: 0;
  color: #a7a7a7;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .cards {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}
</style>

