import { nextTick, onUnmounted, watch, type Ref } from 'vue'

export function useDraggableModal(visible: Ref<boolean>) {
  // 将变量封装在每次 hook 调用产生的闭包中
  let cleanupFn: (() => void) | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0
  const MAX_RETRIES = 10
  const RETRY_INTERVAL = 100 // 增加间隔，确保动画完成

  const setupDraggable = () => {
    // 1. 查找当前真正处于显示状态且层级最高的 modal
    // 过滤出 transform 不为 none 且 opacity 不为 0 的（或者简单的只取最后一个可视的）
    const modals = Array.from(document.querySelectorAll('.ant-modal')) as HTMLElement[]

    // 关键：我们要找的是那个没有被初始化过，且确实是可见的容器
    const currentModal = modals.reverse().find(m => {
      const style = window.getComputedStyle(m.parentElement || m)
      return style.display !== 'none' && !m.hasAttribute('data-draggable-instance')
    })

    if (!currentModal) {
      if (visible.value && retryCount < MAX_RETRIES) {
        retryCount++
        retryTimer = setTimeout(setupDraggable, RETRY_INTERVAL)
      }
      return
    }

    const headerElement = currentModal.querySelector('.ant-modal-header') as HTMLElement
    const modalContent = currentModal.querySelector('.ant-modal-content') as HTMLElement

    if (!headerElement || !modalContent) return

    // 标记当前实例，防止重复绑定
    const instanceId = 'drag_' + Math.random().toString(36).substr(2, 9)
    currentModal.setAttribute('data-draggable-instance', instanceId)

    headerElement.style.cursor = 'move'
    headerElement.style.userSelect = 'none'

    let offsetX = 0
    let offsetY = 0
    let isDragging = false
    // 新增：记录允许的最小 Y 轴位移（防止顶部溢出）
    let minTranslateY = -99999 

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      // 获取当前已有的 transform 数值
      const style = window.getComputedStyle(modalContent)
      const matrix = new WebKitCSSMatrix(style.transform)

      offsetX = e.clientX - matrix.m41
      offsetY = e.clientY - matrix.m42
      
      // --- 修复开始 ---
      // 计算边界：确保模态框顶部不跑出视口
      const rect = modalContent.getBoundingClientRect()
      // 逻辑说明：
      // rect.top 是当前模态框顶部距离视口顶部的距离
      // matrix.m42 是当前的 Y 轴偏移量
      // 模态框的“初始位置”（无偏移时的位置）= rect.top - matrix.m42
      // 我们希望新的偏移量 y 满足：(初始位置 + y) >= 0
      // 所以：y >= -(初始位置) => y >= matrix.m42 - rect.top
      minTranslateY = matrix.m42 - rect.top
      // --- 修复结束 ---

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const x = e.clientX - offsetX
      let y = e.clientY - offsetY
      
      // --- 修复开始 ---
      // 限制 Y 轴坐标，不允许小于计算出的最小边界值
      // 这样标题栏永远至少贴着浏览器顶部，不会完全跑出去
      if (y < minTranslateY) {
        y = minTranslateY
      }
      // --- 修复结束 ---

      modalContent.style.transform = `translate(${x}px, ${y}px)`
    }

    const handleMouseUp = () => {
      isDragging = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    headerElement.addEventListener('mousedown', handleMouseDown)

    // 定义当前实例专用的清理函数
    cleanupFn = () => {
      headerElement.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      currentModal.removeAttribute('data-draggable-instance')
    }
  }

  watch(visible, (newVal) => {
    if (newVal) {
      retryCount = 0
      nextTick(() => setTimeout(setupDraggable, 200))
    } else {
      if (cleanupFn) {
        cleanupFn()
        cleanupFn = null
      }
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
    }
  })

  onUnmounted(() => {
    if (cleanupFn) cleanupFn()
  })
}