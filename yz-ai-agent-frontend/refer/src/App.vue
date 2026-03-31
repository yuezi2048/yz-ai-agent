<template>
  <a-config-provider :locale="appLocale">
    <div id="app">
      <component :is="layoutComponent">
        <router-view />
      </component>
    </div>
  </a-config-provider>

</template>

<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
import '@/access'
import zhCN from 'ant-design-vue/es/locale/zh_CN'; // 引入 ant-design-vue 的中文语言包
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import {useRoute} from "vue-router";
import {computed, onMounted} from "vue"; // 引入 dayjs 的中文语言包
import { useLoginUserStore } from '@/stores/useLoginUserStore'

// 初始化用户信息
const loginUserStore = useLoginUserStore()
onMounted(() => {
  // 先从 sessionStorage 恢复用户信息
  loginUserStore.initLoginUser()
  // 然后尝试从后端获取最新用户信息
  loginUserStore.fetchLoginUser()
})


// healthUsingGet().then(res => {
//   console.log(res)
// })

// 设置 dayjs 默认语言为中文
dayjs.locale('zh-cn');

// 使用 Composition API 和 setup 函数定义响应式数据
const appLocale = zhCN; // 设置当前应用的语言环境

// 登录等页面不需要布局
const route = useRoute()

const layoutComponent = computed(() => {
  // 检查路由元信息是否需要布局
  if (route.meta.layout === false) {
    return 'div' // 或者返回一个简单的包装组件
  }
  return BasicLayout
})

</script>

<style scoped>

</style>
