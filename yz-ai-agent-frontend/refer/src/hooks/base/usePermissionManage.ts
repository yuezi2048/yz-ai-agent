import { ref, computed, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  addPermissionUsingPost,
  updatePermissionUsingPost,
  deletePermissionUsingPost,
  queryPermissionPageUsingPost,
} from '@/api/jichuxinxiguanlijiekou'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { usePermissionTable } from './usePermissionTable'

/**
 * 权限管理完整 Hook
 */
export function usePermissionManage() {
  const baseTable = usePermissionTable()

  /** 所有可用列 */
  const allColumns = ref([
    {
      key: 'serialNo',
      title: '序号',
      dataIndex: 'serialNo',
      width: 56,
      fixed: 'left' as const,
      sorter: false,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1000,
    },
    {
      key: 'permissionName',
      title: '权限名称',
      dataIndex: 'permissionName',
      width: 180,
      fixed: 'left' as const,
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 2600,
    },
    {
      key: 'permissionCode',
      title: '权限代码',
      dataIndex: 'permissionCode',
      width: 160,
      fixed: 'left' as const,
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 2400,
    },
    {
      key: 'sortOrder',
      title: '排列顺序',
      dataIndex: 'sortOrder',
      width: 120,
      fixed: 'left' as const,
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
      fixed: 'right' as const,
      align: 'center' as const,
      minWidth: 80,
      maxWidth: 1200,
    },
  ])

  const defaultSelectedColumns = ['serialNo', 'permissionName', 'permissionCode', 'sortOrder', 'isEnabled', 'remark']

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('PERMISSION_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumns())

  const displayColumns = computed(() => {
    return allColumns.value.filter(col => selectedColumns.value.includes(col.key))
  })

  // 列伸缩
  try {
    localStorage.removeItem('PERMISSION_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'PERMISSION_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // 列设置
  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('PERMISSION_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // CRUD
  const modalVisible = ref(false)
  const modalTitle = ref('添加-权限')
  const editingId = ref<number | null>(null)
  const currentEditIndex = ref<number>(-1)
  const targetSerialNo = ref<number | null>(null)
  const formData = ref<Partial<API.PermissionDTO>>({})

  const currentEditSerialNo = computed(() => {
    if (targetSerialNo.value !== null) {
      return targetSerialNo.value
    }
    if (currentEditIndex.value < 0) {
      return null
    }
    const current = Number(baseTable.paginationParams.current) || 1
    const pageSize = Number(baseTable.paginationParams.pageSize) || 10
    return (current - 1) * pageSize + currentEditIndex.value + 1
  })

  const doAdd = () => {
    modalTitle.value = '添加-权限'
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null
    formData.value = {
      permissionName: '',
      permissionCode: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
    }
    modalVisible.value = true
  }

  const doEdit = (record: API.PermissionItemVO) => {
    modalTitle.value = '修改-权限'
    editingId.value = record.id || null
    targetSerialNo.value = null
    const index = baseTable.dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    formData.value = {
      permissionName: record.permissionName || '',
      permissionCode: record.permissionCode || '',
      sortOrder: record.sortOrder || 0,
      isEnabled: record.isEnabled ?? 1,
      remark: record.remark || '',
    }
    modalVisible.value = true
  }

  const handleSubmit = async (data: API.PermissionDTO, callback?: (success: boolean) => void) => {
    try {
      if (editingId.value) {
        const submitData: API.PermissionUpateDTO = {
          id: editingId.value,
          ...data,
        }
        const res = (await updatePermissionUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          await baseTable.fetchData()
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        const res = (await addPermissionUsingPost(data)) as any
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

  const handleNext = () => {
    formData.value = {
      permissionName: '',
      permissionCode: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
    }
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null
    modalTitle.value = '添加-权限'
  }

  const handleNextEdit = async (callback?: (success: boolean) => void) => {
    try {
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
      let nextRecord: API.PermissionItemVO | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      if (nextIndex < baseTable.dataList.value.length) {
        nextRecord = baseTable.dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        const totalPages = Math.ceil(baseTable.total.value / pageSize)
        const currentPage = baseTable.paginationParams.current

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          targetSerialNo.value = (targetPage - 1) * pageSize + 1

          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()
          await nextTick()

          if (baseTable.dataList.value.length > 0) {
            nextRecord = baseTable.dataList.value[0]
            currentEditIndex.value = 0
            targetSerialNo.value = null
          } else {
            targetSerialNo.value = null
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

      if (nextRecord) {
        editingId.value = nextRecord.id || null
        formData.value = {
          permissionName: nextRecord.permissionName || '',
          permissionCode: nextRecord.permissionCode || '',
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

  const handlePrevEdit = async (callback?: (success: boolean) => void) => {
    try {
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
      let prevRecord: API.PermissionItemVO | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      if (prevIndex >= 0) {
        prevRecord = baseTable.dataList.value[prevIndex]
        currentEditIndex.value = prevIndex
      } else {
        const currentPage = baseTable.paginationParams.current

        if (currentPage > 1) {
          const targetPage = currentPage - 1
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize

          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()
          await nextTick()

          if (baseTable.dataList.value.length > 0) {
            const lastIndex = baseTable.dataList.value.length - 1
            prevRecord = baseTable.dataList.value[lastIndex]
            targetSerialNo.value = (targetPage - 1) * pageSize + lastIndex + 1
            currentEditIndex.value = lastIndex
            targetSerialNo.value = null
          } else {
            targetSerialNo.value = null
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

      if (prevRecord) {
        editingId.value = prevRecord.id || null
        formData.value = {
          permissionName: prevRecord.permissionName || '',
          permissionCode: prevRecord.permissionCode || '',
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

  const doDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该权限吗？',
      onOk: async () => {
        try {
          const res = (await deletePermissionUsingPost({ id })) as any
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

  // 权限列表（用于筛选）
  const permissionList = ref<API.PermissionItemVO[]>([])

  const fetchPermissionList = async () => {
    try {
      const res = (await queryPermissionPageUsingPost({
        current: 1,
        pageSize: 1000,
      })) as any
      if (res.data.code === 0 && res.data.data) {
        // 权限列表字段：permissionItemVOList
        permissionList.value = res.data.data.permissionItemVOList ?? res.data.data.records ?? []
      }
    } catch (error) {
      console.error('获取权限列表失败', error)
    }
  }

  // 初始化
  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('PERMISSION_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('PERMISSION_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('PERMISSION_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      // 设置默认排序：添加日期降序
      if (!baseTable.sortParams.sortField) {
        baseTable.sortParams.sortField = 'createTime'
        baseTable.sortParams.sortOrder = 'desc'
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    ...baseTable,

    allColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,

    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

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

    initPageSettings,

    permissionList,
    fetchPermissionList,
  }
}


