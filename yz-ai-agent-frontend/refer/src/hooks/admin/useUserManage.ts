import { computed, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { deleteEmployeeUsingPost } from '@/api/yuangongguanlijiekou'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useUserTable } from './useUserTable'

/**
 * 用户管理页面 Hook
 * 统一封装：表格列、列设置、分页、查询、删除等逻辑
 */
export function useUserManage() {
  // 基础表格：数据 / 分页 / 查询
  const baseTable = useUserTable()
  const {
    loading,
    dataListWithSerial,
    pagination,
    handlePageChange,
    handlePageSizeChange,
    searchParams,
    fetchData,
    handleTableChange,
    doSearch,
    doReset,
  } = baseTable

  // 列定义
  const allColumns = ref([
    { key: 'id', title: 'id', dataIndex: 'id', width: 80, sorter: true, align: 'center' as const, minWidth: 40, maxWidth: 1000 },
    { key: 'employeeNo', title: '工号', dataIndex: 'employeeNo', width: 100, sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'name', title: '姓名', dataIndex: 'name', width: 100, sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'companyName', title: '公司名称', dataIndex: 'companyName', width: 150, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 2500 },
    { key: 'department', title: '部门', dataIndex: 'department', width: 120, sorter: true, align: 'center' as const, minWidth: 70, maxWidth: 2000 },
    { key: 'position', title: '岗位', dataIndex: 'position', width: 120, sorter: true, align: 'center' as const, minWidth: 70, maxWidth: 2000 },
    { key: 'permission', title: '权限', dataIndex: 'permission', width: 120, sorter: true, align: 'center' as const, minWidth: 70, maxWidth: 2000 },
    { key: 'createTime', title: '创建时间', dataIndex: 'createTime', width: 160, sorter: true, align: 'center' as const, minWidth: 110, maxWidth: 2500 },
    { key: 'updateTime', title: '更新时间', dataIndex: 'updateTime', sorter: true, align: 'center' as const },
    { key: 'action', title: '操作', width: 150, fixed: 'right', align: 'center' as const },
  ])

  const defaultSelectedColumns = [
    'id',
    'employeeNo',
    'name',
    'companyName',
    'department',
    'position',
    'permission',
    'createTime',
    'updateTime',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('USER_MANAGE_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumns())

  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  try {
    localStorage.removeItem('USER_MANAGE_PAGE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'USER_MANAGE_PAGE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // 列设置弹窗
  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('USER_MANAGE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // 删除用户
  const handleDelete = async (id: number | string) => {
    if (!id) return
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该员工吗？',
      async onOk() {
        const res = (await deleteEmployeeUsingPost({ id: Number(id) })) as any
        if (res.data.code === 0) {
          message.success('删除成功')
          await fetchData()
        } else {
          message.error('删除失败，' + (res.data.message || ''))
        }
      },
    })
  }

  // 初始化页面默认配置（列选择 & 列宽）
  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('USER_MANAGE_PAGE_SELECTED_COLUMNS')
      localStorage.removeItem('USER_MANAGE_PAGE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 表格基础
    loading,
    dataListWithSerial,
    pagination,
    handlePageChange,
    handlePageSizeChange,
    searchParams,
    fetchData,
    handleTableChange,
    doSearch,
    doReset,

    // 列
    allColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    tableScrollHeight: baseTable.tableScrollHeight,
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 操作
    handleDelete,

    // 初始化
    initPageSettings,
  }
}


