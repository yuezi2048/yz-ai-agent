import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'

/**
 * 通用表格 Hook 模板
 * 用于管理表格数据、分页、筛选、排序等状态和逻辑
 * 
 * @template T - 数据项类型
 * @template S - 筛选参数类型
 * @template P - API 查询参数类型
 */
export function useBaseTable<T = any, S extends Record<string, any> = Record<string, any>, P = Record<string, any>>(config: {
  /** 查询接口函数 */
  queryApi: (params: P) => Promise<any>
  /** 筛选参数到 API 参数的转换函数 */
  transformSearchParams?: (searchParams: S) => Partial<P>
  /** 响应数据提取函数 */
  extractData?: (response: any) => { records: T[], total: number, [key: string]: any }
  /** 默认分页大小 */
  defaultPageSize?: number
  /** 存储键前缀（用于 localStorage/sessionStorage） */
  storageKeyPrefix?: string
}) {
  const {
    queryApi,
    transformSearchParams,
    extractData,
    defaultPageSize = 10,
    storageKeyPrefix = 'BASE_TABLE',
  } = config

  // ==================== 状态定义 ====================
  
  /** 加载状态 */
  const loading = ref(false)
  
  /** 表格数据列表 */
  const dataList = ref<T[]>([])
  
  /** 总记录数 */
  const total = ref<number>(0)
  
  /** 分页参数 */
  const paginationParams = reactive({
    current: 1,
    pageSize: defaultPageSize,
  })
  
  /** 筛选参数 */
  const searchParams = reactive<S>({} as S)
  
  /** 排序参数 */
  const sortParams = reactive<{
    sortField?: string
    sortOrder?: 'asc' | 'desc'
  }>({})
  
  // ==================== 计算属性 ====================
  
  /** 带序号的数据列表 */
  const dataListWithSerial = computed(() => {
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || defaultPageSize
    
    return dataList.value.map((item, index) => {
      const newItem = { ...item } as any
      newItem.serialNo = (current - 1) * pageSize + index + 1
      return newItem
    })
  })
  
  /** Ant Design 分页配置 */
  const pagination = computed<TablePaginationConfig>(() => ({
    current: paginationParams.current,
    pageSize: paginationParams.pageSize,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  }))
  
  /** 表格行数 */
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
  
  // ==================== 方法 ====================
  
  /**
   * 提取响应数据
   */
  const extractResponseData = (res: any) => {
    if (extractData) {
      return extractData(res)
    }
    
    // 默认提取逻辑
    if (res.data?.code === 0 && res.data?.data) {
      return {
        records: res.data.data.records ?? res.data.data.list ?? [],
        total: res.data.data.total ?? 0,
      }
    }
    
    return { records: [], total: 0 }
  }
  
  /**
   * 获取表格数据
   */
  const fetchData = async () => {
    try {
      loading.value = true
      
      // 确保分页参数是有效数字
      paginationParams.current = Number(paginationParams.current) || 1
      paginationParams.pageSize = Number(paginationParams.pageSize) || defaultPageSize
      
      // 构建 API 参数
      const params: any = {
        current: paginationParams.current,
        pageSize: paginationParams.pageSize,
      }
      
      // 转换筛选参数
      if (transformSearchParams) {
        Object.assign(params, transformSearchParams(searchParams as S))
      } else {
        // 默认：直接合并筛选参数
        Object.assign(params, searchParams as any)
      }
      
      // 处理排序参数（只有当 sortField 存在且不为空时才添加）
      if (sortParams.sortField && typeof sortParams.sortField === 'string' && sortParams.sortField.trim() !== '') {
        params.sortField = sortParams.sortField
        params.sortOrder = sortParams.sortOrder
      }
      
      const res = await queryApi(params as P)
      const { records, total: totalCount } = extractResponseData(res)
      
      dataList.value = records
      total.value = totalCount
    } catch (error) {
      console.error('获取数据失败', error)
      message.error('获取数据失败')
      dataList.value = []
      total.value = 0
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
  /**
   * 每页条数变化处理
   * 兼容两种调用方式：
   * - Ant Design Vue Pagination: (current, size)
   * - 自定义 InvoicePagination: (size)
   */
  const handlePageSizeChange = (currentOrSize: number, size?: number) => {
    const nextSize = typeof size === 'number' ? size : currentOrSize
    paginationParams.current = 1
    paginationParams.pageSize = nextSize
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
    Object.keys(searchParams).forEach(key => {
      const value = (searchParams as any)[key]
      if (Array.isArray(value)) {
        (searchParams as any)[key] = []
      } else if (typeof value === 'string') {
        (searchParams as any)[key] = ''
      } else {
        (searchParams as any)[key] = undefined
      }
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
    pagination,
    paginationParams,
    searchParams,
    sortParams,
    
    // 计算属性
    tableRowCount,
    tableScrollHeight,
    
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

