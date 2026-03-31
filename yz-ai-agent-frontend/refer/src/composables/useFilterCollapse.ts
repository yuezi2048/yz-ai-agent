import { ref, watch } from 'vue'

/**
 * 用于管理表单筛选区域的收缩状态，并自动保存到 sessionStorage
 * @param storageKey sessionStorage 的 key，建议使用页面路径作为 key
 * @param defaultValue 默认收缩状态，默认为 true
 * @returns 返回 filterCollapsed 和 filterCollapseKey 的 ref，以及 toggleFilterCollapse 方法
 */
export function useFilterCollapse(storageKey: string, defaultValue: boolean = false) {
  // 从 sessionStorage 恢复收缩状态
  const loadCollapsedFromStorage = (): boolean => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved !== null) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error(`Failed to load filter collapsed state from sessionStorage for ${storageKey}`, e)
    }
    return defaultValue
  }

  const filterCollapsed = ref(loadCollapsedFromStorage())
  const filterCollapseKey = ref<string[]>(filterCollapsed.value ? [] : ['filter'])

  // 保存收缩状态到 sessionStorage
  const saveCollapsedToStorage = (collapsed: boolean) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(collapsed))
    } catch (e) {
      console.error(`Failed to save filter collapsed state to sessionStorage for ${storageKey}`, e)
    }
  }

  // 监听 filterCollapsed 变化并保存
  watch(filterCollapsed, (newValue) => {
    saveCollapsedToStorage(newValue)
    filterCollapseKey.value = newValue ? [] : ['filter']
  }, { immediate: false })

  // 切换收缩状态
  const toggleFilterCollapse = () => {
    filterCollapsed.value = !filterCollapsed.value
  }

  // 处理 collapse 组件的变化事件
  const handleFilterCollapseChange = (keys: string[] | string) => {
    const arr = Array.isArray(keys) ? keys : [keys]
    filterCollapsed.value = !arr.includes('filter')
  }

  // 处理手动切换按钮点击
  const handleFilterCollapseToggle = () => {
    const willCollapse = !filterCollapsed.value
    filterCollapsed.value = willCollapse
    filterCollapseKey.value = willCollapse ? [] : ['filter']
  }

  return {
    filterCollapsed,
    filterCollapseKey,
    toggleFilterCollapse,
    handleFilterCollapseChange,
    handleFilterCollapseToggle,
  }
}













