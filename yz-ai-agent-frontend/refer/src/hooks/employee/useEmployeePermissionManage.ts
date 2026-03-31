import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useEmployeeTable } from './useEmployeeTable'

/**
 * 员工权限维护页面 Hook
 * 统一封装：表格列、列设置、分页、查询等逻辑
 */
export function useEmployeePermissionManage() {
  // 使用基础表格 Hook（分页、筛选、排序）
  const baseTable = useEmployeeTable()

  // ==================== 列定义 ====================

  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 80, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'name', title: '姓名', dataIndex: 'name', width: 100, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'employeeNo', title: '工号', dataIndex: 'employeeNo', width: 100, sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'phone', title: '联系电话', dataIndex: 'phone', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1800 },
    { key: 'idCard', title: '身份证号码', dataIndex: 'idCard', width: 180, sorter: true, align: 'center' as const, minWidth: 120, maxWidth: 2000 },
    { key: 'permission', title: '分配权限', dataIndex: 'permission', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1800 },
    { key: 'expiryDate', title: '有效期止', dataIndex: 'expiryDate', width: 110, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1500 },
    { key: 'department', title: '所属部门', dataIndex: 'department', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 2000 },
    { key: 'companyName', title: '公司名称', dataIndex: 'companyName', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = [
    'serialNo',
    'name',
    'employeeNo',
    'phone',
    'idCard',
    'permission',
    'expiryDate',
    'department',
    'companyName',
  ]

  const getStoredColumns = (): string[] => {
    try {
      const stored = sessionStorage.getItem('EMPLOYEE_PERMISSION_PAGE_SELECTED_COLUMNS')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('读取列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumns())

  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  // ==================== 列伸缩 ====================

  try {
    localStorage.removeItem('EMPLOYEE_PERMISSION_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'EMPLOYEE_PERMISSION_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // ==================== 列设置弹窗 ====================

  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('EMPLOYEE_PERMISSION_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 权限显示 ====================

  const getPermissionColor = (permission?: string) => {
    if (permission === '管理员') return 'red'
    if (permission === '财务岗位') return 'blue'
    if (permission === '业务岗位') return 'green'
    return 'default'
  }

  return {
    ...baseTable,
    allColumns,
    selectedColumns,
    displayColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,
    getPermissionColor,
  }
}

