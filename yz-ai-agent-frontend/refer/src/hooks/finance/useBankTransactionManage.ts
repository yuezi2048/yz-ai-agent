import { ref, reactive, computed, nextTick, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getLoginUserUsingGet } from '@/api/yuangongguanlijiekou'
import { h } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { exportJsonToExcel } from '@/utils/exportExcel'
import {
  listTransactionByPageUsingPost,
  addBankTransactionUsingPost,
  updateBankTransactionUsingPost,
  deleteBankTransactionUsingPost,
  queryBankTransactionWithInvoicesUsingPost,
  queryBankTransactionWithremainAmountUsingPost,
} from '@/api/caiwuguanlijiekou'
import { getByIdUsingPost, queryInvoicePageUsingPost, addPaymentUsingPost } from '@/api/fapiaoxinxiguanli'
import { listInvoiceFinishPageUsingPost } from '@/api/daokuanxinxiguanli'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { listClientByPageUsingPost, getClientByIdUsingGet, getClientCompanyNamesUsingGet, getUserNameByCompanyNameUsingPost } from '@/api/kehuxinxiguanli'
import { banktrascationUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import { queryTransferMethodPageUsingPost } from '@/api/jichuxinxiguanlijiekou'
import myAxios from '@/request'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useFilterCollapse } from '@/composables/useFilterCollapse'
import { useBankTransactionTable } from './useBankTransactionTable'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

/**
 * 银行收支明细管理完整 Hook
 * 封装筛选、表格列、导入导出、编辑弹窗、查看发票等逻辑
 */
export function useBankTransactionManage() {
  const DEFAULT_COMPANY_NAME = '西安九华云信息科技有限公司'
  // 基础表格：分页 / 筛选 / 排序
  const baseTable = useBankTransactionTable()

  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'BANK_TRANSACTION_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        issuerCompanyIds?: number[]
        clientCompanyName?: string
        salespersonName?: string
        userName?: string
        invoiceNo?: string
        startDate?: string | null
        endDate?: string | null
        amount?: number | null
        includePositive?: boolean
        includeNegative?: boolean
      }
      return parsed
    } catch (error) {
      console.error('加载银行收支筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    issuerCompanyIds: number[]
    clientCompanyName?: string
    salespersonName?: string
    userName?: string
    invoiceNo?: string
    startDate: Dayjs | string | null
    endDate: Dayjs | string | null
    amount: number | null
    includePositive: boolean
    includeNegative: boolean
  }) => {
    try {
      const payload = {
        ...params,
        startDate: params.startDate
          ? dayjs(params.startDate as any).toISOString()
          : null,
        endDate: params.endDate
          ? dayjs(params.endDate as any).toISOString()
          : null,
      }
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.error('保存银行收支筛选条件失败', error)
    }
  }

  // ==================== 筛选折叠 ====================

  try {
    sessionStorage.removeItem('BANK_TRANSACTION_PAGE_FILTER_COLLAPSED')
  } catch (error) {
    console.error('清除筛选框状态失败', error)
  }
  const { filterCollapsed, filterCollapseKey } = useFilterCollapse('BANK_TRANSACTION_PAGE_FILTER_COLLAPSED', false)

  const handleFilterCollapseChange = (keys: string[] | string) => {
    const arr = Array.isArray(keys) ? keys : [keys]
    filterCollapsed.value = !arr.includes('filter')
  }

  const handleFilterCollapseToggle = () => {
    const willCollapse = !filterCollapsed.value
    filterCollapsed.value = willCollapse
    filterCollapseKey.value = willCollapse ? [] : ['filter']
  }

  // ==================== 搜索条件 & 日期范围 ====================

  const searchParams = baseTable.searchParams as {
    issuerCompanyIds: number[]
    clientCompanyName?: string
    salespersonName?: string
    userName?: string
    invoiceNo?: string
    startDate?: Dayjs | string | null
    endDate?: Dayjs | string | null
    minAmount?: number
    maxAmount?: number
    includePositive?: boolean
    includeNegative?: boolean
  }

  // 优先从本地存储恢复筛选条件
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (Array.isArray(storedParams.issuerCompanyIds)) {
      searchParams.issuerCompanyIds = storedParams.issuerCompanyIds as any
    }
    if (typeof storedParams.clientCompanyName === 'string') {
      searchParams.clientCompanyName = storedParams.clientCompanyName
    }
    if (typeof storedParams.salespersonName === 'string') {
      searchParams.salespersonName = storedParams.salespersonName
    }
    if (typeof storedParams.userName === 'string') {
      searchParams.userName = storedParams.userName
    }
    if (typeof storedParams.invoiceNo === 'string') {
      searchParams.invoiceNo = storedParams.invoiceNo
    }
    if (storedParams.startDate) {
      searchParams.startDate = dayjs(storedParams.startDate)
    }
    if (storedParams.endDate) {
      searchParams.endDate = dayjs(storedParams.endDate)
    }
    if (
      typeof storedParams.amount === 'number' ||
      storedParams.amount === null
    ) {
      const v = storedParams.amount as number | null
      ;(searchParams.minAmount as any) = v ?? undefined
      ;(searchParams.maxAmount as any) = v ?? undefined
    }
    if (typeof storedParams.includePositive === 'boolean') {
      searchParams.includePositive = storedParams.includePositive
    }
    if (typeof storedParams.includeNegative === 'boolean') {
      searchParams.includeNegative = storedParams.includeNegative
    }
  }

  // 默认收付类型全选：收（正）和支（负）都勾选
  if (searchParams.includePositive === undefined) {
    searchParams.includePositive = true
  }
  if (searchParams.includeNegative === undefined) {
    searchParams.includeNegative = true
  }

  // 监听筛选条件变化，自动持久化
  watch(
    () => ({
      issuerCompanyIds: searchParams.issuerCompanyIds || [],
      clientCompanyName: searchParams.clientCompanyName || '',
      salespersonName: searchParams.salespersonName || '',
      userName: searchParams.userName || '',
      invoiceNo: searchParams.invoiceNo || '',
      startDate: searchParams.startDate || null,
      endDate: searchParams.endDate || null,
      amount:
        typeof searchParams.minAmount === 'number' &&
        typeof searchParams.maxAmount === 'number' &&
        searchParams.minAmount === searchParams.maxAmount
          ? (searchParams.minAmount as number)
          : null,
      includePositive: !!searchParams.includePositive,
      includeNegative: !!searchParams.includeNegative,
    }),
    (val) => {
      saveSearchParamsToStorage(val)
    },
    { deep: true }
  )

  // ==================== 公司列表 & 选中公司文本 ====================

  const companyList = ref<API.Company[]>([])

  const selectedCompanyNamesText = computed(() => {
    if (!searchParams.issuerCompanyIds || searchParams.issuerCompanyIds.length === 0) {
      return ''
    }
    const selectedCompanies = companyList.value.filter((company: API.Company) =>
      company.id && searchParams.issuerCompanyIds.includes(company.id),
    )
    return selectedCompanies.map((c: API.Company) => c.companyName || '').join(', ')
  })

  const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
    const estimatedWidth = text.length * 14 + 40
    return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
  }

  const companySelectButtonWidth = computed(() => {
    const placeholder = '请选择公司名称'
    if (selectedCompanyNamesText.value) {
      const contentWidth = calculateTextWidth(selectedCompanyNamesText.value, 120, 180)
      const placeholderWidth = calculateTextWidth(placeholder, 120)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 120)
  })

  // ==================== 客户列表（筛选区） ====================

  const clientListForFilter = ref<API.Client_[]>([])

  // 客户单位选项（基础选项，不包含"全部"）
  const baseClientCompanyOptions = ref<Array<{ value: string; label: string }>>([])

  const fetchClientCompanyOptions = async () => {
    try {
      const res = await getClientCompanyNamesUsingGet()
      if (res?.data?.code === 0 && res?.data?.data) {
        const names: string[] = Array.isArray(res.data.data) ? res.data.data : Array.from(res.data.data as any)
        baseClientCompanyOptions.value = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n))).map((n) => ({
          value: n,
          label: n,
        }))
      } else {
        baseClientCompanyOptions.value = []
      }
    } catch (error) {
      console.error('获取客户单位列表失败', error)
      baseClientCompanyOptions.value = []
    }
  }

  // 客户单位自动填充框（使用通用 composable）
  const clientCompanyAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseClientCompanyOptions,
    currentValue: computed(() => searchParams.clientCompanyName || ''),
    enableAutoAdd: true,
  })

  // 客户单位选项（包含"全部"选项）
  const clientCompanyOptions = computed(() => {
    return [{ value: '', label: '全部' }, ...clientCompanyAutoComplete.filteredOptions.value]
  })

  const clientCompanyWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入客户名称', 120)
    if (clientCompanyOptions.value.length > 0) {
      clientCompanyOptions.value.forEach((option: any) => {
        const text = option.label || option.value || ''
        const width = calculateTextWidth(text, 120)
        if (width > maxWidth) {
          maxWidth = width
        }
      })
    }
    return maxWidth
  })

  const paginationParams = baseTable.paginationParams

  // ==================== 客户姓名列表 ====================
  
  const clientContactNameList = ref<string[]>([])

  // 获取客户姓名列表
  const fetchClientContactNameList = async (companyName: string) => {
    const name = (companyName || '').trim()
    if (!name) {
      clientContactNameList.value = []
      return
    }

    try {
      const res = (await getUserNameByCompanyNameUsingPost({ companyName: name } as any)) as any
      if (res?.data?.code === 0 && res?.data?.data) {
        const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
        const names = rows.map((r) => (r?.userName || '').trim()).filter((n) => !!n)
        clientContactNameList.value = Array.from(new Set(names))
      } else {
        clientContactNameList.value = []
      }
    } catch (error) {
      console.error('获取客户姓名列表失败', error)
      clientContactNameList.value = []
    }
  }

  // 客户姓名自动完成选项
  const clientContactOptions = computed(() => {
    return clientContactNameList.value.map((name) => ({
      value: name,
      label: name,
    }))
  })

  // 客户姓名自动填充框（使用通用 composable）
  const clientContactAutoComplete = useAutoCompleteWithExtra({
    baseOptions: clientContactOptions,
    currentValue: computed(() => searchParams.userName || ''),
    enableAutoAdd: true,
  })

  // 过滤后的客户姓名选项
  const filteredClientContactOptions = clientContactAutoComplete.filteredOptions

  const clientContactWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入客户姓名', 120)
    filteredClientContactOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    return maxWidth
  })

  const handleClientCompanySelect = async (value: string) => {
    if (value === '') {
      searchParams.clientCompanyName = ''
      clientContactNameList.value = []
      searchParams.userName = ''
    } else {
      // 当选择客户单位后，自动获取客户姓名列表
      await fetchClientContactNameList(value)
    }
    paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleClientCompanyChange = async (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    clientCompanyAutoComplete.handleChange(value)
    
    // 如果输入的是已存在的客户单位，获取客户姓名列表
    if (value) {
      const exists = clientCompanyOptions.value.some((opt: any) => opt.value === value)
      if (exists) {
        await fetchClientContactNameList(value)
      } else {
        // 如果输入的是新值，清空客户姓名列表
        clientContactNameList.value = []
        searchParams.userName = ''
      }
    } else {
      clientContactNameList.value = []
      searchParams.userName = ''
    }
    
    clearTimeout((handleClientCompanyChange as any).timer)
    ;(handleClientCompanyChange as any).timer = setTimeout(() => {
      searchParams.clientCompanyName = value || ''
      paginationParams.current = 1
      baseTable.fetchData()
    }, 500)
  }

  const handleClientContactSelect = (value: string) => {
    searchParams.userName = value
    paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleClientContactChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    clientContactAutoComplete.handleChange(value)
    searchParams.userName = value
    paginationParams.current = 1
    baseTable.fetchData()
  }

  // ==================== 表格列 & 列设置 ====================

  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'uniqueKey', title: '到账编号', dataIndex: 'uniqueKey', width: 140, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'arrivalTime', title: '到账日期', dataIndex: 'arrivalTime', width: 140, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'amount', title: '到账金额', dataIndex: 'amount', width: 154, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'balance', title: '余额', dataIndex: 'balance', width: 154, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'clientCompanyName', title: '客户单位', dataIndex: 'clientCompanyName', width: 280, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 5000 },
    { key: 'userName', title: '客户姓名', dataIndex: 'userName', width: 112, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'remark2', title: '客户账号', dataIndex: 'remark2', width: 140, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'salespersonName', title: '业务经理', dataIndex: 'salespersonName', width: 112, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'companyName', title: '公司名称', dataIndex: 'companyName', width: 280, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 5000 },
    { key: 'remark3', title: '公司账号', dataIndex: 'remark3', width: 280, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 5000 },
    { key: 'remark1', title: '备注', dataIndex: 'remark1', width: 200, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 5000 },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = ['serialNo', 'uniqueKey', 'arrivalTime', 'amount', 'balance', 'clientCompanyName', 'userName', 'salespersonName', 'remark3']

  const getStoredColumnsTable = (): string[] => {
    try {
      sessionStorage.removeItem('BANK_TRANSACTION_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumnsTable())

  const customizableColumns = computed(() => allColumns.value)

  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  try {
    localStorage.removeItem('BANK_TRANSACTION_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'BANK_TRANSACTION_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)

  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('BANK_TRANSACTION_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 数据 & 导出 ====================

  const dataList = ref<API.BankTransaction_[]>([])
  const total = ref<number>(0)

  const dataListWithSerial = computed(() => {
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10

    return dataList.value.map((item, index) => {
      const newItem = { ...item, serialNo: (current - 1) * pageSize + index + 1 } as API.BankTransaction_ & { serialNo: number }
      return newItem
    })
  })

  // 表格行数（基于自定义的 dataListWithSerial）
  const tableRowCount = computed(() => dataListWithSerial.value.length)

  /**
   * 表格滚动高度（动态计算，如果行数大于10行才显示滚动条）
   * 每行高度计算：padding上下各8px + line-height(12px * 1.5 = 18px) + 边框约1px = 约39px
   * scroll.y 设置的是表格 body 部分的最大高度，不包括表头
   */
  const tableScrollHeight = computed(() => {
    const rowHeight = 39 // 每行高度（padding: 8px上下 + line-height: 18px + 边框约1px + 间距约2px）
    const maxRows = 10 // 银行收支主表默认展示 10 行，超出时出现滚动

    if (tableRowCount.value <= maxRows) {
      // 行数不超过 10 行时，不启用纵向滚动
      return undefined
    }
    return maxRows * rowHeight
  })

  const sortParams = baseTable.sortParams as {
    sortField?: string
    sortOrder?: 'asc' | 'desc'
  }

  const fetchData = async () => {
    try {
      const params: API.TransactionPageDTO = {
        current: paginationParams.current,
        pageSize: paginationParams.pageSize,
      }
      // 公司名称：直接传入 companyIds，和银行收支查询接口保持一致
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        ;(params as any).companyIds = searchParams.issuerCompanyIds
      }
      if (searchParams.clientCompanyName) {
        params.clientCompanyName = searchParams.clientCompanyName
      }
      if (searchParams.salespersonName) {
        params.salespersonName = searchParams.salespersonName
      }
      if (searchParams.userName) {
        params.userName = searchParams.userName
      }
      if (searchParams.invoiceNo) {
        params.invoiceNo = searchParams.invoiceNo
      }
      // 收付金额筛选：传入 amount 参数
      if (typeof searchParams.minAmount === 'number' && typeof searchParams.maxAmount === 'number' && searchParams.minAmount === searchParams.maxAmount) {
        // 单值金额筛选：传入 amount 参数
        params.amount = searchParams.minAmount
      } else {
        // 范围金额筛选：传入 minAmount / maxAmount
        const hasMinAmount = typeof searchParams.minAmount === 'number'
        const hasMaxAmount = typeof searchParams.maxAmount === 'number'
        if (hasMinAmount) {
          ;(params as any).minAmount = searchParams.minAmount as number
        }
        if (hasMaxAmount) {
          ;(params as any).maxAmount = searchParams.maxAmount as number
        }
      }
      // 收付类型：选中"收（正）" => minAmount = 0；选中"支（负）" => maxAmount = -0.001
      if (searchParams.includePositive && !searchParams.includeNegative) {
        ;(params as any).minAmount = 0
      } else if (!searchParams.includePositive && searchParams.includeNegative) {
        ;(params as any).maxAmount = -0.001
      }
      if (searchParams.startDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.startTime = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.endTime = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      if (sortParams.sortField) {
        params.sortField = sortParams.sortField
        params.sortOrder = sortParams.sortOrder
      }

      const res = (await listTransactionByPageUsingPost(params)) as any
      if (res.data.code === 0 && res.data.data) {
        const records = res.data.data.records ?? []
        dataList.value = records.map((r: any, idx: number) => {
          const name = r.clientPerson 
          return {
            ...r,
            userName: name,
            clientPerson: r.clientPerson || name,
            serialNo: (paginationParams.current - 1) * paginationParams.pageSize + idx + 1,
          }
        })
        total.value = res.data.data.total ?? 0
        // 同步更新 baseTable 的 total，确保分页组件能正确显示总条数
        baseTable.total.value = total.value
      } else {
        message.error('获取数据失败 ' + (res.data.message || ''))
        baseTable.total.value = 0
      }
    } catch (error) {
      message.error('获取数据失败')
      dataList.value = []
      total.value = 0
      // 同步更新 baseTable 的 total
      baseTable.total.value = 0
    }
  }

  const handlePageChange = (page: number) => {
    paginationParams.current = page
    fetchData()
  }

  const handlePageSizeChange = (size: number) => {
    paginationParams.pageSize = size
    paginationParams.current = 1
    fetchData()
  }

  const doTableChange = (pagination: any, filters: any, sorter: any) => {
    if (pagination && typeof pagination.current === 'number') {
      paginationParams.current = pagination.current
    }
    if (pagination && typeof pagination.pageSize === 'number') {
      paginationParams.pageSize = pagination.pageSize
    }
    if (sorter && sorter.field && sorter.order) {
      sortParams.sortField = sorter.field
      sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
    } else {
      // 取消排序时，完全清除排序参数
      delete sortParams.sortField
      delete sortParams.sortOrder
    }
    fetchData()
  }

  const doSearch = () => {
    paginationParams.current = 1
    fetchData()
  }

  const doReset = () => {
    searchParams.issuerCompanyIds = []
    searchParams.clientCompanyName = ''
    searchParams.salespersonName = ''
    searchParams.userName = ''
    searchParams.invoiceNo = ''
    searchParams.startDate = null
    searchParams.endDate = null
    searchParams.minAmount = undefined as any
    searchParams.maxAmount = undefined as any
    // 重置后仍保持收付类型全选
    searchParams.includePositive = true
    searchParams.includeNegative = true
    paginationParams.current = 1
    fetchData()
  }

  // 单值收付金额筛选：同时设置最小值和最大值为同一金额
  const handleAmountChange = (value: number | null) => {
    if (value === null || value === undefined) {
      searchParams.minAmount = undefined as any
      searchParams.maxAmount = undefined as any
    } else {
      searchParams.minAmount = value as any
      searchParams.maxAmount = value as any
    }
    paginationParams.current = 1
    fetchData()
  }

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

      const baseParams: API.TransactionPageDTO = {
        pageSize: 100,
      }
      // 公司名称：导出时同样传入 companyIds
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        ;(baseParams as any).companyIds = searchParams.issuerCompanyIds
      }
      if (searchParams.clientCompanyName) {
        baseParams.clientCompanyName = searchParams.clientCompanyName
      }
      if (searchParams.salespersonName) {
        baseParams.salespersonName = searchParams.salespersonName
      }
      if (searchParams.userName) {
        baseParams.userName = searchParams.userName
      }
      if (searchParams.invoiceNo) {
        baseParams.invoiceNo = searchParams.invoiceNo
      }
      // 收付金额筛选：传入 amount 参数（与列表查询逻辑一致）
      if (typeof searchParams.minAmount === 'number' && typeof searchParams.maxAmount === 'number' && searchParams.minAmount === searchParams.maxAmount) {
        // 单值金额筛选：传入 amount 参数
        baseParams.amount = searchParams.minAmount
      } else {
        // 范围金额筛选：传入 minAmount / maxAmount
        const hasMinAmount = typeof searchParams.minAmount === 'number'
        const hasMaxAmount = typeof searchParams.maxAmount === 'number'
        if (hasMinAmount) {
          ;(baseParams as any).minAmount = searchParams.minAmount as number
        }
        if (hasMaxAmount) {
          ;(baseParams as any).maxAmount = searchParams.maxAmount as number
        }
      }
      // 收付类型：与列表查询保持一致
      if (searchParams.includePositive && !searchParams.includeNegative) {
        ;(baseParams as any).minAmount = 0
      } else if (!searchParams.includePositive && searchParams.includeNegative) {
        ;(baseParams as any).maxAmount = -0.001
      }
      if (searchParams.startDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        baseParams.startTime = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        baseParams.endTime = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      // 排序：优先使用弹窗选择；否则使用当前表格排序
      const finalSortField = sortField || sortParams.sortField
      const finalSortOrder = sortOrder || sortParams.sortOrder
      if (finalSortField && typeof finalSortField === 'string' && finalSortField.trim() !== '') {
        baseParams.sortField = finalSortField
        baseParams.sortOrder = finalSortOrder
      }

      onProgress?.(5, '正在获取数据总数...')

      // 先获取第一页以确定总数
      const firstPageParams = { ...baseParams, current: 1 }
      const firstPageRes = (await listTransactionByPageUsingPost(firstPageParams)) as any
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      if (firstPageRes.data.code !== 0 || !firstPageRes.data.data) {
        message.error('获取数据失败 ' + (firstPageRes.data.message || ''))
        onCancel?.()
        return
      }

      const total = firstPageRes.data.data.total ?? 0
      const totalPages = firstPageRes.data.data.pages ?? 1
      const allData: API.BankTransaction_[] = [...(firstPageRes.data.data.records ?? [])]

      onProgress?.(10, `共 ${total} 条记录，正在获取数据...`)

      let current = 2
      let hasMore = current <= totalPages

      while (hasMore) {
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        const params = { ...baseParams, current }
        const res = (await listTransactionByPageUsingPost(params)) as any
        
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        if (res.data.code !== 0 || !res.data.data) {
          message.error('获取数据失败 ' + (res.data.message || ''))
          onCancel?.()
          return
        }
        const records = res.data.data.records ?? []
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

      const exportData = allData.map((item: API.BankTransaction_) => ({
        公司名称: item.companyName,
        公司账号: item.remark3 || '',
        客户单位: item.clientCompanyName,
        业务员: item.salespersonName || '',
        到账时间: item.arrivalTime ? dayjs(item.arrivalTime as any).format('YYYY-MM-DD') : '',
        到款金额: item.amount,
        关联发票号码: item.invoiceNo || '',
        备注1: item.remark1 || '',
      }))

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'companyName': '公司名称',
            'remark3': '公司账号',
            'clientCompanyName': '客户单位',
            'salespersonName': '业务员',
            'arrivalTime': '到账时间',
            'amount': '到款金额',
            'invoiceNo': '关联发票号码',
            'remark1': '备注1',
          }
          const exportKey = keyMap[col.dataIndex] || col.dataIndex
          return {
            key: exportKey,
            width: col.width || 120,
            align: col.align || 'center',
          }
        })

      // 生成 Excel 文件时直接到 100%，由 exportJsonToExcel 内部处理

      const fileName = `银行收支明细_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '银行收支明细', 
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

  // ==================== 导入 ====================

  const importModalVisible = ref(false)

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await banktrascationUploadUsingPost({ overwrite }, {}, file)) as any
    if (res.data.code === 0 && res.data.data) {
      const result: API.ExcelImportResultVO = res.data.data
      message.success(
        `导入成功：共 ${result.totalCount || 0} 条，成功 ${result.successCount || 0} 条，失败 ${result.failCount || 0} 条`,
      )
    } else {
      message.error('导入失败 ' + (res.data.message || ''))
    }
    await fetchData()
  }

  const openImportModal = () => {
    importModalVisible.value = true
  }

  const downloadTemplate = async () => {
    try {
      const response = await myAxios.get('/api/file/banktrascation/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `银行收支明细模板.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('模板下载成功')
    } catch (error: any) {
      console.error('下载模板失败', error)
      message.error('下载模板失败 ' + (error.message || '未知错误'))
    }
  }

  // ==================== 添加 / 编辑弹窗 ====================

  const bankTransactionModalVisible = ref(false)
  const bankTransactionModalTitle = ref('添加银行收支记录')
  const bankTransactionFormRef = ref()
  const editingBankTransactionId = ref<number | null>(null)
  const currentEditIndex = ref<number>(-1)
  const targetSerialNo = ref<number | null>(null) // 临时存储目标序号（用于分页切换时避免闪烁）
  const employeeList = ref<API.EmployeeBasicInfoVO[]>([])
  const clientList = ref<API.Client_[]>([])
  const contactNameList = ref<string[]>([])
  const currentClientRecords = ref<API.Client_[]>([])

  const editingRemainingAmount = ref<number>(0)
  const editingUsedAmount = ref<number>(0)
  const editingOriginalAmount = ref<number>(0)
  const editingInvoiceInfo = ref<Array<{ invoiceNo: string; paidAmount: number }>>([])

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


  const showEditingInvoiceInfo = computed(() => {
    return !!editingBankTransactionId.value && editingInvoiceInfo.value.length > 0
  })

  const invoiceListLoading = ref(false)
  const availableInvoiceList = ref<
    Array<{
      invoiceNo: string
      clientCompanyName?: string
      amount?: number
      totalPaidAmount?: number
      isFullyPaid: boolean
    }>
  >([])

  const uniqueClientList = computed(() => {
    const seen = new Set<string>()
    const unique: API.Client_[] = []
    for (const client of clientList.value) {
      if (client.companyName && !seen.has(client.companyName)) {
        seen.add(client.companyName)
        unique.push(client)
      }
    }
    return unique
  })

  const bankTransactionFormData = reactive<{
    uniqueKey?: string
    companyName?: string
    clientCompanyName?: string
    userName?: string
    clientPhone?: string
    salespersonName?: string
    transferMethod?: string
    arrivalTime?: Dayjs | null
    amount?: number
    invoiceNoList?: string[]
    remark1?: string
    remark2?: string
    remark3?: string
  }>({
    uniqueKey: '',
    companyName: DEFAULT_COMPANY_NAME,
    clientCompanyName: '',
    userName: '',
    clientPhone: '',
    salespersonName: '',
    transferMethod: '',
    arrivalTime: dayjs(),
    amount: undefined,
    invoiceNoList: [],
    remark1: '',
    remark2: '',
    remark3: '',
  })

  const fetchCompanyList = async () => {
    try {
      const res = (await getAllCompanyIdNameUsingGet()) as any
      if (res.data.code === 0 && Array.isArray(res.data.data)) {
        // 后端已返回真实的 id+name，直接使用，避免本地自增 id 错误
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

  const fetchEmployeeList = async () => {
    try {
      // 使用新接口获取所有员工基本信息（无数据丢失风险）
      const res = (await getAllEmployeeBasicInfoUsingGet({})) as any
      if (res?.data?.code === 0 && Array.isArray(res?.data?.data)) {
        employeeList.value = res.data.data
      } else {
        employeeList.value = []
      }
    } catch (error) {
      console.error('获取员工列表失败', error)
      employeeList.value = []
    }
  }

  const fetchClientList = async () => {
    try {
      // 使用新接口获取客户公司名称列表（更轻量级，无数据丢失风险）
      const res = await getClientCompanyNamesUsingGet()
      if (res?.data?.code === 0 && res?.data?.data) {
        const names: string[] = Array.isArray(res.data.data) ? res.data.data : Array.from(res.data.data as any)
        // 转换为 Client_ 格式以保持兼容性（只包含公司名称）
        const clients = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n))).map((companyName) => ({
          companyName,
        })) as API.Client_[]
        clientList.value = clients
        clientListForFilter.value = clients
      } else {
        clientList.value = []
        clientListForFilter.value = []
      }
    } catch (error) {
      console.error('获取客户列表失败', error)
      clientList.value = []
      clientListForFilter.value = []
    }
  }

  const fetchContactNameList = async (companyName: string) => {
    if (!companyName) {
      contactNameList.value = []
      currentClientRecords.value = []
      return
    }
    try {
      // 使用新接口根据公司名称获取客户姓名和ID列表（无数据丢失风险）
      const res = (await getUserNameByCompanyNameUsingPost({ companyName } as any)) as any
      if (res.data.code === 0 && res.data.data) {
        const records = Array.isArray(res.data.data) ? res.data.data : []
        // 转换为 Client_ 格式以保持兼容性
        currentClientRecords.value = records.map((item: any) => ({
          id: item.id,
          companyName,
          userName: item.userName || '',
        })) as API.Client_[]
        const contactNames = records
          .map((item: any) => item.userName)
          .filter((name: string | undefined): name is string => !!name)
        contactNameList.value = Array.from(new Set(contactNames))
      } else {
        contactNameList.value = []
        currentClientRecords.value = []
      }
    } catch (error) {
      console.error('获取联系人列表失败', error)
      contactNameList.value = []
      currentClientRecords.value = []
    }
  }

  const handleUserNameChange = (value: string | undefined) => {
    if (!value || !bankTransactionFormData.clientCompanyName) {
      return
    }
    const matchedClient = currentClientRecords.value.find(
      (client: API.Client_) =>
        client.companyName === bankTransactionFormData.clientCompanyName && client.userName === value,
    )
    if (matchedClient && matchedClient.userPhone) {
      bankTransactionFormData.clientPhone = matchedClient.userPhone
    } else if (matchedClient && matchedClient.registerPhone) {
      bankTransactionFormData.clientPhone = matchedClient.registerPhone
    }
  }

  const handleClientCompanyNameChange = async (value: string | undefined) => {
    if (value) {
      await fetchContactNameList(value)
      if (contactNameList.value.length === 1) {
        bankTransactionFormData.userName = contactNameList.value[0]
        handleUserNameChange(contactNameList.value[0])
      } else {
        bankTransactionFormData.userName = ''
        bankTransactionFormData.clientPhone = ''
      }
    } else {
      contactNameList.value = []
      currentClientRecords.value = []
      bankTransactionFormData.userName = ''
      bankTransactionFormData.clientPhone = ''
    }
  }

  const fetchAvailableInvoices = async () => {
    try {
      invoiceListLoading.value = true
      const params: API.InvoicePageDto = {
        current: 1,
        pageSize: 1000,
      }
      const res = (await queryInvoicePageUsingPost(params)) as any
      if (res.data.code === 0 && res.data.data) {
        const allInvoices = res.data.data.records ?? []
        const unpaidInvoices = allInvoices.filter((invoice: API.InvoiceItem) => {
          const amount = invoice.amount || 0
          const paidAmount = invoice.paidAmount || 0
          if (amount < 0) return false
          return !invoice.paidDate || paidAmount < amount
        })
        availableInvoiceList.value = unpaidInvoices.map((invoice: API.InvoiceItem) => {
          const amount = invoice.amount || 0
          const paidAmount = invoice.paidAmount || 0
          return {
            invoiceNo: invoice.invoiceNo || '',
            clientCompanyName: invoice.clientCompanyName,
            amount,
            totalPaidAmount: paidAmount,
            isFullyPaid: paidAmount >= amount && !!invoice.paidDate,
          }
        })
      }
    } catch (error) {
      console.error('获取发票列表失败', error)
      message.error('获取发票列表失败')
    } finally {
      invoiceListLoading.value = false
    }
  }

  const handleAddInputInvoice = async () => {
    bankTransactionModalTitle.value = '添加-收支记录'
    editingBankTransactionId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    contactNameList.value = []
    availableInvoiceList.value = []
    editingRemainingAmount.value = 0
    editingUsedAmount.value = 0
    editingOriginalAmount.value = 0
    editingInvoiceInfo.value = []
    Object.assign(bankTransactionFormData, {
      uniqueKey: '',
      companyName: DEFAULT_COMPANY_NAME,
      clientCompanyName: '',
      userName: '',
      clientPhone: '',
      salespersonName: '',
      transferMethod: '',
      arrivalTime: dayjs(),
      amount: undefined,
      invoiceNoList: [],
      remark1: '',
      remark2: '',
      remark3: '',
    })
    // 打开弹窗前，预先加载转账方式选项，供表单使用
    await fetchTransferMethodOptions()
    bankTransactionModalVisible.value = true
    await fetchAvailableInvoices()
  }

  const handleSubmitBankTransaction = async (data: {
    companyName?: string
    clientCompanyName?: string
    userName?: string
    clientPhone?: string
    salespersonName?: string
    arrivalTime?: Dayjs | null
    amount?: number
    remark1?: string
    remark2?: string
    remark3?: string
  }, callback?: (success: boolean) => void) => {
    try {
      if (!data.companyName) {
        message.error('请输入公司名称')
        callback?.(false)
        return
      }
      if (!data.arrivalTime) {
        message.error('请选择到账时间')
        callback?.(false)
        return
      }
      if (data.amount === undefined || data.amount === null) {
        message.error('请输入到款金额')
        callback?.(false)
        return
      }
      if (!data.clientCompanyName) {
        message.error('请输入客户名称')
        callback?.(false)
        return
      }
      if (!data.userName) {
        message.error('请选择客户联系人')
        callback?.(false)
        return
      }
      if (!data.salespersonName) {
        message.error('请选择业务员')
        callback?.(false)
        return
      }

      // 归一化：防止出现数组形态的 id（接口只接受单值）
      const normalizeId = (v: any) => (Array.isArray(v) ? v[0] : v)

      // companyId 规则：
      // - 如果公司名称为“其他账号”，统一传 -1，由后端做特殊处理
      // - 否则优先用表单回填的 companyId；若为空则通过公司名称从 companyList 兜底映射
      let normalizedCompanyId: number | undefined
      if ((data.companyName || '').trim() === '其他账号') {
        normalizedCompanyId = -1
      } else {
        normalizedCompanyId =
          normalizeId((data as any).companyId) ||
          companyList.value.find((c) => (c.companyName || '').trim() === (data.companyName || '').trim())?.id
      }
      const normalizedClientId = normalizeId((data as any).clientId)
      const normalizedSalespersonId = normalizeId((data as any).salespersonId)

      if (normalizedCompanyId == null) {
        message.error('公司信息未成功关联，请重新选择公司名称后再保存')
        callback?.(false)
        return
      }

      if (editingBankTransactionId.value) {
        // 移除前端金额校验，允许负数，交给后端判断
        const updateData: API.BankTransactionUpdateDto = {
          id: editingBankTransactionId.value,
          companyName: data.companyName,
          companyId: normalizedCompanyId,
          clientCompanyName: data.clientCompanyName,
          userName: data.userName,
          clientPhone: data.clientPhone || '',
          salespersonName: data.salespersonName,
          salespersonId: normalizedSalespersonId,
          transferMethod: (data as any).transferMethod,
          // 使用 dayjs 包裹，兼容字符串 / Date / Dayjs
          arrivalTime: dayjs(data.arrivalTime as any).format('YYYY-MM-DD'),
          amount: data.amount,
          invoiceNo:
            bankTransactionFormData.invoiceNoList && bankTransactionFormData.invoiceNoList.length > 0
              ? bankTransactionFormData.invoiceNoList.join(',')
              : undefined,
          remark1: data.remark1,
          remark2: data.remark2,
          remark3: data.remark3,
        }
        const res = (await updateBankTransactionUsingPost(updateData)) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          // 编辑模式下，不关闭弹窗，等待用户点击"下一条"或关闭
          await fetchData()
          // 重新加载当前编辑记录的余额信息，更新已关联发票金额信息
          if (editingBankTransactionId.value) {
            const currentRecord = dataList.value.find(item => item.id === editingBankTransactionId.value)
            if (currentRecord) {
              await loadBankTransactionRecord(currentRecord)
            }
          }
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        const submitData: API.BankTransactionAddDto_ = {
          companyName: data.companyName!,
          companyId: normalizedCompanyId,
          // 使用 dayjs 包裹，兼容字符串 / Date / Dayjs
          arrivalTime: dayjs(data.arrivalTime as any).format('YYYY-MM-DD'),
          amount: data.amount!,
          clientCompanyName: data.clientCompanyName,
          userName: data.userName,
          clientId: normalizedClientId,
          clientPhone: data.clientPhone,
          salespersonName: data.salespersonName,
          salespersonId: normalizedSalespersonId,
          transferMethod: (data as any).transferMethod,
          invoiceNo:
            bankTransactionFormData.invoiceNoList && bankTransactionFormData.invoiceNoList.length > 0
              ? bankTransactionFormData.invoiceNoList
              : undefined,
          remark1: data.remark1,
          remark2: data.remark2,
          remark3: data.remark3,
        }
        const res = (await addBankTransactionUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
          // 保存成功后，从响应中获取 uniqueKey 填充到表单
          if (res.data.data && res.data.data.uniqueKey) {
            bankTransactionFormData.uniqueKey = res.data.data.uniqueKey
          }
          await fetchData()
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

  const handleCancelBankTransaction = () => {
    bankTransactionModalVisible.value = false
    editingBankTransactionId.value = null
    editingRemainingAmount.value = 0
    editingUsedAmount.value = 0
    editingOriginalAmount.value = 0
    editingInvoiceInfo.value = []
  }

  // 处理下一条事件（连续录入 - 新增模式）
  const handleNextBankTransaction = () => {
    // 保留所有字段状态，不做任何清空
    // 只清除验证状态，不清除字段值
    // 注意：uniqueKey 需要清空，因为它是保存成功后填充的，不是默认值
    Object.assign(bankTransactionFormData, {
      uniqueKey: '', // 清空 uniqueKey，点击下一条后仍提示系统自动生成
      companyName: DEFAULT_COMPANY_NAME,
      clientCompanyName: '',
      userName: '',
      clientPhone: '',
      salespersonName: '',
      arrivalTime: dayjs(),
      amount: undefined,
      invoiceNoList: [],
      remark1: '',
      remark2: '',
      remark3: '',
    })
  }

  // 处理编辑模式下的下一条
  const handleNextBankTransactionEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingBankTransactionId.value) {
        const foundIndex = dataList.value.findIndex(item => item.id === editingBankTransactionId.value)
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
      let nextRecord: API.BankTransaction_ | undefined
      const current = Number(paginationParams.current) || 1
      const pageSize = Number(paginationParams.pageSize) || 10

      // 如果下一条记录在当前页
      if (nextIndex < dataList.value.length) {
        nextRecord = dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        // 如果下一条记录在下一页
        const totalPages = Math.ceil(total.value / pageSize)
        const currentPage = paginationParams.current

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          // 设置临时序号，避免闪烁
          targetSerialNo.value = (targetPage - 1) * pageSize + 1

          // 加载下一页数据
          paginationParams.current = targetPage
          await fetchData()

          await nextTick()
          // 等待数据加载完成后，获取第一条记录
          if (dataList.value.length > 0) {
            nextRecord = dataList.value[0]
            currentEditIndex.value = 0
            targetSerialNo.value = null // 清除临时序号，使用计算值
          } else {
            targetSerialNo.value = null // 清除临时序号
            message.warning('没有更多记录了')
            bankTransactionModalVisible.value = false
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
        await loadBankTransactionRecord(nextRecord)
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
  const handlePrevBankTransactionEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingBankTransactionId.value) {
        const foundIndex = dataList.value.findIndex(item => item.id === editingBankTransactionId.value)
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
      let prevRecord: API.BankTransaction_ | undefined
      const current = Number(paginationParams.current) || 1
      const pageSize = Number(paginationParams.pageSize) || 10

      // 如果上一条记录在当前页
      if (prevIndex >= 0) {
        prevRecord = dataList.value[prevIndex]
        currentEditIndex.value = prevIndex
      } else {
        // 如果上一条记录在上一页
        const currentPage = paginationParams.current

        if (currentPage > 1) {
          const targetPage = currentPage - 1
          // 设置临时序号（预估，假设上一页是满页）
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize

          // 加载上一页数据
          paginationParams.current = targetPage
          await fetchData()

          await nextTick()
          if (dataList.value.length > 0) {
            // 获取上一页的最后一条记录
            const lastIndex = dataList.value.length - 1
            prevRecord = dataList.value[lastIndex]
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
        await loadBankTransactionRecord(prevRecord)
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

  // 加载银行收支记录到表单（用于编辑和上一条/下一条）
  const loadBankTransactionRecord = async (record: API.BankTransaction_) => {
    editingBankTransactionId.value = record.id || null
    let userName = ''
    if (record.clientId) {
      try {
        const clientRes = (await getClientByIdUsingGet({ id: record.clientId })) as any
        if (clientRes.data.code === 0 && clientRes.data.data) {
          userName = clientRes.data.data.userName || ''
        }
      } catch (error) {
        console.error('获取客户信息失败', error)
      }
    }
    let invoiceNoList: string[] = []
    if (record.invoiceNo) {
      invoiceNoList = record.invoiceNo.split(',').map((no) => no.trim()).filter((no) => no)
    }
    if (record.id) {
      try {
        const res = (await queryBankTransactionWithremainAmountUsingPost({
          bankTransactionId: record.id,
        })) as any
        if (res.data.code === 0 && res.data.data) {
          const data: API.BankTransactionRemainingAmountVO_ = res.data.data
          editingRemainingAmount.value = data.remainingAmount || 0
          editingUsedAmount.value = data.usedAmount || 0
          editingOriginalAmount.value = data.bankTransactionAmount || record.amount || 0
          const invoiceRes = (await queryBankTransactionWithInvoicesUsingPost({
            bankTransactionId: record.id,
          })) as any
          if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
            const invoiceData: API.BankTransactionWithInvoicesVO_ = invoiceRes.data.data
            editingInvoiceInfo.value = (invoiceData.invoiceList || []).map((invoice: API.InvoiceDetailVO_) => ({
              id: (invoice as any).invoiceFinishId ?? (invoice as any).id,
              invoiceBaseId: invoice.invoiceBaseId,
              invoiceNo: invoice.invoiceNo || '',
              paidAmount: invoice.paidAmount || 0,
              paidDate: (invoice as any).paidDate,
              transferMethod: (invoice as any).transferMethod,
            }))
          }
        }
      } catch (error) {
        console.error('获取剩余金额和关联发票信息失败', error)
        editingRemainingAmount.value = 0
        editingUsedAmount.value = 0
        editingOriginalAmount.value = record.amount || 0
        editingInvoiceInfo.value = []
      }
    }
    Object.assign(bankTransactionFormData, {
      uniqueKey: record.uniqueKey || '',
      companyName: record.companyName || '',
      clientCompanyName: record.clientCompanyName || '',
      userName,
      clientPhone: record.clientPhone || '',
      salespersonName: record.salespersonName || '',
      transferMethod: (record as any).transferMethod || '',
      arrivalTime: record.arrivalTime ? dayjs(record.arrivalTime) : dayjs(),
      amount: record.amount,
      invoiceNoList,
      remark1: record.remark1 || '',
      remark2: record.remark2 || '',
      remark3: record.remark3 || '',
    })
    if (record.clientCompanyName) {
      await fetchContactNameList(record.clientCompanyName)
    } else {
      contactNameList.value = []
    }
    availableInvoiceList.value = []
    await fetchAvailableInvoices()
  }

  const invoiceModalVisible = ref(false)
  const currentInvoiceInfo = ref<API.InvoiceBase_ | null>(null)
  const currentInvoiceFinishInfo = ref<API.InvoiceFinish_ | null>(null)

  // 余额关联发票信息查看
  const balanceInvoiceModalVisible = ref(false)
  const currentBalanceRecord = ref<API.BankTransaction_ | null>(null)
  const balanceInvoiceList = ref<Array<{ invoiceNo: string; paidAmount: number }>>([])
  const balanceUsedAmount = ref<number>(0)
  const balanceRemainingAmount = ref<number>(0)
  const balanceOriginalAmount = ref<number>(0)
  const balanceMinAllowedAmount = ref<number>(0)

  // 发票列表相关（用于余额关联发票信息查看）
  const balanceInvoiceListLoading = ref(false)
  const invoiceList = ref<API.InvoiceItem[]>([])
  const selectedInvoiceIds = ref<number[]>([])
  const invoiceSearchParams = reactive({
    customerCompany: '',
    customerContact: '',
    issuerCompanyIds: [] as number[],
    salespersonName: '',
    startDate: null as string | null,
    endDate: null as string | null,
    invoiceNumber: '',
    minInvoiceAmount: null as number | null,
    maxInvoiceAmount: null as number | null,
  })

  // 员工列表（用于入账）
  const employeeListForPayment = ref<API.EmployeeBasicInfoVO[]>([])
  const paymentSalespersonId = ref<number | null>(null)
  const transferMethodOptions = ref<Array<{ label: string; value: string }>>([])

  // 到款出账模态框（进项发票查询）
  const outflowModalVisible = ref(false)
  const currentOutflowRecord = ref<API.BankTransaction_ | null>(null)

  // 查看余额关联发票信息
  const handleViewBalanceInvoices = async (record: API.BankTransaction_) => {
    try {
      if (!record.id) {
        message.error('银行收支记录ID不存在')
        return
      }
      currentBalanceRecord.value = record
      balanceInvoiceModalVisible.value = true
      balanceInvoiceList.value = []
      balanceUsedAmount.value = 0
      balanceRemainingAmount.value = 0
      balanceOriginalAmount.value = 0
      balanceMinAllowedAmount.value = 0
      selectedInvoiceIds.value = []
      invoiceList.value = []

      // 获取剩余金额和关联发票信息
      const res = (await queryBankTransactionWithremainAmountUsingPost({
        bankTransactionId: record.id,
      })) as any
      if (res.data.code === 0 && res.data.data) {
        const data: API.BankTransactionRemainingAmountVO_ = res.data.data
        balanceRemainingAmount.value = data.remainingAmount || 0
        balanceUsedAmount.value = data.usedAmount || 0
        balanceOriginalAmount.value = data.bankTransactionAmount || record.amount || 0
        balanceMinAllowedAmount.value = balanceOriginalAmount.value - balanceRemainingAmount.value

        // 获取关联发票列表
        const invoiceRes = (await queryBankTransactionWithInvoicesUsingPost({
          bankTransactionId: record.id,
        })) as any
        if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
          const invoiceData: API.BankTransactionWithInvoicesVO_ = invoiceRes.data.data
          balanceInvoiceList.value = (invoiceData.invoiceList || []).map((invoice: API.InvoiceDetailVO_) => ({
            id: (invoice as any).invoiceFinishId ?? (invoice as any).id,
            invoiceBaseId: invoice.invoiceBaseId,
            invoiceNo: invoice.invoiceNo || '',
            paidAmount: invoice.paidAmount || 0,
            paidDate: (invoice as any).paidDate,
            transferMethod: (invoice as any).transferMethod,
          }))
        }
      } else {
        message.error('获取关联发票信息失败 ' + (res.data.message || ''))
        balanceInvoiceModalVisible.value = false
        return
      }

      // 加载员工列表 & 登录用户 & 转账方式
      await Promise.all([fetchEmployeeListForPayment(), fetchLoginUser(), fetchTransferMethodOptions()])
      // 加载发票列表
      await fetchInvoiceListForPayment()
    } catch (error) {
      console.error('获取余额关联发票信息失败', error)
      message.error('获取余额关联发票信息失败')
      balanceInvoiceModalVisible.value = false
    }
  }

  /**
   * 查看到款出账（金额为负，关联进项发票查询）
   */
  const handleViewOutflowPayment = (record: API.BankTransaction_) => {
    if (!record || !record.id) {
      message.error('银行收支记录不存在')
      return
    }
    currentOutflowRecord.value = record
    outflowModalVisible.value = true
  }

  // 获取员工列表（用于入账）
  const fetchEmployeeListForPayment = async () => {
    try {
      // 使用新接口获取所有员工基本信息（无数据丢失风险）
      const res = (await getAllEmployeeBasicInfoUsingGet({})) as any
      if (res?.data?.code === 0 && Array.isArray(res?.data?.data)) {
        employeeListForPayment.value = res.data.data
      } else {
        employeeListForPayment.value = []
      }
    } catch (error) {
      console.error('获取员工列表失败', error)
      employeeListForPayment.value = []
    }
  }

  // 获取转账方式列表（用于入账）
  const fetchTransferMethodOptions = async () => {
    try {
      const res = (await queryTransferMethodPageUsingPost({
        current: 1,
        pageSize: 1000,
        isEnabledList: [1],
      })) as any
      if (res.data.code === 0 && res.data.data) {
        const records = res.data.data.records || []
        transferMethodOptions.value = records
          .filter((m: any) => m && m.methodName && m.isEnabled !== 0)
          .map((m: any) => ({
            value: String(m.methodName),
            label: String(m.methodName),
          }))
      }
    } catch (error) {
      console.error('获取转账方式列表失败', error)
    }
  }

  // 获取当前登录用户，作为业务经理默认值
  const fetchLoginUser = async () => {
    try {
      const res = (await getLoginUserUsingGet()) as any
      if (res?.data?.code === 0 && res.data.data?.id) {
        paymentSalespersonId.value = res.data.data.id
      }
    } catch (error) {
      console.error('获取当前登录用户失败', error)
    }
  }

  // 获取发票列表（用于入账）
  const fetchInvoiceListForPayment = async () => {
    try {
      balanceInvoiceListLoading.value = true
      const params: any = {
        current: 1,
        pageSize: 1000,
      }
      if (invoiceSearchParams.customerCompany) {
        params.clientCompanyName = invoiceSearchParams.customerCompany
      }
      if (invoiceSearchParams.customerContact) {
        params.clientPerson = invoiceSearchParams.customerContact
      }
      if (invoiceSearchParams.issuerCompanyIds && invoiceSearchParams.issuerCompanyIds.length > 0) {
        params.issuerCompanyIds = invoiceSearchParams.issuerCompanyIds
      }
      if (invoiceSearchParams.salespersonName) {
        params.salespersonName = invoiceSearchParams.salespersonName
      }
      if (invoiceSearchParams.startDate) {
        params.startDate = invoiceSearchParams.startDate
      }
      if (invoiceSearchParams.endDate) {
        params.endDate = invoiceSearchParams.endDate
      }
      if (invoiceSearchParams.invoiceNumber) {
        params.invoiceNo = invoiceSearchParams.invoiceNumber
      }
      if (invoiceSearchParams.minInvoiceAmount !== null) {
        params.minAmount = invoiceSearchParams.minInvoiceAmount
      }
      if (invoiceSearchParams.maxInvoiceAmount !== null) {
        params.maxAmount = invoiceSearchParams.maxInvoiceAmount
      }

      const res = (await queryInvoicePageUsingPost(params)) as any
      if (res.data.code === 0 && res.data.data) {
        invoiceList.value = (res.data.data.records || []).map((item: any, idx: number) => {
          const name = item.clientPerson

          return {
            ...item,
            clientPerson: item.clientPerson || name,
            userName: item.userName || name,
            // 计算欠款金额 = 开票金额 - 已到账金额
            amountDue: (item.amount || 0) - (item.totalPaidAmount || 0),
            serialNo: idx + 1,
          }
        })
      }
    } catch (error) {
      console.error('获取发票列表失败', error)
      message.error('获取发票列表失败')
    } finally {
      balanceInvoiceListLoading.value = false
    }
  }

  // 重置发票搜索条件
  const resetInvoiceSearch = () => {
    invoiceSearchParams.customerCompany = ''
    invoiceSearchParams.customerContact = ''
    invoiceSearchParams.issuerCompanyIds = []
    invoiceSearchParams.salespersonName = ''
    invoiceSearchParams.startDate = null
    invoiceSearchParams.endDate = null
    invoiceSearchParams.invoiceNumber = ''
    invoiceSearchParams.minInvoiceAmount = null
    invoiceSearchParams.maxInvoiceAmount = null
    fetchInvoiceListForPayment()
  }

  // 处理入账提交
  const handleBalancePaymentSubmit = async (paymentInfos: Array<{ invoiceId: number; invoiceNo: string; amountDue: number; paymentAmount: number; paidDate?: string; salespersonId?: number | null; transferMethod?: string }>) => {
    try {
      if (!currentBalanceRecord.value || !currentBalanceRecord.value.id) {
        message.error('银行收支记录不存在')
        return
      }

      if (!paymentInfos || paymentInfos.length === 0) {
        message.warning('请至少选择一张发票并设置入账金额')
        return
      }

      // 计算总入账金额
      const totalAmount = paymentInfos.reduce((sum, info) => sum + info.paymentAmount, 0)
      if (totalAmount <= 0) {
        message.warning('入账金额必须大于0')
        return
      }
      if (totalAmount > balanceRemainingAmount.value) {
        message.error(`入账金额 ${totalAmount.toFixed(2)} 超过剩余可用金额 ${balanceRemainingAmount.value.toFixed(2)}`)
        return
      }

      // 到账日期：优先使用前端传入（选中行=今天），否则回退为 arrivalTime 推导
      let paidDate = paymentInfos[0]?.paidDate || dayjs().format('YYYY-MM-DD')
      if (!paymentInfos[0]?.paidDate && currentBalanceRecord.value.arrivalTime) {
        const arrivalTime = currentBalanceRecord.value.arrivalTime
        if (/^\d{4}-\d{2}-\d{2}/.test(arrivalTime)) {
          paidDate = arrivalTime.substring(0, 10)
        } else if (/^\d{8}$/.test(arrivalTime)) {
          paidDate = `${arrivalTime.substring(0, 4)}-${arrivalTime.substring(4, 6)}-${arrivalTime.substring(6, 8)}`
        } else {
          const date = dayjs(arrivalTime)
          if (date.isValid()) paidDate = date.format('YYYY-MM-DD')
        }
      }

      // 构建确认对话框内容（VNode，避免显示 HTML 源码）
      const confirmContentVNode = () => {
        return h('div', { style: { marginBottom: '16px' } }, [
          h('div', { style: { marginBottom: '8px', fontWeight: '600' } }, [
            '到账日期：',
            h('span', { style: { color: '#1890ff' } }, paidDate),
          ]),
          h('div', { style: { marginBottom: '12px', fontWeight: '600' } }, [
            '总入账金额：',
            h('span', { style: { color: '#52c41a' } }, totalAmount.toFixed(2)),
          ]),
          h('div', { style: { marginBottom: '8px', fontWeight: '600' } }, '入账明细：'),
          h('table', { style: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' } }, [
            h('thead', {}, [
              h('tr', { style: { background: '#f5f5f5' } }, [
                h('th', { style: { padding: '8px', textAlign: 'left', border: '1px solid #d9d9d9' } }, '发票号码'),
                h('th', { style: { padding: '8px', textAlign: 'right', border: '1px solid #d9d9d9' } }, '欠款金额'),
                h('th', { style: { padding: '8px', textAlign: 'right', border: '1px solid #d9d9d9' } }, '入账金额'),
                h('th', { style: { padding: '8px', textAlign: 'center', border: '1px solid #d9d9d9' } }, '转账方式'),
                h('th', { style: { padding: '8px', textAlign: 'center', border: '1px solid #d9d9d9' } }, '到账日期'),
              ]),
            ]),
            h('tbody', {}, paymentInfos.map((info, index) => {
              return h('tr', { style: { background: index % 2 === 0 ? '#fafafa' : '' } }, [
                h('td', { style: { padding: '8px', border: '1px solid #d9d9d9' } }, info.invoiceNo || '-'),
                h('td', { style: { padding: '8px', textAlign: 'right', border: '1px solid #d9d9d9' } }, info.amountDue.toFixed(2)),
                h('td', {
                  style: {
                    padding: '8px',
                    textAlign: 'right',
                    border: '1px solid #d9d9d9',
                    color: '#52c41a',
                    fontWeight: '600',
                  },
                }, info.paymentAmount.toFixed(2)),
                h('td', { style: { padding: '8px', textAlign: 'center', border: '1px solid #d9d9d9' } }, info.transferMethod || '-'),
                h('td', { style: { padding: '8px', textAlign: 'center', border: '1px solid #d9d9d9' } }, info.paidDate || '-'),
              ])
            })),
          ]),
        ])
      }

      // 显示确认对话框
      Modal.confirm({
        title: '确认入账',
        content: confirmContentVNode,
        width: 600,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 构建入账DTO
            const paymentDtos: API.InvoicePaymentDto[] = paymentInfos.map((info) => ({
              invoiceBaseId: info.invoiceId,
              bankTransactionId: currentBalanceRecord.value!.id!,
              paidAmount: info.paymentAmount,
              paidDate: info.paidDate || paidDate,
              salespersonId: (info.salespersonId ?? paymentSalespersonId.value ?? employeeListForPayment.value[0]?.id) ?? undefined,
              transferMethod: info.transferMethod,
            }))

            const res = (await addPaymentUsingPost(paymentDtos)) as any
            if (res.data.code === 0) {
              message.success('入账成功')
              // 不关闭弹窗，刷新当前记录与列表
              selectedInvoiceIds.value = []
              await baseTable.fetchData()
              if (currentBalanceRecord.value?.id) {
                await handleViewBalanceInvoices(currentBalanceRecord.value)
              }
            } else {
              message.error('入账失败: ' + (res.data.message || ''))
            }
          } catch (error: any) {
            console.error('入账失败', error)
            message.error('入账失败: ' + (error.message || '未知错误'))
          }
        },
      })
    } catch (error: any) {
      console.error('入账失败', error)
      message.error('入账失败: ' + (error.message || '未知错误'))
    }
  }

  const handleViewInvoice = async (record: API.BankTransaction_, invoiceNo: string) => {
    try {
      if (!record.id) {
        message.error('银行收支记录ID不存在')
        return
      }
      currentInvoiceInfo.value = null
      currentInvoiceFinishInfo.value = null
      invoiceModalVisible.value = true

      const bankTransactionRes = (await queryBankTransactionWithInvoicesUsingPost({
        bankTransactionId: record.id,
      })) as any
      if (bankTransactionRes.data.code !== 0 || !bankTransactionRes.data.data) {
        message.error('获取关联发票信息失败 ' + (bankTransactionRes.data.message || ''))
        invoiceModalVisible.value = false
        return
      }

      const bankTransactionData: API.BankTransactionWithInvoicesVO_ = bankTransactionRes.data.data
      const invoiceList = bankTransactionData.invoiceList || []
      const matchedInvoice = invoiceList.find((item: API.InvoiceDetailVO_) => item.invoiceNo === invoiceNo.trim())
      if (!matchedInvoice) {
        message.warning('未找到该发票的关联信息')
        invoiceModalVisible.value = false
        return
      }

      if (matchedInvoice.invoiceBaseId) {
        try {
          const invoiceRes = (await getByIdUsingPost({
            id: matchedInvoice.invoiceBaseId,
          })) as any
          if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
            currentInvoiceInfo.value = invoiceRes.data.data
          } else {
            message.warning('获取发票详细信息失败 ' + (invoiceRes.data.message || ''))
          }
        } catch (error) {
          console.error('获取发票详细信息失败', error)
          message.warning('获取发票详细信息失败')
        }
      }

      if (matchedInvoice.invoiceFinishId) {
        try {
          const finishRes = (await listInvoiceFinishPageUsingPost({
            current: 1,
            pageSize: 10,
            invoiceNo: invoiceNo.trim(),
          })) as any
          if (finishRes.data.code === 0 && finishRes.data.data) {
            const records = finishRes.data.data.records || []
            const matchedFinish = records.find(
              (item: API.InvoiceFinish_) =>
                item.id === matchedInvoice.invoiceFinishId ||
                (item.invoiceNo === invoiceNo.trim() && item.bankTransactionId === record.id),
            )
            if (matchedFinish) {
              currentInvoiceFinishInfo.value = matchedFinish
            }
          }
        } catch (error) {
          console.error('获取到款信息失败', error)
        }
      } else {
        try {
          const finishRes = (await listInvoiceFinishPageUsingPost({
            current: 1,
            pageSize: 10,
            invoiceNo: invoiceNo.trim(),
          })) as any
          if (finishRes.data.code === 0 && finishRes.data.data) {
            const records = finishRes.data.data.records || []
            const matchedFinish = records.find(
              (item: API.InvoiceFinish_) =>
                item.invoiceNo === invoiceNo.trim() && item.bankTransactionId === record.id,
            )
            if (matchedFinish) {
              currentInvoiceFinishInfo.value = matchedFinish
            }
          }
        } catch (error) {
          console.error('获取到款信息失败', error)
        }
      }
    } catch (error) {
      console.error('查询发票信息失败', error)
      message.error('查询发票信息失败')
      invoiceModalVisible.value = false
    }
  }

  const handleEdit = async (record: API.BankTransaction_) => {
    bankTransactionModalTitle.value = '编辑-银行收支'
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    await loadBankTransactionRecord(record)
    bankTransactionModalVisible.value = true
  }

  const handleDelete = (record: API.BankTransaction_) => {
    const amount = Number(record.amount || 0)
    const warningText = amount >= 0
      ? '警告：该操作会删除该收支关联的所有销项发票的入账记录，该操作无法撤销'
      : '警告：该操作会删除该收支关联的所有进项发票的出账记录，该操作无法撤销'
    
    const confirmContent = () => {
      return h('div', [
        h('div', { style: { marginBottom: '12px' } }, '确定要删除该银行收支记录吗？'),
        h('div', { style: { color: '#ff4d4f', marginTop: '8px' } }, warningText)
      ])
    }
    
    Modal.confirm({
      title: '确认删除',
      content: confirmContent,
      onOk: async () => {
        try {
          if (!record.id) {
            message.error('记录ID不存在')
            return
          }
          const res = (await deleteBankTransactionUsingPost({ id: record.id })) as any
          if (res.data.code === 0) {
            message.success('删除成功')
            await fetchData()
          } else {
            message.error('删除失败 ' + (res.data.message || ''))
          }
        } catch (error: any) {
          message.error('删除失败 ' + (error.message || '未知错误'))
        }
      },
    })
  }

  const showCompanyModal = ref(false)

  const handleCompanyModalOk = (selectedCompanyIds: number[]) => {
    searchParams.issuerCompanyIds = selectedCompanyIds
    paginationParams.current = 1
    fetchData()
  }

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('BANK_TRANSACTION_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('BANK_TRANSACTION_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('BANK_TRANSACTION_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      filterCollapsed.value = false
      filterCollapseKey.value = ['filter']
      // 设置默认日期为当前月份
      if (!searchParams.startDate && !searchParams.endDate) {
        searchParams.startDate = dayjs().startOf('month')
        searchParams.endDate = dayjs()
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 筛选折叠
    filterCollapsed,
    filterCollapseKey,
    handleFilterCollapseChange,
    handleFilterCollapseToggle,

    // 基础表格
    loading: baseTable.loading,
    pagination: baseTable.pagination,
    paginationParams,
    searchParams,
    sortParams,
    dataList,
    dataListWithSerial,
    tableRowCount,
    tableScrollHeight,
    fetchData,
    handlePageChange,
    handlePageSizeChange,
    doTableChange,
    doSearch,
    doReset,
    handleAmountChange,

    // 公司 / 客户筛选
    companyList,
    clientList,
    clientListForFilter,
    clientCompanyOptions,
    fetchClientCompanyOptions,
    clientCompanyWidth,
    filteredClientContactOptions,
    clientContactWidth,
    selectedCompanyNamesText,
    companySelectButtonWidth,
    handleClientCompanySelect,
    handleClientCompanyChange,
    handleClientContactSelect,
    handleClientContactChange,

    // 表格列
    allColumns,
    customizableColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 导出 / 导入
    handleExport,
    exportModalVisible,
    openExportModal,
    importModalVisible,
    handleImport,
    openImportModal,
    downloadTemplate,

    // 银行收支记录弹窗
    bankTransactionModalVisible,
    bankTransactionModalTitle,
    bankTransactionFormData,
    employeeList,
    clientListAll: clientList,
    uniqueClientList,
    editingBankTransactionId,
    editingRemainingAmount,
    editingUsedAmount,
    editingOriginalAmount,
    editingInvoiceInfo,
    currentEditSerialNo,
    fetchCompanyList,
    fetchEmployeeList,
    fetchClientList,
    fetchAvailableInvoices,
    handleAddInputInvoice,
    handleSubmitBankTransaction,
    handleCancelBankTransaction,
    handleNextBankTransaction,
    handleNextBankTransactionEdit,
    handlePrevBankTransactionEdit,
    handleEdit,
    handleDelete,

    // 查看发票弹窗
    invoiceModalVisible,
    currentInvoiceInfo,
    currentInvoiceFinishInfo,
    handleViewInvoice,

    // 余额关联发票信息查看
    balanceInvoiceModalVisible,
    currentBalanceRecord,
    balanceInvoiceList,
    balanceUsedAmount,
    balanceRemainingAmount,
    balanceOriginalAmount,
    balanceMinAllowedAmount,
    handleViewBalanceInvoices,
    outflowModalVisible,
    currentOutflowRecord,
    handleViewOutflowPayment,
    invoiceListLoading: balanceInvoiceListLoading,
    invoiceList,
    selectedInvoiceIds,
    invoiceSearchParams,
    employeeListForPayment,
    paymentSalespersonId,
    transferMethodOptions,
    fetchInvoiceListForPayment,
    resetInvoiceSearch,
    handleBalancePaymentSubmit,

    // 公司选择模态框
    showCompanyModal,
    handleCompanyModalOk,

    // 初始化
    initPageSettings,
  }
}


