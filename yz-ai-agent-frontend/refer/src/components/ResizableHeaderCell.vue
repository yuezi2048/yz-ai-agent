<template>
  <div 
    class="resizable-header-cell" 
    :style="{ width: width ? width + 'px' : 'auto' }"
    @click="handleCellClick"
  >
    <div ref="contentRef" class="resizable-header-content">
      <slot />
    </div>
    <div
      v-if="!shouldDisableResize"
      class="resizable-handle"
      :class="{ 'hide-separator': props.hideSeparator }"
      @mousedown.prevent.stop="handleMouseDown"
      @click.stop.prevent="handleHandleClick"
      @mouseup.stop.prevent
      @mouseleave="handleHandleMouseLeave"
    >
      <div class="resizable-handle-line" v-if="!props.hideSeparator"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, nextTick, withDefaults } from 'vue'

interface Props {
  width?: number
  minWidth?: number
  maxWidth?: number
  columnKey?: string
  isLastColumn?: boolean
  fixed?: string | boolean
  hideSeparator?: boolean
  onResize?: (width: number, deltaX?: number) => void
  onResizeStop?: (width: number, deltaX?: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  hideSeparator: false,
})

const contentRef = ref<HTMLElement | null>(null)
const titleTextWidth = ref<number>(0)
const isResizing = ref(false)
// 存储当前拖拽的事件监听器清理函数，用于在需要时强制清理
let currentCleanupFn: (() => void) | null = null

const isActionColumn = computed(() => props.columnKey === 'action')
const isFixedRight = computed(() => props.fixed === 'right' || props.fixed === true)
const shouldDisableResize = computed(() => {
  // 操作列、固定右侧的列、最后一列、没有宽度的列都不应该有伸缩功能
  return isActionColumn.value || isFixedRight.value || props.isLastColumn || props.width === undefined
})

// 测量标题文字的实际宽度
const measureTitleWidth = () => {
  if (!contentRef.value) return 0
  
  try {
    // 使用临时元素测量文字宽度（最安全的方法，不会影响布局）
    const tempElement = document.createElement('span')
    const styles = window.getComputedStyle(contentRef.value)
    
    // 复制样式以确保测量准确
    tempElement.style.visibility = 'hidden'
    tempElement.style.position = 'absolute'
    tempElement.style.top = '-9999px'
    tempElement.style.left = '-9999px'
    tempElement.style.whiteSpace = 'nowrap'
    tempElement.style.fontSize = styles.fontSize
    tempElement.style.fontFamily = styles.fontFamily
    tempElement.style.fontWeight = styles.fontWeight
    tempElement.style.fontStyle = styles.fontStyle
    tempElement.style.letterSpacing = styles.letterSpacing
    tempElement.style.textTransform = styles.textTransform
    tempElement.style.padding = '0'
    tempElement.style.margin = '0'
    tempElement.style.border = '0'
    tempElement.style.lineHeight = styles.lineHeight
    
    // 获取文字内容（从slot中获取）
    const textContent = contentRef.value.textContent || contentRef.value.innerText || ''
    if (!textContent.trim()) return 0
    
    tempElement.textContent = textContent
    
    document.body.appendChild(tempElement)
    const width = Math.ceil(tempElement.offsetWidth) // 向上取整，确保有足够空间
    document.body.removeChild(tempElement)
    
    return width
  } catch (error) {
    console.warn('Failed to measure title width:', error)
    return 0
  }
}

// 计算动态最小宽度：取传入的minWidth和标题文字宽度的较大值
const dynamicMinWidth = computed(() => {
  const baseMinWidth = props.minWidth || 60
  
  // 如果已经测量到标题宽度，使用它来计算最小宽度
  if (titleTextWidth.value > 0) {
    // 标题文字宽度 + 左右padding（各16px，根据table.css中的padding设置）+ 拖拽手柄空间（12px）+ 安全边距（8px）
    const titleBasedMinWidth = titleTextWidth.value + 16 * 2 + 12 + 8
    
    // 取较大值，确保最小宽度至少能容纳标题文字
    return Math.max(baseMinWidth, titleBasedMinWidth)
  }
  
  // 如果还没有测量到，使用基础最小宽度
  return baseMinWidth
})

// 监听内容变化，重新测量（处理动态内容变化）
// 使用MutationObserver监听slot内容变化
let mutationObserver: MutationObserver | null = null

// 在组件挂载后测量标题宽度并设置监听
onMounted(() => {
  // 使用双重nextTick确保DOM完全渲染
  nextTick(() => {
    nextTick(() => {
      const measuredWidth = measureTitleWidth()
      if (measuredWidth > 0) {
        titleTextWidth.value = measuredWidth
      }
      
      // 设置MutationObserver监听内容变化
      if (contentRef.value) {
        mutationObserver = new MutationObserver(() => {
          nextTick(() => {
            const measuredWidth = measureTitleWidth()
            if (measuredWidth > 0) {
              titleTextWidth.value = measuredWidth
            }
          })
        })
        
        mutationObserver.observe(contentRef.value, {
          childList: true,
          subtree: true,
          characterData: true,
        })
      }
    })
  })
})

// 清理MutationObserver
onUnmounted(() => {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
})

const handleMouseDown = (e: MouseEvent) => {
  if (!props.width || !props.onResize) return

  // 解决在 Windows 操作系统下，Edge 浏览器和 Chrome 浏览器，松开鼠标按键，依然能拖动
  const clearSelection = () => {
    if (window.getSelection) {
      const selection = window.getSelection()
      if (selection) {
        if (selection.empty) {
          selection.empty()
        } else if (selection.removeAllRanges) {
          selection.removeAllRanges()
        }
      }
    } else if ((document as any).selection && (document as any).selection.empty) {
      ;(document as any).selection.empty()
    }
  }
  clearSelection()

  // 阻止事件冒泡和默认行为，避免触发排序
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()

  // 标记开始拖拽，用于阻止后续的点击事件
  isResizing.value = true
  let isDragging = false
  let hasMoved = false

  const startX = e.clientX
  const startWidth = props.width
  // 使用动态计算的最小宽度，确保不小于标题文字宽度
  const minWidth = dynamicMinWidth.value
  const maxWidth = props.maxWidth || Infinity

  // 清理函数
  const cleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mouseleave', handleMouseLeave)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // 清除全局清理函数引用
    currentCleanupFn = null
  }
  
  // 保存清理函数到全局变量，以便在需要时强制清理
  currentCleanupFn = cleanup

  const handleMouseMove = (moveEvent: MouseEvent) => {
    // 如果已经不在拖拽状态，直接返回，不处理移动事件
    if (!isResizing.value) {
      return
    }
    
    moveEvent.preventDefault()
    moveEvent.stopPropagation()
    moveEvent.stopImmediatePropagation()
    
    const deltaX = moveEvent.clientX - startX
    const moveDelta = Math.abs(deltaX)
    
    // 如果移动距离超过阈值，标记为拖拽
    if (moveDelta > 3) {
      isDragging = true
      hasMoved = true
      
      // 只有在实际拖拽时才更新列宽
      let newWidth = startWidth + deltaX
      
      if (newWidth < minWidth) {
        newWidth = minWidth
      }
      if (newWidth > maxWidth) {
        newWidth = maxWidth
      }

      // 传递 deltaX 用于判断拖拽方向
      props.onResize?.(newWidth, deltaX)
    }
  }

  const handleMouseLeave = (leaveEvent: MouseEvent) => {
    // 如果鼠标离开且没有实际拖拽，取消拖拽状态
    if (!hasMoved || !isDragging) {
      cleanup()
      isResizing.value = false
    }
  }

  const handleMouseUp = (upEvent: MouseEvent) => {
    upEvent.preventDefault()
    upEvent.stopPropagation()
    upEvent.stopImmediatePropagation()
    
    const deltaX = upEvent.clientX - startX
    const moveDelta = Math.abs(deltaX)
    
    // 清理事件监听器
    cleanup()
    
    // 判断是否实际发生了拖拽（移动距离超过3px）
    const hasDragged = isDragging || moveDelta > 3
    
    if (hasDragged) {
      // 如果发生了拖拽，应用新的宽度
      let finalWidth = startWidth + deltaX
      
      if (finalWidth < minWidth) {
        finalWidth = minWidth
      }
      if (finalWidth > maxWidth) {
        finalWidth = maxWidth
      }
      
      // 传递 deltaX 用于判断拖拽方向
      props.onResizeStop?.(finalWidth, deltaX)
      
      // 延迟重置拖拽标记，确保排序事件不会触发
      // 注意：只有在真正拖拽后才延迟重置，避免影响后续的排序操作
      setTimeout(() => {
        isResizing.value = false
      }, 100) // 延迟100ms确保排序事件不会触发，但不要太长以免影响后续操作
    } else {
      // 如果没有实际拖拽（只是点击），恢复原始宽度并取消拖拽状态
      // 不调用 onResizeStop，因为这只是点击，不是拖拽
      // 立即重置状态，允许后续的排序操作
      isResizing.value = false
    }
    
    isDragging = false
    hasMoved = false
  }
  
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', handleMouseMove, { passive: false })
  document.addEventListener('mouseup', handleMouseUp, { passive: false })
  document.addEventListener('mouseleave', handleMouseLeave, { passive: false })
}

// 处理单元格点击事件，如果正在拖拽则阻止排序
const handleCellClick = (e: MouseEvent) => {
  // 检查点击是否发生在拖拽手柄上
  const target = e.target as HTMLElement
  const isClickOnHandle = target?.closest('.resizable-handle') !== null
  
  // 如果点击在拖拽手柄上，不处理（由 handleHandleClick 处理）
  if (isClickOnHandle) {
    return
  }
  
  // 如果正在拖拽调整列宽，阻止点击事件冒泡到表头排序
  if (isResizing.value) {
    e.stopPropagation()
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

// 处理拖拽手柄的点击事件
const handleHandleClick = (e: MouseEvent) => {
  // 如果正在拖拽，强制清理并取消拖拽状态
  if (isResizing.value) {
    // 如果有清理函数，立即执行清理
    if (currentCleanupFn) {
      currentCleanupFn()
    }
    
    // 立即重置拖拽状态
    isResizing.value = false
    
    // 确保移除所有可能的事件监听器
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // 阻止点击事件冒泡
    e.stopPropagation()
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

// 处理拖拽手柄的鼠标离开事件
const handleHandleMouseLeave = (e: MouseEvent) => {
  // 如果鼠标离开拖拽手柄且正在拖拽状态，可能需要取消
  // 但这里不直接取消，因为可能鼠标还在移动中
  // 实际的取消逻辑在 handleMouseUp 中处理
}
</script>

<style scoped>
.resizable-header-cell {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保列宽固定，不影响其他列 */
  box-sizing: border-box;
  width: 100%;
  /* 确保内容居中 */
  text-align: center;
  min-height: 100%;
}

.resizable-header-content {
  /* 使用 flex: 1 占据可用空间，但确保内容居中 */
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 确保内容居中 */
  text-align: center;
  /* 确保内容不超出列宽 */
  max-width: 100%;
  box-sizing: border-box;
  /* 移除 padding，避免标题偏移 */
  padding: 0;
  /* 确保内容在容器中居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保内容区域占据所有可用空间 */
  min-width: 0;
}

.resizable-handle {
  position: absolute;
  right: -6px;
  top: 0;
  bottom: 0;
  width: 12px;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保拖拽手柄不影响列布局 */
  pointer-events: auto;
  /* 确保拖拽手柄延伸到列边界外 */
  margin: 0;
  padding: 0;
}

.resizable-handle:hover {
  background: rgba(24, 144, 255, 0.05);
}

.resizable-handle:active {
  background: rgba(24, 144, 255, 0.1);
}

.resizable-handle-line {
  width: 3px;
  height: 60%;
  background-color: #000;
  border-radius: 2px;
  transition: all 0.2s;
  /* 确保线条在伸缩栏中心 */
  margin: 0 auto;
}

.resizable-handle:hover .resizable-handle-line {
  background-color: #1890ff;
  width: 4px;
  height: 70%;
}

.resizable-handle.hide-separator {
  opacity: 0;
}

.resizable-handle.hide-separator:hover {
  opacity: 1;
  background: rgba(24, 144, 255, 0.05);
}
</style>

