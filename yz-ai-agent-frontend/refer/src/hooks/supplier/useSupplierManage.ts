import { ref, computed, nextTick, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  addSupplierUsingPost,
  updateSupplierUsingPost,
  deleteSupplierUsingPost,
  listSupplierUsingPost,
} from '@/api/gongyingshangguanlijiekou'
import { inputInvoiceUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import myAxios from '@/request'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useSupplierTable } from './useSupplierTable'
import { exportJsonToExcel } from '@/utils/exportExcel'

/**
 * 供应商管理完整 Hook
 * 包含列定义、列设置、导入导出、CRUD 等业务逻辑
 */
export function useSupplierManage() {
  // 基础表格（分页、筛选、排序）
  const baseTable = useSupplierTable()

  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'SUPPLIER_MANAGE_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        companyName?: string
        supplierName?: string
        legalPerson?: string
        taxNo?: string
        registerAddress?: string
        businessScope?: string
      }
      return parsed
    } catch (error) {
      console.error('加载供应商管理筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    companyName?: string
    supplierName?: string
    legalPerson?: string
    taxNo?: string
    registerAddress?: string
    businessScope?: string
  }) => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(params))
    } catch (error) {
      console.error('保存供应商管理筛选条件失败', error)
    }
  }

  // ==================== 列定义 ====================
  // 按用户要求的顺序：序号、供货单位、供货姓名、供货电话、公司税号、银行名称、银行账号、法人、注册地址、注册电话、邮箱、经营范围、添加日期、备注1
  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'companyName', title: '供货单位', dataIndex: 'companyName', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'supplierName', title: '供货姓名', dataIndex: 'supplierName', width: 112, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'supplierPhone', title: '供货电话', dataIndex: 'supplierPhone', width: 182, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 3000 },
    { key: 'taxNo', title: '公司税号', dataIndex: 'taxNo', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'bankName', title: '银行名称', dataIndex: 'bankName', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'bankAccount', title: '银行账号', dataIndex: 'bankAccount', width: 200, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'legalPerson', title: '法人', dataIndex: 'legalPerson', width: 112, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 2000 },
    { key: 'registerAddress', title: '注册地址', dataIndex: 'registerAddress', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'registerPhone', title: '注册电话', dataIndex: 'registerPhone', width: 182, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 3000 },
    { key: 'email', title: '邮箱', dataIndex: 'email', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'businessScope', title: '经营范围', dataIndex: 'businessScope', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'createTime', title: '添加日期', dataIndex: 'createTime', width: 172, sorter: true, align: 'center' as const, minWidth: 88, maxWidth: 2000 },
    { key: 'remark1', title: '备注', dataIndex: 'remark1', width: 200, sorter: true, align: 'center' as const, minWidth: 74, maxWidth: 5000 },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = [
    'serialNo',
    'companyName',
    'supplierName',
    'supplierPhone',
    'taxNo',
    'bankName',
    'bankAccount',
    'legalPerson',
    'registerPhone',
    'registerAddress',
    'email',
    'businessScope',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('SUPPLIER_MANAGE_PAGE_SELECTED_COLUMNS')
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
    localStorage.removeItem('SUPPLIER_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'SUPPLIER_MANAGE_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableDisplayColumns = computed(() => resizableColumns.value)
  const tableScrollHeight = baseTable.tableScrollHeight

  // ==================== 列设置弹窗 ====================

  const columnSettingVisible = ref(false)

  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('SUPPLIER_MANAGE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 公司名称筛选（供 SupplierFilterBar 使用） ====================

  let supplierCompanyChangeTimer: any = null

  const handleSupplierCompanySelect = (value: string) => {
    if (value === '') {
      baseTable.searchParams.companyName = ''
    }
    baseTable.doSearch()
  }

  const handleSupplierCompanyChange = (value: string) => {
    clearTimeout(supplierCompanyChangeTimer)
    supplierCompanyChangeTimer = setTimeout(() => {
      baseTable.doSearch()
    }, 500)
  }

  // 统一的筛选框变化处理函数（防抖）
  let filterChangeTimer: any = null
  const handleFilterChange = () => {
    clearTimeout(filterChangeTimer)
    filterChangeTimer = setTimeout(() => {
      baseTable.doSearch()
    }, 500)
  }

  // 从基础表格中拿到筛选参数（供持久化使用）
  const supplierSearchParams = baseTable.searchParams as any

  // 优先从本地存储恢复筛选条件
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (typeof storedParams.companyName === 'string') {
      supplierSearchParams.companyName = storedParams.companyName
    }
    if (typeof storedParams.supplierName === 'string') {
      supplierSearchParams.supplierName = storedParams.supplierName
    }
    if (typeof storedParams.legalPerson === 'string') {
      supplierSearchParams.legalPerson = storedParams.legalPerson
    }
    if (typeof storedParams.taxNo === 'string') {
      supplierSearchParams.taxNo = storedParams.taxNo
    }
    if (typeof storedParams.registerAddress === 'string') {
      supplierSearchParams.registerAddress = storedParams.registerAddress
    }
    if (typeof storedParams.businessScope === 'string') {
      supplierSearchParams.businessScope = storedParams.businessScope
    }
  }

  // 监听筛选条件变化，自动持久化
  watch(
    () => ({
      companyName: supplierSearchParams.companyName || '',
      supplierName: supplierSearchParams.supplierName || '',
      legalPerson: supplierSearchParams.legalPerson || '',
      taxNo: supplierSearchParams.taxNo || '',
      registerAddress: supplierSearchParams.registerAddress || '',
      businessScope: supplierSearchParams.businessScope || '',
    }),
    (val) => {
      saveSearchParamsToStorage(val)
    },
    { deep: true }
  )

  // ==================== 模态框 / 表单 ====================

  const modalVisible = ref(false)
  const modalTitle = ref('添加-供应商')
  const editingId = ref<number | null>(null)
  const currentEditIndex = ref<number>(-1)
  const targetSerialNo = ref<number | null>(null) // 临时存储目标序号（用于分页切换时避免闪烁）
  const formData = ref<Partial<API.SupplierAddDTO>>({})

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

  const doAdd = () => {
    modalTitle.value = '添加-供应商'
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    formData.value = {
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      supplierName: '',
      supplierPhone: '',
      email: '',
      businessScope: '',
      remark1: '',
      remark2: '',
      remark3: '',
    }
    modalVisible.value = true
  }

  const doEdit = (record: API.Supplier_) => {
    modalTitle.value = '修改-供应商'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = baseTable.dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    formData.value = {
      id: record.id, // 确保 id 被包含在 formData 中
      companyName: record.companyName || '',
      supplierName: record.supplierName || '',
      supplierPhone: record.supplierPhone || '',
      taxNo: record.taxNo || '',
      legalPerson: record.legalPerson || '',
      registerPhone: record.registerPhone || '',
      registerAddress: record.registerAddress || '',
      email: record.email || '',
      wechat: record.remark2 || '', // 微信从remark2读取
      bankName: record.bankName || '',
      bankAccount: record.bankAccount || '',
      businessScope: record.businessScope || '',
      remark1: record.remark1 || '',
    } as any
    modalVisible.value = true
  }

  const handleSubmit = async (data: any, callback?: (success: boolean) => void) => {
    try {
      // 处理微信字段：将wechat转换为remark2
      const submitData: any = { ...data }
      if (submitData.wechat !== undefined) {
        submitData.remark2 = submitData.wechat
        delete submitData.wechat
      }
      
      // 确保 id 存在：优先使用 editingId.value，如果不存在则使用 data.id
      const id = editingId.value || (submitData.id ? (Array.isArray(submitData.id) ? submitData.id[0] : submitData.id) : null)
      
      if (id) {
        const updateData: API.SupplierUpdateDTO = {
          id: id,
          ...submitData,
        }
        // 确保 id 在 updateData 中（避免被 submitData 中的 undefined id 覆盖）
        updateData.id = id
        const res = (await updateSupplierUsingPost(updateData)) as any
        if (res.data.code === 0) {
          message.success('更新成功')
          // 编辑模式下，不关闭弹窗，等待用户点击"下一条"或关闭
          await baseTable.fetchData()
          callback?.(true)
        } else {
          message.error('更新失败 ' + (res.data.message || ''))
          callback?.(false)
        }
      } else {
        // 新增模式：确保 submitData 中没有 id
        delete submitData.id
        const addData: API.SupplierAddDTO = submitData as API.SupplierAddDTO
        const res = (await addSupplierUsingPost(addData)) as any
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
      companyName: '',
      supplierName: '',
      supplierPhone: '',
      taxNo: '',
      legalPerson: '',
      registerPhone: '',
      registerAddress: '',
      email: '',
      wechat: '',
      bankName: '',
      bankAccount: '',
      businessScope: '',
      remark1: '',
    } as any
    editingId.value = null
    modalTitle.value = '添加-供应商'
  }

  // 处理编辑模式下的下一条
  const handleNextEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
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
      let nextRecord: API.Supplier_ | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      // 如果下一条记录在当前页
      if (nextIndex < baseTable.dataList.value.length) {
        nextRecord = baseTable.dataList.value[nextIndex]
        currentEditIndex.value = nextIndex
      } else {
        // 如果下一条记录在下一页
        const totalPages = Math.ceil(baseTable.total.value / pageSize)
        const currentPage = baseTable.paginationParams.current

        if (currentPage < totalPages) {
          const targetPage = currentPage + 1
          // 设置临时序号，避免闪烁
          targetSerialNo.value = (targetPage - 1) * pageSize + 1
          
          // 加载下一页数据
          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          // 等待数据加载完成后，获取第一条记录
          if (baseTable.dataList.value.length > 0) {
            nextRecord = baseTable.dataList.value[0]
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
        formData.value = {
          companyName: nextRecord.companyName || '',
          supplierName: nextRecord.supplierName || '',
          supplierPhone: nextRecord.supplierPhone || '',
          taxNo: nextRecord.taxNo || '',
          legalPerson: nextRecord.legalPerson || '',
          registerPhone: nextRecord.registerPhone || '',
          registerAddress: nextRecord.registerAddress || '',
          email: nextRecord.email || '',
          wechat: nextRecord.remark2 || '',
          bankName: nextRecord.bankName || '',
          bankAccount: nextRecord.bankAccount || '',
          businessScope: nextRecord.businessScope || '',
          remark1: nextRecord.remark1 || '',
        } as any
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
  const handlePrevEdit = async (callback?: (success: boolean) => void) => {
    try {
      // 如果当前索引无效，尝试通过ID查找
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
      let prevRecord: API.Supplier_ | undefined
      const current = Number(baseTable.paginationParams.current) || 1
      const pageSize = Number(baseTable.paginationParams.pageSize) || 10

      // 如果上一条记录在当前页
      if (prevIndex >= 0) {
        prevRecord = baseTable.dataList.value[prevIndex]
        currentEditIndex.value = prevIndex
      } else {
        // 如果上一条记录在上一页
        const currentPage = baseTable.paginationParams.current

        if (currentPage > 1) {
          const targetPage = currentPage - 1
          // 设置临时序号（预估，假设上一页是满页）
          targetSerialNo.value = (targetPage - 1) * pageSize + pageSize
          
          // 加载上一页数据
          baseTable.paginationParams.current = targetPage
          await baseTable.fetchData()

          await nextTick()
          if (baseTable.dataList.value.length > 0) {
            // 获取上一页的最后一条记录
            const lastIndex = baseTable.dataList.value.length - 1
            prevRecord = baseTable.dataList.value[lastIndex]
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
        formData.value = {
          companyName: prevRecord.companyName || '',
          supplierName: prevRecord.supplierName || '',
          supplierPhone: prevRecord.supplierPhone || '',
          taxNo: prevRecord.taxNo || '',
          legalPerson: prevRecord.legalPerson || '',
          registerPhone: prevRecord.registerPhone || '',
          registerAddress: prevRecord.registerAddress || '',
          email: prevRecord.email || '',
          wechat: prevRecord.remark2 || '',
          bankName: prevRecord.bankName || '',
          bankAccount: prevRecord.bankAccount || '',
          businessScope: prevRecord.businessScope || '',
          remark1: prevRecord.remark1 || '',
        } as any
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
      content: '确定要删除该供应商吗？',
      onOk: async () => {
        try {
          const res = (await deleteSupplierUsingPost({ id })) as any
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

  // ==================== 导出 ====================

  const exportModalVisible = ref(false)
  const openExportModal = () => {
    exportModalVisible.value = true
  }

  /**
   * 供应商导出：按筛选条件 + 排序（弹窗选择优先）分页拉全量导出
   */
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

      const pageSize = 100
      const sp = baseTable.searchParams as any
      const baseParams: any = {
        pageSize,
        companyName: sp.companyName || undefined,
        supplierName: sp.supplierName || undefined,
        legalPerson: sp.legalPerson || undefined,
        taxNo: sp.taxNo || undefined,
        registerAddress: sp.registerAddress || undefined,
        businessScope: sp.businessScope || undefined,
      }

      // 排序：优先使用弹窗选择；否则使用当前表格排序
      const finalSortField = sortField || baseTable.sortParams.sortField
      const finalSortOrder = sortOrder || baseTable.sortParams.sortOrder
      if (finalSortField) {
        baseParams.sortField = finalSortField
        baseParams.sortOrder = finalSortOrder
      }

      onProgress?.(5, '正在获取数据总数...')

      // 先获取第一页以确定总数
      const firstPageRes = (await listSupplierUsingPost({ ...baseParams, current: 1 })) as any
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      if (firstPageRes.data?.code !== 0 || !firstPageRes.data?.data) {
        message.error('获取供应商列表失败 ' + (firstPageRes.data?.message || ''))
        onCancel?.()
        return
      }

      const total = firstPageRes.data.data.total || 0
      const totalPages = firstPageRes.data.data.pages ?? Math.max(1, Math.ceil(Number(total || 0) / pageSize))
      const allData: API.Supplier_[] = [...(firstPageRes.data.data.records ?? firstPageRes.data.data.list ?? [])]

      onProgress?.(10, `共 ${total} 条记录，正在获取数据...`)

      let current = 2
      let hasMore = current <= totalPages

      while (hasMore) {
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        const res = (await listSupplierUsingPost({ ...baseParams, current })) as any
        
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        if (res.data?.code !== 0 || !res.data?.data) {
          message.error('获取供应商列表失败 ' + (res.data?.message || ''))
          onCancel?.()
          return
        }
        const records: API.Supplier_[] = res.data.data.records ?? res.data.data.list ?? []
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

      const exportData = allData.map((item: API.Supplier_) => ({
        供货单位: item.companyName || '',
        供货姓名: item.supplierName || '',
        供货电话: item.supplierPhone || '',
        公司税号: item.taxNo || '',
        银行名称: item.bankName || '',
        银行账号: item.bankAccount || '',
        法人: item.legalPerson || '',
        注册地址: item.registerAddress || '',
        注册电话: item.registerPhone || '',
        邮箱: item.email || '',
        经营范围: item.businessScope || '',
        添加日期: item.createTime ? dayjs(item.createTime as any).format('YYYY-MM-DD') : '',
        备注: item.remark1 || '',
      }))

      // 获取当前显示的列配置，用于设置 Excel 列宽和对齐方式
      const exportColumns = resizableDisplayColumns.value
        .filter((col: any) => col.dataIndex && col.key !== 'serialNo' && col.key !== 'action')
        .map((col: any) => {
          // 映射列 dataIndex 到导出数据的键名
          const keyMap: Record<string, string> = {
            'companyName': '供货单位',
            'supplierName': '供货姓名',
            'supplierPhone': '供货电话',
            'taxNo': '公司税号',
            'bankName': '银行名称',
            'bankAccount': '银行账号',
            'legalPerson': '法人',
            'registerAddress': '注册地址',
            'registerPhone': '注册电话',
            'email': '邮箱',
            'businessScope': '经营范围',
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

      const fileName = `供应商信息_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '供应商信息', 
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
      message.error('导出失败 ' + (error.message || '未知错误'))
      onProgress?.(0, '导出失败')
      onCancel?.()
    }
  }

  // ==================== 导入 ====================

  const importModalVisible = ref(false)

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await inputInvoiceUploadUsingPost({ overwrite }, {}, file)) as any
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

  const openImportModal = () => {
    importModalVisible.value = true
  }

  const downloadTemplate = async () => {
    try {
      const response = await myAxios.get('/api/file/supplier/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `供应商信息模板.xlsx`
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

  // ==================== 初始化 ====================

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('SUPPLIER_MANAGE_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('SUPPLIER_MANAGE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('SUPPLIER_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      // 设置默认排序：创建时间降序
      if (!baseTable.sortParams.sortField) {
        baseTable.sortParams.sortField = 'createTime'
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
    tableScrollHeight,
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 供应商公司筛选
    handleSupplierCompanySelect,
    handleSupplierCompanyChange,
    handleFilterChange,

    // 模态框 / 表单
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

    // 导入导出
    handleExport,
    exportModalVisible,
    openExportModal,
    importModalVisible,
    handleImport,
    openImportModal,
    downloadTemplate,

    // 初始化
    initPageSettings,
  }
}


