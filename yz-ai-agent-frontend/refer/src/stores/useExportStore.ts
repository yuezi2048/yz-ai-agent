import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 全局导出状态管理
 * 确保同时只能有一个导出任务
 */
export const useExportStore = defineStore('export', () => {
  // 是否有正在进行的导出任务
  const isExporting = ref(false)
  
  // 当前导出任务的取消控制器
  let currentAbortController: AbortController | null = null

  /**
   * 开始导出任务
   * @returns {AbortSignal | null} 如果已有导出任务，返回 null；否则返回新的 AbortSignal
   */
  function startExport(): AbortSignal | null {
    if (isExporting.value) {
      return null
    }
    
    isExporting.value = true
    currentAbortController = new AbortController()
    return currentAbortController.signal
  }

  /**
   * 完成导出任务
   */
  function finishExport() {
    isExporting.value = false
    currentAbortController = null
  }

  /**
   * 取消当前导出任务
   */
  function cancelExport() {
    if (currentAbortController) {
      currentAbortController.abort()
    }
    isExporting.value = false
    currentAbortController = null
  }

  return {
    isExporting,
    startExport,
    finishExport,
    cancelExport,
  }
})

