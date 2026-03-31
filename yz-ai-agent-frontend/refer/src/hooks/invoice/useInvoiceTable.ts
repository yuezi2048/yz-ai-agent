import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { queryInvoicePageUsingPost } from '@/api/fapiaoxinxiguanli'

/**
 * 发票表格 Hook
 * 管理表格数据、分页、筛选、排序等状态和逻辑
 */
export function useInvoiceTable() {
  // ==================== 状态定义 ====================
  
  /** 加载状态 */
  const loading = ref(false)
  
  /** 表格数据列表 */
  const dataList = ref<API.InvoiceItem[]>([])
  
  /** 总记录数 */
  const total = ref<number>(0)
  
  /** 统计信息 */
  const statistics = ref<API.InvoiceStatistics | null>(null)
  
  /** 分页参数 */
  const paginationParams = reactive({
    current: 1,
    pageSize: 10,
  })
  
  /** 筛选参数 */
  const searchParams = reactive<{
    startDate?: Dayjs
    endDate?: Dayjs
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
  }>({})
  
  /** 排序参数 */
  const sortParams = reactive<{
    sortField?: string
    sortOrder?: 'asc' | 'desc'
  }>({})
  
  // ==================== 计算属性 ====================
  
  /** 带序号的数据列表 */
  const dataListWithSerial = computed(() => {
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10
    
    return dataList.value.map((item, index) => {
      const newItem = { ...item }
      newItem.serialNo = (current - 1) * pageSize + index + 1
      return newItem
    })
  })
  
  /** 表格行数 */
  const tableRowCount = computed(() => dataListWithSerial.value.length)
  
  // ==================== 方法 ====================
  
  /**
   * 获取表格数据
   */
  const fetchData = async () => {
    try {
      loading.value = true
      
      // 确保分页参数是有效数字
      paginationParams.current = Number(paginationParams.current) || 1
      paginationParams.pageSize = Number(paginationParams.pageSize) || 10
      
      const params: API.InvoicePageDto = {
        current: paginationParams.current,
        pageSize: paginationParams.pageSize,
      }
      
      // 处理日期参数
      if (searchParams.startDate) {
        try {
          // 统一转换为 dayjs 对象，dayjs() 可以处理 dayjs 对象、字符串、Date 等
          const startDate = dayjs(searchParams.startDate as any)
          if (startDate.isValid()) {
            params.startDate = startDate.format('YYYY-MM-DD')
          }
        } catch (error) {
          console.warn('日期格式转换失败:', searchParams.startDate, error)
        }
      }
      if (searchParams.endDate) {
        try {
          // 统一转换为 dayjs 对象，dayjs() 可以处理 dayjs 对象、字符串、Date 等
          const endDate = dayjs(searchParams.endDate as any)
          if (endDate.isValid()) {
            params.endDate = endDate.format('YYYY-MM-DD')
          }
        } catch (error) {
          console.warn('日期格式转换失败:', searchParams.endDate, error)
        }
      }
      
      // 处理筛选参数
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
        ;(params as any).minAmount = searchParams.minInvoiceAmount
      }
      if (searchParams.maxInvoiceAmount !== null && searchParams.maxInvoiceAmount !== undefined) {
        ;(params as any).maxAmount = searchParams.maxInvoiceAmount
      }
      if (searchParams.invoiceNumber) {
        ;(params as any).invoiceNo = searchParams.invoiceNumber
      }
      
      // 处理排序参数（只有当 sortField 存在且不为空时才添加）
      if (sortParams.sortField && typeof sortParams.sortField === 'string' && sortParams.sortField.trim() !== '') {
        params.sortField = sortParams.sortField
        params.sortOrder = sortParams.sortOrder
      }
      
      const res = await queryInvoicePageUsingPost(params) as any
      
      if (res.data.code === 0 && res.data.data) {
        dataList.value = res.data.data.records ?? []
        total.value = res.data.data.total ?? 0
        
        if (res.data.data?.statistics) {
          statistics.value = {
            totalAmount: res.data.data.statistics.totalAmount ?? 0,
            totalPaidAmount: res.data.data.statistics.totalPaidAmount ?? 0,
            redInvoiceCount: res.data.data.statistics.redInvoiceCount ?? 0,
          }
        }
      } else {
        message.error('获取查询结果失败 ' + (res.data.message || ''))
      }
    } catch (error) {
      console.error('获取查询结果失败', error)
      message.error('获取查询结果失败')
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 分页变化处理
   */
  const handlePageChange = (page: number) => {
    paginationParams.current = page
    fetchData()
  }
  
  /**
   * 每页条数变化处理
   */
  const handlePageSizeChange = (current: number, size: number) => {
    paginationParams.current = 1
    paginationParams.pageSize = size
    fetchData()
  }
  
  /**
   * 表格变化处理（排序、筛选等）
   */
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // 处理排序
    if (sorter && sorter.field && sorter.order) {
      sortParams.sortField = sorter.field
      sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc'
    } else {
      // 取消排序时，完全清除排序参数
      delete sortParams.sortField
      delete sortParams.sortOrder
    }
    
    // 重置到第一页
    paginationParams.current = 1
    fetchData()
  }
  
  /**
   * 重置筛选条件
   */
  const resetSearchParams = () => {
    Object.assign(searchParams, {
      startDate: undefined,
      endDate: undefined,
      issuerCompanyIds: [],
      markValues: [],
      invoiceTypes: [],
      customerCompany: '',
      customerContact: '',
      salespersonName: '',
      issuerName: '',
      minInvoiceAmount: null,
      maxInvoiceAmount: null,
      invoiceNumber: '',
    })
    paginationParams.current = 1
  }
  
  /**
   * 执行查询
   */
  const doSearch = () => {
    paginationParams.current = 1
    fetchData()
  }
  
  /**
   * 执行重置
   */
  const doReset = () => {
    resetSearchParams()
    fetchData()
  }
  
  return {
    // 状态
    loading,
    dataList,
    dataListWithSerial,
    total,
    statistics,
    paginationParams,
    searchParams,
    sortParams,
    tableRowCount,
    
    // 方法
    fetchData,
    handlePageChange,
    handlePageSizeChange,
    handleTableChange,
    resetSearchParams,
    doSearch,
    doReset,
  }
}

