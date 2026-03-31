import { computed, onMounted, reactive, ref, nextTick, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { exportJsonToExcel } from '@/utils/exportExcel'
import dayjs from 'dayjs'
import {
  listClientByPageUsingPost,
  addClientUsingPost,
  updateClientUsingPost,
  deleteClientUsingPost,
  getClientCompanyNamesUsingGet,
} from '@/api/kehuxinxiguanli'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useFilterCollapse } from '@/composables/useFilterCollapse'
import { clientUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import myAxios from '@/request'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

/**
 * 客户管理页面 Hook
 * 封装筛选、表格列、分页、导入导出、增删改等逻辑
 */
export function useClientManage() {
  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'CLIENT_MANAGE_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        companyName?: string
        userName?: string
        userPhone?: string
        taxNo?: string
        legalPerson?: string
        registerAddress?: string
      }
      return parsed
    } catch (error) {
      console.error('加载客户管理筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    companyName: string
    userName: string
    userPhone: string
    taxNo: string
    legalPerson: string
    registerAddress: string
  }) => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(params))
    } catch (error) {
      console.error('保存客户管理筛选条件失败', error)
    }
  }

  // 筛选收缩状态
  try {
    sessionStorage.removeItem('CLIENT_MANAGE_PAGE_FILTER_COLLAPSED')
  } catch (error) {
    console.error('清除筛选框状态失败', error)
  }
  const { filterCollapsed, filterCollapseKey } = useFilterCollapse('CLIENT_MANAGE_PAGE_FILTER_COLLAPSED', false)

  const handleFilterCollapseChange = (keys: string[] | string) => {
    const arr = Array.isArray(keys) ? keys : [keys]
    filterCollapsed.value = !arr.includes('filter')
  }

  const handleFilterCollapseToggle = () => {
    const willCollapse = !filterCollapsed.value
    filterCollapsed.value = willCollapse
    filterCollapseKey.value = willCollapse ? [] : ['filter']
  }

  // 所有可用列（按用户要求的顺序：序号、客户单位、客户姓名、客户电话、公司税号、银行名称、银行账号、法人、注册电话、注册地址、邮箱、微信、经营范围、业务经理、添加日期、备注1）
  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'companyName', title: '客户单位', dataIndex: 'companyName', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'userName', title: '客户姓名', dataIndex: 'userName', width: 112, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'userPhone', title: '客户电话', dataIndex: 'userPhone', width: 182, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 3000 },
    { key: 'taxNo', title: '公司税号', dataIndex: 'taxNo', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'bankName', title: '银行名称', dataIndex: 'bankName', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'bankAccount', title: '银行账号', dataIndex: 'bankAccount', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'legalPerson', title: '法人', dataIndex: 'legalPerson', width: 112, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'registerPhone', title: '注册电话', dataIndex: 'registerPhone', width: 182, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 3000 },
    { key: 'registerAddress', title: '注册地址', dataIndex: 'registerAddress', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'email', title: '邮箱', dataIndex: 'email', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'wechat', title: '微信', dataIndex: 'remark2', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 }, // 微信使用remark2字段
    { key: 'businessScope', title: '经营范围', dataIndex: 'businessScope', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'salespersonName', title: '业务经理', dataIndex: 'salespersonName', width: 112, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'createTime', title: '添加日期', dataIndex: 'createTime', width: 172, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'remark1', title: '备注', dataIndex: 'remark1', width: 200, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 5000 },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = [
    'serialNo',
    'companyName',
    'userName',
    'userPhone',
    'taxNo',
    'bankName',
    'bankAccount',
    'legalPerson',
    'registerPhone',
    'registerAddress',
    'email',
    'wechat',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('CLIENT_MANAGE_PAGE_SELECTED_COLUMNS')
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
    localStorage.removeItem('CLIENT_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'CLIENT_MANAGE_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // 数据 & 分页
  const dataList = ref<API.Client_[]>([])
  const total = ref<number>(0)

  const paginationParams = reactive({
    current: 1,
    pageSize: 10,
  })

  const pagination = computed(() => ({
    current: paginationParams.current,
    pageSize: paginationParams.pageSize,
    total: total.value,
    showSizeChanger: true,
    showTotal: (t: number) => `共 ${t} 条`,
  }))

  const dataListWithSerial = computed(() => {
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10
    return dataList.value.map((item, index) => {
      const newItem = { ...item, serialNo: (current - 1) * pageSize + index + 1 } as API.Client_ & { serialNo: number }
      return newItem
    })
  })

  // 表格行数
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

  // 搜索条件（客户单位、客户姓名、客户电话、公司税号、法人、注册地址）
  const searchParams = reactive({
    companyName: '',
    userName: '',
    userPhone: '',
    taxNo: '',
    legalPerson: '',
    registerAddress: '',
  })

  // 优先从本地存储恢复筛选条件
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (typeof storedParams.companyName === 'string') {
      searchParams.companyName = storedParams.companyName
    }
    if (typeof storedParams.userName === 'string') {
      searchParams.userName = storedParams.userName
    }
    if (typeof storedParams.userPhone === 'string') {
      searchParams.userPhone = storedParams.userPhone
    }
    if (typeof storedParams.taxNo === 'string') {
      searchParams.taxNo = storedParams.taxNo
    }
    if (typeof storedParams.legalPerson === 'string') {
      searchParams.legalPerson = storedParams.legalPerson
    }
    if (typeof storedParams.registerAddress === 'string') {
      searchParams.registerAddress = storedParams.registerAddress
    }
  }

  // 监听筛选条件变化，自动持久化
  watch(
    () => ({
      companyName: searchParams.companyName || '',
      userName: searchParams.userName || '',
      userPhone: searchParams.userPhone || '',
      taxNo: searchParams.taxNo || '',
      legalPerson: searchParams.legalPerson || '',
      registerAddress: searchParams.registerAddress || '',
    }),
    (val) => {
      saveSearchParamsToStorage(val)
    },
    { deep: true }
  )

  // 排序状态
  const sortParams = reactive<{
    sortField?: string
    sortOrder?: 'asc' | 'desc'
  }>({
    sortField: 'createTime',
    sortOrder: 'desc',
  })

  // 客户列表 & 筛选下拉
  const clientList = ref<API.Client_[]>([])

  // 客户单位选项（基础选项，不包含"全部"）
  const baseClientCompanyOptions = computed(() => {
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
  const clientCompanyAutoComplete = useAutoCompleteWithExtra({
    baseOptions: baseClientCompanyOptions,
    currentValue: computed(() => searchParams.companyName || ''),
    enableAutoAdd: true,
  })

  // 客户单位选项（包含"全部"选项）
  const clientCompanyOptions = computed(() => {
    return [{ value: '', label: '全部' }, ...clientCompanyAutoComplete.filteredOptions.value]
  })

  const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
    const estimatedWidth = text.length * 14 + 40
    return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
  }

  const customerCompanyWidth = computed(() => {
    let maxWidth = calculateTextWidth('选择或输入客户单位', 120)
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

  const handleClientCompanySelect = (value: string) => {
    if (value === '') {
      searchParams.companyName = ''
    }
    paginationParams.current = 1
    fetchData()
  }

  const handleClientCompanyChange = (value: string) => {
    // 使用 composable 的 handleChange 自动添加输入内容
    clientCompanyAutoComplete.handleChange(value)
    
    clearTimeout((handleClientCompanyChange as any).timer)
    ;(handleClientCompanyChange as any).timer = setTimeout(() => {
      paginationParams.current = 1
      fetchData()
    }, 500)
  }

  // 统一的筛选框变化处理函数（防抖）
  let filterChangeTimer: any = null
  const handleFilterChange = () => {
    clearTimeout(filterChangeTimer)
    filterChangeTimer = setTimeout(() => {
      paginationParams.current = 1
      fetchData()
    }, 500)
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

  const fetchData = async () => {
    try {
      const params: API.ClientPageDto = {
        current: paginationParams.current,
        pageSize: paginationParams.pageSize,
        companyName: searchParams.companyName || undefined,
        userName: searchParams.userName || undefined,
        userPhone: searchParams.userPhone || undefined,
        taxNo: searchParams.taxNo || undefined,
        legalPerson: searchParams.legalPerson || undefined,
        registerAddress: searchParams.registerAddress || undefined,
      }
      // 处理排序参数（只有当 sortField 存在且不为空时才添加）
      if (sortParams.sortField && typeof sortParams.sortField === 'string' && sortParams.sortField.trim() !== '') {
        ;(params as any).sortField = sortParams.sortField
        ;(params as any).sortOrder = sortParams.sortOrder
      }
      const res = (await listClientByPageUsingPost(params)) as any
      if (res.data.code === 0 && res.data.data) {
        dataList.value = res.data.data.records ?? []
        total.value = res.data.data.total ?? 0
      } else {
        message.error('获取客户列表失败 ' + (res.data.message || ''))
      }
    } catch (error) {
      message.error('获取客户列表失败')
    }
  }

  const handlePageChange = (page: number) => {
    paginationParams.current = page
    fetchData()
  }

  // 每页条数变化（由 InvoicePagination 的 update:pageSize 触发，只传入 size）
  const handlePageSizeChange = (size: number) => {
    paginationParams.current = 1
    paginationParams.pageSize = size
    fetchData()
  }

  const doTableChange = (paginationInner: any, filters: any, sorter: any) => {
    paginationParams.current = paginationInner.current
    paginationParams.pageSize = paginationInner.pageSize
    if (sorter && sorter.field && sorter.order) {
      sortParams.sortField = sorter.field
      sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
    } else {
      // 取消排序时，恢复到初始化的默认排序
      sortParams.sortField = 'createTime'
      sortParams.sortOrder = 'desc'
    }
    fetchData()
  }

  const doSearch = () => {
    paginationParams.current = 1
    fetchData()
  }

  const doReset = () => {
    searchParams.companyName = ''
    searchParams.userName = ''
    searchParams.userPhone = ''
    searchParams.taxNo = ''
    searchParams.legalPerson = ''
    searchParams.registerAddress = ''
    paginationParams.current = 1
    fetchData()
  }

  // 列设置弹窗
  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('CLIENT_MANAGE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // 添加/编辑弹窗
  const modalVisible = ref(false)
  const modalTitle = ref('添加客户')
  const formData = reactive<{
    companyName?: string
    userName?: string
    userPhone?: string
    taxNo?: string
    legalPerson?: string
    registerPhone?: string
    registerAddress?: string
    email?: string
    wechat?: string
    bankName?: string
    bankAccount?: string
    salespersonName?: string
    businessScope?: string
    remark1?: string
  }>({
    companyName: '',
    userName: '',
    userPhone: '',
    taxNo: '',
    legalPerson: '',
    registerPhone: '',
    registerAddress: '',
    email: '',
    wechat: '',
    bankName: '',
    bankAccount: '',
    salespersonName: '',
    businessScope: '',
    remark1: '',
  })

  const editingId = ref<number | null>(null)
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
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10
    return (current - 1) * pageSize + currentEditIndex.value + 1
  })

  const doAddClient = () => {
    modalTitle.value = '添加-客户'
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    Object.assign(formData, {
      companyName: '',
      userName: '',
      userPhone: '',
      taxNo: '',
      legalPerson: '',
      registerPhone: '',
      registerAddress: '',
      email: '',
      wechat: '',
      bankName: '',
      bankAccount: '',
      salespersonName: '',
      businessScope: '',
      remark1: '',
    })
    modalVisible.value = true
  }

  const doEdit = (record: API.Client_) => {
    modalTitle.value = '修改-客户'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 查找当前记录在列表中的索引
    const foundIndex = dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = foundIndex >= 0 ? foundIndex : -1
    Object.assign(formData, {
      companyName: record.companyName || '',
      userName: record.userName || '',
      userPhone: record.userPhone || '',
      taxNo: record.taxNo || '',
      legalPerson: record.legalPerson || '',
      registerPhone: record.registerPhone || '',
      registerAddress: record.registerAddress || '',
      email: record.email || '',
      wechat: record.remark2 || '', // 微信从remark2读取
      bankName: record.bankName || '',
      bankAccount: record.bankAccount || '',
      salespersonName: record.salespersonName || '',
      businessScope: record.businessScope || '',
      remark1: record.remark1 || '',
    })
    modalVisible.value = true
  }

  const handleSubmit = async (data: {
    companyName: string
    userName: string
    userPhone: string
    taxNo: string
    legalPerson: string
    registerPhone: string
    registerAddress: string
    email: string
    wechat: string // 微信字段，需要存储到remark2
    bankName: string
    bankAccount: string
    salespersonName: string
    businessScope: string
    remark1: string
  }, callback?: (success: boolean) => void) => {
    try {
      if (editingId.value) {
        const submitData: API.ClientUpdateDto = {
          id: editingId.value,
          companyName: data.companyName,
          userName: data.userName,
          userPhone: data.userPhone,
          taxNo: data.taxNo,
          legalPerson: data.legalPerson,
          registerPhone: data.registerPhone,
          registerAddress: data.registerAddress,
          email: data.email,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          salespersonName: data.salespersonName,
          businessScope: data.businessScope,
          remark1: data.remark1,
          remark2: data.wechat, // 微信存储到remark2
        } as any
        const res = (await updateClientUsingPost(submitData)) as any
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
        const submitData: API.ClientAddDto = {
          companyName: data.companyName,
          userName: data.userName,
          userPhone: data.userPhone,
          taxNo: data.taxNo,
          legalPerson: data.legalPerson,
          registerPhone: data.registerPhone,
          registerAddress: data.registerAddress,
          email: data.email,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          salespersonName: data.salespersonName,
          businessScope: data.businessScope,
          remark1: data.remark1,
          remark2: data.wechat, // 微信存储到remark2
        } as any
        const res = (await addClientUsingPost(submitData)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
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

  const doDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据不可恢复，是否继续？',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        try {
          const res = (await deleteClientUsingPost({ id })) as any
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

  // 处理下一条事件（连续录入 - 新增模式）
  const handleNext = () => {
    // 新增模式：保留所有已填入的字段，包括唯一字段
    // 不进行任何字段清空操作，完全保留所有数据
    // 重置编辑索引
    currentEditIndex.value = -1
    editingId.value = null
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
      let nextRecord: API.Client_ | undefined

      // 如果下一条记录在当前页
      if (nextIndex < dataList.value.length) {
        nextRecord = dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        // 如果下一条记录在下一页
        const totalPages = Math.ceil(total.value / paginationParams.pageSize)
        const currentPage = paginationParams.current

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          const pageSize = Number(paginationParams.pageSize) || 10
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
          companyName: nextRecord.companyName || '',
          userName: nextRecord.userName || '',
          userPhone: nextRecord.userPhone || '',
          taxNo: nextRecord.taxNo || '',
          legalPerson: nextRecord.legalPerson || '',
          registerPhone: nextRecord.registerPhone || '',
          registerAddress: nextRecord.registerAddress || '',
          email: nextRecord.email || '',
          wechat: nextRecord.remark2 || '',
          bankName: nextRecord.bankName || '',
          bankAccount: nextRecord.bankAccount || '',
          salespersonName: nextRecord.salespersonName || '',
          businessScope: nextRecord.businessScope || '',
          remark1: nextRecord.remark1 || '',
        })
        callback?.(true)
      } else {
        message.warning('无法获取下一条记录')
        callback?.(false)
      }
    } catch (error) {
      console.error('获取下一条记录失败', error)
      message.error('获取下一条记录失败')
      callback?.(false)
    }
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
      let prevRecord: API.Client_ | undefined
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
        editingId.value = prevRecord.id || null
        Object.assign(formData, {
          companyName: prevRecord.companyName || '',
          userName: prevRecord.userName || '',
          userPhone: prevRecord.userPhone || '',
          taxNo: prevRecord.taxNo || '',
          legalPerson: prevRecord.legalPerson || '',
          registerPhone: prevRecord.registerPhone || '',
          registerAddress: prevRecord.registerAddress || '',
          email: prevRecord.email || '',
          wechat: prevRecord.remark2 || '',
          bankName: prevRecord.bankName || '',
          bankAccount: prevRecord.bankAccount || '',
          salespersonName: prevRecord.salespersonName || '',
          businessScope: prevRecord.businessScope || '',
          remark1: prevRecord.remark1 || '',
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

  // 导入 / 导出
  const importModalVisible = ref(false)

  const openImportModal = () => {
    importModalVisible.value = true
  }

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await clientUploadUsingPost({ overwrite }, {}, file)) as any
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
      const response = await myAxios.get('/api/file/client/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `客户信息模板.xlsx`
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

      const baseParams: API.ClientPageDto = {
        pageSize: 100,
        companyName: searchParams.companyName || undefined,
        userName: searchParams.userName || undefined,
        userPhone: searchParams.userPhone || undefined,
        taxNo: searchParams.taxNo || undefined,
        legalPerson: searchParams.legalPerson || undefined,
        registerAddress: searchParams.registerAddress || undefined,
      }
      // 排序：优先使用弹窗选择；否则使用当前表格排序
      const finalSortField = sortField || sortParams.sortField
      const finalSortOrder = sortOrder || sortParams.sortOrder
      if (finalSortField) {
        ;(baseParams as any).sortField = finalSortField
        ;(baseParams as any).sortOrder = finalSortOrder
      }
      
      onProgress?.(5, '正在获取数据总数...')
      
      // 先获取第一页以确定总数
      const firstPageRes = (await listClientByPageUsingPost({ ...baseParams, current: 1 })) as any
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      if (firstPageRes.data.code !== 0 || !firstPageRes.data.data) {
        message.error('获取客户列表失败 ' + (firstPageRes.data.message || ''))
        onCancel?.()
        return
      }
      
      const total = firstPageRes.data.data.total || 0
      const totalPages = firstPageRes.data.data.pages ?? 1
      const allData: API.Client_[] = [...(firstPageRes.data.data.records ?? [])]
      
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
        const res = (await listClientByPageUsingPost(params)) as any
        
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        if (res.data.code !== 0 || !res.data.data) {
          message.error('获取客户列表失败 ' + (res.data.message || ''))
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

      const exportData = allData.map((item: API.Client_) => ({
        客户单位: item.companyName,
        客户姓名: item.userName || '',
        客户电话: item.userPhone || '',
        公司税号: item.taxNo,
        银行名称: item.bankName,
        银行账号: item.bankAccount,
        法人: item.legalPerson || '',
        注册电话: item.registerPhone,
        注册地址: item.registerAddress,
        邮箱: item.email || '',
        微信: item.remark2 || '',
        经营范围: item.businessScope || '',
        业务经理: item.salespersonName || '',
        添加日期: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD') : '',
        备注: item.remark1 || '',
      }))

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'companyName': '客户单位',
            'userName': '客户姓名',
            'userPhone': '客户电话',
            'taxNo': '公司税号',
            'bankName': '银行名称',
            'bankAccount': '银行账号',
            'legalPerson': '法人',
            'registerPhone': '注册电话',
            'registerAddress': '注册地址',
            'email': '邮箱',
            'remark2': '微信',
            'businessScope': '经营范围',
            'salespersonName': '业务经理',
            'createTime': '添加日期',
            'remark1': '备注',
          }
          const exportKey = keyMap[col.dataIndex] || col.dataIndex
          return {
            key: exportKey,
            width: col.width || 120,
            align: col.align || 'center',
          }
        })
      
      // 生成 Excel 文件时直接到 100%，由 exportJsonToExcel 内部处理

      const fileName = `客户信息_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '客户信息', 
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

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('CLIENT_MANAGE_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('CLIENT_MANAGE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('CLIENT_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      filterCollapsed.value = false
      filterCollapseKey.value = ['filter']
      // 设置默认排序：创建时间降序
      if (!sortParams.sortField) {
        sortParams.sortField = 'createTime'
        sortParams.sortOrder = 'desc'
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  onMounted(async () => {
    initPageSettings()
    await fetchClientList()
    fetchData()
  })

  return {
    // 筛选收缩
    filterCollapsed,
    filterCollapseKey,
    handleFilterCollapseChange,
    handleFilterCollapseToggle,

    // 列 & 列设置
    allColumns,
    selectedColumns,
    customizableColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,
    tableScrollHeight,
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 数据 & 分页
    dataListWithSerial,
    pagination,
    paginationParams,
    fetchData,
    handlePageChange,
    handlePageSizeChange,
    doTableChange,

    // 筛选
    searchParams,
    clientCompanyOptions,
    customerCompanyWidth,
    handleClientCompanySelect,
    handleClientCompanyChange,
    handleFilterChange,
    doSearch,
    doReset,

    // 客户列表
    clientList,
    fetchClientList,

    // 表单弹窗
    modalVisible,
    modalTitle,
    formData,
    editingId,
    doAddClient,
    doEdit,
    handleSubmit,
    doDelete,
    handleNext,
    handleNextEdit,
    handlePrevEdit,
    currentEditSerialNo,

    // 导入 / 导出
    importModalVisible,
    openImportModal,
    handleImport,
    downloadTemplate,
    handleExport,
    exportModalVisible,
    openExportModal,

    // 初始化
    initPageSettings,
  }
}


