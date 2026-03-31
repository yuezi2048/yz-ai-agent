import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { queryInvoicePageUsingPost } from '@/api/fapiaoxinxiguanli'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { getClientCompanyNamesUsingGet } from '@/api/kehuxinxiguanli'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useAccountsReceivableTable } from './useAccountsReceivableTable'
import { exportJsonToExcel } from '@/utils/exportExcel'

/**
 * 应收账款管理完整 Hook
 * 封装列定义、列设置、筛选辅助、导出等逻辑
 */
export function useAccountsReceivableManage() {
  // 基础表格逻辑：分页 / 筛选 / 排序（已做未到款过滤）
  const baseTable = useAccountsReceivableTable()

  // ==================== 列定义 ====================

  const allColumns = ref([
    { key: 'invoiceNo', title: '发票号码', dataIndex: 'invoiceNo', width: 150, sorter: true, align: 'center' as const, minWidth: 100, maxWidth: 3000 },
    { key: 'issueDate', title: '开票日期', dataIndex: 'issueDate', width: 120, sorter: true, align: 'center' as const, minWidth: 100, maxWidth: 2000 },
    { key: 'clientCompanyName', title: '客户单位', dataIndex: 'clientCompanyName', width: 200, sorter: true, align: 'center' as const, minWidth: 150, maxWidth: 4000 },
    { key: 'clientPerson', title: '客户联系人', dataIndex: 'clientPerson', width: 150, sorter: true, align: 'center' as const, minWidth: 100, maxWidth: 2500 },
    { key: 'amount', title: '金额', dataIndex: 'amount', width: 120, sorter: true, align: 'center' as const, minWidth: 100, maxWidth: 2000 },
    { key: 'issuerCompanyName', title: '开票单位', dataIndex: 'issuerCompanyName', width: 200, sorter: true, align: 'center' as const, minWidth: 150, maxWidth: 4000 },
    { key: 'createTime', title: '添加日期', dataIndex: 'createTime', width: 172, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
  ])

  const defaultSelectedColumns = ['invoiceNo', 'issueDate', 'clientCompanyName', 'clientPerson', 'amount', 'issuerCompanyName']

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('ACCOUNTS_RECEIVABLE_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumns())

  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  // ==================== 列伸缩 ====================

  try {
    localStorage.removeItem('ACCOUNTS_RECEIVABLE_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'ACCOUNTS_RECEIVABLE_PAGE_TABLE_COLUMN_WIDTHS',
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
      sessionStorage.setItem('ACCOUNTS_RECEIVABLE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 公司/客户列表 ====================

  const companyList = ref<API.Company[]>([])
  const clientList = ref<API.Client_[]>([])

  const fetchCompanyList = async () => {
    try {
      const res = (await getAllCompanyIdNameUsingGet()) as any
      if (res.data.code === 0 && Array.isArray(res.data.data)) {
        companyList.value = res.data.data.map((item: any) => ({
          id: item.id,
          companyName: item.companyName,
        })) as API.Company[]
      } else {
        companyList.value = []
      }
    } catch (error) {
      console.error('获取公司列表失败', error)
      companyList.value = []
    }
  }

  const fetchClientList = async () => {
    try {
      // 使用新接口获取客户公司名称列表（更轻量级，无数据丢失风险）
      const res = await getClientCompanyNamesUsingGet()
      if (res?.data?.code === 0 && res?.data?.data) {
        const names: string[] = Array.isArray(res.data.data) ? res.data.data : Array.from(res.data.data as any)
        // 转换为 Client_ 格式以保持兼容性（只包含公司名称）
        clientList.value = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n))).map((companyName) => ({
          companyName,
        })) as API.Client_[]
      } else {
        clientList.value = []
      }
    } catch (error) {
      console.error('获取客户列表失败', error)
      clientList.value = []
    }
  }

  // ==================== 客户单位筛选（供 FilterBar 使用） ====================

  let clientCompanyChangeTimer: any = null

  const handleClientCompanySelect = (value: string) => {
    // 自动填充选中时，直接写入搜索参数并重新查询
    (baseTable.searchParams as any).clientCompanyName = value || ''
    baseTable.doSearch()
  }

  const handleClientCompanyChange = (value: string) => {
    clearTimeout(clientCompanyChangeTimer)
    clientCompanyChangeTimer = setTimeout(() => {
      // 文本变更时，同步更新搜索参数；为空字符串则清空过滤条件
      ;(baseTable.searchParams as any).clientCompanyName = value || ''
      baseTable.doSearch()
    }, 500)
  }

  // ==================== 开票单位多选模态框 ====================

  const showIssuerCompanyModal = ref(false)

  const handleIssuerCompanyModalOk = (selectedCompanyIds: number[]) => {
    baseTable.searchParams.issuerCompanyIds = selectedCompanyIds
    baseTable.doSearch()
  }

  // ==================== 联系人信息弹窗 ====================

  const contactInfoModalVisible = ref(false)
  const currentContactInfo = ref<API.InvoiceItem | null>(null)

  const handleShowContactInfo = (record: API.InvoiceItem) => {
    currentContactInfo.value = record
    contactInfoModalVisible.value = true
  }

  // ==================== 导出 ====================

  // 导出排序弹窗
  const exportModalVisible = ref(false)
  const openExportModal = () => {
    exportModalVisible.value = true
  }

  const handleExport = async (
    sortField?: string, 
    sortOrder?: 'asc' | 'desc',
    abortSignal?: AbortSignal,
    onProgress?: (progress: number, statusText: string) => void,
    onComplete?: (recordCount: number) => void,
    onCancel?: () => void
  ) => {
    try {
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      const params: any = {}
      const sp = baseTable.searchParams as {
        startDate?: Dayjs | string | null
        endDate?: Dayjs | string | null
        issuerCompanyIds?: number[]
        clientCompanyName?: string
      }

      // 使用 dayjs() 包裹后再调用 format，兼容 Dayjs 对象、Date 对象和字符串
      if (sp.startDate) {
        params.startDate = dayjs(sp.startDate).format('YYYY-MM-DD')
      }
      if (sp.endDate) {
        params.endDate = dayjs(sp.endDate).format('YYYY-MM-DD')
      }
      if (sp.issuerCompanyIds && sp.issuerCompanyIds.length > 0) {
        const selectedCompanies = companyList.value.filter(
          (c) => c.id && sp.issuerCompanyIds!.includes(c.id),
        )
        params.issuerCompanyNames = selectedCompanies
          .map((c) => c.companyName || '')
          .filter(Boolean)
      }
      if (sp.clientCompanyName && sp.clientCompanyName !== '') {
        params.clientCompanyName = sp.clientCompanyName
      }

      // 导出也统一按应收账款逻辑，从后端直接过滤应收数据
      params.isOwed = true

      onProgress?.(5, '正在获取数据总数...')

      // 先获取第一页以确定总数
      const finalSortField = sortField || baseTable.sortParams.sortField
      const finalSortOrder = sortOrder || baseTable.sortParams.sortOrder
      const firstPageParams: any = { ...params, current: 1, pageSize: 100 }
      if (finalSortField) {
        firstPageParams.sortField = finalSortField
        firstPageParams.sortOrder = finalSortOrder
      }
      const firstPageRes = (await queryInvoicePageUsingPost(firstPageParams)) as any
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      if (firstPageRes.data.code !== 0) {
        message.error('获取数据失败')
        onCancel?.()
        return
      }

      const total = firstPageRes.data.data?.total || 0
      const totalPages = firstPageRes.data.data?.pages ?? 1
      const allData: API.InvoiceItem[] = [...(firstPageRes.data.data?.records ?? [])]

      onProgress?.(10, `共 ${total} 条记录，正在获取数据...`)

      let current = 2
      let hasMore = current <= totalPages

      while (hasMore) {
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        const pageParams: any = { ...params, current, pageSize: 100 }
        if (finalSortField) {
          pageParams.sortField = finalSortField
          pageParams.sortOrder = finalSortOrder
        }
        const res = (await queryInvoicePageUsingPost(pageParams)) as any
        
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        if (res.data.code !== 0) {
          message.error('获取数据失败')
          onCancel?.()
          return
        }

        const records = res.data.data?.records ?? []
        allData.push(...records)

        hasMore = current < totalPages
        current++
        
        // 更新进度：10% - 98%（最后一页时达到98%）
        const progress = 10 + Math.floor((current - 1) / totalPages * 88)
        onProgress?.(Math.min(progress, 98), `正在获取数据 ${current - 1}/${totalPages} 页...`)
      }

      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      onProgress?.(99, '正在处理数据...')

      const exportData = allData.map((item: API.InvoiceItem) => ({
        发票号码: item.invoiceNo,
        开票日期: item.issueDate ? dayjs(item.issueDate as any).format('YYYY-MM-DD') : '',
        客户单位: item.clientCompanyName || '',
        客户联系人: item.clientPerson || '',
        金额: item.amount,
        开票单位: item.issuerCompanyName || '',
      }))

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'invoiceNo': '发票号码',
            'issueDate': '开票日期',
            'clientCompanyName': '客户单位',
            'clientPerson': '客户联系人',
            'amount': '金额',
            'issuerCompanyName': '开票单位',
          }
          const exportKey = keyMap[col.dataIndex] || col.dataIndex
          return {
            key: exportKey,
            width: col.width || 120,
            align: col.align || 'center',
          }
        })

      // 生成 Excel 文件时直接到 100%，由 exportJsonToExcel 内部处理

      const fileName = `应收账款_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '应收账款', 
          data: exportData,
          columns: exportColumns
        }], 
        fileName, 
        onProgress,
        abortSignal,
        false
      )
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }
      
      onComplete?.(recordCount || allData.length)
    } catch (error: any) {
      // 如果是取消操作，不显示错误提示
      if (error?.message === '导出已取消' || abortSignal?.aborted) {
        onCancel?.()
        return
      }
      console.error('导出失败', error)
      message.error('导出失败')
      onProgress?.(0, '导出失败')
      onCancel?.()
    }
  }

  // ==================== 初始化 ====================

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('ACCOUNTS_RECEIVABLE_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('ACCOUNTS_RECEIVABLE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('ACCOUNTS_RECEIVABLE_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      // 设置默认日期为当前月份
      const baseTableSearchParams = baseTable.searchParams as { startDate?: Dayjs | null; endDate?: Dayjs | null }
      if (!baseTableSearchParams.startDate && !baseTableSearchParams.endDate) {
        baseTableSearchParams.startDate = dayjs().startOf('month')
        baseTableSearchParams.endDate = dayjs()
      }
      // 设置默认排序：开票日期降序
      if (!baseTable.sortParams.sortField) {
        baseTable.sortParams.sortField = 'issueDate'
        baseTable.sortParams.sortOrder = 'desc'
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 基础表格
    ...baseTable,

    // 列相关
    allColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    // 复用通用表格的滚动高度计算，保证与销项发票等页面风格一致
    tableScrollHeight: baseTable.tableScrollHeight,
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 公司/客户列表
    companyList,
    clientList,
    fetchCompanyList,
    fetchClientList,

    // 客户单位选择
    handleClientCompanySelect,
    handleClientCompanyChange,

    // 开票单位模态框
    showIssuerCompanyModal,
    handleIssuerCompanyModalOk,

    // 联系人信息弹窗
    contactInfoModalVisible,
    currentContactInfo,
    handleShowContactInfo,

    // 导出
    handleExport,
    exportModalVisible,
    openExportModal,

    // 初始化
    initPageSettings,
  }
}


