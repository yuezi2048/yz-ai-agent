<template>
  <div id="topBar" :class="{ collapsed: navigationStore.isCollapsed }">
    <div class="top-bar-content">
      <!-- 第一行：页面标题 + 个人信息 / 我的审核 -->
      <div class="top-bar-row top-bar-row-main">
        <!-- 左侧：当前页面名称（模块简称） -->
        <div class="current-page">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>

        <!-- 右侧：用户信息 + 我的审核 -->
        <div class="user-section">
          <div
            class="user-info-wrapper"
            @mouseenter="handleUserHover"
            @mouseleave="handleUserLeave"
          >
            <a-avatar :size="32" class="user-avatar">
              {{ loginUserStore.loginUser.name?.slice(0, 1) || 'U' }}
            </a-avatar>
            <span class="user-name">{{ loginUserStore.loginUser.name || '未登录' }}</span>
          </div>

          <a-button
            type="text"
            class="approval-btn"
            @click="handleApprovalClick"
          >
            <FileTextOutlined />
            我的审核
          </a-button>

          <!-- 用户功能菜单弹出层 -->
          <div
            v-if="showUserMenu"
            class="user-menu-popup"
            :style="userMenuStyle"
            @mouseenter="handleUserMenuEnter"
            @mouseleave="handleUserMenuLeave"
          >
            <div class="user-menu-item" @click="handleProfile">
              <UserOutlined />
              <span>个人资料</span>
            </div>
            <div class="user-menu-item" @click="handleChangePassword">
              <UserOutlined />
              <span>修改密码</span>
            </div>
            <div class="user-menu-item" @click="handleLogout">
              <LogoutOutlined />
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：导航标签栏 -->
      <div class="top-bar-row top-bar-row-tabs">
        <button
          class="tabs-arrow tabs-arrow-left"
          :disabled="!hasPrevTab"
          @click="switchToPrevTab"
        >
          <LeftOutlined />
        </button>

        <div ref="tabsContainerRef" class="tabs-container">
          <div
            v-for="tab in tabs"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tab.path === currentPath }"
            @click="handleTabClick(tab)"
            @mousedown.middle="handleTabClose(tab)"
          >
            <span class="tab-label">{{ tab.title }}</span>
            <CloseOutlined
              class="tab-close"
              @click.stop="handleTabClose(tab)"
            />
          </div>
        </div>

        <button
          class="tabs-arrow tabs-arrow-right"
          :disabled="!hasNextTab"
          @click="switchToNextTab"
        >
          <RightOutlined />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CloseOutlined, FileTextOutlined, UserOutlined, LogoutOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useNavigationStore } from '@/stores/useNavigationStore.ts'
import { userLogoutUsingPost } from '@/api/yuangongguanlijiekou'
import checkAccess from '@/access/checkAccess'

// 菜单配置（与导航栏保持一致）
const menuConfig = [
  {
    key: 'invoice',
    label: '发票管理',
    children: [
      { key: '/invoice/info/query', label: '销项发票' },
    ],
  },
  {
    key: 'finance',
    label: '财务管理',
    children: [
      { key: '/finance/bank/transaction', label: '银行收支明细' },
      { key: '/finance/input/invoice', label: '进项发票管理' },
      { key: '/finance/accounts/receivable', label: '应收账款列表' },
    ],
  },
  {
    key: 'client',
    label: '用户管理',
    children: [
      { key: '/invoice/client', label: '客户信息管理' },
      { key: '/supplier/list', label: '供应商信息管理' },
      { key: '/employee/manage', label: '员工信息维护' },
    ],
  },
  {
    key: 'base',
    label: '基础信息管理',
    children: [
      { key: '/base/company', label: '公司信息' },
      { key: '/employee/permission', label: '权限维护' },
      { key: '/base/transfer/method', label: '票据种类' },
      { key: '/base/invoice/type', label: '发票种类' },
      { key: '/base/mark', label: '销票标注' },
    ],
  },
  {
    key: 'bi',
    label: '商业智能',
    children: [
      { key: '/bi/statistics', label: '报表查询' },
    ],
  },
]

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const navigationStore = useNavigationStore()

// 根据用户权限过滤菜单配置
const filteredMenuConfig = computed(() => {
  return menuConfig.map(menu => {
    if (!menu.children) return menu
    // 过滤子菜单，只保留用户有权限访问的
    const filteredChildren = menu.children.filter(child => {
      const routeItem = router.getRoutes().find(r => r.path === child.key)
      const needAccess = routeItem?.meta?.access
      if (!needAccess) return false
      return checkAccess(loginUserStore.loginUser, needAccess as string)
    })
    // 如果子菜单全部被过滤掉，则整个菜单项不显示
    if (filteredChildren.length === 0) return null
    return {
      ...menu,
      children: filteredChildren
    }
  }).filter(Boolean) as typeof menuConfig
})

interface Tab {
  path: string
  title: string
}

// 从 sessionStorage 恢复标签页
const loadTabsFromStorage = (): Tab[] => {
  try {
    const saved = sessionStorage.getItem('topBarTabs')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load tabs from sessionStorage', e)
  }
  return []
}

// 保存标签页到 sessionStorage
const saveTabsToStorage = (tabsToSave: Tab[]) => {
  try {
    sessionStorage.setItem('topBarTabs', JSON.stringify(tabsToSave))
  } catch (e) {
    console.error('Failed to save tabs to sessionStorage', e)
  }
}

const tabs = ref<Tab[]>(loadTabsFromStorage())
const currentPath = ref('')

// 获取当前页面模块简称（去掉“一级功能-二级功能”的形式，并适当简化名称）
const getPageTitle = () => {
  // 如果是主页，直接返回"主页"
  if (currentPath.value === '/') {
    return '主页'
  }

  const currentTab = tabs.value.find(tab => tab.path === currentPath.value)
  const title = currentTab?.title || route.meta?.title || (route.name as string) || '未命名页面'

  // 查找对应的菜单配置，返回精简后的子菜单名称
  for (const menu of filteredMenuConfig.value) {
    if (menu.children) {
      for (const child of menu.children) {
        if (child.key === currentPath.value) {
          let shortLabel: string = (child.label || title) as string
          // 通用精简规则：去掉"查询统计""统计"等字样，使标题更短
          shortLabel = shortLabel.replace('查询统计', '查询')
          shortLabel = shortLabel.replace('统计', '')
          return shortLabel
        }
      }
    }
  }

  return title
}

// 当前页面标题
const currentPageTitle = computed(() => {
  return getPageTitle()
})

// 标签容器 ref，用于滚动控制
const tabsContainerRef = ref<HTMLElement | null>(null)

// 当前激活标签索引
const activeTabIndex = computed(() => {
  return tabs.value.findIndex(tab => tab.path === currentPath.value)
})

const hasPrevTab = computed(() => activeTabIndex.value > 0)
const hasNextTab = computed(() => activeTabIndex.value !== -1 && activeTabIndex.value < tabs.value.length - 1)

// 保证当前激活标签可见
const scrollActiveTabIntoView = () => {
  nextTick(() => {
    const container = tabsContainerRef.value
    if (!container) return
    const activeEl = container.querySelector('.tab-item.active') as HTMLElement | null
    if (!activeEl) return

    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()

    if (activeRect.left < containerRect.left) {
      container.scrollLeft -= (containerRect.left - activeRect.left)
    } else if (activeRect.right > containerRect.right) {
      container.scrollLeft += (activeRect.right - containerRect.right)
    }
  })
}

const switchToPrevTab = () => {
  if (!hasPrevTab.value) return
  const target = tabs.value[activeTabIndex.value - 1]
  if (target) {
    router.push(target.path)
  }
}

const switchToNextTab = () => {
  if (!hasNextTab.value) return
  const target = tabs.value[activeTabIndex.value + 1]
  if (target) {
    router.push(target.path)
  }
}

// 添加标签页
const addTab = (path: string, title: string) => {
  const existingTab = tabs.value.find(tab => tab.path === path)
  if (!existingTab) {
    tabs.value.push({ path, title })
    saveTabsToStorage(tabs.value)
  }
  currentPath.value = path
}

// 移除标签页
const removeTab = (path: string) => {
  const index = tabs.value.findIndex(tab => tab.path === path)
  if (index !== -1) {
    tabs.value.splice(index, 1)
    saveTabsToStorage(tabs.value)

    // 如果关闭的是当前标签页，切换到最后一个标签页
    if (path === currentPath.value) {
      if (tabs.value.length > 0) {
        const lastTab = tabs.value[tabs.value.length - 1]
        router.push(lastTab.path)
      } else {
        // 如果没有标签页了，跳转到首页
        router.push('/')
      }
    }
  }
}

// 标签页点击
const handleTabClick = (tab: Tab) => {
  currentPath.value = tab.path
  router.push(tab.path)
}

// 标签页关闭
const handleTabClose = (tab: Tab) => {
  removeTab(tab.path)
}

// 审核按钮点击
const handleApprovalClick = () => {
  Modal.info({
    title: '提示',
    content: '审核功能待开发，敬请期待',
    okText: '知道了',
  })
}

// 用户菜单相关
const showUserMenu = ref(false)
const userMenuStyle = ref({ top: '0px', right: '0px' })
let userLeaveTimer: any = null
let userMenuEnterTimer: any = null

const handleUserHover = (event: MouseEvent) => {
  if (userLeaveTimer) {
    clearTimeout(userLeaveTimer)
    userLeaveTimer = null
  }

  showUserMenu.value = true

  // 计算菜单位置
  const userElement = event.currentTarget as HTMLElement
  if (userElement) {
    const rect = userElement.getBoundingClientRect()
    userMenuStyle.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right - 20}px`, // 减少right值，向右偏移20px
    }
  }
}

const handleUserLeave = () => {
  if (userLeaveTimer) {
    clearTimeout(userLeaveTimer)
  }
  userLeaveTimer = setTimeout(() => {
    const menuElement = document.querySelector('.user-menu-popup')
    if (menuElement) {
      const menuRect = menuElement.getBoundingClientRect()
      const mouseX = (window as any).lastMouseX || 0
      const mouseY = (window as any).lastMouseY || 0

      if (
        mouseX >= menuRect.left - 10 &&
        mouseX <= menuRect.right + 10 &&
        mouseY >= menuRect.top - 10 &&
        mouseY <= menuRect.bottom + 10
      ) {
        return
      }
    }
    showUserMenu.value = false
  }, 300)
}

const handleUserMenuEnter = () => {
  if (userLeaveTimer) {
    clearTimeout(userLeaveTimer)
    userLeaveTimer = null
  }
}

const handleUserMenuLeave = () => {
  if (userMenuEnterTimer) {
    clearTimeout(userMenuEnterTimer)
  }
  userMenuEnterTimer = setTimeout(() => {
    showUserMenu.value = false
  }, 100)
}


// 处理个人资料
const handleProfile = () => {
  router.push('/user/profile')
  showUserMenu.value = false
}

const handleChangePassword = () => {
  router.push('/user/changePassword')
  showUserMenu.value = false
}

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
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
      showUserMenu.value = false
    },
  })
}

// 监听鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  ;(window as any).lastMouseX = e.clientX
  ;(window as any).lastMouseY = e.clientY
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    currentPath.value = newPath
    // 主页特殊处理
    let title = '未命名页面'
    if (newPath === '/') {
      title = '主页'
    } else {
      title = route.meta?.title as string || route.name as string || '未命名页面'
    }
    addTab(newPath, title)
    scrollActiveTabIntoView()
  },
  { immediate: true }
)

onMounted(() => {
  // 如果没有标签页，自动创建主页标签
  if (tabs.value.length === 0) {
    addTab('/', '主页')
    if (route.path !== '/') {
      router.push('/')
    }
  } else if (route.path === '/') {
    addTab('/', '主页')
  }
  scrollActiveTabIntoView()
})
</script>

<style scoped>
#topBar {
  position: fixed;
  top: 0;
  right: 0;
  height: 96px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
}

#topBar {
  left: 240px;
}

#topBar.collapsed {
  left: 60px;
}

.top-bar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 20px;
}

.top-bar-row {
  display: flex;
  align-items: center;
}

.top-bar-row-main {
  height: 52px;
  justify-content: space-between;
}

.top-bar-row-tabs {
  height: 44px;
  border-top: 1px solid #f0f0f0;
}

.current-page {
  flex: 0 0 auto;
  padding-right: 16px;
  border-right: 1px solid #e8e8e8;
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabs-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  /* 隐藏滚动条，仅通过左右箭头切换 */
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.tabs-arrow {
  width: 32px;
  height: 100%;
  border: none;
  background: #fff;
  border-left: 1px solid #f0f0f0;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  padding: 0;
}

.tabs-arrow-left {
  border-left: none;
}

.tabs-arrow-right {
  border-right: none;
}

.tabs-arrow:disabled {
  cursor: default;
  color: #d9d9d9;
}

.tabs-arrow:not(:disabled):hover {
  background: #f5f5f5;
  color: #1890ff;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  border-right: 1px solid #e8e8e8;
  border-bottom: 2px solid transparent;
  color: #555;
}

.tab-item:hover {
  background: #f8f8f8;
}

.tab-item.active {
  background: #fff;
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-label {
  font-size: 14px;
}

.tab-close {
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.tab-close:hover {
  opacity: 1;
}

.tab-item.active .tab-close {
  color: #1890ff;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 20px;
  border-left: 1px solid #e8e8e8;
  position: relative;
}

.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info-wrapper:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-avatar {
  background: #1890ff;
  color: #fff;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.user-menu-popup {
  position: fixed;
  width: 140px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1002;
  padding: 4px 0;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 12px;
  color: #333;
  line-height: 22px;
}

.user-menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-menu-item :deep(.anticon) {
  font-size: 14px;
  width: 14px;
  text-align: center;
}

.user-menu-item span {
  flex: none; /* 修改这个属性，避免文字占据过多空间 */
}

.approval-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
}

.approval-btn:hover {
  color: #1890ff;
}
</style>

