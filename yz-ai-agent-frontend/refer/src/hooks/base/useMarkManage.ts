import { ref, computed, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  addMarkUsingPost,
  updateMarkUsingPost,
  deleteMarkUsingPost,
  queryMarkPageUsingPost,
} from '@/api/jichuxinxiguanlijiekou'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useMarkTable } from './useMarkTable'

/**
 * 标记管理完整 Hook
 * 包含列定义、列设置、CRUD 等所有业务逻辑
 */
export function useMarkManage() {
  // 使用基础表格 Hook
  const baseTable = useMarkTable()

  // ==================== 列定义 ====================

  /** 所有可用列 */
  const allColumns = ref([
    {
      key: 'serialNo',
      title: '序号',
      dataIndex: 'serialNo',
      width: 56,
      fixed: 'left',
      sorter: false,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1000,
    },
    {
      key: 'markValue',
      title: '标注',
      dataIndex: 'markValue',
      width: 200,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 3000,
    },
    {
      key: 'sortOrder',
      title: '排列顺序',
      dataIndex: 'sortOrder',
      width: 120,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 1800,
    },
    {
      key: 'isEnabled',
      title: '启用状态',
      dataIndex: 'isEnabled',
      width: 100,
      sorter: true,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1500,
    },
    {
      key: 'remark',
      title: '备注',
      dataIndex: 'remark',
      sorter: true,
      align: 'center' as const,
    },
    {
      key: 'action',
      title: '操作',
      width: 120,
      fixed: 'right',
      align: 'center' as const,
      minWidth: 80,
      maxWidth: 1200,
    },
  ])

  /** 默认显示的列 */
  const defaultSelectedColumns = ['serialNo', 'markValue', 'sortOrder', 'isEnabled', 'remark']

  /** 获取存储的列设置（每次进入时使用默认值） */
  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('MARK_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  /** 当前选中的列 */
  const selectedColumns = ref<string[]>(getStoredColumns())

  /** 显示的列 */
  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  // ==================== 列伸缩 ====================

  // 每次进入时清除列宽存储
  try {
    localStorage.removeItem('MARK_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  /** 列伸缩功能 */
  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'MARK_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  /** 可调整的显示列 */
  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // ==================== 列设置弹窗 ====================

  /** 列设置弹窗显示状态 */
  const columnSettingVisible = ref(false)

  /** 打开列设置弹窗 */
  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  /** 列设置确认 */
  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('MARK_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== CRUD 操作 ====================

  /** 模态框显示状态 */
  const modalVisible = ref(false)
  /** 模态框标题 */
  const modalTitle = ref('添加-销票标注')
  /** 编辑中的 ID */
  const editingId = ref<number | null>(null)
  /** 当前编辑记录在列表中的索引 */
  const currentEditIndex = ref<number>(-1)
  /** 临时存储目标序号（用于分页切换时避免闪烁） */
  const targetSerialNo = ref<number | null>(null)
  /** 表单数据 */
  const formData = ref<Partial<API.MarkDTO>>({})

  // 计算当前编辑记录在查询结果中的序号
  const currentEditSerialNo = computed(() => {
    // 如果正在切换分页，使用目标序号
    if (targetSerialNo.value !== null) {
      return targetSerialNo.value
    }
    if (currentEditIndex.value < 0) {
      return null // 新增模式或记录未找到
    }
    const current = Number(baseTable.paginationParams.current) || 1
    const pageSize = Number(baseTable.paginationParams.pageSize) || 10
    return (current - 1) * pageSize + currentEditIndex.value + 1
  })

  /** 打开添加弹窗 */
  const doAdd = () => {
    modalTitle.value = '添加-销票标注'
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    formData.value = {
      markValue: '',
      markLabel: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
    }
    modalVisible.value = true
  }

  /** 打开编辑弹窗 */
  const doEdit = (record: API.MarkConfig_) => {
    modalTitle.value = '修改-销票标注'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = baseTable.dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    formData.value = {
      markValue: record.markValue || '',
      markLabel: record.markLabel || '',
      sortOrder: record.sortOrder || 0,
      isEnabled: record.isEnabled ?? 1,
      remark: record.remark || '',
    }
    modalVisible.value = true
  }

  /** 提交表单 */
  const handleSubmit = async (data: API.MarkDTO, callback?: (success: boolean) => void) => {
    try {
      if (editingId.value) {
        const submitData: API.MarkConfigUpdateDTO = {
          id: editingId.value,
          ...data,
        }
        const res = (await updateMarkUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          // 编辑模式下，不关闭弹窗，等待用户点击"下一条"或关闭
          await baseTable.fetchData()
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        const res = (await addMarkUsingPost(data)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
          await baseTable.fetchData()
          callback?.(true)
        } else {
          message.error('添加失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      }
    } catch (error) {
      console.error('提交失败', error)
      callback?.(false)
    }
  }

  /** 下一条（连续录入） */
  const handleNext = () => {
    formData.value = {
      markValue: '',
      markLabel: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
    }
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null
    modalTitle.value = '添加-销票标注'
  }

  // 处理编辑模式下的下一条
  const handleNextEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingId.value) {
        const foundIndex = baseTable.dataList.value.findIndex(item => item.id === editingId.value)
        if (foundIndex >= 0) {
          currentEditIndex.value = foundIndex
        } else {
          message.warning('无法找到当前记录')
          callback?.(false)
          return
        }
      }

      if (currentEditIndex.value < 0) {
        message.warning('无法找到下一条记录')
        callback?.(false)
        return
      }

      const nextIndex = currentEditIndex.value + 1
      let nextRecord: API.MarkConfig_ | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      // 如果下一条记录在当前页
      if (nextIndex < baseTable.dataList.value.length) {
        nextRecord = baseTable.dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        // 如果下一条记录在下一页
        const totalPages = Math.ceil(baseTable.total.value / pageSize)
        const currentPage = baseTable.paginationParams.current

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          // 设置临时序号，避免闪烁
          targetSerialNo.value = (targetPage - 1) * pageSize + 1

          // 加载下一页数据
          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          // 等待数据加载完成后，获取第一条记录
          if (baseTable.dataList.value.length > 0) {
            nextRecord = baseTable.dataList.value[0]
            currentEditIndex.value = 0
            targetSerialNo.value = null // 清除临时序号，使用计算值
          } else {
            targetSerialNo.value = null // 清除临时序号
            message.warning('没有更多记录了')
            modalVisible.value = false
            callback?.(false)
            return
          }
        } else {
          message.warning('已经是最后一条记录了')
          callback?.(false)
          return
        }
      }

      // 更新表单数据
      if (nextRecord) {
        editingId.value = nextRecord.id || null
        formData.value = {
          markValue: nextRecord.markValue || '',
          markLabel: nextRecord.markLabel || '',
          sortOrder: nextRecord.sortOrder || 0,
          isEnabled: nextRecord.isEnabled ?? 1,
          remark: nextRecord.remark || '',
        }
        callback?.(true)
      } else {
        callback?.(false)
      }
    } catch (error: any) {
      console.error('获取下一条记录失败', error)
      message.error('获取下一条记录失败 ' + (error.message || '未知错误'))
      callback?.(false)
    }
  }

  // 处理编辑模式下的上一条
  const handlePrevEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingId.value) {
        const foundIndex = baseTable.dataList.value.findIndex(item => item.id === editingId.value)
        if (foundIndex >= 0) {
          currentEditIndex.value = foundIndex
        } else {
          message.warning('无法找到当前记录')
          callback?.(false)
          return
        }
      }

      if (currentEditIndex.value < 0) {
        message.warning('无法找到上一条记录')
        callback?.(false)
        return
      }

      const prevIndex = currentEditIndex.value - 1
      let prevRecord: API.MarkConfig_ | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      // 如果上一条记录在当前页
      if (prevIndex >= 0) {
        prevRecord = baseTable.dataList.value[prevIndex]
        currentEditIndex.value = prevIndex
      } else {
        // 如果上一条记录在上一页
        const currentPage = baseTable.paginationParams.current

        if (currentPage > 1) {
          const targetPage = currentPage - 1
          // 设置临时序号（预估，假设上一页是满页）
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize

          // 加载上一页数据
          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          if (baseTable.dataList.value.length > 0) {
            // 获取上一页的最后一条记录
            const lastIndex = baseTable.dataList.value.length - 1
            prevRecord = baseTable.dataList.value[lastIndex]
            // 更新为准确的序号
            targetSerialNo.value = (targetPage - 1) * pageSize + lastIndex + 1
            currentEditIndex.value = lastIndex
            targetSerialNo.value = null // 清除临时序号，使用计算值
          } else {
            targetSerialNo.value = null // 清除临时序号
            message.warning('没有更多记录了')
            callback?.(false)
            return
          }
        } else {
          message.warning('已经是第一条记录了')
          callback?.(false)
          return
        }
      }

      // 更新表单数据
      if (prevRecord) {
        editingId.value = prevRecord.id || null
        formData.value = {
          markValue: prevRecord.markValue || '',
          markLabel: prevRecord.markLabel || '',
          sortOrder: prevRecord.sortOrder || 0,
          isEnabled: prevRecord.isEnabled ?? 1,
          remark: prevRecord.remark || '',
        }
        callback?.(true)
      } else {
        callback?.(false)
      }
    } catch (error: any) {
      console.error('获取上一条记录失败', error)
      message.error('获取上一条记录失败 ' + (error.message || '未知错误'))
      callback?.(false)
    }
  }

  /** 删除数据 */
  const doDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该销票标注吗？',
      onOk: async () => {
        try {
          const res = (await deleteMarkUsingPost({ id })) as any
          if (res.data.code === 0) {
            message.success('删除成功')
            await baseTable.fetchData()
          } else {
            message.error('删除失败 ' + (res.data.message || ''))
          }
        } catch (error: any) {
          message.error('删除失败 ' + (error.message || '未知错误'))
        }
      },
    })
  }

  // ==================== 标注列表（用于筛选） ====================

  const markList = ref<API.MarkConfig_[]>([])

  const fetchMarkList = async () => {
    try {
      const res = (await queryMarkPageUsingPost({
        current: 1,
        pageSize: 1000,
      })) as any
      if (res.data.code === 0 && res.data.data) {
        markList.value = res.data.data.records ?? []
      }
    } catch (error) {
      console.error('获取标注列表失败', error)
    }
  }

  // ==================== 初始化 ====================

  /** 初始化页面设置 */
  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('MARK_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('MARK_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('MARK_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 基础表格数据和方法
    ...baseTable,

    // 列相关
    allColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // CRUD
    modalVisible,
    modalTitle,
    formData,
    currentEditSerialNo,
    doAdd,
    doEdit,
    handleSubmit,
    handleNext,
    handleNextEdit,
    handlePrevEdit,
    doDelete,

    // 初始化
    initPageSettings,

    // 标注列表
    markList,
    fetchMarkList,
  }
}

