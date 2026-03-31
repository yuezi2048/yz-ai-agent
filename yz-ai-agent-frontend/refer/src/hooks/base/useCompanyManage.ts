import { ref, computed, onMounted, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  addCompanyUsingPost,
  updateCompanyUsingPost,
  deleteCompanyUsingPost,
  listCompanyByPageUsingPost,
} from '@/api/gongsixinxijiekou'
import { companyUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useCompanyTable } from './useCompanyTable'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import myAxios from '@/request'
import { exportJsonToExcel } from '@/utils/exportExcel'

/**
 * 公司管理完整 Hook
 * 包含列定义、列设置、CRUD、导入导出等所有业务逻辑
 */
export function useCompanyManage() {
  // 使用基础表格 Hook
  const baseTable = useCompanyTable()

  // ==================== 列定义 ====================
  
  /** 所有可用列 */
  const allColumns = ref([
    {
      key: 'serialNo',
      title: '序号',
      dataIndex: 'serialNo',
      width: 56,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1000,
    },
    {
      key: 'companyName',
      title: '公司名称',
      dataIndex: 'companyName',
      width: 200,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 3000,
    },
    {
      key: 'taxNo',
      title: '公司税号',
      dataIndex: 'taxNo',
      width: 180,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 2500,
    },
    {
      key: 'legalPerson',
      title: '法人',
      dataIndex: 'legalPerson',
      width: 100,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1500,
    },
    {
      key: 'registerPhone',
      title: '注册电话',
      dataIndex: 'registerPhone',
      width: 120,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 1800,
    },
    {
      key: 'bankName',
      title: '银行名称',
      dataIndex: 'bankName',
      width: 150,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 2500,
    },
    {
      key: 'bankAccount',
      title: '银行账号',
      dataIndex: 'bankAccount',
      width: 180,
      fixed: 'left',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 2500,
    },
    {
      key: 'isEnabled',
      title: '启用状态',
      dataIndex: 'isEnabled',
      width: 96,
      sorter: true,
      align: 'center' as const,
      minWidth: 80,
      maxWidth: 1200,
    },
    {
      key: 'sortOrder',
      title: '排列顺序',
      dataIndex: 'sortOrder',
      width: 100,
      sorter: true,
      align: 'center' as const,
      minWidth: 80,
      maxWidth: 1200,
    },
    {
      key: 'registerAddress',
      title: '注册地址',
      dataIndex: 'registerAddress',
      width: 200,
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 3000,
    },
    {
      key: 'contactPerson',
      title: '联系人',
      dataIndex: 'contactPerson',
      width: 100,
      sorter: true,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1500,
    },
    {
      key: 'contactPhone1',
      title: '联系电话',
      dataIndex: 'contactPhone1',
      width: 120,
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 1800,
    },
    {
      key: 'createTime',
      title: '添加日期',
      dataIndex: 'createTime',
      width: 172,
      sorter: true,
      align: 'center' as const,
      minWidth: 88,
      maxWidth: 2000,
    },
    {
      key: 'remark',
      title: '备注',
      sorter: true,
      align: 'center' as const,
    },
    {
      key: 'action',
      title: '操作',
      width: 150,
      fixed: 'right',
      align: 'center' as const,
    },
  ])

  /** 默认显示的列 */
  const defaultSelectedColumns = [
    'serialNo',
    'companyName',
    'taxNo',
    'legalPerson',
    'registerPhone',
    'bankName',
    'bankAccount',
    'isEnabled',
    'sortOrder',
    'registerAddress',
    'contactPerson',
    'contactPhone1',
  ]

  /** 获取存储的列设置（每次进入时使用默认值） */
  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('COMPANY_MANAGE_SELECTED_COLUMNS')
    } catch (error) {
      console.error('清除列设置失败', error)
    }
    return defaultSelectedColumns
  }

  /** 当前选中的列 */
  const selectedColumns = ref<string[]>(getStoredColumns())

  /** 可自定义的列 */
  const customizableColumns = computed(() => allColumns.value)

  /** 显示的列 */
  const displayColumns = computed(() => {
    return allColumns.value.filter((col) => selectedColumns.value.includes(col.key))
  })

  // ==================== 列伸缩 ====================

  // 每次进入时清除列宽存储
  try {
    localStorage.removeItem('COMPANY_MANAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  /** 列伸缩功能 */
  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'COMPANY_MANAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  /** 可调整的显示列 */
  const resizableDisplayColumns = computed(() => resizableColumns.value)

  // ==================== 列设置弹窗 ====================

  /** 列设置弹窗显示状态 */
  const columnSettingVisible = ref(false)

  /** 打开列设置弹窗 */
  const handleColumnSetting = () => {
    columnSettingVisible.value = true
  }

  /** 列设置确认 */
  const handleColumnSettingOk = (selectedCols: string[]) => {
    selectedColumns.value = selectedCols
    try {
      sessionStorage.setItem('COMPANY_MANAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
    } catch (error) {
      console.error('保存列设置失败', error)
    }
    message.success('列设置已保存')
  }

  // ==================== 公司列表（用于筛选模态框） ====================

  const companyList = ref<API.Company[]>([])

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

  // ==================== 导入导出 ====================

  /** 导入弹窗显示状态 */
  const importModalVisible = ref(false)

  /** 打开导入弹窗 */
  const openImportModal = () => {
    importModalVisible.value = true
  }

  /** 处理导入 */
  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await companyUploadUsingPost({ overwrite }, {}, file)) as any
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

  /** 下载模板 */
  const downloadTemplate = async () => {
    try {
      const response = await myAxios.get('/api/file/company/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `公司信息模板.xlsx`
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

  /** 导出数据 */
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

      const searchParams = baseTable.searchParams as any
      const baseParams: API.CompanyPageDTO = {
        pageSize: 100,
        companyName: searchParams.companyName || undefined,
        taxNo: searchParams.taxNo || undefined,
        legalPerson: searchParams.legalPerson || undefined,
        registerAddress: searchParams.registerAddress || undefined,
        registerPhone: searchParams.registerPhone || undefined,
        bankName: searchParams.bankName || undefined,
        bankAccount: searchParams.bankAccount || undefined,
        contactPerson: searchParams.contactPerson || undefined,
        contactPhone1: searchParams.contactPhone1 || undefined,
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
      const firstPageRes = (await listCompanyByPageUsingPost({ ...baseParams, current: 1 })) as any
      
      // 检查是否已取消
      if (abortSignal?.aborted) {
        onCancel?.()
        return
      }

      if (firstPageRes.data.code !== 0 || !firstPageRes.data.data) {
        message.error('获取公司列表失败 ' + (firstPageRes.data.message || ''))
        onCancel?.()
        return
      }

      const total = firstPageRes.data.data.total || 0
      const totalPages = firstPageRes.data.data.pages ?? 1
      const allData: API.Company[] = [...(firstPageRes.data.data.records ?? [])]

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
        const res = (await listCompanyByPageUsingPost(params)) as any
        
        // 检查是否已取消
        if (abortSignal?.aborted) {
          onCancel?.()
          return
        }

        if (res.data.code !== 0 || !res.data.data) {
          message.error('获取公司列表失败 ' + (res.data.message || ''))
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

      const exportData = allData.map((item: API.Company) => ({
        公司名称: item.companyName,
        公司税号: item.taxNo,
        法人: item.legalPerson || '',
        注册地址: item.registerAddress || '',
        注册电话: item.registerPhone || '',
        银行名称: item.bankName || '',
        银行账号: item.bankAccount || '',
        联系人: item.contactPerson || '',
        电话1: item.contactPhone1 || '',
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
            'companyName': '公司名称',
            'taxNo': '公司税号',
            'legalPerson': '法人',
            'registerAddress': '注册地址',
            'registerPhone': '注册电话',
            'bankName': '银行名称',
            'bankAccount': '银行账号',
            'contactPerson': '联系人',
            'contactPhone1': '电话1',
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

      const fileName = `公司信息_${new Date().toISOString().split('T')[0]}.xlsx`
      const recordCount = exportJsonToExcel(
        [{ 
          sheetName: '公司信息', 
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

  // ==================== CRUD 操作 ====================

  /** 模态框显示状态 */
  const modalVisible = ref(false)
  /** 模态框标题 */
  const modalTitle = ref('添加-公司信息')
  /** 编辑中的 ID */
  const editingId = ref<number | null>(null)
  /** 当前编辑记录在列表中的索引 */
  const currentEditIndex = ref<number>(-1)
  /** 临时存储目标序号（用于分页切换时避免闪烁） */
  const targetSerialNo = ref<number | null>(null)
  /** 表单数据 */
  const formData = ref<Partial<API.CompanyAddDto>>({})

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

  /** 打开添加弹窗 */
  const doAddCompany = () => {
    modalTitle.value = '添加-公司信息'
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
      contactPerson: '',
      contactPhone1: '',
      isEnabled: 1,
      remark1: '',
      remark2: '',
      remark3: '',
    } as Partial<API.CompanyAddDto & { isEnabled?: number }>
    modalVisible.value = true
  }

  /** 打开编辑弹窗 */
  const doEdit = (record: API.Company) => {
    modalTitle.value = '修改-公司信息'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = baseTable.dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    formData.value = {
      companyName: record.companyName || '',
      taxNo: record.taxNo || '',
      legalPerson: record.legalPerson || '',
      registerAddress: record.registerAddress || '',
      registerPhone: record.registerPhone || '',
      bankName: record.bankName || '',
      bankAccount: record.bankAccount || '',
      contactPerson: record.contactPerson || '',
      contactPhone1: record.contactPhone1 || '',
      isEnabled: typeof record.isEnabled === 'number' ? record.isEnabled : 1,
      sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : 0,
      remark1: record.remark1 || '',
      remark2: record.remark2 || '',
      remark3: record.remark3 || '',
    } as Partial<API.CompanyAddDto & { isEnabled?: number; sortOrder?: number }>
    modalVisible.value = true
  }

  /** 提交表单 */
  const handleSubmit = async (data: API.CompanyAddDto & { isEnabled?: number; sortOrder?: number }, callback?: (success: boolean) => void) => {
    try {
      if (editingId.value) {
        // 更新
        const submitData: API.CompanyUpdateDto = {
          id: editingId.value,
          ...data,
        }
        const res = (await updateCompanyUsingPost(submitData)) as any
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
        // 新增
        const res = (await addCompanyUsingPost(data as any)) as any
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

  /** 下一条（连续录入） */
  const handleNext = () => {
    formData.value = {
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone1: '',
      isEnabled: 1,
      sortOrder: 0,
      remark1: '',
      remark2: '',
      remark3: '',
    } as Partial<API.CompanyAddDto & { isEnabled?: number; sortOrder?: number }>
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null
    modalTitle.value = '添加-公司信息'
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
      let nextRecord: API.Company | undefined
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
          taxNo: nextRecord.taxNo || '',
          legalPerson: nextRecord.legalPerson || '',
          registerAddress: nextRecord.registerAddress || '',
          registerPhone: nextRecord.registerPhone || '',
          bankName: nextRecord.bankName || '',
          bankAccount: nextRecord.bankAccount || '',
          contactPerson: nextRecord.contactPerson || '',
          contactPhone1: nextRecord.contactPhone1 || '',
          isEnabled: typeof nextRecord.isEnabled === 'number' ? nextRecord.isEnabled : 1,
          sortOrder: typeof nextRecord.sortOrder === 'number' ? nextRecord.sortOrder : 0,
          remark1: nextRecord.remark1 || '',
          remark2: nextRecord.remark2 || '',
          remark3: nextRecord.remark3 || '',
        } as Partial<API.CompanyAddDto & { isEnabled?: number; sortOrder?: number }>
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
      let prevRecord: API.Company | undefined
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
          taxNo: prevRecord.taxNo || '',
          legalPerson: prevRecord.legalPerson || '',
          registerAddress: prevRecord.registerAddress || '',
          registerPhone: prevRecord.registerPhone || '',
          bankName: prevRecord.bankName || '',
          bankAccount: prevRecord.bankAccount || '',
          contactPerson: prevRecord.contactPerson || '',
          contactPhone1: prevRecord.contactPhone1 || '',
          isEnabled: typeof prevRecord.isEnabled === 'number' ? prevRecord.isEnabled : 1,
          sortOrder: typeof prevRecord.sortOrder === 'number' ? prevRecord.sortOrder : 0,
          remark1: prevRecord.remark1 || '',
          remark2: prevRecord.remark2 || '',
          remark3: prevRecord.remark3 || '',
        } as Partial<API.CompanyAddDto & { isEnabled?: number; sortOrder?: number }>
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

  /** 删除数据 */
  const doDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该公司吗？',
      onOk: async () => {
        try {
          const res = (await deleteCompanyUsingPost({ id })) as any
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

  // ==================== 初始化 ====================

  /** 初始化页面设置 */
  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('COMPANY_MANAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('COMPANY_MANAGE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('COMPANY_MANAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      // 去除默认排序规则，交由后端判断
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  return {
    // 基础表格数据和方法
    ...baseTable,

    // 列相关
    allColumns,
    customizableColumns,
    selectedColumns,
    resizableDisplayColumns,
    tableWidth,
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 公司列表
    companyList,
    fetchCompanyList,

    // 导入导出
    importModalVisible,
    openImportModal,
    handleImport,
    downloadTemplate,
    handleExport,
    exportModalVisible,
    openExportModal,

    // CRUD
    modalVisible,
    modalTitle,
    formData,
    currentEditSerialNo,
    doAddCompany,
    doEdit,
    handleSubmit,
    handleNext,
    handleNextEdit,
    handlePrevEdit,
    doDelete,

    // 初始化
    initPageSettings,

    // 供外部使用的筛选字段（包含 companyIds）
    searchParams: baseTable.searchParams,
  }
}

