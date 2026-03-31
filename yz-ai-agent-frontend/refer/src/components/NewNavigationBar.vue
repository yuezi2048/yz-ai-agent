<template>
  <div id="newNavigationBar" :class="{ collapsed: isCollapsed }">
    <!-- Logo区域 -->
    <div class="logo-section">
      <div class="logo" @click="handleLogoClick">
        <div class="logo-icon">SaaS</div>
        <div class="logo-text">九华云SaaS管理平台</div>
      </div>
      <div class="search-box">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索菜单"
          size="small"
          class="menu-search"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </div>
    </div>

    <!-- 菜单区域 -->
    <div class="menu-section">
      <div
        v-for="menu in filteredMenus"
        :key="menu.key"
        class="menu-item"
        :class="{ active: activeMenuKey === menu.key }"
        @mouseenter="handleMenuHover(menu, $event)"
        @mouseleave="handleMenuLeave"
        @click="handleMenuClick(menu)"
      >
        <div class="menu-icon">
          <component :is="menu.icon" />
        </div>
        <div class="menu-label" v-if="!isCollapsed">{{ menu.label }}</div>
        <div class="menu-arrow" v-if="!isCollapsed && menu.children && menu.children.length > 0">
          <RightOutlined />
        </div>
      </div>
    </div>

    <!-- 折叠按钮 - 放在导航栏右侧中部 -->
    <div class="collapse-btn" @click="toggleCollapse">
      <component :is="isCollapsed ? RightOutlined : LeftOutlined" />
    </div>

    <!-- 子菜单弹出层 -->
    <div
      v-if="hoveredMenu && hoveredMenu.children"
      class="submenu-popup"
      :style="submenuStyle"
      @mouseenter="handleSubmenuEnter"
      @mouseleave="handleSubmenuLeave"
    >
      <div class="submenu-header">
        <span class="submenu-title">{{ hoveredMenu.label }}</span>
        <CloseOutlined class="submenu-close" @click="closeSubmenu" />
      </div>
      <div class="submenu-content">
        <div
          v-for="child in hoveredMenu.children"
          :key="child.key"
          class="submenu-item"
          @click="handleSubmenuClick(child)"
        >
          <div class="submenu-icon">
            <component :is="child.icon" />
          </div>
          <div class="submenu-label">{{ child.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  RightOutlined,
  LeftOutlined,
  SearchOutlined,
  CloseOutlined,
  DollarOutlined,
  FileSearchOutlined,
  AccountBookOutlined,
  ShopOutlined,
  IdcardOutlined,
  PieChartOutlined,
} from '@ant-design/icons-vue'
import { h } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import checkAccess from '@/access/checkAccess'
import { useNavigationStore } from '@/stores/useNavigationStore.ts'

const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()
const loginUserStore = useLoginUserStore()

// 菜单配置 - 严格按照功能模块划分
const menuConfig = [
  {
    key: '/',
    label: '主页',
    icon: () => h(HomeOutlined),
  },
  {
    key: 'invoice',
    label: '发票管理',
    icon: () => h(FileTextOutlined),
    children: [
      {
        key: '/invoice/info/query',
        label: '销项发票',
        icon: () => h(FileSearchOutlined),
      },
    ],
  },
  {
    key: 'finance',
    label: '财务管理',
    icon: () => h(AccountBookOutlined),
    children: [
      {
        key: '/finance/bank/transaction',
        label: '银行收支明细',
        icon: () => h(BankOutlined),
      },
      {
        key: '/finance/input/invoice',
        label: '进项发票管理',
        icon: () => h(FileTextOutlined),
      },
      {
        key: '/finance/accounts/receivable',
        label: '应收账款列表',
        icon: () => h(DollarOutlined),
      },
    ],
  },
  {
    key: 'client',
    label: '用户管理',
    icon: () => h(TeamOutlined),
    children: [
      {
        key: '/invoice/client',
        label: '客户信息管理',
        icon: () => h(TeamOutlined),
      },
      {
        key: '/supplier/list',
        label: '供应商信息管理',
        icon: () => h(ShopOutlined),
      },
      {
        key: '/employee/manage',
        label: '员工信息维护',
        icon: () => h(IdcardOutlined),
      },
    ],
  },
  {
    key: 'base',
    label: '基础信息管理',
    icon: () => h(SettingOutlined),
    children: [
      {
        key: '/base/company',
        label: '公司信息',
        icon: () => h(BankOutlined),
      },
      {
        key: '/employee/permission',
        label: '权限维护',
        icon: () => h(SettingOutlined),
      },
      {
        key: '/base/transfer/method',
        label: '票据种类',
        icon: () => h(DollarOutlined),
      },
      {
        key: '/base/invoice/type',
        label: '发票种类',
        icon: () => h(FileTextOutlined),
      },
      {
        key: '/base/mark',
        label: '销票标注',
        icon: () => h(SettingOutlined),
      },
      {
        key: '/base/input/invoice/purpose',
        label: '进票用途',
        icon: () => h(FileTextOutlined),
      },
      {
        key: '/base/permission',
        label: '权限管理',
        icon: () => h(SettingOutlined),
      },
    ],
  },
  {
    key: 'bi',
    label: '商业智能',
    icon: () => h(PieChartOutlined),
    children: [
      {
        key: '/bi/statistics',
        label: '报表查询',
        icon: () => h(BarChartOutlined),
      },
    ],
  },
]

const searchKeyword = ref('')
const isCollapsed = computed({
  get: () => navigationStore.isCollapsed,
  set: (value) => navigationStore.setCollapsed(value)
})
const hoveredMenu = ref<any>(null)
const submenuStyle = ref({ top: '0px', left: '0px' })
const activeMenuKey = ref<string>('')

// 根据用户权限过滤菜单配置
const permissionFilteredMenus = computed(() => {
  return menuConfig.map(menu => {
    // 如果是主页，检查是否有权限访问
    if (menu.key === '/') {
      const routeItem = router.getRoutes().find(r => r.path === menu.key)
      const needAccess = routeItem?.meta?.access
      if (needAccess && !checkAccess(loginUserStore.loginUser, needAccess as string)) {
        return null
      }
      return menu
    }
    
    // 如果有子菜单，过滤子菜单
    if (menu.children) {
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
    }
    return menu
  }).filter(Boolean) as typeof menuConfig
})

// 过滤菜单（包含搜索和权限过滤）
const filteredMenus = computed(() => {
  let menus = permissionFilteredMenus.value
  if (!searchKeyword.value) {
    return menus
  }
  const keyword = searchKeyword.value.toLowerCase()
  return menus.filter(menu => {
    if (menu.label.toLowerCase().includes(keyword)) {
      return true
    }
    if (menu.children) {
      return menu.children.some(child => child.label.toLowerCase().includes(keyword))
    }
    return false
  })
})

// 菜单悬停
const handleMenuHover = (menu: any, event?: MouseEvent) => {
  // 如果有子菜单，无论是否收缩都显示
  if (!menu.children || menu.children.length === 0) {
    return
  }

  // 清除之前的关闭定时器
  if (menuLeaveTimer) {
    clearTimeout(menuLeaveTimer)
    menuLeaveTimer = null
  }

  hoveredMenu.value = menu

  // 计算子菜单位置
  if (event) {
    const menuElement = event.currentTarget as HTMLElement
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect()
      submenuStyle.value = {
        top: `${rect.top}px`,
        left: `${rect.right + 8}px`,
      }
    }
  }
}

let menuLeaveTimer: any = null
let submenuEnterTimer: any = null

const handleMenuLeave = () => {
  // 清除之前的定时器
  if (menuLeaveTimer) {
    clearTimeout(menuLeaveTimer)
  }
  // 延迟关闭，以便鼠标移动到子菜单
  menuLeaveTimer = setTimeout(() => {
    // 检查鼠标是否在子菜单上
    const submenuElement = document.querySelector('.submenu-popup')
    if (submenuElement) {
      const submenuRect = submenuElement.getBoundingClientRect()
      const mouseX = (window as any).lastMouseX || 0
      const mouseY = (window as any).lastMouseY || 0

      // 如果鼠标在子菜单区域内，不关闭
      if (
        mouseX >= submenuRect.left - 10 &&
        mouseX <= submenuRect.right + 10 &&
        mouseY >= submenuRect.top - 10 &&
        mouseY <= submenuRect.bottom + 10
      ) {
        return
      }
    }
    hoveredMenu.value = null
  }, 300)
}

const handleSubmenuEnter = () => {
  // 清除关闭定时器，保持子菜单打开
  if (menuLeaveTimer) {
    clearTimeout(menuLeaveTimer)
    menuLeaveTimer = null
  }
}

const handleSubmenuLeave = () => {
  // 延迟关闭，给鼠标时间移回菜单项
  if (submenuEnterTimer) {
    clearTimeout(submenuEnterTimer)
  }
  submenuEnterTimer = setTimeout(() => {
    hoveredMenu.value = null
  }, 200)
}

// 监听鼠标移动，记录位置
onMounted(() => {
  const handleMouseMove = (e: MouseEvent) => {
    ;(window as any).lastMouseX = e.clientX
    ;(window as any).lastMouseY = e.clientY
  }
  document.addEventListener('mousemove', handleMouseMove)

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
  })
})

const closeSubmenu = () => {
  hoveredMenu.value = null
}

// 菜单点击
const handleMenuClick = (menu: any) => {
  if (menu.children && menu.children.length > 0) {
    // 如果有子菜单，不跳转，只显示子菜单
    return
  }
  if (menu.key) {
    activeMenuKey.value = menu.key
    router.push(menu.key)
  }
}

// 子菜单点击
const handleSubmenuClick = (child: any) => {
  activeMenuKey.value = child.key
  router.push(child.key)
  hoveredMenu.value = null
}

// 折叠/展开
const toggleCollapse = () => {
  navigationStore.toggleCollapse()
  if (navigationStore.isCollapsed) {
    hoveredMenu.value = null
  }
}

// Logo点击事件 - 新建主页
const handleLogoClick = () => {
  router.push('/')
}

// 监听路由变化，更新激活菜单
const updateActiveMenu = () => {
  const currentPath = route.path
  for (const menu of menuConfig) {
    if (menu.children) {
      for (const child of menu.children) {
        if (child.key === currentPath) {
          activeMenuKey.value = menu.key
          return
        }
      }
    }
    if (menu.key === currentPath) {
      activeMenuKey.value = menu.key
      return
    }
  }
  activeMenuKey.value = ''
}

onMounted(() => {
  updateActiveMenu()
  router.afterEach(() => {
    updateActiveMenu()
  })
})
</script>

<style scoped>
#newNavigationBar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: #2c3e50;
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: width 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

#newNavigationBar.collapsed {
  width: 60px;
}

.logo-section {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: #e74c3c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  border-radius: 4px;
}

.logo-text {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.collapsed .logo-text {
  display: none;
}

.search-box {
  width: 100%;
}

.collapsed .search-box {
  display: none;
}

.menu-search {
  width: 100%;
}

.menu-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
  position: relative;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.collapsed .menu-item {
  padding: 12px;
  justify-content: center;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.15);
}

.menu-item.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #e74c3c;
}

.menu-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
  flex-shrink: 0;
}

.collapsed .menu-icon {
  margin-right: 0;
}

.menu-label {
  flex: 1;
  white-space: nowrap;
  min-width: 0;
}

.menu-arrow {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
  flex-shrink: 0;
}

.collapse-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  z-index: 10;
  border-radius: 4px 0 0 4px;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.submenu-popup {
  position: fixed;
  width: 300px;
  background: #34495e;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  max-height: 600px;
  overflow-y: auto;
  pointer-events: auto;
}

.submenu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.submenu-title {
  font-size: 16px;
  font-weight: 500;
}

.submenu-close {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.submenu-close:hover {
  opacity: 1;
}

.submenu-content {
  padding: 8px 0;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submenu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submenu-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.submenu-label {
  flex: 1;
}
</style>

