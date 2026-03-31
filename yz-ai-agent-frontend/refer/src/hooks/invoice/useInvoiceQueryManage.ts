import { ref, reactive, computed, nextTick, watch, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { exportJsonToExcel } from '@/utils/exportExcel'
import {
  queryInvoicePageUsingPost,
  addPaymentUsingPost,
  deleteClientUsingPost1,
  addInvoiceBaseUsingPost,
  updateClientUsingPost1,
  cancelPaymentUsingPost,
  getByIdUsingPost,
} from '@/api/fapiaoxinxiguanli'
import { getAllCompanyIdNameUsingGet, checkExistsUsingPost } from '@/api/gongsixinxijiekou'
import { listClientByPageUsingPost, existsClientUsingPost, getClientCompanyNamesUsingGet, getUserNameByCompanyNameUsingPost } from '@/api/kehuxinxiguanli'
import { listTransactionByPageUsingPost } from '@/api/caiwuguanlijiekou'
import { getAllEmployeeBasicInfoUsingGet, existsEmployeeUsingPost } from '@/api/yuangongguanlijiekou'
import { invoiceUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import myAxios from '@/request'
import { queryInvoiceTypeListEnabledUsingPost, queryMarkListEnabledUsingPost } from '@/api/jichuxinxiguanlijiekou'
import { listInvoiceFinishPageUsingPost } from '@/api/daokuanxinxiguanli'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useFilterCollapse } from '@/composables/useFilterCollapse'
import { useInvoiceTable } from './useInvoiceTable'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

/**
 * 发票查询管理完整 Hook
 * 封装筛选、表格列、导入导出、增删改弹窗、入账等逻辑
 */
export function useInvoiceQueryManage() {
  // 基础表格：分页 / 筛选 / 排序
  const baseTable = useInvoiceTable()

  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'INVOICE_QUERY_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        startDate?: string | null
        endDate?: string | null
        issuerCompanyIds?: number[]
        markValues?: string[]
        invoiceTypes?: string[]
        customerCompany?: string
        customerContact?: string
        salespersonName?: string
        issuerName?: string
        minInvoiceAmount?: number | null
        maxInvoiceAmount?: number | null
        invoiceNumber?: string
        invoiceStatus?: string
      }
      return parsed
    } catch (error) {
      console.error('加载发票查询筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    startDate: Dayjs | null
    endDate: Dayjs | null
    issuerCompanyIds: number[]
    markValues: string[]
    invoiceTypes: string[]
    customerCompany: string
    customerContact: string
    salespersonName: string
    issuerName: string
    minInvoiceAmount: number | null
    maxInvoiceAmount: number | null
    invoiceNumber: string
    invoiceStatus: string
  }) => {
    try {
      const payload = {
        ...params,
        startDate: params.startDate
          ? (params.startDate as any).toISOString?.() ??
            dayjs(params.startDate as any).toISOString()
          : null,
        endDate: params.endDate
          ? (params.endDate as any).toISOString?.() ??
            dayjs(params.endDate as any).toISOString()
          : null,
      }
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.error('保存发票查询筛选条件失败', error)
    }
  }

  // ==================== 筛选折叠 ====================

  try {
    sessionStorage.removeItem('INVOICE_QUERY_PAGE_FILTER_COLLAPSED')
  } catch (error) {
    console.error('清除筛选框状态失败', error)
  }
  const { filterCollapsed, filterCollapseKey } = useFilterCollapse('INVOICE_QUERY_PAGE_FILTER_COLLAPSED', false)

  const handleFilterCollapseChange = (keys: string[] | string) => {
    const arr = Array.isArray(keys) ? keys : [keys]
    filterCollapsed.value = !arr.includes('filter')
  }

  const handleFilterCollapseToggle = () => {
    const willCollapse = !filterCollapsed.value
    filterCollapsed.value = willCollapse
    filterCollapseKey.value = willCollapse ? [] : ['filter']
  }

  // ==================== 搜索条件 ====================

  const searchParams = baseTable.searchParams as {
    startDate: Dayjs | null
    endDate: Dayjs | null
    issuerCompanyIds: number[]
    markValues: string[]
    invoiceTypes: string[] // 发票种类多选（名称列表）
    customerCompany: string
    customerContact: string
    salespersonName: string
    issuerName: string
    minInvoiceAmount: number | null // 最小开票金额
    maxInvoiceAmount: number | null // 最大开票金额
    invoiceNumber: string // 发票号码
    invoiceStatus: string
  }

  // 尝试从本地存储恢复筛选条件（在设置默认值之前）
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (storedParams.startDate) {
      ;(searchParams.startDate as any) = dayjs(storedParams.startDate)
    }
    if (storedParams.endDate) {
      ;(searchParams.endDate as any) = dayjs(storedParams.endDate)
    }
    if (Array.isArray(storedParams.issuerCompanyIds)) {
      searchParams.issuerCompanyIds = storedParams.issuerCompanyIds
    }
    if (Array.isArray(storedParams.markValues)) {
      searchParams.markValues = storedParams.markValues
    }
    if (Array.isArray(storedParams.invoiceTypes)) {
      searchParams.invoiceTypes = storedParams.invoiceTypes
    }
    if (typeof storedParams.customerCompany === 'string') {
      searchParams.customerCompany = storedParams.customerCompany
    }
    if (typeof storedParams.customerContact === 'string') {
      searchParams.customerContact = storedParams.customerContact
    }
    if (typeof storedParams.salespersonName === 'string') {
      searchParams.salespersonName = storedParams.salespersonName
    }
    if (typeof storedParams.issuerName === 'string') {
      searchParams.issuerName = storedParams.issuerName
    }
    if (
      typeof storedParams.minInvoiceAmount === 'number' ||
      storedParams.minInvoiceAmount === null
    ) {
      searchParams.minInvoiceAmount = storedParams.minInvoiceAmount as any
    }
    if (
      typeof storedParams.maxInvoiceAmount === 'number' ||
      storedParams.maxInvoiceAmount === null
    ) {
      searchParams.maxInvoiceAmount = storedParams.maxInvoiceAmount as any
    }
    if (typeof storedParams.invoiceNumber === 'string') {
      searchParams.invoiceNumber = storedParams.invoiceNumber
    }
    if (typeof storedParams.invoiceStatus === 'string') {
      searchParams.invoiceStatus = storedParams.invoiceStatus
    }
  }

  // 初始化默认日期
  if (!searchParams.startDate && !searchParams.endDate) {
    searchParams.startDate = dayjs().startOf('month')
    searchParams.endDate = dayjs()
  }

  // 初始化 invoiceTypes 为空数组（如果未定义）
  if (!searchParams.invoiceTypes) {
    searchParams.invoiceTypes = []
  }

  // 监听筛选条件变化，自动持久化到本地
  watch(
    () => ({
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      issuerCompanyIds: searchParams.issuerCompanyIds,
      markValues: searchParams.markValues,
      invoiceTypes: searchParams.invoiceTypes,
      customerCompany: searchParams.customerCompany,
      customerContact: searchParams.customerContact,
      salespersonName: searchParams.salespersonName,
      issuerName: searchParams.issuerName,
      minInvoiceAmount: searchParams.minInvoiceAmount,
      maxInvoiceAmount: searchParams.maxInvoiceAmount,
      invoiceNumber: searchParams.invoiceNumber,
      invoiceStatus: searchParams.invoiceStatus,
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
      const contentWidth = calculateTextWidth(selectedCompanyNamesText.value, 120, 220)
      const placeholderWidth = calculateTextWidth(placeholder, 140)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 140)
  })

  // ==================== 客户列表 ====================

  const clientList = ref<API.Client_[]>([])

  // 客户单位选项（基础选项，不包含"全部"）
  const baseCustomerCompanyOptions = computed(() => {
    const uniqueCompanyNames = new Set<string>()
    const uniqueClients = clientList.value.filter((client: API.Client_) => {
      const companyName = client.companyName || ''
      if (companyName && !uniqueCompanyNames.has(companyName)) {
        uniqueCompanyNames.add(companyName)
        return true
      }
      return false
    })
    return uniqueClients.map((client: API.Client_) => ({
      value: client.companyName || '',
      label: client.companyName || '',
    }))
  })

  // 客户单位自动填充框（使用通用 composable）
  const customerCompanyAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseCustomerCompanyOptions,
    currentValue: computed(() => searchParams.customerCompany || ''),
    enableAutoAdd: true,
  })

  // 客户单位选项（包含"全部"选项）
  const customerCompanyOptions = computed(() => {
    return [{ value: '', label: '全部' }, ...customerCompanyAutoComplete.filteredOptions.value]
  })

  const customerCompanyWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入客户单位', 120)
    if (customerCompanyOptions.value.length > 0) {
      customerCompanyOptions.value.forEach((option: any) => {
        const text = option.label || option.value || ''
        const width = calculateTextWidth(text, 120)
        if (width > maxWidth) {
          maxWidth = width
        }
      })
    }
    return maxWidth
  })

  // ==================== 客户姓名列表 ====================
  
  const customerContactNameList = ref<string[]>([])

  // 获取客户姓名列表
  const fetchCustomerContactNameList = async (companyName: string) => {
    const name = (companyName || '').trim()
    if (!name) {
      customerContactNameList.value = []
      return
    }

    try {
      const res = (await getUserNameByCompanyNameUsingPost({ companyName: name } as any)) as any
      if (res?.data?.code === 0 && res?.data?.data) {
        const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
        const names = rows.map((r) => (r?.userName || '').trim()).filter((n) => !!n)
        customerContactNameList.value = Array.from(new Set(names))
      } else {
        customerContactNameList.value = []
      }
    } catch (error) {
      console.error('获取客户姓名列表失败', error)
      customerContactNameList.value = []
    }
  }

  // 客户姓名自动完成选项
  const customerContactOptions = computed(() => {
    return customerContactNameList.value.map((name) => ({
      value: name,
      label: name,
    }))
  })

  // 客户姓名自动填充框（使用通用 composable）
  const customerContactAutoComplete = useAutoCompleteWithExtra({
    baseOptions: customerContactOptions,
    currentValue: computed(() => searchParams.customerContact || ''),
    enableAutoAdd: true,
  })

  // 过滤后的客户姓名选项
  const filteredCustomerContactOptions = customerContactAutoComplete.filteredOptions

  const customerContactWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入客户姓名', 120)
    filteredCustomerContactOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    return maxWidth
  })

  const handleCustomerCompanySelect = async (value: string) => {
    if (value === '') {
      searchParams.customerCompany = ''
      customerContactNameList.value = []
      searchParams.customerContact = ''
    } else {
      // 当选择客户单位后，自动获取客户姓名列表
      await fetchCustomerContactNameList(value)
    }
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleCustomerCompanyChange = async (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    customerCompanyAutoComplete.handleChange(value)
    
    // 如果输入的是已存在的客户单位，获取客户姓名列表
    if (value) {
      const exists = customerCompanyOptions.value.some((opt: any) => opt.value === value)
      if (exists) {
        await fetchCustomerContactNameList(value)
      } else {
        // 如果输入的是新值，清空客户姓名列表
        customerContactNameList.value = []
        searchParams.customerContact = ''
      }
    } else {
      customerContactNameList.value = []
      searchParams.customerContact = ''
    }
    
    clearTimeout((handleCustomerCompanyChange as any).timer)
    ;(handleCustomerCompanyChange as any).timer = setTimeout(() => {
      if (value) {
        baseTable.paginationParams.current = 1
        baseTable.fetchData()
      }
    }, 500)
  }

  const handleCustomerContactSelect = (value: string) => {
    searchParams.customerContact = value
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleCustomerContactChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    customerContactAutoComplete.handleChange(value)
    searchParams.customerContact = value
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  // ==================== 发票类型列表 ====================

  const invoiceTypeList = ref<API.InvoiceType_[]>([])

  // 发票种类（多选）显示文本
  const selectedInvoiceTypeNamesText = computed(() => {
    const names = searchParams.invoiceTypes || []
    if (!names.length) return ''
    return names.filter(Boolean).join(', ')
  })

  const invoiceTypeSelectButtonWidth = computed(() => {
    const placeholder = '请选择发票种类'
    if (selectedInvoiceTypeNamesText.value) {
      const contentWidth = calculateTextWidth(selectedInvoiceTypeNamesText.value, 120, 180)
      const placeholderWidth = calculateTextWidth(placeholder, 120)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 120)
  })

  // ==================== 标记列表 ====================

  const markList = ref<Array<{ value: string; label: string }>>([])

  const selectedMarkValuesText = computed(() => {
    if (!searchParams.markValues || searchParams.markValues.length === 0) {
      return ''
    }
    const selectedMarks = markList.value.filter((mark: any) => searchParams.markValues.includes(mark.value))
    return selectedMarks.map((m: any) => m.label || m.value || '').join(', ')
  })

  const markSelectButtonWidth = computed(() => {
    const placeholder = '请选择标注'
    if (selectedMarkValuesText.value) {
      const contentWidth = calculateTextWidth(selectedMarkValuesText.value, 120, 180)
      const placeholderWidth = calculateTextWidth(placeholder, 120)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 120)
  })

  // ==================== 发票种类选择弹窗 ====================

  const showInvoiceTypeModal = ref(false)

  const handleInvoiceTypeModalOk = (selectedTypeIds: number[], selectedTypeNames: string[]) => {
    searchParams.invoiceTypes = selectedTypeNames || []
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  // ==================== 业务经理 / 开票人 自动填充 ====================

  // 业务经理选项（基础选项）
  const baseSalespersonOptions = computed(() => {
    const names = employeeList.value.map((e: API.EmployeeBasicInfoVO) => e.name || '').filter(Boolean)
    const unique = Array.from(new Set(names))
    return unique.map((n) => ({ value: n, label: n }))
  })

  // 业务经理自动填充框（使用通用 composable）
  const salespersonAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseSalespersonOptions,
    currentValue: computed(() => searchParams.salespersonName || ''),
    enableAutoAdd: true,
  })

  // 业务经理选项（包含用户输入的内容）
  const salespersonOptions = salespersonAutoComplete.filteredOptions

  // 开票人自动填充框（使用通用 composable，与业务经理共用基础选项）
  const issuerAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseSalespersonOptions,
    currentValue: computed(() => searchParams.issuerName || ''),
    enableAutoAdd: true,
  })

  // 开票人选项（包含用户输入的内容）
  const issuerOptions = issuerAutoComplete.filteredOptions

  const salespersonWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入业务经理', 120)
    salespersonOptions.value.forEach((opt: any) => {
      const text = opt.label || opt.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) maxWidth = width
    })
    return maxWidth
  })

  const issuerWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入开票人', 120)
    issuerOptions.value.forEach((opt: any) => {
      const text = opt.label || opt.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) maxWidth = width
    })
    return maxWidth
  })

  const handleSalespersonSelect = (value: string) => {
    if (value === '') searchParams.salespersonName = ''
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleSalespersonChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    salespersonAutoComplete.handleChange(value)
    
    clearTimeout((handleSalespersonChange as any).timer)
    ;(handleSalespersonChange as any).timer = setTimeout(() => {
      baseTable.paginationParams.current = 1
      baseTable.fetchData()
    }, 500)
  }

  const handleIssuerSelect = (value: string) => {
    if (value === '') searchParams.issuerName = ''
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  const handleIssuerChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    issuerAutoComplete.handleChange(value)
    
    clearTimeout((handleIssuerChange as any).timer)
    ;(handleIssuerChange as any).timer = setTimeout(() => {
      baseTable.paginationParams.current = 1
      baseTable.fetchData()
    }, 500)
  }

  // 统一的筛选框变化处理函数（防抖）
  let filterChangeTimer: any = null
  const handleFilterChange = () => {
    clearTimeout(filterChangeTimer)
    filterChangeTimer = setTimeout(() => {
      baseTable.paginationParams.current = 1
      baseTable.fetchData()
    }, 500)
  }

  // ==================== 表格列 & 列设置 ====================

  const allColumns = ref([
    // 按用户要求的顺序 & 宽度（字符位估算），前 6 列固定
    { key: 'serialNo',        title: '序号',     dataIndex: 'serialNo',          width: 72,  fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60,  maxWidth: 800,  ellipsis: true },  // 4 字符位
    { key: 'issueDate',      title: '开票日期', dataIndex: 'issueDate',         width: 128, fixed: 'left', sorter: true,  align: 'center' as const, minWidth: 110, maxWidth: 1500, ellipsis: true }, // 8 字符位
    { key: 'amount',         title: '开票金额', dataIndex: 'amount',            width: 128, fixed: 'left', sorter: true,  align: 'center' as const, minWidth: 110, maxWidth: 1500, ellipsis: true },
    { key: 'invoiceNo',      title: '发票号码', dataIndex: 'invoiceNo',         width: 220, fixed: 'left', sorter: true,  align: 'center' as const, minWidth: 180, maxWidth: 2600, ellipsis: true }, // 文本较长
    { key: 'customerCompany',title: '客户单位', dataIndex: 'clientCompanyName', width: 300, fixed: 'left', sorter: true,  align: 'center' as const, minWidth: 260, maxWidth: 4500, ellipsis: true }, // 20 字符位
    { key: 'customerContact',title: '客户姓名', dataIndex: 'clientPerson',      width: 132, fixed: 'left', sorter: true,  align: 'center' as const, minWidth: 120, maxWidth: 1800, ellipsis: true }, // 8 字符位
    { key: 'invoiceType',    title: '发票种类', dataIndex: 'invoiceType',       width: 120, sorter: true,  align: 'center' as const, minWidth: 100, maxWidth: 1600, ellipsis: true },
    { key: 'mark',           title: '标注',     dataIndex: 'mark',              width: 100, sorter: true,  align: 'center' as const, minWidth: 80,  maxWidth: 1400, ellipsis: true },

    // 之后列可随横向滚动隐藏
    { key: 'paidDate',       title: '到款日期', dataIndex: 'paidDate',          width: 128, sorter: true,  align: 'center' as const, minWidth: 110, maxWidth: 1500, ellipsis: true },
    { key: 'paidAmount',     title: '到款金额', dataIndex: 'totalPaidAmount',   width: 128, sorter: true,  align: 'center' as const, minWidth: 110, maxWidth: 1500, ellipsis: true },
    { key: 'salespersonName',title: '业务经理', dataIndex: 'salespersonName',   width: 110, sorter: true,  align: 'center' as const, minWidth: 100, maxWidth: 1600, ellipsis: true },
    { key: 'issuerCompany',  title: '公司名称', dataIndex: 'issuerCompanyName', width: 300, sorter: true,  align: 'center' as const, minWidth: 260, maxWidth: 4500, ellipsis: true },
    { key: 'issuerName',     title: '开票人',   dataIndex: 'issuerName',        width: 110, sorter: true,  align: 'center' as const, minWidth: 100, maxWidth: 1600, ellipsis: true },
    { key: 'remark1',        title: '备注1',    dataIndex: 'remark1',           width: 150, sorter: true,  align: 'center' as const, minWidth: 120, maxWidth: 3000, ellipsis: true },

    // 操作列固定在右侧
    { key: 'action', title: '操作', width: 180, fixed: 'right', align: 'center' as const, minWidth: 150, maxWidth: 2500 },
  ])

  const defaultSelectedColumns = [
    // 自定义列默认勾选顺序：序号、开票日期、开票金额、发票号码、客户单位、客户姓名、发票种类、到款日期、到款金额
    'serialNo',
    'issueDate',
    'amount',
    'invoiceNo',
    'customerCompany',
    'customerContact',
    'invoiceType',
    'paidDate',
    'paidAmount',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('INVOICE_QUERY_PAGE_SELECTED_COLUMNS')
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
    localStorage.removeItem('INVOICE_QUERY_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'INVOICE_QUERY_PAGE_TABLE_COLUMN_WIDTHS',
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
      sessionStorage.setItem('INVOICE_QUERY_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 表格滚动高度 ====================

  const tableRowCount = computed(() => baseTable.dataListWithSerial.value.length)

  const tableScrollHeight = computed(() => {
    const rowHeight = 39
    const maxRows = 10

    if (tableRowCount.value <= maxRows) {
      return undefined
    } else {
      return maxRows * rowHeight
    }
  })

  // ==================== 表格变化处理 ====================

  const doTableChange = (pagination: any, filters: any, sorter: any) => {
    if (pagination && typeof pagination.current === 'number') {
      baseTable.paginationParams.current = pagination.current
    }
    if (pagination && typeof pagination.pageSize === 'number') {
      baseTable.paginationParams.pageSize = pagination.pageSize
    }

    if (sorter && sorter.field && sorter.field !== 'serialNo' && sorter.order) {
      baseTable.sortParams.sortField = sorter.field
      baseTable.sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
    } else {
      // 取消排序时，完全清除排序参数
      delete baseTable.sortParams.sortField
      delete baseTable.sortParams.sortOrder
    }

    baseTable.fetchData()
  }

  // ==================== 重置 ====================

  const doReset = () => {
    searchParams.startDate = dayjs().startOf('month')
    searchParams.endDate = dayjs()
    searchParams.issuerCompanyIds = []
    searchParams.markValues = []
    searchParams.invoiceTypes = []
    searchParams.customerCompany = ''
    searchParams.customerContact = ''
    searchParams.salespersonName = ''
    searchParams.issuerName = ''
    searchParams.minInvoiceAmount = null
    searchParams.maxInvoiceAmount = null
    searchParams.invoiceNumber = ''
    searchParams.invoiceStatus = ''
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  // 单值开票金额筛选：同时设置最小值和最大值为同一金额
  const handleAmountChange = (value: number | null) => {
    if (value === null || value === undefined) {
      searchParams.minInvoiceAmount = null
      searchParams.maxInvoiceAmount = null
    } else {
      searchParams.minInvoiceAmount = value
      searchParams.maxInvoiceAmount = value
    }
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
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
      if (searchParams.startDate) {
        params.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        params.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        params.issuerCompanyIds = searchParams.issuerCompanyIds
      }
      if (searchParams.markValues && searchParams.markValues.length > 0) {
        params.markValues = searchParams.markValues
      }
      if (searchParams.customerCompany && searchParams.customerCompany !== '') {
        params.clientCompanyName = searchParams.customerCompany
      }
      if (searchParams.customerContact) {
        params.clientPerson = searchParams.customerContact
      }
      if (searchParams.salespersonName) {
        params.salespersonName = searchParams.salespersonName
      }
      if (searchParams.issuerName) {
        params.issuerName = searchParams.issuerName
      }
      if (searchParams.invoiceTypes && searchParams.invoiceTypes.length > 0) {
        params.invoiceTypes = searchParams.invoiceTypes
      }
      if (searchParams.minInvoiceAmount !== null && searchParams.minInvoiceAmount !== undefined) {
        params.minAmount = searchParams.minInvoiceAmount
      }
      if (searchParams.maxInvoiceAmount !== null && searchParams.maxInvoiceAmount !== undefined) {
        params.maxAmount = searchParams.maxInvoiceAmount
      }
      if (searchParams.invoiceNumber) {
        params.invoiceNo = searchParams.invoiceNumber
      }
      if (searchParams.invoiceStatus) {
        params.invoiceStatus = searchParams.invoiceStatus
      }

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
        开票日期: item.issueDate ? dayjs(item.issueDate as any).format('YYYY-MM-DD') : '',
        公司名称: item.issuerCompanyName || '',
        客户单位: item.clientCompanyName,
        金额: item.amount,
        发票号码: item.invoiceNo,
        客户联系人: item.clientPerson || '',
        到账日期: item.paidDate ? dayjs(item.paidDate as any).format('YYYY-MM-DD') : '',
        到账金额: item.totalPaidAmount != null ? item.totalPaidAmount : 0,
        发票性质: item.invoiceType,
        备注1: item.remark1 || '',
        备注2: item.remark2 || '',
        备注3: item.remark3 || '',
      }))

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'issueDate': '开票日期',
            'issuerCompanyName': '公司名称',
            'clientCompanyName': '客户单位',
            'amount': '金额',
            'invoiceNo': '发票号码',
            'clientPerson': '客户联系人',
            'paidDate': '到账日期',
            'totalPaidAmount': '到账金额',
            'invoiceType': '发票性质',
            'remark1': '备注1',
            'remark2': '备注2',
            'remark3': '备注3',
          }
          const exportKey = keyMap[col.dataIndex] || col.dataIndex
          return {
            key: exportKey,
            width: col.width || 120,
            align: col.align || 'center',
          }
        })

      // 生成 Excel 文件时直接到 100%，由 exportJsonToExcel 内部处理

      const fileName = `发票信息_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '发票信息', 
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

  const batchImportModalVisible = ref(false)

  const handleBatchImport = () => {
    batchImportModalVisible.value = true
  }

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await invoiceUploadUsingPost({ overwrite }, {}, file)) as any
    if (res.data.code === 0 && res.data.data) {
      const result: API.ExcelImportResultVO = res.data.data
      message.success(
        `导入成功：共 ${result.totalCount || 0} 条，成功 ${result.successCount || 0} 条，失败 ${result.failCount || 0} 条`,
      )
    } else {
      message.error('导入失败 ' + (res.data.message || ''))
    }
    await baseTable.fetchData()
  }

  const downloadTemplate = async () => {
    try {
      const response = await myAxios.get('/api/file/invoicebase/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `发票信息模板.xlsx`
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

  // ==================== 公司名称选择模态框 ====================

  const showIssuerCompanyModal = ref(false)

  const handleIssuerCompanyModalOk = (selectedCompanyIds: number[]) => {
    searchParams.issuerCompanyIds = selectedCompanyIds
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  // ==================== 标号选择模态框 ====================

  const showMarkModal = ref(false)

  const handleMarkModalOk = (selectedMarkValues: string[]) => {
    searchParams.markValues = selectedMarkValues
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  // ==================== 创建/编辑发票 ====================

  const invoiceModalVisible = ref(false)
  const invoiceModalTitle = ref('添加-销项发票')
  const editingInvoiceId = ref<number | null>(null)
  const currentEditIndex = ref<number>(-1)
  // 临时存储目标序号（用于分页切换时避免闪烁）
  const targetSerialNo = ref<number | null>(null)

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
  const invoiceFormData = reactive<{
    issueDate: Dayjs | null
    amount: number | undefined
    invoiceNo: string
    customerCompany: string
    customerContact: string
    issuerCompany: string
    salespersonName: string
    issuerName: string
    mark: string
    invoiceType: string
    remark1: string
    remark2: string
    remark3: string
    uniqueKey?: string
  }>({
    issueDate: dayjs(),
    amount: undefined,
    invoiceNo: '',
    customerCompany: '',
    customerContact: '',
    issuerCompany: '',
    salespersonName: '',
    issuerName: '',
    mark: '000',
    invoiceType: '',
    remark1: '',
    remark2: '',
    remark3: '',
  })

  const employeeList = ref<API.EmployeeBasicInfoVO[]>([])

  const lastSavedFormData = ref<{
    customerCompany?: string
    issuerCompany?: string
    salespersonName?: string
    issuerName?: string
    invoiceType?: string
  }>({})

  const handleCreateInvoice = async () => {
    invoiceModalTitle.value = '添加-销项发票'
    editingInvoiceId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    Object.assign(invoiceFormData, {
      issueDate: undefined as any,
      amount: undefined,
      invoiceNo: '',
      customerCompany: '',
      customerContact: '',
      issuerCompany: undefined as any,
      salespersonName: '',
      issuerName: '',
      mark: '000',
      invoiceType: '',
      remark1: '',
      remark2: '',
      remark3: '',
      uniqueKey: undefined,
    })
    await nextTick()
    invoiceModalVisible.value = true
  }

  const handleEdit = async (record: API.InvoiceItem) => {
    invoiceModalTitle.value = '修改-销项发票'
    editingInvoiceId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    const index = baseTable.dataList.value.findIndex((item) => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    Object.assign(invoiceFormData, {
      issueDate: record.issueDate ? dayjs(record.issueDate) : undefined,
      amount: record.amount,
      invoiceNo: record.invoiceNo,
      customerCompany: record.clientCompanyName,
      customerContact: record.clientPerson,
      issuerCompany: record.issuerCompanyName || undefined,
      salespersonName: record.salespersonName || '',
      issuerName: record.issuerName || '',
      mark: record.mark || '000',
      invoiceType: record.invoiceType,
      remark1: record.remark1 || '',
      remark2: record.remark2 || '',
      remark3: record.remark3 || '',
      uniqueKey: record.uniqueKey,
    })
    await nextTick()
    invoiceModalVisible.value = true
  }

  const handleInvoiceNextEdit = async (callback?: (success: boolean) => void) => {
    try {
      if (currentEditIndex.value < 0 && editingInvoiceId.value) {
        const foundIndex = baseTable.dataList.value.findIndex((item) => item.id === editingInvoiceId.value)
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
      let nextRecordId: number | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      if (nextIndex < baseTable.dataList.value.length) {
        // 下一条在当前页，直接更新索引（不需要临时序号）
        nextRecordId = baseTable.dataList.value[nextIndex].id
        currentEditIndex.value = nextIndex
      } else {
        // 下一条在下一页
        const totalPages = Math.ceil(baseTable.total.value / baseTable.paginationParams.pageSize)
        const currentPage = baseTable.paginationParams.current

        if (currentPage < totalPages) {
          // 先计算目标序号（下一页第一条）
          const targetPage = currentPage + 1
          targetSerialNo.value = (targetPage - 1) * pageSize + 1

          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          if (baseTable.dataList.value.length > 0) {
            nextRecordId = baseTable.dataList.value[0].id
            currentEditIndex.value = 0
            targetSerialNo.value = null // 清除临时序号，使用计算值
          } else {
            targetSerialNo.value = null // 清除临时序号
            message.warning('没有更多记录了')
            invoiceModalVisible.value = false
            callback?.(false)
            return
          }
        } else {
          message.warning('已经是最后一条记录了')
          callback?.(false)
          return
        }
      }

      if (nextRecordId) {
        const res = (await getByIdUsingPost({ id: nextRecordId })) as any
        if (res.data.code === 0 && res.data.data) {
          const invoiceDetail = res.data.data
          editingInvoiceId.value = invoiceDetail.id || null
          Object.assign(invoiceFormData, {
            issueDate: invoiceDetail.issueDate ? dayjs(invoiceDetail.issueDate) : undefined,
            amount: invoiceDetail.amount,
            invoiceNo: invoiceDetail.invoiceNo,
            customerCompany: invoiceDetail.clientCompanyName,
            customerContact: invoiceDetail.clientPerson,
            issuerCompany: invoiceDetail.issuerCompanyName || undefined,
            salespersonName: invoiceDetail.salespersonName || '',
            issuerName: invoiceDetail.issuerName || '',
            mark: invoiceDetail.mark || '000',
            invoiceType: invoiceDetail.invoiceType,
            remark1: invoiceDetail.remark1 || '',
            remark2: invoiceDetail.remark2 || '',
            remark3: invoiceDetail.remark3 || '',
            uniqueKey: invoiceDetail.uniqueKey,
          })
          await nextTick()
          callback?.(true)
        } else {
          message.error('获取发票详情失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        callback?.(false)
      }
    } catch (error: any) {
      console.error('获取下一条记录失败', error)
      message.error('获取下一条记录失败 ' + (error.message || '未知错误'))
      callback?.(false)
    }
  }

  const handleInvoicePrevEdit = async (callback?: (success: boolean) => void) => {
    try {
      if (currentEditIndex.value < 0 && editingInvoiceId.value) {
        const foundIndex = baseTable.dataList.value.findIndex((item) => item.id === editingInvoiceId.value)
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
      let prevRecordId: number | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      if (prevIndex >= 0) {
        // 上一条记录在当前页，直接更新索引（不需要临时序号）
        prevRecordId = baseTable.dataList.value[prevIndex].id
        currentEditIndex.value = prevIndex
      } else {
        // 上一条记录在上一页
        const currentPage = baseTable.paginationParams.current

        if (currentPage > 1) {
          // 先计算目标序号（上一页最后一条）
          // 注意：我们需要先知道上一页有多少条数据才能准确计算序号
          // 但为了简化，我们先设置一个预估序号，然后在获取数据后更新
          const targetPage = currentPage - 1
          // 预估序号：假设上一页是满页（pageSize条），最后一条的序号
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize

          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          if (baseTable.dataList.value.length > 0) {
            // 获取上一页的最后一条记录
            const lastIndex = baseTable.dataList.value.length - 1
            prevRecordId = baseTable.dataList.value[lastIndex].id
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

      if (prevRecordId) {
        const res = (await getByIdUsingPost({ id: prevRecordId })) as any
        if (res.data.code === 0 && res.data.data) {
          const invoiceDetail = res.data.data
          editingInvoiceId.value = invoiceDetail.id || null
          Object.assign(invoiceFormData, {
            issueDate: invoiceDetail.issueDate ? dayjs(invoiceDetail.issueDate) : undefined,
            amount: invoiceDetail.amount,
            invoiceNo: invoiceDetail.invoiceNo,
            customerCompany: invoiceDetail.clientCompanyName,
            customerContact: invoiceDetail.clientPerson,
            issuerCompany: invoiceDetail.issuerCompanyName || undefined,
            salespersonName: invoiceDetail.salespersonName || '',
            issuerName: invoiceDetail.issuerName || '',
            mark: invoiceDetail.mark || '000',
            invoiceType: invoiceDetail.invoiceType,
            remark1: invoiceDetail.remark1 || '',
            remark2: invoiceDetail.remark2 || '',
            remark3: invoiceDetail.remark3 || '',
            uniqueKey: invoiceDetail.uniqueKey,
          })
          await nextTick()
          callback?.(true)
        } else {
          message.error('获取发票详情失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        callback?.(false)
      }
    } catch (error: any) {
      console.error('获取上一条记录失败', error)
      message.error('获取上一条记录失败 ' + (error.message || '未知错误'))
      callback?.(false)
    }
  }

  const handleInvoiceSubmit = async (
    data: {
      issueDate: Dayjs | string | null
      amount: number | undefined
      invoiceNo: string
      customerCompany: string
      customerContact: string
      issuerCompany: string
      salespersonName: string
      issuerName: string
      mark: string
      invoiceType: string
      remark1: string
      remark2: string
      remark3: string
    },
    callback?: (success: boolean) => void,
  ) => {
    try {
      let client: API.Client_ | null =
        clientList.value.find((c: API.Client_) => c.companyName === data.customerCompany) || null

      // 公司兜底：保证 company 和 company.id 都存在
      const ensureCompany = async (): Promise<API.Company> => {
        const name = (data.issuerCompany || '').trim()
        const findLocal = () =>
          companyList.value.find((c) => (c.companyName || '').trim() === name) ||
          companyList.value.find((c) => (c.companyName || '').trim().toLowerCase() === name.toLowerCase())

        let found = findLocal()
        if (!found) {
          await fetchCompanyList()
          found = findLocal()
        }
        if (found && found.id) return found

        // 兜底：调用 exists 接口
        const existsRes = (await checkExistsUsingPost({ companyName: name })) as any
        const exists = existsRes?.data?.code === 0 && existsRes?.data?.data?.exists
        const id = existsRes?.data?.data?.id
        if (exists && id) {
          const item = { id, companyName: name } as API.Company
          companyList.value = [...companyList.value, item]
          return item
        }
        throw new Error('INVALID_COMPANY')
      }

      let company: API.Company
      try {
        company = await ensureCompany()
      } catch (e) {
        message.error('请选择有效的公司名称')
        callback?.(false)
        return
      }

      if (!company?.id) {
        message.error('公司名称对应的ID不存在，请刷新页面后重试')
        callback?.(false)
        return
      }
      // 强校验：客户单位 + 客户姓名 必须匹配（即使客户单位能匹配到列表，也要校验联系人）
      // 测试场景：客户单位满足条件但客户姓名不满足条件 -> 必须拒绝提交
      {
        const existsRes = (await existsClientUsingPost({
          companyName: data.customerCompany,
          userName: data.customerContact,
        })) as any
        const exists = existsRes?.data?.code === 0 && existsRes?.data?.data?.exists
        const rawId = existsRes?.data?.data?.clientId
        // 归一化 clientId：确保是单个 number（避免后端返回数组）
        const id = Array.isArray(rawId) ? rawId[0] : rawId

        if (!exists || !id) {
          message.error('客户信息关联失败：请从下拉选择正确的客户姓名，或先创建客户信息')
          callback?.(false)
          return
        }

        // 以接口返回的 clientId 为准（避免本地 clientList 里只有 companyName 但联系人不匹配）
        if (!client || client.id !== id) {
          client = { id, companyName: data.customerCompany, userName: data.customerContact } as any
          // 避免重复插入
          if (!clientList.value.some((c: any) => c?.id === id)) {
            clientList.value = [...clientList.value, client as any]
          }
        } else {
          // 同步用户选择的联系人（若本地记录缺失/不同）
          client.userName = data.customerContact
        }
      }

      if (!client || !client.id) {
        message.error('客户信息未成功关联，请重新选择客户单位/联系人后再保存')
        callback?.(false)
        return
      }

      let salespersonId: number | undefined
      let issuerId: number | undefined
      if (data.salespersonName) {
        const salesperson = employeeList.value.find((e: API.EmployeeBasicInfoVO) => e.name === data.salespersonName)
        salespersonId = salesperson?.id
        if (!salespersonId) {
          // 兜底：可能刚通过“+”新增员工，但父组件列表尚未刷新
          const existsRes = (await existsEmployeeUsingPost({ name: data.salespersonName })) as any
          const exists = existsRes?.data?.code === 0 && existsRes?.data?.data?.exists
          const id = existsRes?.data?.data?.employeeId
          if (exists && id) {
            salespersonId = id
            employeeList.value = [...employeeList.value, { id, name: data.salespersonName } as any]
          } else {
            message.error('请选择有效的业务经理')
            callback?.(false)
            return
          }
        }
      }
      if (data.issuerName) {
        const issuer = employeeList.value.find((e: API.EmployeeBasicInfoVO) => e.name === data.issuerName)
        issuerId = issuer?.id
        if (!issuerId) {
          // 兜底：可能刚通过“+”新增员工，但父组件列表尚未刷新
          const existsRes = (await existsEmployeeUsingPost({ name: data.issuerName })) as any
          const exists = existsRes?.data?.code === 0 && existsRes?.data?.data?.exists
          const id = existsRes?.data?.data?.employeeId
          if (exists && id) {
            issuerId = id
            employeeList.value = [...employeeList.value, { id, name: data.issuerName } as any]
          } else {
            message.error('请选择有效的开票人')
            callback?.(false)
            return
          }
        }
      }

      // 注意：客户关联校验已在上方通过 existsClientUsingPost 强校验完成

      if (editingInvoiceId.value) {
        if (!data.issueDate) {
          message.error('请选择开票日期')
          callback?.(false)
          return
        }
        const issueDateStr =
          typeof data.issueDate === 'string' ? data.issueDate : (data.issueDate as Dayjs).format('YYYY-MM-DD')
        // 归一化 ID：确保都是单个 number（避免数组）
        const normalizedClientId = Array.isArray(client.id) ? client.id[0] : client.id
        const normalizedCompanyId = Array.isArray(company.id) ? company.id[0] : company.id
        const submitData: API.InvoiceUpdateDto = {
          id: editingInvoiceId.value,
          issueDate: issueDateStr,
          amount: data.amount!,
          invoiceNo: data.invoiceNo,
          clientCompanyName: data.customerCompany,
          clientPerson: data.customerContact,
          issuerCompanyId: normalizedCompanyId, // 已在前面的检查中确保 company.id 存在
          issuerClientId: normalizedClientId,
          salespersonName: data.salespersonName,
          salespersonId: salespersonId,
          issuerName: data.issuerName,
          issuerId: issuerId,
          mark: data.mark,
          invoiceType: data.invoiceType,
          remark1: data.remark1,
          remark2: data.remark2,
          remark3: data.remark3,
        }
        const res = (await updateClientUsingPost1(submitData)) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          await baseTable.fetchData()
          const updatedIndex = baseTable.dataList.value.findIndex((item) => item.id === editingInvoiceId.value)
          if (updatedIndex >= 0) {
            currentEditIndex.value = updatedIndex
            const updatedRecord = baseTable.dataList.value[updatedIndex]
            Object.assign(invoiceFormData, {
              issueDate: updatedRecord.issueDate ? dayjs(updatedRecord.issueDate) : undefined,
              amount: updatedRecord.amount,
              invoiceNo: updatedRecord.invoiceNo,
              customerCompany: updatedRecord.clientCompanyName,
              customerContact: updatedRecord.clientPerson,
              issuerCompany: updatedRecord.issuerCompanyName || undefined,
              salespersonName: updatedRecord.salespersonName || '',
              issuerName: updatedRecord.issuerName || '',
              mark: updatedRecord.mark || '000',
              invoiceType: updatedRecord.invoiceType,
              remark1: updatedRecord.remark1 || '',
              remark2: updatedRecord.remark2 || '',
              remark3: updatedRecord.remark3 || '',
              uniqueKey: updatedRecord.uniqueKey,
            })
          }
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        if (!data.issueDate) {
          message.error('请选择开票日期')
          callback?.(false)
          return
        }
        const issueDateStr =
          typeof data.issueDate === 'string' ? data.issueDate : (data.issueDate as Dayjs).format('YYYY-MM-DD')
        // 归一化 ID：确保都是单个 number（避免数组）
        const normalizedClientId = Array.isArray(client.id) ? client.id[0] : client.id
        const normalizedCompanyId = Array.isArray(company.id) ? company.id[0] : company.id
        const submitData: API.InvoiceAddDto = {
          issueDate: issueDateStr,
          amount: data.amount!,
          invoiceNo: data.invoiceNo,
          clientCompanyName: data.customerCompany,
          clientPerson: data.customerContact,
          issuerCompanyId: normalizedCompanyId!,
          issuerClientId: normalizedClientId!,
          salespersonName: data.salespersonName,
          salespersonId: salespersonId,
          issuerName: data.issuerName,
          issuerId: issuerId,
          mark: data.mark,
          invoiceType: data.invoiceType,
          remark1: data.remark1,
          remark2: data.remark2,
          remark3: data.remark3,
        }
        const res = (await addInvoiceBaseUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
          lastSavedFormData.value = {
            customerCompany: data.customerCompany,
            issuerCompany: data.issuerCompany,
            salespersonName: data.salespersonName,
            issuerName: data.issuerName,
            invoiceType: data.invoiceType,
          }
          await baseTable.fetchData()
          callback?.(true)
        } else {
          message.error('添加失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      }
    } catch (error) {
      console.error('表单验证失败', error)
      callback?.(false)
    }
  }

  const handleInvoiceNext = () => {
    currentEditIndex.value = -1
    editingInvoiceId.value = null
  }

  const handleDelete = (record: API.InvoiceItem) => {
    const confirmContent = () => {
      return h('div', [
        h('div', { style: { marginBottom: '12px' } }, `确定要删除发票 ${record.invoiceNo} 吗？`),
        h('div', { style: { color: '#ff4d4f', marginTop: '8px' } }, '警告：该操作会删除所有关联的银行收支记录，该操作无法撤销')
      ])
    }
    Modal.confirm({
      title: '确认删除',
      content: confirmContent,
      onOk: async () => {
        try {
          if (!record.id) {
            message.error('发票ID不存在')
            return
          }
          const res = (await deleteClientUsingPost1({ id: record.id })) as any
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

  // ==================== 入账 ====================

  const paymentModalVisible = ref(false)
  const currentPaymentRecord = ref<API.InvoiceItem | null>(null)
  const availableBankTransactions = ref<API.BankTransaction_[]>([])
  const existingPayments = ref<API.InvoiceFinish_[]>([])

  const fetchAvailableBankTransactions = async () => {
    try {
      const res = (await listTransactionByPageUsingPost({
        current: 1,
        pageSize: 1000,
      })) as any
      if (res.data.code === 0 && res.data.data) {
        availableBankTransactions.value = (res.data.data.records ?? []).filter((item: API.BankTransaction_) => {
          if (!item.invoiceFinishId) {
            return true
          }
          return true
        })
      }
    } catch (error) {
      console.error('获取银行收支记录失败', error)
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

  const handlePayment = async (record: API.InvoiceItem) => {
    currentPaymentRecord.value = record

    await fetchAvailableBankTransactions()
    await fetchEmployeeList()

    existingPayments.value = []
    if (record.invoiceNo) {
      try {
        const finishRes = (await listInvoiceFinishPageUsingPost({
          invoiceNo: record.invoiceNo,
          current: 1,
          pageSize: 1000,
        })) as any

        if (finishRes.data.code === 0 && finishRes.data.data) {
          existingPayments.value = (finishRes.data.data.records || []).filter(
            (payment: API.InvoiceFinish_) => payment.isDelete === 0,
          )
        }
      } catch (error) {
        console.error('获取入账记录失败', error)
      }
    }

    paymentModalVisible.value = true
  }

  const handlePaymentDelete = async (paymentId: number) => {
    try {
      const res = (await cancelPaymentUsingPost({ id: paymentId })) as any
      if (res.data.code === 0) {
        message.success('删除成功')
        existingPayments.value = existingPayments.value.filter((p) => p.id !== paymentId)
        await baseTable.fetchData()
      } else {
        message.error('删除失败: ' + (res.data.message || ''))
      }
    } catch (error: any) {
      console.error('删除入账记录失败', error)
      message.error('删除失败: ' + (error.message || '未知错误'))
    }
  }

  // 批量撤销入账
  const handleCancelPayment = (invoiceIds: (number | string)[]) => {
    if (!invoiceIds || invoiceIds.length === 0) {
      message.warning('请先选择要撤销入账的销项发票')
      return
    }

    const confirmContent = () => {
      return h('div', [
        h('div', { style: { marginBottom: '12px' } }, '确定要撤销选中销项发票的入账记录吗？'),
        h('div', { style: { color: '#ff4d4f', marginTop: '8px' } }, '警告：该操作会删除该入账记录关联的银行收支记录，该操作不可撤销')
      ])
    }

    Modal.confirm({
      title: '确认撤销入账',
      content: confirmContent,
      okText: '确定撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 获取所有选中发票的入账记录
          const allPaymentIds: number[] = []
          const invoiceNos: string[] = []

          for (const invoiceId of invoiceIds) {
            const invoice = baseTable.dataList.value.find((item: API.InvoiceItem) => {
              const id = item.id || item.serialNo
              return id === invoiceId
            })

            if (!invoice || !invoice.invoiceNo) {
              continue
            }

            invoiceNos.push(invoice.invoiceNo)

            try {
              // 获取该发票的所有入账记录
              const finishRes = (await listInvoiceFinishPageUsingPost({
                invoiceNo: invoice.invoiceNo,
                current: 1,
                pageSize: 1000,
              })) as any

              if (finishRes.data.code === 0 && finishRes.data.data) {
                const payments = (finishRes.data.data.records || []).filter(
                  (payment: API.InvoiceFinish_) => payment.isDelete === 0 && payment.id
                )
                allPaymentIds.push(...payments.map((p: API.InvoiceFinish_) => p.id!))
              }
            } catch (error) {
              console.error(`获取发票 ${invoice.invoiceNo} 的入账记录失败`, error)
            }
          }

          if (allPaymentIds.length === 0) {
            message.warning('选中的发票没有入账记录')
            return
          }

          // 批量删除所有入账记录
          const promises = allPaymentIds.map(async (paymentId) => {
            const res = (await cancelPaymentUsingPost({ id: paymentId })) as any
            if (res.data.code === 0) {
              return { success: true, paymentId }
            } else {
              return { success: false, paymentId, error: res.data.message || '未知错误' }
            }
          })

          const results = await Promise.all(promises)
          const successCount = results.filter(r => r.success).length
          const failCount = results.filter(r => !r.success).length

          if (successCount > 0) {
            message.success(`成功撤销 ${successCount} 条入账记录`)
          }
          if (failCount > 0) {
            message.error(`撤销失败 ${failCount} 条入账记录`)
          }

          await baseTable.fetchData()
        } catch (error: any) {
          console.error('撤销入账失败', error)
          message.error('撤销入账失败：' + (error.message || '未知错误'))
        }
      },
    })
  }

  const handlePaymentSubmit = async (paymentDtos: API.InvoicePaymentDto[]) => {
    try {
      if (!currentPaymentRecord.value || !currentPaymentRecord.value.id) {
        message.error('发票信息不存在')
        return
      }

      for (let i = 0; i < paymentDtos.length; i++) {
        const dto = paymentDtos[i]
        if (!dto.bankTransactionId) {
          message.error(`入账记录 ${i + 1} 缺少银行收支记录ID`)
          return
        }
      }

      const paymentDtosWithInvoiceId: API.InvoicePaymentDto[] = paymentDtos.map((dto) => ({
        ...dto,
        invoiceBaseId: currentPaymentRecord.value!.id || 0,
        bankTransactionId: dto.bankTransactionId,
        id: dto.id ?? undefined,
      }))

      const res = (await addPaymentUsingPost(paymentDtosWithInvoiceId)) as any

      if (res.data.code === 0) {
        message.success('入账成功')
        paymentModalVisible.value = false
        currentPaymentRecord.value = null
        await baseTable.fetchData()
      } else {
        message.error('入账失败: ' + (res.data.message || ''))
      }
    } catch (error: any) {
      console.error('入账失败', error)
      message.error('入账失败: ' + (error.message || '未知错误'))
    }
  }

  // ==================== 基础数据加载 ====================

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

  const fetchInvoiceTypeList = async () => {
    try {
      const res = (await queryInvoiceTypeListEnabledUsingPost()) as any
      if (res.data.code === 0) {
        // 将返回的 { label, value }[] 格式转换为 { id, typeName }[] 格式
        const data = res.data.data || []
        invoiceTypeList.value = data.map((item: { label: string; value: string }) => ({
          id: Number(item.value),
          typeName: item.label,
        })) as API.InvoiceType_[]
      }
    } catch (error) {
      console.error('获取发票类型列表失败', error)
    }
  }

  const fetchMarkList = async () => {
    try {
      const res = (await queryMarkListEnabledUsingPost()) as any
      if (res.data.code === 0 && res.data.data) {
        markList.value = (res.data.data || []).map((item: any) => ({
          value: item.value || '',
          label: item.label || item.value || '',
        }))
      }
    } catch (error) {
      console.error('获取标记列表失败', error)
    }
  }

  // ==================== 初始化 ====================

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('INVOICE_QUERY_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('INVOICE_QUERY_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('INVOICE_QUERY_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      filterCollapsed.value = false
      filterCollapseKey.value = ['filter']
      // 设置默认排序：开票日期升序
      if (!baseTable.sortParams.sortField) {
        baseTable.sortParams.sortField = 'issueDate'
        baseTable.sortParams.sortOrder = 'asc'
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  // ==================== 分页处理 ====================

  const pagination = computed(() => ({
    current: baseTable.paginationParams.current,
    pageSize: baseTable.paginationParams.pageSize,
    total: baseTable.total.value,
  }))

  const handlePageChange = (page: number) => {
    baseTable.paginationParams.current = page
    baseTable.fetchData()
  }

  const handlePageSizeChange = (size: number) => {
    baseTable.paginationParams.pageSize = size
    baseTable.paginationParams.current = 1
    baseTable.fetchData()
  }

  return {
    // 筛选折叠
    filterCollapsed,
    filterCollapseKey,
    handleFilterCollapseChange,
    handleFilterCollapseToggle,

    // 基础表格
    loading: baseTable.loading,
    pagination,
    paginationParams: baseTable.paginationParams,
    searchParams,
    sortParams: baseTable.sortParams,
    dataList: baseTable.dataList,
    dataListWithSerial: baseTable.dataListWithSerial,
    total: baseTable.total,
    statistics: baseTable.statistics,
    tableRowCount,
    tableScrollHeight,
    fetchData: baseTable.fetchData,
    doTableChange,
    handlePageChange,
    handlePageSizeChange,
    doSearch: baseTable.doSearch,
    doReset,
    handleAmountChange,

    // 公司 / 客户筛选
    companyList,
    clientList,
    customerCompanyOptions,
    customerCompanyWidth,
    filteredCustomerContactOptions,
    customerContactWidth,
    selectedCompanyNamesText,
    companySelectButtonWidth,
    handleCustomerCompanySelect,
    handleCustomerCompanyChange,
    handleCustomerContactSelect,
    handleCustomerContactChange,

    // 发票类型 / 标记
    invoiceTypeList,
    selectedInvoiceTypeNamesText,
    invoiceTypeSelectButtonWidth,
    markList,
    selectedMarkValuesText,
    markSelectButtonWidth,

    // 业务经理 / 开票人自动填充
    salespersonOptions,
    salespersonWidth,
    handleSalespersonSelect,
    handleSalespersonChange,
    issuerOptions,
    issuerWidth,
    handleIssuerSelect,
    handleIssuerChange,
    handleFilterChange,

    // 列设置
    allColumns,
    customizableColumns: allColumns,
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
    batchImportModalVisible,
    handleBatchImport,
    handleImport,
    downloadTemplate,

    // 公司名称选择模态框
    showIssuerCompanyModal,
    handleIssuerCompanyModalOk,

    // 标号选择模态框
    showMarkModal,
    handleMarkModalOk,

    // 发票种类选择模态框
    showInvoiceTypeModal,
    handleInvoiceTypeModalOk,

    // 创建/编辑发票
    invoiceModalVisible,
    invoiceModalTitle,
    invoiceFormData,
    editingInvoiceId,
    currentEditIndex,
    currentEditSerialNo,
    employeeList,
    handleCreateInvoice,
    handleEdit,
    handleInvoiceSubmit,
    handleInvoiceNext,
    handleInvoiceNextEdit,
    handleInvoicePrevEdit,
    handleDelete,

    // 入账
    paymentModalVisible,
    currentPaymentRecord,
    availableBankTransactions,
    existingPayments,
    handlePayment,
    handlePaymentDelete,
    handlePaymentSubmit,
    handleCancelPayment,

    // 基础数据加载
    fetchCompanyList,
    fetchClientList,
    fetchEmployeeList,
    fetchInvoiceTypeList,
    fetchMarkList,

    // 初始化
    initPageSettings,
  }
}

