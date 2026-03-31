import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  // 从 sessionStorage 恢复收缩状态
  const loadCollapsedFromStorage = (): boolean => {
    try {
      const saved = sessionStorage.getItem('navigationCollapsed')
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load collapsed state from sessionStorage', e)
    }
    return true // 默认收缩
  }

  const isCollapsed = ref(loadCollapsedFromStorage())

  // 保存收缩状态到 sessionStorage
  const saveCollapsedToStorage = (collapsed: boolean) => {
    try {
      sessionStorage.setItem('navigationCollapsed', JSON.stringify(collapsed))
    } catch (e) {
      console.error('Failed to save collapsed state to sessionStorage', e)
    }
  }

  // 监听 isCollapsed 变化并保存
  watch(isCollapsed, (newValue) => {
    saveCollapsedToStorage(newValue)
  }, { immediate: false })

  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
  }

  const setCollapsed = (collapsed: boolean) => {
    isCollapsed.value = collapsed
  }

  return {
    isCollapsed,
    toggleCollapse,
    setCollapsed,
  }
})


