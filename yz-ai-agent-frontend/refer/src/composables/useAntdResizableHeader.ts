import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'

export interface ResizableColumnType extends TableColumnsType[number] {
  key?: string
  dataIndex?: string
  width?: number
  minWidth?: number
  maxWidth?: number
}

export interface ColumnsStateType {
  persistenceKey?: string
  persistenceType?: 'localStorage' | 'sessionStorage'
}

export interface UseAntdResizableHeaderOptions {
  columns: ResizableColumnType[] | Ref<ResizableColumnType[]> | ComputedRef<ResizableColumnType[]>
  defaultWidth?: number
  minConstraints?: number
  maxConstraints?: number
  columnsState?: ColumnsStateType
  onResizeStart?: () => void
  onResizeEnd?: () => void
  debounceWaitTime?: number
}

export function useAntdResizableHeader(options: UseAntdResizableHeaderOptions) {
  const {
    columns: originalColumnsRef,
    defaultWidth = 120,
    minConstraints,
    maxConstraints,
    columnsState,
    onResizeStart,
    onResizeEnd,
  } = options

  // 将 columns 转换为 ref
  const originalColumns = computed(() => {
    const cols = originalColumnsRef
    return 'value' in cols ? cols.value : cols
  })

  // 存储列宽状态
  const columnWidths = ref<Record<string, number>>({})

  // 从持久化存储加载列宽
  const loadColumnWidths = () => {
    if (!columnsState?.persistenceKey) return

    try {
      const storage = columnsState.persistenceType === 'sessionStorage' 
        ? sessionStorage 
        : localStorage
      const saved = storage.getItem(columnsState.persistenceKey)
      if (saved) {
        columnWidths.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load column widths:', error)
    }
  }

  // 保存列宽到持久化存储
  const saveColumnWidths = () => {
    if (!columnsState?.persistenceKey) return

    try {
      const storage = columnsState.persistenceType === 'sessionStorage' 
        ? sessionStorage 
        : localStorage
      storage.setItem(columnsState.persistenceKey, JSON.stringify(columnWidths.value))
    } catch (error) {
      console.error('Failed to save column widths:', error)
    }
  }

  // 初始化列宽
  const initializeColumnWidths = () => {
    const cols = originalColumns.value
    cols.forEach((col, index) => {
      const key = col.key || col.dataIndex || String(index)
      if (col.width !== undefined) {
        if (!(key in columnWidths.value)) {
          columnWidths.value[key] = col.width
        }
      }
    })
    loadColumnWidths()
  }

  // 监听 columns 变化，初始化列宽
  watch(originalColumns, () => {
    initializeColumnWidths()
  }, { immediate: true })

  // 更新列宽（支持同步移动）
  // 向右拖拽：左边固定，右边所有列同步向右移动（保持宽度不变）
  // 向左拖拽：右边固定，左边列同步向左移动（保持宽度不变）
  const updateColumnWidth = (key: string, width: number, deltaX?: number) => {
    const cols = originalColumns.value
    const currentIndex = cols.findIndex(col => {
      const colKey = col.key || col.dataIndex || ''
      return colKey === key
    })
    
    if (currentIndex === -1) {
      columnWidths.value[key] = width
      // 立即保存到持久化存储
      if (columnsState?.persistenceKey) {
        saveColumnWidths()
      }
      return
    }
    
    const currentWidth = columnWidths.value[key] || cols[currentIndex].width || defaultWidth
    const widthDelta = width - currentWidth
    
    // 如果没有 deltaX 或宽度没有变化，直接更新
    if (deltaX === undefined || widthDelta === 0) {
      columnWidths.value[key] = width
      if (columnsState?.persistenceKey) {
        saveColumnWidths()
      }
      return
    }
    
    // 获取当前列的限制
    const currentCol = cols[currentIndex]
    const currentMinWidth = currentCol.minWidth || minConstraints || defaultWidth / 2
    const currentMaxWidth = currentCol.maxWidth || maxConstraints || Infinity
    
    // 确保新宽度在限制范围内
    let finalWidth = width
    if (finalWidth < currentMinWidth) {
      finalWidth = currentMinWidth
    } else if (finalWidth > currentMaxWidth) {
      finalWidth = currentMaxWidth
    }
    
    // 向右拖拽（deltaX > 0）：左边固定，右边所有列同步向右移动
    // 右边列保持宽度不变，它们的位置会自动右移（表格总宽度增加）
    // 向左拖拽（deltaX < 0）：右边固定，左边列同步向左移动
    // 左边列保持宽度不变，它们的位置会自动左移（表格总宽度减少）
    // 由于表格使用固定布局（table-layout: fixed），其他列保持宽度不变时，
    // 它们的位置会自动调整，从而实现同步移动的效果
    columnWidths.value[key] = finalWidth
    
    // 立即保存到持久化存储
    if (columnsState?.persistenceKey) {
      saveColumnWidths()
    }
  }

  // 计算可调整的列
  const resizableColumns = computed(() => {
    const cols = originalColumns.value
    return cols.map((col, index) => {
      const key = col.key || col.dataIndex || String(index)
      const savedWidth = columnWidths.value[key]
      const width = savedWidth !== undefined ? savedWidth : col.width

      return {
        ...col,
        width,
        key: key, // 确保 key 存在
      }
    })
  })

  // 计算表格总宽度
  const tableWidth = computed(() => {
    return resizableColumns.value.reduce((sum, col) => {
      if (col.width) {
        return sum + col.width
      }
      return sum + defaultWidth
    }, 0)
  })

  // 处理拖拽开始
  const handleResizeStart = (e: MouseEvent, key: string, column: ResizableColumnType) => {
    e.preventDefault()
    e.stopPropagation()
    
    onResizeStart?.()
    
    const startX = e.clientX
    const startWidth = columnWidths.value[key] || column.width || defaultWidth
    const minWidth = minConstraints || column.minWidth || defaultWidth / 2
    const maxWidth = maxConstraints || column.maxWidth || Infinity

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const deltaX = moveEvent.clientX - startX
      let newWidth = startWidth + deltaX
      
      if (newWidth < minWidth) {
        newWidth = minWidth
      }
      if (newWidth > maxWidth) {
        newWidth = maxWidth
      }

      columnWidths.value[key] = newWidth
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveColumnWidths()
      onResizeEnd?.()
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 获取列的拖拽处理函数
  const getResizeHandler = (column: ResizableColumnType) => {
    const key = column.key || column.dataIndex || ''
    // 如果列没有设置 width 或者是操作列，不允许拖拽
    if (column.width === undefined || key === 'action') {
      return undefined
    }
    return (e: MouseEvent) => handleResizeStart(e, key, column)
  }

  // 重置列宽
  const resetColumns = () => {
    columnWidths.value = {}
    const cols = originalColumns.value
    cols.forEach((col, index) => {
      const key = col.key || col.dataIndex || String(index)
      if (col.width !== undefined) {
        columnWidths.value[key] = col.width
      }
    })
    if (columnsState?.persistenceKey) {
      const storage = columnsState.persistenceType === 'sessionStorage' 
        ? sessionStorage 
        : localStorage
      storage.removeItem(columnsState.persistenceKey)
    }
  }

  // 刷新组件
  const refresh = () => {
    // 触发重新计算
    columnWidths.value = { ...columnWidths.value }
  }

  return {
    resizableColumns,
    tableWidth,
    resetColumns,
    refresh,
    getResizeHandler,
    columnWidths,
    updateColumnWidth,
  }
}

