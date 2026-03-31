<template>
  <div id="basicLayout">
    <!-- 新的导航栏 -->
    <NewNavigationBar />

    <!-- 顶部栏 -->
    <TopBar />

    <!-- 主内容区域 -->
    <div class="main-content" :style="{ marginLeft: contentMarginLeft }">
          <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NewNavigationBar from '@/components/NewNavigationBar.vue'
import TopBar from '@/components/TopBar.vue'
import { useNavigationStore } from '@/stores/useNavigationStore.ts'

const navigationStore = useNavigationStore()

const contentMarginLeft = computed(() => {
  return navigationStore.isCollapsed ? '60px' : '240px'
})
</script>

<style scoped>
#basicLayout {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  margin-top: 96px;
  padding: 0 0 0 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  transition: margin-left 0.3s ease;
  /* 预留滚动条空间，避免滚动条出现/消失时布局偏移 */
  scrollbar-gutter: stable;
}
</style>
