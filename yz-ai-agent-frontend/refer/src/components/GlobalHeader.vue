<template>
  <div id="globalHeader">
    <a-row :wrapper="false" align="middle">

      <a-col flex="200px">
        <router-link to="/" class="logo-main">
          <div class="logo-text">
            <div class="title">九华云SaaS管理平台</div>
          </div>
        </router-link>
      </a-col>

      <a-col flex="auto">
        <a-menu
            v-model:selectedKeys="current"
            mode="horizontal"
            :items="items"
            @click="doMenuClick"
            theme="dark"
            class="header-menu vertical-icon-menu"
        />
      </a-col>

      <a-col flex="280px">
        <div class="right-actions">

          <div class="user-login-status">
            <div v-if="loginUserStore.loginUser.id">
              <a-dropdown trigger="hover" placement="bottomRight">
                <div class="user-dropdown-trigger">
                  <a-avatar size="default" class="user-avatar">
                    {{ loginUserStore.loginUser.name?.slice(0, 1) }}
                  </a-avatar>
                  <div class="user-name-container">
                    <span class="user-name-text">{{ loginUserStore.loginUser.name ?? '无名' }}</span>
                  </div>
                </div>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="doChangePassword">
                      <UserOutlined />
                      修改密码
                    </a-menu-item>
                    <a-menu-item @click="doLogout">
                      <LogoutOutlined />
                      退出登录
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div v-else>
              <router-link to="/user/login">
                <a-button ghost type="primary" class="login-btn">登录</a-button>
              </router-link>
            </div>
          </div>

          <div class="action-btn" @click="toggleFullScreen" title="进入全屏模式" v-if="!isFullscreen">
            <FullscreenOutlined class="action-icon" />
          </div>
          <div class="action-btn" @click="toggleFullScreen" title="退出全屏模式" v-else>
            <FullscreenExitOutlined  class="action-icon" />
          </div>

        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, onMounted, onUnmounted } from 'vue'
import {
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/yuangongguanlijiekou'
import checkAccess from '@/access/checkAccess.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()

// 全屏状态控制
const isFullscreen = ref(false)

// 切换全屏逻辑
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

// 监听全屏变化（防止用户按ESC退出时状态不一致）
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 菜单配置：确保每个都有 Icon
const originItems = [
  //主页 (HomeOutlined)
  { key: '/', icon: () => h(HomeOutlined), label: '主页', title: '主页' },
  // 发票管理 (FileTextOutlined)
  { key: '/invoice/info', icon: () => h(FileTextOutlined), label: '发票管理', title: '发票管理' },
    // 公司管理 (BankOutlined)
    { key: '/invoice/company', icon: () => h(BankOutlined), label: '公司管理', title: '公司管理' },
  // 客户管理 (TeamOutlined)
  { key: '/invoice/client', icon: () => h(TeamOutlined), label: '客户管理', title: '客户管理' },
  // 用户管理 (UserOutlined)
  { key: '/admin/userManage', icon: () => h(UserOutlined), label: '用户管理', title: '用户管理' },
]

const items = computed(() => {
  return originItems.filter((menu) => {
    const item = menuToRouteItem(menu)
    const hideInMenu = item.meta?.hideInMenu ?? false
    if (hideInMenu) return false
    return checkAccess(loginUserStore.loginUser, item.meta?.access as string)
  })
})

const menuToRouteItem = (menu: any) => {
  const routes = router.getRoutes()
  const targetRoute = routes.find((route) => route.path === menu.key)
  return {
    path: menu.key,
    meta: {
      ...(targetRoute?.meta || {}),
      access: targetRoute?.meta?.access,
      hideInMenu: targetRoute?.meta?.hideInMenu ?? false,
    },
  }
}

const doMenuClick = ({ key }: { key: string }) => {
  router.push({ path: key })
}

const current = ref<string[]>([])
router.afterEach((to) => {
  current.value = [to.path]
})

const doChangePassword = () => {
  router.push('/user/changePassword')
}

const doLogout = async () => {
  try {
    const res = await userLogoutUsingPost()
    if (res.data.code === 0) {
      loginUserStore.setLoginUserFromApi(null)
      message.success('退出登录成功')
      await router.push('/user/login')
    } else {
      message.error('退出登录失败，' + (res.data.message || ''))
    }
  } catch (e: any) {
    message.error('退出登录失败，' + (e?.message || '网络异常'))
  }
}
</script>

<style scoped>
/* =======================================
   1. 全局 Header 容器
   ======================================= */
#globalHeader {
  background: #5176EA;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 72px;
  padding: 0 24px;
  z-index: 100;
  position: relative;
  width: 100%;
  margin: 0;
}

/* 额外的：如果您发现在浏览器中依然没有全覆盖，请在您的 App.vue 或全局 CSS 中添加：
body {
    margin: 0;
    padding: 0;
}
*/

/* =======================================
   2. Logo 区域：大文字风格
   ======================================= */
#globalHeader .logo-main {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 72px;
  text-decoration: none;
}

#globalHeader .logo-img {
  width: 44px;
  height: 44px;
  border-radius: 4px;
}

#globalHeader .logo-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* 【修改点】强制 Logo 文字不换行，让它更紧凑 */
  white-space: nowrap;
}

#globalHeader .title {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;
  letter-spacing: 1px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =======================================
   3. 菜单区域：上图标下文字
   ======================================= */
.header-menu {
  background: #5176EA !important;
  border-bottom: none !important;
  height: 72px;
  display: flex;
  align-items: center;
  /* 确保菜单容器可以收缩 */
  min-width: 0;
}

/* 强制重写 Ant Menu Item 布局为垂直居中 */
#globalHeader :deep(.ant-menu-item) {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100% !important;
  line-height: 1.2 !important;

  /* 【核心修改 1】减小最小宽度，允许收缩到最小程度 */
  min-width: 50px !important;
  /* 【核心修改 2】减少左右内边距，提供更多收缩空间 */
  padding: 0 10px !important;

  top: 0 !important;
  margin-top: 0 !important;
  transition: all 0.3s ease;

  /* 【核心修改 3】强制菜单文字不换行，使其收缩而不是换行 */
  white-space: nowrap;
}

/* 调整图标样式 */
#globalHeader :deep(.ant-menu-item .anticon) {
  font-size: 18px !important;
  margin-bottom: 4px !important;
  display: block !important;
}

/* 调整文字样式 */
#globalHeader :deep(.ant-menu-item .ant-menu-title-content) {
  font-size: 13px;
  margin-left: 0 !important;
  opacity: 0.9;

  /* 【核心修改 4】隐藏溢出文字并显示省略号 */
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 悬停效果：背景加深 */
#globalHeader :deep(.ant-menu-item:hover) {
  background-color: rgba(0, 0, 0, 0.1) !important;
}

/* 选中状态：底部加粗白线 + 背景微亮 */
#globalHeader :deep(.ant-menu-item-selected) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}
#globalHeader :deep(.ant-menu-item-selected::after) {
  border-bottom: 3px solid #ffffff !important;
  bottom: 0 !important;
}
#globalHeader :deep(.ant-menu-dark .ant-menu-item) {
  color: #fff !important;
}

/* =======================================
   4. 右侧功能区 (保持固定宽度，防止溢出)
   ======================================= */
.right-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 72px;
  gap: 8px;
  /* 【修改点】确保右侧整个容器不可被压缩，保持完整性 */
  flex-shrink: 0;
}

/* 全屏按钮样式 */
.action-btn {
  /* 确保全屏按钮始终位于最右边 */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* 减少内边距 */
  padding: 0 8px;
  height: 100%;
  color: rgba(255,255,255,0.85);
  transition: background 0.3s;
}
.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #fff;
}
.action-icon {
  font-size: 18px;
  margin-bottom: 2px;
}
.action-text {
  font-size: 12px;
  transform: scale(0.9);
}

/* 用户状态区 */
.user-login-status {
  display: flex;
  align-items: center;
  /* 【修复点 2】确保用户状态区不会被挤压，并占用最大空间 */
  flex-shrink: 0;
  padding-right: 8px;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  /* 保持间距，但移除多余的 padding */
  gap: 10px;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-avatar {
  background-color: #fff;
  color: #5176EA;
  font-weight: bold;
}

.user-name-container {
  display: flex;
  align-items: center;
  /* 【修复点 2】微调最大宽度，确保名字换行时不溢出 */
  max-width: 80px;
  white-space: normal;
  word-break: break-word;
  line-height: 14px;
}

.user-name-text {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.login-btn {
  border-color: #fff;
  color: #fff;
}
.login-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
