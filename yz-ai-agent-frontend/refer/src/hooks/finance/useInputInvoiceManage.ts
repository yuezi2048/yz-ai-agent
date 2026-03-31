import { ref, reactive, computed, nextTick, watch, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { exportJsonToExcel } from '@/utils/exportExcel'
import {
  listInputInvoiceByPageUsingPost,
  addInputInvoiceUsingPost,
  updateInputInvoiceUsingPost,
  deleteInputInvoiceUsingPost,
  cancelInputPaymentUsingPost,
} from '@/api/caiwuguanlijiekou'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { sipplierUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import { existsSupplierUsingPost, getSupplierCompanyNamesUsingGet, getSupplierNameByCompanyNameUsingPost } from '@/api/gongyingshangguanlijiekou'
import {
  queryInvoicePurposeListEnabledUsingGet,
  queryInvoicePurposePageUsingPost,
  queryInvoiceTypeListEnabledUsingPost,
} from '@/api/jichuxinxiguanlijiekou'
import myAxios from '@/request'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useFilterCollapse } from '@/composables/useFilterCollapse'
import { useInputInvoiceTable } from './useInputInvoiceTable'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

/**
 * 进项发票管理完整 Hook
 * 封装筛选、表格列、导入导出、增删改弹窗等逻辑
 */
export function useInputInvoiceManage() {
  // 基础表格：分页 / 筛选
  const baseTable = useInputInvoiceTable()

  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'INPUT_INVOICE_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        companyIds?: number[]
        supplierName?: string
        salespersonName?: string
        invoiceTypeIds?: number[]
        invoicePurposeIds?: number[]
        isAccounted?: boolean
        isPaid?: boolean
        startDate?: string | null
        endDate?: string | null
        amount?: number | null
      }
      return parsed
    } catch (error) {
      console.error('加载进项发票筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    companyIds: number[]
    supplierName?: string
    salespersonName?: string
    invoiceTypeIds: number[]
    invoicePurposeIds: number[]
    isAccounted?: boolean
    isPaid?: boolean
    startDate: Dayjs | string | null
    endDate: Dayjs | string | null
    amount: number | null
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
      console.error('保存进项发票筛选条件失败', error)
    }
  }

  // ==================== 筛选折叠 ====================

  try {
    sessionStorage.removeItem('INPUT_INVOICE_PAGE_FILTER_COLLAPSED')
  } catch (error) {
    console.error('清除筛选框状态失败', error)
  }
  const { filterCollapsed, filterCollapseKey } = useFilterCollapse('INPUT_INVOICE_PAGE_FILTER_COLLAPSED', false)

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
    companyIds: number[]
    supplierName?: string
    salespersonName?: string
    invoiceTypeIds?: number[]
    invoicePurposeIds?: number[]
    isAccounted?: boolean
    isPaid?: boolean
    startDate?: Dayjs | string | null
    endDate?: Dayjs | string | null
    minAmount?: number
    maxAmount?: number
  }

  // 优先从本地存储恢复筛选条件
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (Array.isArray(storedParams.companyIds)) {
      searchParams.companyIds = storedParams.companyIds as any
    }
    if (typeof storedParams.supplierName === 'string') {
      searchParams.supplierName = storedParams.supplierName
    }
    if (typeof storedParams.salespersonName === 'string') {
      searchParams.salespersonName = storedParams.salespersonName
    }
    if (Array.isArray(storedParams.invoiceTypeIds)) {
      searchParams.invoiceTypeIds = storedParams.invoiceTypeIds as any
    }
    if (Array.isArray(storedParams.invoicePurposeIds)) {
      searchParams.invoicePurposeIds = storedParams.invoicePurposeIds as any
    }
    if (typeof storedParams.isAccounted === 'boolean') {
      searchParams.isAccounted = storedParams.isAccounted
    }
    if (typeof storedParams.isPaid === 'boolean') {
      searchParams.isPaid = storedParams.isPaid
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
      searchParams.minAmount = v ?? undefined
      searchParams.maxAmount = v ?? undefined
    }
  }

  const dateRange = ref<[Dayjs, Dayjs] | null>(null)

  // 默认筛选当前月份发票（除非本地已有筛选条件）
  if (!storedParams || (!storedParams.startDate && !storedParams.endDate)) {
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')
    searchParams.startDate = startOfMonth
    searchParams.endDate = endOfMonth
    dateRange.value = [dayjs(startOfMonth), dayjs(endOfMonth)]
  }

  const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    if (dates && dates.length === 2) {
      searchParams.startDate = dates[0]
      searchParams.endDate = dates[1]
    } else {
      searchParams.startDate = null
      searchParams.endDate = null
    }
  }

  // 监听筛选条件变化，自动持久化
  watch(
    () => ({
      companyIds: searchParams.companyIds || [],
      supplierName: searchParams.supplierName || '',
      salespersonName: searchParams.salespersonName || '',
      invoiceTypeIds: searchParams.invoiceTypeIds || [],
      invoicePurposeIds: searchParams.invoicePurposeIds || [],
      isAccounted:
        typeof searchParams.isAccounted === 'boolean'
          ? searchParams.isAccounted
          : undefined,
      isPaid:
        typeof searchParams.isPaid === 'boolean'
          ? searchParams.isPaid
          : undefined,
      startDate: searchParams.startDate || null,
      endDate: searchParams.endDate || null,
      amount:
        typeof searchParams.minAmount === 'number' &&
        typeof searchParams.maxAmount === 'number' &&
        searchParams.minAmount === searchParams.maxAmount
          ? (searchParams.minAmount as number)
          : null,
    }),
    (val) => {
      saveSearchParamsToStorage(val)
    },
    { deep: true }
  )

  // ==================== 公司 & 供应商 ====================

  const companyList = ref<API.Company[]>([])
  const employeeList = ref<API.EmployeeBasicInfoVO[]>([])
  const invoiceTypeList = ref<API.InvoiceType_[]>([])
  const invoicePurposeList = ref<API.InvoicePurposeItemVO[]>([])

  const selectedCompanyNamesText = computed(() => {
    if (!searchParams.companyIds || searchParams.companyIds.length === 0) {
      return ''
    }
    const selectedCompanies = companyList.value.filter((company: API.Company) =>
      company.id && searchParams.companyIds.includes(company.id),
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

  // 供货单位下拉（使用后端接口）
  const baseSupplierCompanyOptions = ref<Array<{ value: string; label: string }>>([])

  const fetchSupplierCompanyOptions = async () => {
    try {
      const res = await getSupplierCompanyNamesUsingGet()
      if (res?.data?.code === 0 && res?.data?.data) {
        const names: string[] = res.data.data || []
        baseSupplierCompanyOptions.value = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n))).map(
          (name) => ({ value: name, label: name }),
        )
      } else baseSupplierCompanyOptions.value = []
    } catch (error) {
      console.error('获取供货单位列表失败', error)
      baseSupplierCompanyOptions.value = []
    }
  }

  // 供货单位自动填充框（使用通用 composable）
  const supplierCompanyAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseSupplierCompanyOptions,
    currentValue: computed(() => searchParams.supplierName || ''),
    enableAutoAdd: true,
  })

  // 供货单位选项（包含用户输入的内容）
  const supplierCompanyOptions = supplierCompanyAutoComplete.filteredOptions

  const supplierCompanyWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入供货单位', 120)
    supplierCompanyOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    return maxWidth
  })

  // ==================== 供货姓名列表 ====================

  const supplierContactNameList = ref<string[]>([])

  // 获取供货姓名列表
  const fetchSupplierContactNameList = async (companyName: string) => {
    const name = (companyName || '').trim()
    if (!name) {
      supplierContactNameList.value = []
      return
    }

    try {
      const res = (await getSupplierNameByCompanyNameUsingPost({ companyName: name } as any)) as any
      if (res?.data?.code === 0 && res?.data?.data) {
        const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
        const names = rows.map((r) => (r?.userName || '').trim()).filter((n) => !!n)
        supplierContactNameList.value = Array.from(new Set(names))
      } else {
        supplierContactNameList.value = []
      }
    } catch (error) {
      console.error('获取供货姓名列表失败', error)
      supplierContactNameList.value = []
    }
  }

  // 供货姓名自动完成选项
  const supplierContactOptions = computed(() => {
    return supplierContactNameList.value.map((name) => ({
      value: name,
      label: name,
    }))
  })

  // 供货姓名自动填充框（使用通用 composable）
  const supplierContactAutoComplete = useAutoCompleteWithExtra({
    baseOptions: supplierContactOptions,
    currentValue: computed(() => searchParams.salespersonName || ''),
    enableAutoAdd: true,
  })

  // 过滤后的供货姓名选项
  const filteredSupplierContactOptions = supplierContactAutoComplete.filteredOptions

  const supplierContactWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入供货姓名', 120)
    filteredSupplierContactOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    return maxWidth
  })

  const handleSupplierCompanySelect = async (value: string) => {
    if (value === '') {
      searchParams.supplierName = ''
      supplierContactNameList.value = []
      searchParams.salespersonName = ''
    } else {
      // 当选择供货单位后，自动获取供货姓名列表
      await fetchSupplierContactNameList(value)
    }
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const handleSupplierCompanyChange = async (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    supplierCompanyAutoComplete.handleChange(value)

    // 如果输入的是已存在的供货单位，获取供货姓名列表
    if (value) {
      const exists = supplierCompanyOptions.value.some((opt: any) => opt.value === value)
      if (exists) {
        await fetchSupplierContactNameList(value)
      } else {
        // 如果输入的是新值，清空供货姓名列表
        supplierContactNameList.value = []
        searchParams.salespersonName = ''
      }
    } else {
      supplierContactNameList.value = []
      searchParams.salespersonName = ''
    }

    clearTimeout((handleSupplierCompanyChange as any).timer)
    ;(handleSupplierCompanyChange as any).timer = setTimeout(() => {
      if (value) {
        baseTable.paginationParams.current = 1
        fetchData()
      }
    }, 500)
  }

  const handleSupplierContactSelect = (value: string) => {
    searchParams.salespersonName = value
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const handleSupplierContactChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    supplierContactAutoComplete.handleChange(value)
    searchParams.salespersonName = value
    baseTable.paginationParams.current = 1
    fetchData()
  }

  // 处理财务状态变化
  const handleFinancialStatusChange = () => {
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const invoiceTypeWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择票类型', 120)
    const types = ['普票1%', '专票1%', '专票13%', '普票13%', '专票6%', '普票6%', '其他']
    types.forEach((type: string) => {
      const width = calculateTextWidth(type, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    return maxWidth
  })

  // ==================== 表格列 & 列设置 ====================

  const sortParams = baseTable.sortParams as {
    sortField?: string
    sortOrder?: 'asc' | 'desc'
  }

  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'issueDate', title: '开票日期', dataIndex: 'issueDate', width: 140, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'amount', title: '开票金额', dataIndex: 'amount', width: 154, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'paymentAmount', title: '已付金额', dataIndex: 'paymentAmount', width: 154, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'unpaidAmount', title: '未付金额', dataIndex: 'unpaidAmount', width: 154, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'invoiceNo', title: '发票号码', dataIndex: 'invoiceNo', width: 196, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 3000 },
    { key: 'supplierName', title: '供货单位', dataIndex: 'supplierName', width: 280, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 3000 },
    { key: 'supplierContact', title: '供货姓名', dataIndex: 'supplierContact', width: 112, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'invoiceType', title: '发票类型', dataIndex: 'invoiceType', width: 112, sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 2000 },
    { key: 'invoicePurpose', title: '发票用途', dataIndex: 'invoicePurpose', width: 112, sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 2000 },
    { key: 'companyName', title: '公司名称', dataIndex: 'companyName', width: 280, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 5000 },
    { key: 'remark1', title: '备注', dataIndex: 'remark1', width: 200, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 5000 },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = [
    'serialNo',
    'issueDate',
    'amount',
    'paymentAmount',
    'unpaidAmount',
    'invoiceNo',
    'supplierName',
    'supplierContact',
    'invoiceType',
    'invoicePurpose',
    'companyName',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('INPUT_INVOICE_PAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  const selectedColumns = ref<string[]>(getStoredColumns())

  const customizableColumns = computed(() => allColumns.value)

  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  try {
    localStorage.removeItem('INPUT_INVOICE_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'INPUT_INVOICE_PAGE_TABLE_COLUMN_WIDTHS',
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
      sessionStorage.setItem('INPUT_INVOICE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 数据 & 表格交互 ====================

  const dataList = ref<API.InputInvoice_[]>([])
  const total = ref<number>(0)

  const dataListWithSerial = computed(() => {
    const current = Number(baseTable.paginationParams.current) || 1
    const pageSize = Number(baseTable.paginationParams.pageSize) || 10
    return dataList.value.map((item, index) => {
      const newItem = { ...item, serialNo: (current - 1) * pageSize + index + 1 } as API.InputInvoice_ & {
        serialNo: number
      }
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
    const maxRows = 10 // 最大显示行数

    if (tableRowCount.value <= maxRows) {
      // 如果行数 <= 10，不显示滚动条（返回undefined，Ant Design Vue会禁用垂直滚动）
      return undefined
    } else {
      // 如果行数 > 10，固定显示10行的高度，超出部分通过滚动条查看
      // scroll.y 只计算 body 部分的高度，不包括表头
      // 直接使用 maxRows * rowHeight 确保显示10行
      return maxRows * rowHeight
    }
  })

  const fetchData = async () => {
    try {
      const params: API.InputVoicePageDTO = {
        current: baseTable.paginationParams.current,
        pageSize: baseTable.paginationParams.pageSize,
      }
      // 4) 公司名称：进项发票查询接口使用 companyIds（ID 列表）
      if (searchParams.companyIds && searchParams.companyIds.length > 0) {
        params.companyIds = searchParams.companyIds
      }
      if (searchParams.supplierName) {
        params.supplierName = searchParams.supplierName
      }
      // 1) 供货姓名：接口字段使用 salespersonName（不再用 supplierContact）
      if (searchParams.salespersonName) {
        params.salespersonName = searchParams.salespersonName
      }

      // 2/3) 发票类型 / 用途：传名称列表 invoiceTypes / invoicePurposes
      if (searchParams.invoiceTypeIds && searchParams.invoiceTypeIds.length > 0) {
        const types = invoiceTypeList.value
          .filter((t: any) => t?.id && searchParams.invoiceTypeIds?.includes(t.id))
          .map((t: any) => t?.typeName)
          .filter((name: any) => !!name)
        if (types.length > 0) {
          ;(params as any).invoiceTypes = types
        }
      }
      if (searchParams.invoicePurposeIds && searchParams.invoicePurposeIds.length > 0) {
        const purposes = invoicePurposeList.value
          .filter((p: any) => p?.id && searchParams.invoicePurposeIds?.includes(p.id))
          .map((p: any) => p?.purposeName)
          .filter((name: any) => !!name)
        if (purposes.length > 0) {
          ;(params as any).invoicePurposes = purposes
        }
      }
      // 财务状态筛选逻辑：
      // 1. 不选和全选（两个都不选或两个都选）：不传入 isAccounted 字段
      // 2. 仅选中财务入账（isAccounted=true, isPaid=false）：传入 isAccounted=1
      // 3. 仅选中财务付款（isAccounted=false, isPaid=true）：传入 isAccounted=0
      const isAccountedChecked = searchParams.isAccounted === true
      const isPaidChecked = searchParams.isPaid === true
      
      if (isAccountedChecked && !isPaidChecked) {
        // 仅选中财务入账：传入 isAccounted=1
        params.isAccounted = 1
      } else if (!isAccountedChecked && isPaidChecked) {
        // 仅选中财务付款：传入 isAccounted=0
        params.isAccounted = 0
      }
      // 其他情况（两个都不选或两个都选）：不传入 isAccounted 字段
      if (searchParams.startDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.minAmount !== undefined && searchParams.minAmount !== null) {
        params.minAmount = searchParams.minAmount
      }
      if (searchParams.maxAmount !== undefined && searchParams.maxAmount !== null) {
        params.maxAmount = searchParams.maxAmount
      }
      // 优化：未付金额排序通过已付金额间接判断
      // 未付金额 = 开票金额 - 已付金额
      // 未付金额升序 = 已付金额降序，未付金额降序 = 已付金额升序
      let sortField = sortParams.sortField
      let sortOrder = sortParams.sortOrder
      if (sortField === 'unpaidAmount') {
        sortField = 'paymentAmount'
        // 反转排序顺序
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      }

      if (sortField) {
        params.sortField = sortField
        params.sortOrder = sortOrder
      }

      const res = (await listInputInvoiceByPageUsingPost(params)) as any
      if (res.data.code === 0 && res.data.data) {
        dataList.value = res.data.data.records ?? []
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

  const doTableChange = (pagination: any, filters: any, sorter: any) => {
    if (pagination && typeof pagination.current === 'number') {
      baseTable.paginationParams.current = pagination.current
    }
    if (pagination && typeof pagination.pageSize === 'number') {
      baseTable.paginationParams.pageSize = pagination.pageSize
    }
    if (sorter && sorter.field && sorter.order) {
      // 优化：未付金额排序通过已付金额间接判断
      // 未付金额 = 开票金额 - 已付金额
      // 未付金额升序 = 已付金额降序，未付金额降序 = 已付金额升序
      if (sorter.field === 'unpaidAmount') {
        sortParams.sortField = 'paymentAmount'
        // 反转排序顺序
        sortParams.sortOrder = sorter.order === 'ascend' ? 'desc' : 'asc'
      } else {
        sortParams.sortField = sorter.field
        sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
      }
    } else {
      // 取消排序时，完全清除排序参数
      delete sortParams.sortField
      delete sortParams.sortOrder
    }
    fetchData()
  }

  const handlePageChange = (page: number) => {
    baseTable.paginationParams.current = page
    fetchData()
  }

  const handlePageSizeChange = (size: number) => {
    baseTable.paginationParams.pageSize = size
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const doSearch = () => {
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const handleFilterChange = () => {
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const doReset = () => {
    searchParams.companyIds = []
    searchParams.supplierName = ''
    searchParams.salespersonName = ''
    searchParams.invoiceTypeIds = []
    searchParams.invoicePurposeIds = []
    searchParams.isAccounted = undefined
    searchParams.isPaid = undefined
    // 清空金额区间
    searchParams.minAmount = undefined
    searchParams.maxAmount = undefined
    // 重置为当前月份（使用字符串以匹配 a-date-picker 的 value-format）
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')
    searchParams.startDate = startOfMonth
    searchParams.endDate = endOfMonth
    dateRange.value = [dayjs(startOfMonth), dayjs(endOfMonth)]
    baseTable.paginationParams.current = 1
    fetchData()
  }

  // ==================== 导出 / 导入 ====================

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

      const baseParams: API.InputVoicePageDTO = {
        pageSize: 100,
      }
      if (searchParams.companyIds && searchParams.companyIds.length > 0) {
        baseParams.companyIds = searchParams.companyIds
      }
      if (searchParams.supplierName) {
        baseParams.supplierName = searchParams.supplierName
      }
      if (searchParams.salespersonName) {
        baseParams.salespersonName = searchParams.salespersonName
      }
      if (searchParams.invoiceTypeIds && searchParams.invoiceTypeIds.length > 0) {
        const types = invoiceTypeList.value
          .filter((t: any) => t?.id && searchParams.invoiceTypeIds?.includes(t.id))
          .map((t: any) => t?.typeName)
          .filter((name: any) => !!name)
        if (types.length > 0) {
          ;(baseParams as any).invoiceTypes = types
        }
      }
      if (searchParams.invoicePurposeIds && searchParams.invoicePurposeIds.length > 0) {
        const purposes = invoicePurposeList.value
          .filter((p: any) => p?.id && searchParams.invoicePurposeIds?.includes(p.id))
          .map((p: any) => p?.purposeName)
          .filter((name: any) => !!name)
        if (purposes.length > 0) {
          ;(baseParams as any).invoicePurposes = purposes
        }
      }
      // 财务状态筛选逻辑（与查询逻辑一致）：
      // 1. 不选和全选（两个都不选或两个都选）：不传入 isAccounted 字段
      // 2. 仅选中财务入账（isAccounted=true, isPaid=false）：传入 isAccounted=1
      // 3. 仅选中财务付款（isAccounted=false, isPaid=true）：传入 isAccounted=0
      const isAccountedChecked = searchParams.isAccounted === true
      const isPaidChecked = searchParams.isPaid === true
      
      if (isAccountedChecked && !isPaidChecked) {
        // 仅选中财务入账：传入 isAccounted=1
        baseParams.isAccounted = 1
      } else if (!isAccountedChecked && isPaidChecked) {
        // 仅选中财务付款：传入 isAccounted=0
        baseParams.isAccounted = 0
      }
      // 其他情况（两个都不选或两个都选）：不传入 isAccounted 字段
      if (searchParams.startDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        baseParams.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        baseParams.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.minAmount !== undefined && searchParams.minAmount !== null) {
        baseParams.minAmount = searchParams.minAmount
      }
      if (searchParams.maxAmount !== undefined && searchParams.maxAmount !== null) {
        baseParams.maxAmount = searchParams.maxAmount
      }
      // 排序：优先使用弹窗选择；否则使用当前表格排序
      let finalSortField = sortField || sortParams.sortField
      let finalSortOrder = sortOrder || sortParams.sortOrder

      // 优化：未付金额排序通过已付金额间接判断
      // 未付金额 = 开票金额 - 已付金额
      // 未付金额升序 = 已付金额降序，未付金额降序 = 已付金额升序
      if (finalSortField === 'unpaidAmount') {
        finalSortField = 'paymentAmount'
        // 反转排序顺序
        finalSortOrder = finalSortOrder === 'asc' ? 'desc' : 'asc'
      }

      if (finalSortField && typeof finalSortField === 'string' && finalSortField.trim() !== '') {
        baseParams.sortField = finalSortField
        baseParams.sortOrder = finalSortOrder
      }

      onProgress?.(5, '正在获取数据总数...')

      // 先获取第一页以确定总数
      const firstPageParams = { ...baseParams, current: 1 }
      const firstPageRes = (await listInputInvoiceByPageUsingPost(firstPageParams)) as any

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

      const total = firstPageRes.data.data.total || 0
      const totalPages = firstPageRes.data.data.pages ?? 1
      const allData: API.InputInvoice_[] = [...(firstPageRes.data.data.records ?? [])]

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
        const res = (await listInputInvoiceByPageUsingPost(params)) as any

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

      const exportData = allData.map((item: API.InputInvoice_) => {
        const invoiceDate = (item as any).invoiceDate || item.issueDate
        return {
          公司名称: item.companyName,
          供应商名称: item.supplierName,
          业务员: item.salespersonName || '',
          发票类型: item.invoiceType,
          发票用途: item.invoicePurpose,
          是否已入账: item.isAccounted ? '是' : '否',
          开票日期: invoiceDate ? dayjs(invoiceDate as any).format('YYYY-MM-DD') : '',
          金额: item.amount,
          税额: item.taxAmount || '',
          备注1: item.remark1 || '',
          备注2: item.remark2 || '',
          备注3: item.remark3 || '',
        }
      })

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'companyName': '公司名称',
            'supplierName': '供应商名称',
            'salespersonName': '业务员',
            'invoiceType': '发票类型',
            'invoicePurpose': '发票用途',
            'isAccounted': '是否已入账',
            'issueDate': '开票日期',
            'amount': '金额',
            'taxAmount': '税额',
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

      const fileName = `进项发票_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{
          sheetName: '进项发票',
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

  const importModalVisible = ref(false)

  const openImportModal = () => {
    importModalVisible.value = true
  }

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await sipplierUploadUsingPost({ overwrite }, {}, file)) as any
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

  const downloadTemplate = async () => {
    try {
      const response = await myAxios.get('/api/file/inputinvoice/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `进项发票模板.xlsx`
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

  // ==================== 创建 / 编辑弹窗 ====================

  const modalVisible = ref(false)
  const modalTitle = ref('添加进项发票')
  const formRef = ref()
  const editingId = ref<number | null>(null)
  const editingPaidAmount = ref<number | null>(null) // 保存编辑时的已付金额
  const currentEditIndex = ref<number>(-1)
  const targetSerialNo = ref<number | null>(null) // 临时存储目标序号（用于分页切换时避免闪烁）

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

  const formData = reactive<{
    companyId?: number
    companyName?: string
    salespersonId?: number
    issueDate?: Dayjs | null
    amount?: number
    invoiceNo?: string
    supplierName?: string
    supplierContact?: string
    invoiceType?: string
    invoicePurpose?: string
    invoiceStatus?: string
    remark1?: string
    uniqueKey?: string
  }>({
    companyId: undefined,
    companyName: '',
    salespersonId: undefined,
    issueDate: dayjs(),
    amount: undefined,
    invoiceNo: '',
    supplierName: '',
    supplierContact: '',
    invoiceType: '',
    invoicePurpose: '',
    invoiceStatus: '',
    remark1: '',
  })

  const handleCreate = () => {
    modalTitle.value = '添加进项发票'
    editingId.value = null
    editingPaidAmount.value = null // 清除已付金额
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    Object.assign(formData, {
      companyId: undefined,
      companyName: '', // 添加companyName字段
      salespersonId: undefined,
      issueDate: dayjs(),
      amount: undefined,
      invoiceNo: '',
      supplierName: '',
      supplierContact: '',
      invoiceType: '',
      invoicePurpose: '',
      invoiceStatus: '',
      remark1: '',
      uniqueKey: undefined,
    })
    modalVisible.value = true
  }

  const handleEdit = (record: API.InputInvoice_) => {
    modalTitle.value = '编辑进项发票'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    // 保存编辑时的已付金额（如果不存在或为0，则设为null，表示没有已付金额）
    // 进项发票使用 paymentAmount 字段表示已付金额
    const paidAmount = (record as any).paymentAmount || (record as any).totalPaidAmount || (record as any).paidAmount
    editingPaidAmount.value = paidAmount && paidAmount > 0 ? paidAmount : null
    Object.assign(formData, {
      companyId: record.companyId,
      companyName: record.companyName || '', // 添加companyName字段
      salespersonId: record.salespersonId,
      issueDate: record.issueDate ? dayjs(record.issueDate) : dayjs(),
      amount: record.amount,
      invoiceNo: record.invoiceNo,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      invoiceType: record.invoiceType,
      invoicePurpose: record.invoicePurpose,
      invoiceStatus: (record as any).invoiceStatus || '',
      remark1: record.remark1 || '',
      uniqueKey: (record as any).uniqueKey,
    })
    modalVisible.value = true
  }

  const handleSubmit = async (data: Partial<typeof formData>, callback?: (success: boolean) => void) => {
    try {
      // companyId 兜底拦截：确保“公司名称(companyName)”映射到真实 companyId
      if (data.companyName) {
        const normalizedName = (data.companyName || '').trim()
        const resolveCompanyId = () => {
          // 精确匹配
          let matched = companyList.value.find((c: API.Company) => (c.companyName || '').trim() === normalizedName)
          // 容错：大小写不敏感匹配
          if (!matched) {
            matched = companyList.value.find(
              (c: API.Company) => (c.companyName || '').trim().toLowerCase() === normalizedName.toLowerCase(),
            )
          }
          return matched?.id
        }

        let resolvedId = resolveCompanyId()
        // 兜底：可能公司列表还没加载（默认公司名直接提交时常见），先刷新一次再匹配
        if (!resolvedId) {
          await fetchCompanyList()
          resolvedId = resolveCompanyId()
        }
        if (resolvedId) {
          data.companyId = resolvedId
        }
      }

      if (!data.companyId) {
        message.error('公司信息未成功关联，请刷新页面或重新选择公司后再保存')
        callback?.(false)
        return
      }
      if (!data.issueDate) {
        message.error('请选择开票日期')
        callback?.(false)
        return
      }
      if (!data.amount) {
        message.error('请输入开票金额')
        callback?.(false)
        return
      }
      // 编辑模式下，校验开票金额必须大于已付金额
      if (editingId.value) {
        // 确保已付金额已正确获取
        if (editingPaidAmount.value !== null && editingPaidAmount.value > 0) {
          const newAmount = data.amount || 0
          const paidAmount = editingPaidAmount.value
          if (newAmount <= paidAmount) {
            message.error(`开票金额必须大于已付金额。当前已付金额：${paidAmount.toFixed(2)}，开票金额：${newAmount.toFixed(2)}`)
            callback?.(false)
            return
          }
        } else {
          // 如果已付金额未正确获取，尝试从当前记录中重新获取
          const currentRecord = dataList.value.find(item => item.id === editingId.value)
          if (currentRecord) {
            const paidAmount = (currentRecord as any).paymentAmount || (currentRecord as any).totalPaidAmount || (currentRecord as any).paidAmount || 0
            if (paidAmount > 0) {
              const newAmount = data.amount || 0
              if (newAmount <= paidAmount) {
                message.error(`开票金额必须大于已付金额。当前已付金额：${paidAmount.toFixed(2)}，开票金额：${newAmount.toFixed(2)}`)
                callback?.(false)
                return
              }
            }
          }
        }
      }
      if (!data.invoiceNo) {
        message.error('请输入发票号码')
        callback?.(false)
        return
      }
      if (!data.supplierName) {
        message.error('请输入供货单位')
        callback?.(false)
        return
      }

      // 强校验：供货单位 + 供货姓名 必须匹配（测试场景：供货单位满足条件但供货姓名不满足条件 -> 必须拒绝提交）
      if (!data.supplierContact) {
        message.error('请输入供货姓名')
        callback?.(false)
        return
      }
      {
        const existsRes = (await existsSupplierUsingPost({
          companyName: data.supplierName,
          supplierName: data.supplierContact,
        } as any)) as any
        const exists = existsRes?.data?.code === 0 && existsRes?.data?.data?.exists
        const sid = existsRes?.data?.data?.supplierId
        const supplierId = Array.isArray(sid) ? sid[0] : sid
        if (!exists || !supplierId) {
          message.error('供货单位关联失败：请从下拉选择正确的供货姓名，或先创建供应商信息')
          callback?.(false)
          return
        }
        ;(data as any).supplierId = supplierId
      }
      const submitData: API.InputInvoiceAddDTO = {
        companyId: data.companyId,
        salespersonId: data.salespersonId,
        supplierId: (data as any).supplierId,
        issueDate: typeof data.issueDate === 'string' ? data.issueDate : data.issueDate.format('YYYY-MM-DD'),
        amount: data.amount,
        invoiceNo: data.invoiceNo!,
        supplierName: data.supplierName,
        supplierContact: data.supplierContact,
        invoiceType: data.invoiceType,
        invoicePurpose: data.invoicePurpose,
        remark1: data.remark1,
      }
      if (editingId.value) {
        const res = (await updateInputInvoiceUsingPost({ ...submitData, id: editingId.value })) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          // 编辑模式下，不关闭弹窗，等待用户点击"下一条"或关闭
          await fetchData()
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        const res = (await addInputInvoiceUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
          // 新增模式下，不关闭弹窗，等待用户点击"下一条"或关闭
          await fetchData()
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

  const handleCancel = () => {
    modalVisible.value = false
    formRef.value?.resetFields()
    editingId.value = null
    editingPaidAmount.value = null // 清除已付金额
    currentEditIndex.value = -1
  }

  // 处理下一条事件（连续录入 - 新增模式）
  const handleNext = () => {
    // 保留所有字段状态，不做任何清空
    // 只清除验证状态，不清除字段值
    formRef.value?.clearValidate()
    // 重置编辑索引
    currentEditIndex.value = -1
    editingId.value = null
  }

  // 处理编辑模式下的上一条
  const handlePrevEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingId.value) {
        const foundIndex = dataList.value.findIndex(item => item.id === editingId.value)
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
      let prevRecord: API.InputInvoice_ | undefined

      // 如果上一条记录在当前页
      if (prevIndex >= 0) {
        prevRecord = dataList.value[prevIndex]
        currentEditIndex.value = prevIndex
      } else {
        // 如果上一条记录在上一页
        const currentPage = baseTable.paginationParams.current
        const pageSize = Number(baseTable.paginationParams.pageSize) || 10

        if (currentPage > 1) {
          const targetPage = currentPage - 1
          // 设置临时序号（预估，假设上一页是满页）
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize

          // 加载上一页数据
          baseTable.paginationParams.current = targetPage
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
        editingId.value = prevRecord.id || null
        Object.assign(formData, {
          companyId: prevRecord.companyId,
          companyName: prevRecord.companyName || '', // 添加companyName字段
          salespersonId: prevRecord.salespersonId,
          issueDate: prevRecord.issueDate ? dayjs(prevRecord.issueDate) : dayjs(),
          amount: prevRecord.amount,
          invoiceNo: prevRecord.invoiceNo,
          supplierName: prevRecord.supplierName,
          supplierContact: prevRecord.supplierContact,
          invoiceType: prevRecord.invoiceType,
          invoicePurpose: prevRecord.invoicePurpose,
          invoiceStatus: (prevRecord as any).invoiceStatus || '',
          remark1: prevRecord.remark1 || '',
          uniqueKey: (prevRecord as any).uniqueKey,
        })
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

  // 处理编辑模式下的下一条
  const handleNextEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
      if (currentEditIndex.value < 0 && editingId.value) {
        const foundIndex = dataList.value.findIndex(item => item.id === editingId.value)
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
      let nextRecord: API.InputInvoice_ | undefined

      // 如果下一条记录在当前页
      if (nextIndex < dataList.value.length) {
        nextRecord = dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        // 如果下一条记录在下一页
        const totalPages = Math.ceil(baseTable.total.value / baseTable.paginationParams.pageSize)
        const currentPage = baseTable.paginationParams.current
        const pageSize = Number(baseTable.paginationParams.pageSize) || 10

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          // 设置临时序号，避免闪烁
          targetSerialNo.value = (targetPage - 1) * pageSize + 1

          // 加载下一页数据
          baseTable.paginationParams.current = targetPage
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
        Object.assign(formData, {
          companyId: nextRecord.companyId,
          companyName: nextRecord.companyName || '', // 添加companyName字段
          salespersonId: nextRecord.salespersonId,
          issueDate: nextRecord.issueDate ? dayjs(nextRecord.issueDate) : dayjs(),
          amount: nextRecord.amount,
          invoiceNo: nextRecord.invoiceNo,
          supplierName: nextRecord.supplierName,
          supplierContact: nextRecord.supplierContact,
          invoiceType: nextRecord.invoiceType,
          invoicePurpose: nextRecord.invoicePurpose,
          invoiceStatus: (nextRecord as any).invoiceStatus || '',
          remark1: nextRecord.remark1 || '',
          uniqueKey: (nextRecord as any).uniqueKey,
        })
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

  const handleDelete = (record: API.InputInvoice_) => {
    const confirmContent = () => {
      return h('div', [
        h('div', { style: { marginBottom: '12px' } }, `确定要删除进项发票 ${record.invoiceNo} 吗？`),
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
          const res = (await deleteInputInvoiceUsingPost({ id: record.id })) as any
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

  // 撤销出账
  const handleCancelPayment = (invoiceIds: (number | string)[]) => {
    if (!invoiceIds || invoiceIds.length === 0) {
      message.warning('请先选择要撤销出账的进项发票')
      return
    }

    const confirmContent = () => {
      return h('div', [
        h('div', { style: { marginBottom: '12px' } }, '确定要撤销选中进项发票的出账记录吗？'),
        h('div', { style: { color: '#ff4d4f', marginTop: '8px' } }, '警告：该操作会删除该出账记录关联的银行收支记录，该操作不可撤销')
      ])
    }

    Modal.confirm({
      title: '确认撤销出账',
      content: confirmContent,
      okText: '确定撤销',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 对每个选中的发票调用撤销出账接口
          const promises = invoiceIds.map(async (invoiceId) => {
            const invoice = dataList.value.find((item: API.InputInvoice_) => {
              return item.id === invoiceId
            })
            
            if (!invoice || !invoice.id) {
              return { success: false, invoiceNo: '未知', error: '发票ID不存在' }
            }

            const res = (await cancelInputPaymentUsingPost({ id: invoice.id })) as any
            return {
              success: res.data.code === 0,
              invoiceNo: invoice.invoiceNo || '未知',
              message: res.data.message || '',
            }
          })

          const results = await Promise.all(promises)
          const successResults = results.filter(r => r.success)
          const failResults = results.filter(r => !r.success)

          if (successResults.length > 0) {
            message.success('撤销出账成功')
          }
          if (failResults.length > 0) {
            // 撤销出账失败时，直接展示后端返回的 message（多条用换行拼接）
            const msg = failResults
              .map(r => r.message || `发票 ${r.invoiceNo} 撤销失败`)
              .join('\n')
            message.error(msg)
          }
          await fetchData()
        } catch (error: any) {
          console.error('撤销出账失败', error)
          message.error(error.message || '撤销出账失败')
        }
      },
    })
  }

  // ==================== 公共初始化 & 公司选择弹窗 ====================

  const showCompanyModal = ref(false)
  const showInvoiceTypeModal = ref(false)
  const showInvoicePurposeModal = ref(false)

  const handleCompanyModalOk = (selectedCompanyIds: number[]) => {
    searchParams.companyIds = selectedCompanyIds
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const selectedInvoiceTypeNamesText = computed(() => {
    if (!searchParams.invoiceTypeIds || searchParams.invoiceTypeIds.length === 0) {
      return ''
    }
    const selectedTypes = invoiceTypeList.value.filter((type: API.InvoiceType_) =>
      type.id && searchParams.invoiceTypeIds?.includes(type.id)
    )
    return selectedTypes.map((t: API.InvoiceType_) => t.typeName || '').join(', ')
  })

  const invoiceTypeSelectButtonWidth = computed(() => {
    const placeholder = '请选择发票类型'
    if (selectedInvoiceTypeNamesText.value) {
      const contentWidth = calculateTextWidth(selectedInvoiceTypeNamesText.value, 120, 180)
      const placeholderWidth = calculateTextWidth(placeholder, 120)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 120)
  })

  const handleInvoiceTypeModalOk = (selectedTypeIds: number[]) => {
    searchParams.invoiceTypeIds = selectedTypeIds
    baseTable.paginationParams.current = 1
    fetchData()
  }

  const selectedInvoicePurposeNamesText = computed(() => {
    if (!searchParams.invoicePurposeIds || searchParams.invoicePurposeIds.length === 0) {
      return ''
    }
    const selectedPurposes = invoicePurposeList.value.filter((purpose: API.InvoicePurposeItemVO) =>
      purpose.id && searchParams.invoicePurposeIds?.includes(purpose.id)
    )
    return selectedPurposes.map((p: API.InvoicePurposeItemVO) => p.purposeName || '').join(', ')
  })

  const invoicePurposeSelectButtonWidth = computed(() => {
    const placeholder = '请选择发票用途'
    if (selectedInvoicePurposeNamesText.value) {
      const contentWidth = calculateTextWidth(selectedInvoicePurposeNamesText.value, 120, 180)
      const placeholderWidth = calculateTextWidth(placeholder, 120)
      return Math.max(contentWidth, placeholderWidth)
    }
    return calculateTextWidth(placeholder, 120)
  })

  const handleInvoicePurposeModalOk = (selectedPurposeIds: number[]) => {
    searchParams.invoicePurposeIds = selectedPurposeIds
    baseTable.paginationParams.current = 1
    fetchData()
  }

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

  const fetchInvoicePurposeList = async () => {
    try {
      // 优先使用 enabled 列表接口（更轻量）
      const res = (await queryInvoicePurposeListEnabledUsingGet()) as any
      if (res.data.code === 0) {
        invoicePurposeList.value = (res.data.data || []) as any[]
        return
      }
      // fallback（避免后端未上线 enabled 时阻塞）
      const fallback = (await queryInvoicePurposePageUsingPost({ current: 1, pageSize: 1000 })) as any
      if (fallback.data.code === 0 && fallback.data.data) {
        invoicePurposeList.value = fallback.data.data.records ?? []
      }
    } catch (error) {
      console.error('获取发票用途列表失败', error)
    }
  }

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('INPUT_INVOICE_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('INPUT_INVOICE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('INPUT_INVOICE_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      filterCollapsed.value = false
      filterCollapseKey.value = ['filter']
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 折叠
    filterCollapsed,
    filterCollapseKey,
    handleFilterCollapseChange,
    handleFilterCollapseToggle,

    // 表格基础
    loading: baseTable.loading,
    pagination: baseTable.pagination,
    paginationParams: baseTable.paginationParams,
    searchParams,
    sortParams,
    dataList,
    dataListWithSerial,
    tableRowCount,
    tableScrollHeight,
    fetchData,
    doTableChange,
    handlePageChange,
    handlePageSizeChange,
    doSearch,
    handleFilterChange,
    doReset,

    // 公司 / 供应商
    companyList,
    employeeList,
    selectedCompanyNamesText,
    companySelectButtonWidth,
    supplierCompanyOptions,
    supplierCompanyWidth,
    filteredSupplierContactOptions,
    supplierContactWidth,
    invoiceTypeWidth,
    handleSupplierCompanySelect,
    handleSupplierCompanyChange,
    handleSupplierContactSelect,
    handleSupplierContactChange,
    handleFinancialStatusChange,
    fetchSupplierCompanyOptions,

    // 列设置
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
    openImportModal,
    handleImport,
    downloadTemplate,

    // 创建 / 编辑弹窗
    modalVisible,
    modalTitle,
    formRef,
    formData,
    editingId,
    currentEditSerialNo,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleCancel,
    handleNext,
    handleNextEdit,
    handlePrevEdit,
    handleDelete,
    handleCancelPayment,

    // 公司选择模态框
    showCompanyModal,
    handleCompanyModalOk,

    // 发票类型选择模态框
    showInvoiceTypeModal,
    invoiceTypeList,
    selectedInvoiceTypeNamesText,
    invoiceTypeSelectButtonWidth,
    handleInvoiceTypeModalOk,

    // 发票用途选择模态框
    showInvoicePurposeModal,
    invoicePurposeList,
    selectedInvoicePurposeNamesText,
    invoicePurposeSelectButtonWidth,
    handleInvoicePurposeModalOk,

    // 额外
    dateRange,
    handleDateRangeChange,

    // 初始化与基础数据加载
    fetchCompanyList,
    fetchEmployeeList,
    fetchInvoiceTypeList,
    fetchInvoicePurposeList,
    initPageSettings,
  }
}


