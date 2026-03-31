<template>
  <div id="invoiceSider">
    <a-layout-sider
      v-if="loginUserStore.loginUser.id"
      class="sider"
      width="180"
      breakpoint="lg"
      collapsed-width="0"
    >
      <a-menu
        v-model:selectedKeys="current"
        mode="inline"
        :items="menuItems"
        @click="doMenuClick"
      />
    </a-layout-sider>
  </div>
</template>

<script lang="ts" setup>
import { ref, h, computed, watch } from 'vue'
import { DollarOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import checkAccess from '@/access/checkAccess'

const loginUserStore = useLoginUserStore()

// 固定的菜单列表
const fixedMenuItems = [
  {
    key: '/invoice/info/query',
    label: '销项发票',
    icon: () => h(SearchOutlined),
  },
  {
    key: '/invoice/info/finish',
    label: '发票到款信息',
    icon: () => h(DollarOutlined),
  },
]

const router = useRouter()
const route = useRoute()

// 当前选中菜单
const current = ref<string[]>([route.path])

// 监听路由变化，更新当前选中菜单
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/invoice/info')) {
      current.value = [newPath]
    }
  },
  { immediate: true }
)

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

const menuItems = computed(() => {
  // 根据用户权限过滤菜单项
  return fixedMenuItems.filter(menu => {
    const routeItem = router.getRoutes().find(r => r.path === menu.key)
    const needAccess = routeItem?.meta?.access
    if (!needAccess) return false
    return checkAccess(loginUserStore.loginUser, needAccess as string)
  })
})
</script>

<style scoped>
#invoiceSider :deep(.ant-menu-item) {
  padding-left: 0 !important;
}
</style>

