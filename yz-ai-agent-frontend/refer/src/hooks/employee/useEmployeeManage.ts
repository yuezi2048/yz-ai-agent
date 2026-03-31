import { ref, computed, nextTick, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  addEmployeeUsingPost,
  updateEmployeeUsingPost,
  deleteEmployeeUsingPost,
  listEmployeeUsingPost,
} from '@/api/yuangongguanlijiekou'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { employeeUploadUsingPost } from '@/api/wenjianshangchuanjiekou'
import myAxios from '@/request'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useEmployeeTable } from './useEmployeeTable'

/**
 * 员工管理完整 Hook
 * 包含列定义、列设置、导入、CRUD 等所有业务逻辑
 */
export function useEmployeeManage() {
  // 使用基础表格 Hook（分页、筛选、排序）
  const baseTable = useEmployeeTable()

  // ==================== 筛选条件持久化 ====================

  const FILTER_STORAGE_KEY = 'EMPLOYEE_MANAGE_PAGE_SEARCH_PARAMS'

  const loadSearchParamsFromStorage = () => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        name?: string
        employeeNo?: string
        department?: string
        companyId?: number
        permission?: string
      }
      return parsed
    } catch (error) {
      console.error('加载员工管理筛选条件失败', error)
      return null
    }
  }

  const saveSearchParamsToStorage = (params: {
    name?: string
    employeeNo?: string
    department?: string
    companyIds?: number[]
  }) => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(params))
    } catch (error) {
      console.error('保存员工管理筛选条件失败', error)
    }
  }

  const employeeSearchParams = baseTable.searchParams as any

  // 优先从本地存储恢复筛选条件
  const storedParams = loadSearchParamsFromStorage()
  if (storedParams) {
    if (typeof storedParams.name === 'string') {
      employeeSearchParams.name = storedParams.name
    }
    if (typeof storedParams.employeeNo === 'string') {
      employeeSearchParams.employeeNo = storedParams.employeeNo
    }
    if (typeof storedParams.department === 'string') {
      employeeSearchParams.department = storedParams.department
    }
    if (Array.isArray(storedParams.companyIds)) {
      employeeSearchParams.companyIds = storedParams.companyIds
    }
  }

  // 监听筛选条件变化，自动持久化
  watch(
    () => ({
      name: employeeSearchParams.name || '',
      employeeNo: employeeSearchParams.employeeNo || '',
      department: employeeSearchParams.department || '',
      companyIds: employeeSearchParams.companyIds || [],
    }),
    (val) => {
      saveSearchParamsToStorage(val)
    },
    { deep: true }
  )

  // ==================== 列定义 ====================

  const allColumns = ref([
    { key: 'serialNo', title: '序号', dataIndex: 'serialNo', width: 56, fixed: 'left', sorter: false, align: 'center' as const, minWidth: 60, maxWidth: 1000 },
    { key: 'name', title: '姓名', dataIndex: 'name', width: 80, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'employeeNo', title: '工号', dataIndex: 'employeeNo', width: 80, fixed: 'left', sorter: true, align: 'center' as const, minWidth: 60, maxWidth: 1500 },
    { key: 'gender', title: '性别', dataIndex: 'gender', width: 50, sorter: true, align: 'center' as const, minWidth: 50, maxWidth: 1000 },
    { key: 'birthDate', title: '出生年月', dataIndex: 'birthDate', width: 110, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1500 },
    { key: 'age', title: '年龄', dataIndex: 'age', width: 50, sorter: true, align: 'center' as const, minWidth: 50, maxWidth: 1000 },
    { key: 'phone', title: '联系电话', dataIndex: 'phone', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1800 },
    { key: 'department', title: '部门', dataIndex: 'department', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 2000 },
    { key: 'companyName', title: '公司名称', dataIndex: 'companyName', width: 200, sorter: true, align: 'center' as const, minWidth: 90, maxWidth: 3000 },
    { key: 'idCard', title: '身份证号', dataIndex: 'idCard', width: 180, sorter: true, align: 'center' as const, minWidth: 120, maxWidth: 2000 },
    { key: 'hireDate', title: '入职日期', dataIndex: 'hireDate', width: 110, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1500 },
    { key: 'regularDate', title: '转正日期', dataIndex: 'regularDate', width: 110, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1500 },
    { key: 'permission', title: '人员权限', dataIndex: 'permission', width: 120, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1800 },
    { key: 'expiryDate', title: '有效期止', dataIndex: 'expiryDate', width: 110, sorter: true, align: 'center' as const, minWidth: 80, maxWidth: 1500 },
    { key: 'remark1', title: '备注1', dataIndex: 'remark1', sorter: true, align: 'center' as const },
    { key: 'action', title: '操作', width: 100, fixed: 'right', align: 'center' as const, minWidth: 80, maxWidth: 1200 },
  ])

  const defaultSelectedColumns = [
    'serialNo',
    'name',
    'employeeNo',
    'gender',
    'birthDate',
    'age',
    'phone',
    'department',
    'companyName',
    'idCard',
    'hireDate',
    'regularDate',
  ]

  const getStoredColumns = (): string[] => {
    try {
      sessionStorage.removeItem('EMPLOYEE_MANAGE_PAGE_SELECTED_COLUMNS')
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
    localStorage.removeItem('EMPLOYEE_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: displayColumns,
    columnsState: {
      persistenceKey: 'EMPLOYEE_MANAGE_PAGE_TABLE_COLUMN_WIDTHS',
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
      sessionStorage.setItem('EMPLOYEE_MANAGE_PAGE_SELECTED_COLUMNS', JSON.stringify(selectedCols))
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

  // ==================== 公司列表 ====================

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

  // 根据记录推导公司名称（优先用后端返回的 companyName）
  const getCompanyNameFromRecord = (record: Partial<API.Employee_>) => {
    const companyNameField = (record as any).companyName
    const companyIdField = record.companyId

    // 如果 companyName 是非纯数字字符串，直接使用
    if (typeof companyNameField === 'string' && companyNameField.trim() && !/^\d+$/.test(companyNameField.trim())) {
      return companyNameField.trim()
    }

    // 如果 companyName 是数字或纯数字字符串，尝试用 companyId 去匹配名称
    const normalizedId =
      typeof companyNameField === 'number'
        ? companyNameField
        : /^\d+$/.test(companyNameField || '')
          ? Number(companyNameField)
          : companyIdField

    const matched = companyList.value.find((c) => c.id === normalizedId)
    if (matched?.companyName) return matched.companyName

    // 若通过 companyId 也匹配不到，则返回空字符串，避免将数字填入自动完成框
    return ''
  }

  // ==================== 模态框 / 表单 ====================

  const modalVisible = ref(false)
  const modalTitle = ref('添加员工')
  const editingId = ref<number | null>(null)
  const currentEditIndex = ref<number>(-1)
  const targetSerialNo = ref<number | null>(null) // 临时存储目标序号（用于分页切换时避免闪烁）
  type FormModel = Partial<
    API.EmployeeAddDTO & {
      id?: number
      companyName?: string
      birthDate?: any
      hireDate?: any
      regularDate?: any
      firstInsuranceDate?: any
      age?: any
      email?: string
    }
  >
  const formData = ref<FormModel>({})

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

  const doAdd = async () => {
    modalTitle.value = '添加-员工'
    editingId.value = null
    currentEditIndex.value = -1
    targetSerialNo.value = null // 清除临时序号
    formData.value = {
      id: undefined, // 新增模式下，id 为 undefined，用于判断是否是编辑模式
      employeeNo: '', // 新增模式下，工号为空，保存时自动生成
      companyId: 0,
      name: '',
      gender: '',
      birthDate: undefined,
      age: undefined,
      phone: '',
      idCard: '',
      householdType: '',
      maritalStatus: '',
      nativePlace: '',
      householdAddress: '',
      residenceAddress: '',
      firstInsuranceDate: undefined,
      email: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      educationLevel: '',
      educationType: '',
      graduationSchool: '',
      major: '',
      department: '',
      position: '',
      hireDate: undefined,
      regularDate: undefined,
      remark1: '',
    }
    modalVisible.value = true
  }

  const doEdit = (record: API.Employee_) => {
    modalTitle.value = '编辑-员工信息'
    editingId.value = record.id || null
    targetSerialNo.value = null // 清除临时序号
    // 记录当前编辑的记录在列表中的索引
    const index = baseTable.dataList.value.findIndex(item => item.id === record.id)
    currentEditIndex.value = index >= 0 ? index : -1
    
    // 计算年龄
    const calculateAge = (birthDate?: string) => {
      if (!birthDate) return undefined
      const birth = dayjs(birthDate)
      if (!birth.isValid()) return undefined
      const today = dayjs()
      let age = today.year() - birth.year()
      const monthDiff = today.month() - birth.month()
      if (monthDiff < 0 || (monthDiff === 0 && today.date() < birth.date())) {
        age--
      }
      return age
    }
    
    formData.value = {
      id: record.id, // 编辑模式下，设置 id，用于判断是否是编辑模式
      employeeNo: record.employeeNo || '',
      companyId: record.companyId || 0,
      companyName: getCompanyNameFromRecord(record),
      name: record.name || '',
      gender: record.gender || '',
      birthDate: record.birthDate ? dayjs(record.birthDate) : undefined,
      age: calculateAge(record.birthDate),
      phone: record.phone || '',
      idCard: record.idCard || '',
      householdType: (record as any).householdType || '',
      maritalStatus: (record as any).maritalStatus || '',
      nativePlace: (record as any).nativePlace || '',
      householdAddress: (record as any).householdAddress || '',
      residenceAddress: (record as any).residenceAddress || '',
      firstInsuranceDate: (record as any).firstInsuranceDate ? dayjs((record as any).firstInsuranceDate) : undefined,
      email: (record as any).email || '',
      emergencyContactName: (record as any).emergencyContactName || '',
      emergencyContactRelation: (record as any).emergencyContactRelation || '',
      emergencyContactPhone: (record as any).emergencyContactPhone || '',
      educationLevel: (record as any).educationLevel || '',
      educationType: (record as any).educationType || '',
      graduationSchool: (record as any).graduationSchool || '',
      major: (record as any).major || '',
      department: record.department || '',
      position: record.position || '',
      hireDate: record.hireDate ? dayjs(record.hireDate) : undefined,
      regularDate: record.regularDate ? dayjs(record.regularDate) : undefined,
      remark1: record.remark1 || '',
    }
    modalVisible.value = true
  }

  const handleSubmit = async (data: API.EmployeeAddDTO, callback?: (success: boolean) => void) => {
    try {
      // companyId 兜底拦截：确保 companyId 对应真实公司（避免默认公司名/列表未刷新导致传入错误ID）
      const tryResolveCompanyId = async () => {
        const name = ((data as any).companyName || '').trim()
        if (!name) return
        const resolve = () =>
          companyList.value.find((c) => (c.companyName || '').trim() === name)?.id ||
          companyList.value.find((c) => (c.companyName || '').trim().toLowerCase() === name.toLowerCase())?.id
        let resolved = resolve()
        if (!resolved) {
          await fetchCompanyList()
          resolved = resolve()
        }
        if (resolved) {
          ;(data as any).companyId = resolved
        }
      }

      if (!(data as any).companyId && (data as any).companyName) {
        await tryResolveCompanyId()
      }
      if (!(data as any).companyId) {
        message.error('公司信息未成功关联，请刷新页面或重新选择公司后再保存')
        callback?.(false)
        return
      }

      if (editingId.value) {
        const submitData: API.EmployeeUpdateDTO = {
          id: editingId.value,
          ...data,
        }
        const res = (await updateEmployeeUsingPost(submitData)) as any
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
        const res = (await addEmployeeUsingPost(data)) as any
        if (res.data.code === 0) {
          message.success('添加成功')
          // 刷新列表以获取最新数据
          await baseTable.fetchData()
          // 如果返回了员工ID，从列表中查找该员工并回填工号和ID
          const newEmployeeId = res.data.data
          if (newEmployeeId && typeof newEmployeeId === 'number') {
            const newEmployee = baseTable.dataList.value.find((emp: API.Employee_) => emp.id === newEmployeeId)
            if (newEmployee) {
              // 回填工号
              formData.value.employeeNo = newEmployee.employeeNo || data.employeeNo || ''
              // 设置 id，这样保存成功后就可以点击"下一条"了（会切换到编辑模式）
              formData.value.id = newEmployeeId
              // 更新 editingId，以便后续的"下一条"功能正常工作
              editingId.value = newEmployeeId
              // 更新当前编辑索引
              const index = baseTable.dataList.value.findIndex(item => item.id === newEmployeeId)
              currentEditIndex.value = index >= 0 ? index : -1
            } else {
              // 如果列表中找不到，使用我们生成的工号
              formData.value.employeeNo = data.employeeNo || ''
              // 即使找不到，也设置 id，以便切换到编辑模式
              formData.value.id = newEmployeeId
              editingId.value = newEmployeeId
            }
          } else {
            // 如果没有返回ID，使用我们生成的工号，但不设置 id（保持新增模式）
            formData.value.employeeNo = data.employeeNo || ''
          }
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

  const handleNext = async () => {
    formData.value = {
      id: undefined, // 新增模式下，id 为 undefined
      employeeNo: '', // 新增模式下，工号为空，保存时自动生成
      companyId: 0,
      name: '',
      gender: '',
      birthDate: undefined,
      age: '',
      phone: '',
      idCard: '',
      householdType: '',
      maritalStatus: '',
      nativePlace: '',
      householdAddress: '',
      residenceAddress: '',
      firstInsuranceDate: undefined,
      email: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      educationLevel: '',
      educationType: '',
      graduationSchool: '',
      major: '',
      department: '',
      position: '',
      hireDate: undefined,
      regularDate: undefined,
      remark1: '',
    }
    editingId.value = null
    modalTitle.value = '添加-员工'
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
      let nextRecord: API.Employee_ | undefined
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
        const calculateAge = (birthDate?: string) => {
          if (!birthDate) return ''
          const birth = dayjs(birthDate)
          if (!birth.isValid()) return undefined
          const today = dayjs()
          let age = today.year() - birth.year()
          const monthDiff = today.month() - birth.month()
          if (monthDiff < 0 || (monthDiff === 0 && today.date() < birth.date())) {
            age--
          }
          return age
        }
        formData.value = {
          id: nextRecord.id, // 保留 id 便于后续判断编辑态
          employeeNo: nextRecord.employeeNo || '',
          companyId: nextRecord.companyId || 0,
          companyName: getCompanyNameFromRecord(nextRecord),
          name: nextRecord.name || '',
          gender: nextRecord.gender || '',
          birthDate: nextRecord.birthDate ? dayjs(nextRecord.birthDate) : undefined,
          age: calculateAge(nextRecord.birthDate),
          phone: nextRecord.phone || '',
          idCard: nextRecord.idCard || '',
          householdType: (nextRecord as any).householdType || '',
          maritalStatus: (nextRecord as any).maritalStatus || '',
          nativePlace: (nextRecord as any).nativePlace || '',
          householdAddress: (nextRecord as any).householdAddress || '',
          residenceAddress: (nextRecord as any).residenceAddress || '',
          firstInsuranceDate: (nextRecord as any).firstInsuranceDate ? dayjs((nextRecord as any).firstInsuranceDate) : undefined,
          email: (nextRecord as any).email || '',
          emergencyContactName: (nextRecord as any).emergencyContactName || '',
          emergencyContactRelation: (nextRecord as any).emergencyContactRelation || '',
          emergencyContactPhone: (nextRecord as any).emergencyContactPhone || '',
          educationLevel: (nextRecord as any).educationLevel || '',
          educationType: (nextRecord as any).educationType || '',
          graduationSchool: (nextRecord as any).graduationSchool || '',
          major: (nextRecord as any).major || '',
          department: nextRecord.department || '',
          position: nextRecord.position || '',
          hireDate: nextRecord.hireDate ? dayjs(nextRecord.hireDate) : undefined,
          regularDate: nextRecord.regularDate ? dayjs(nextRecord.regularDate) : undefined,
          remark1: nextRecord.remark1 || '',
        }
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
      let prevRecord: API.Employee_ | undefined
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
        const calculateAge = (birthDate?: string) => {
          if (!birthDate) return undefined
          const birth = dayjs(birthDate)
          if (!birth.isValid()) return undefined
          const today = dayjs()
          let age = today.year() - birth.year()
          const monthDiff = today.month() - birth.month()
          if (monthDiff < 0 || (monthDiff === 0 && today.date() < birth.date())) {
            age--
          }
          return age
        }
        formData.value = {
          id: prevRecord.id, // 保留 id 便于后续判断编辑态
          employeeNo: prevRecord.employeeNo || '',
          companyId: prevRecord.companyId || 0,
          companyName: getCompanyNameFromRecord(prevRecord),
          name: prevRecord.name || '',
          gender: prevRecord.gender || '',
          birthDate: prevRecord.birthDate ? dayjs(prevRecord.birthDate) : undefined,
          age: calculateAge(prevRecord.birthDate),
          phone: prevRecord.phone || '',
          idCard: prevRecord.idCard || '',
          householdType: (prevRecord as any).householdType || '',
          maritalStatus: (prevRecord as any).maritalStatus || '',
          nativePlace: (prevRecord as any).nativePlace || '',
          householdAddress: (prevRecord as any).householdAddress || '',
          residenceAddress: (prevRecord as any).residenceAddress || '',
          firstInsuranceDate: (prevRecord as any).firstInsuranceDate ? dayjs((prevRecord as any).firstInsuranceDate) : undefined,
          email: (prevRecord as any).email || '',
          emergencyContactName: (prevRecord as any).emergencyContactName || '',
          emergencyContactRelation: (prevRecord as any).emergencyContactRelation || '',
          emergencyContactPhone: (prevRecord as any).emergencyContactPhone || '',
          educationLevel: (prevRecord as any).educationLevel || '',
          educationType: (prevRecord as any).educationType || '',
          graduationSchool: (prevRecord as any).graduationSchool || '',
          major: (prevRecord as any).major || '',
          department: prevRecord.department || '',
          position: prevRecord.position || '',
          hireDate: prevRecord.hireDate ? dayjs(prevRecord.hireDate) : undefined,
          regularDate: prevRecord.regularDate ? dayjs(prevRecord.regularDate) : undefined,
          remark1: prevRecord.remark1 || '',
        }
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
      content: '确定要删除该员工吗？',
      onOk: async () => {
        try {
          const res = (await deleteEmployeeUsingPost({ id })) as any
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

  // ==================== 导入相关 ====================

  const importModalVisible = ref(false)

  const handleImport = async (file: File, overwrite: boolean) => {
    const res = (await employeeUploadUsingPost({ overwrite }, {}, file)) as any
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
      const response = await myAxios.get('/api/file/employee/download', {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `员工信息模板.xlsx`
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
      sessionStorage.removeItem('EMPLOYEE_MANAGE_PAGE_SELECTED_COLUMNS')
      sessionStorage.removeItem('EMPLOYEE_MANAGE_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('EMPLOYEE_MANAGE_PAGE_TABLE_COLUMN_WIDTHS')
      selectedColumns.value = [...defaultSelectedColumns]
      // 设置默认排序：添加日期降序
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
    updateColumnWidth,

    // 列设置
    columnSettingVisible,
    handleColumnSetting,
    handleColumnSettingOk,

    // 权限展示
    getPermissionColor,

    // 公司列表
    companyList,
    fetchCompanyList,

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

    // 导入相关
    importModalVisible,
    handleImport,
    openImportModal,
    downloadTemplate,

    // 初始化
    initPageSettings,
  }
}


