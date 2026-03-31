<template>
  <div id="globalSider">
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
import {ref, h, computed, watch} from 'vue'
import { UserOutlined, PictureOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import checkAccess from '@/access/checkAccess'

const loginUserStore = useLoginUserStore()

// 固定的菜单列表
const fixedMenuItems = [
  {
    key: '/admin/dataManage/school/coverage',
    label: '学校配送覆盖数据',
    icon: () => h(TeamOutlined),
  },
  {
    key: '/admin/dataManage/school/delivery',
    label: '学校配送业务规模数据',
    icon: () => h(TeamOutlined),
  },
  {
    key: '/admin/dataManage/other/coverage',
    label: '其他配送覆盖数据',
    icon: () => h(UserOutlined),
  },
  {
    key: '/admin/dataManage/other/delivery',
    label: '其他配送业务规模数据',
    icon: () => h(PictureOutlined),
  },
  {
    key: '/admin/dataManage/scales',
    label: '配送单位工作情况统计',
    icon: () => h(PictureOutlined),
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
      current.value = [newPath]
    },
    { immediate: true }
)

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  // 【关键修改】：直接跳转到菜单项的 key 路径
  router.push(key)
  // 例如：点击 '学校配送覆盖数据'，会跳转到 '/admin/dataManage/school/coverage'
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
#components-layout-demo-top-side-2 .logo {
  float: left;
  width: 120px;
  height: 31px;
  margin: 16px 24px 16px 0;
  background: rgba(255, 255, 255, 0.3);
}

.ant-row-rtl #components-layout-demo-top-side-2 .logo {
  float: right;
  margin: 16px 0 16px 24px;
}

#globalSider :deep(.ant-menu-item) {
  padding-left: 0 !important;
}


.site-layout-background {
  background: #fff;
}
</style>
