<template>
  <div id="invoiceInfoManagePage">
    <a-layout style="min-height: calc(100vh - 72px)">
      <!-- 侧边栏 -->
      <InvoiceSider />
      
      <!-- 内容区域 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script lang="ts" setup>
import InvoiceSider from '@/components/InvoiceSider.vue'
</script>

<style scoped>
#invoiceInfoManagePage {
  height: 100%;
}

#invoiceInfoManagePage .content {
  padding: 20px;
  background: #fff;
}
</style>

