<template>
  <div id="employeePermissionPage">
    <!-- 筛选栏 -->
    <EmployeeFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      filter-collapsed-storage-key="EMPLOYEE_PERMISSION_PAGE_FILTER_COLLAPSED"
      @update:searchParams="(params) => Object.assign(searchParams, params)"
      @search="doSearch"
      @reset="doReset"
    />

    <!-- 表格 -->
    <a-card>
      <template #extra>
        <a-space>
          <a-button @click="handleColumnSetting">
            <template #icon><SettingOutlined /></template>
            自定义列
          </a-button>
          <a-button type="primary" @click="doAdd">
            <template #icon><PlusOutlined /></template>
            添加
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="resizableDisplayColumns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="false"
        @change="handleTableChange"
        :scroll="{ x: tableWidth, y: tableScrollHeight }"
        size="small"
        class="invoice-standard-table"
      >
        <template #headerCell="{ column }">
          <ResizableHeaderCell
            :width="column.width"
            :min-width="column.minWidth"
            :max-width="column.maxWidth"
            :column-key="column.key"
            :is-last-column="resizableDisplayColumns.findIndex(c => (c.key || c.dataIndex) === (column.key || column.dataIndex)) === resizableDisplayColumns.length - 1"
            :fixed="column.fixed"
            :on-resize="(width, deltaX) => updateColumnWidth(column.key || '', width, deltaX)"
            :on-resize-stop="(width, deltaX) => updateColumnWidth(column.key || '', width, deltaX)"
            :hide-separator="true"
          >
            {{ column.title }}
          </ResizableHeaderCell>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'serialNo'">
            <span>{{ record.serialNo }}</span>
          </template>
          <template v-if="column.dataIndex === 'permission'">
            <a-tag :color="getPermissionColor(record.permission)">
              {{ record.permission || '未设置' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-column-content">
              <a-space :size="4">
                <a-button type="link" size="small" @click="doEdit(record)">编辑</a-button>
              </a-space>
            </div>
          </template>
        </template>
      </a-table>
      <InvoicePagination
        :total="paginationView.total || 0"
        :current="paginationView.current || 1"
        :page-size="paginationView.pageSize || 10"
        @update:current="handlePageChange"
        @update:pageSize="(size) => handlePageSizeChange(1, size)"
      />
    </a-card>

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="allColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 添加/编辑弹窗 -->
    <EmployeePermissionEditModal
      ref="employeePermissionEditModalRef"
      v-model="modalVisible"
      :title="modalTitle"
      :serial-no="currentEditSerialNo"
      :form-data="formData"
      :is-editing="!!editingId"
      @ok="handleSubmit"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
      @reset="() => {}"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons-vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import EmployeePermissionEditModal from '@/modal/employee/EmployeePermissionEditModal.vue'
import type { ComponentPublicInstance } from 'vue'
import EmployeeFilterBar from '@/components/employee/EmployeeFilterBar.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import { useEmployeePermissionManage } from '@/hooks/employee/useEmployeePermissionManage'
import { updatePermissionUsingPost1 as updatePermissionUsingPost } from '@/api/yuangongguanlijiekou'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'

// 使用权限维护 Hook
const {
  loading,
  dataList,
  dataListWithSerial,
  pagination,
  paginationParams,
  searchParams,
  tableScrollHeight,
  allColumns,
  selectedColumns,
  resizableDisplayColumns,
  tableWidth,
  updateColumnWidth,
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,
  getPermissionColor,
  doSearch,
  doReset,
  handlePageChange,
  handlePageSizeChange,
  handleTableChange,
  fetchData,
} = useEmployeePermissionManage()

const paginationView = computed(() => pagination.value)

// 公司列表（用于筛选、展示 companyName 的映射）
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
const getCompanyNameFromRecord = (record: Partial<API.EmployeeVO>) => {
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

  // 若通过 companyId 也匹配不到，则返回空字符串，避免将数字显示在 UI 上
  return ''
}

// 模态框相关
const modalVisible = ref(false)
const modalTitle = ref('添加-员工权限')
const editingId = ref<number | null>(null)
const currentEditIndex = ref<number>(-1)
const targetSerialNo = ref<number | null>(null) // 临时存储目标序号（用于分页切换时避免闪烁）
const formData = ref<any>({})
const employeePermissionEditModalRef = ref<InstanceType<typeof EmployeePermissionEditModal>>()

const currentEditSerialNo = computed(() => {
  // 如果正在切换分页，使用目标序号
  if (targetSerialNo.value !== null) {
    return targetSerialNo.value
  }
  if (currentEditIndex.value < 0) {
    return null
  }
  const current = Number(pagination.value.current) || 1
  const pageSize = Number(pagination.value.pageSize) || 10
  return (current - 1) * pageSize + currentEditIndex.value + 1
})

const doAdd = () => {
  modalTitle.value = '添加-员工权限'
  editingId.value = null
  currentEditIndex.value = -1
  targetSerialNo.value = null // 清除临时序号
  formData.value = {
    employeeId: undefined,
    permission: '',
    expiryDate: dayjs('2099-12-31'),
  }
  modalVisible.value = true
}

const doEdit = (record: API.EmployeeVO) => {
  modalTitle.value = '修改-员工权限'
  editingId.value = record.id || null
  targetSerialNo.value = null // 清除临时序号
  const index = dataList.value.findIndex(item => item.id === record.id)
  currentEditIndex.value = index >= 0 ? index : -1
  formData.value = {
    id: record.id,
    employeeId: record.id,
    name: record.name,
    employeeNo: record.employeeNo,
    phone: record.phone,
    idCard: record.idCard,
    companyId: record.companyId,
    companyName: getCompanyNameFromRecord(record),
    department: record.department,
    permission: record.permission || '',
    expiryDate: record.expiryDate ? dayjs(record.expiryDate) : dayjs('2099-12-31'),
  }
  modalVisible.value = true
}

const handleSubmit = async (data: any, callback?: (success: boolean) => void) => {
  try {
    if (!data.id && !data.employeeId) {
      message.error('请先选择员工')
      callback?.(false)
      return
    }

    const employeeId = data.id || data.employeeId
    if (!employeeId) {
      message.error('员工ID不能为空')
      callback?.(false)
      return
    }

    const expiryDate =
      data.expiryDate ? (typeof data.expiryDate === 'string' ? data.expiryDate : data.expiryDate.format('YYYY-MM-DD')) : ''
    if (!expiryDate) {
      message.error('有效期止不能为空')
      callback?.(false)
      return
    }

    const submitData: API.EmployeePermissionUpdateDTO = {
      id: employeeId,
      permission: data.permission,
      permissionCode: data.permissionCode || '',
      permissionId: data.permissionId,
      expiryDate,
    }

    const res = (await updatePermissionUsingPost(submitData)) as any
    if (res.data.code === 0) {
      message.success(editingId.value ? '更新成功' : '添加成功')
      await fetchData()
      // 如果是新增模式且弹窗还在打开状态，重新获取权限为空的员工列表
      if (!editingId.value && modalVisible.value && employeePermissionEditModalRef.value) {
        await employeePermissionEditModalRef.value.refreshEmployeeList()
      }
      callback?.(true)
    } else {
      message.error((editingId.value ? '更新失败' : '添加失败') + ' ' + (res.data.message || ''))
      callback?.(false)
    }
  } catch (error) {
    console.error('提交失败', error)
    message.error('提交失败')
    callback?.(false)
  }
}

// 下一条（连续录入）
const handleNext = () => {
  formData.value = {
    employeeId: undefined,
    permission: '',
    expiryDate: dayjs('2099-12-31'),
  }
  editingId.value = null
  currentEditIndex.value = -1
  targetSerialNo.value = null
  modalTitle.value = '添加-员工权限'
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
    let nextRecord: API.EmployeeVO | undefined
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10

    // 如果下一条记录在当前页
    if (nextIndex < dataList.value.length) {
      nextRecord = dataList.value[nextIndex]
      currentEditIndex.value = nextIndex
    } else {
      // 如果下一条记录在下一页
      const totalPages = Math.ceil((pagination.value.total || 0) / pageSize)
      const currentPage = current

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
        id: nextRecord.id,
        employeeId: nextRecord.id,
        name: nextRecord.name,
        employeeNo: nextRecord.employeeNo,
        phone: nextRecord.phone,
        idCard: nextRecord.idCard,
        companyId: nextRecord.companyId,
          companyName: getCompanyNameFromRecord(nextRecord),
        department: nextRecord.department,
        permission: nextRecord.permission || '',
        expiryDate: nextRecord.expiryDate ? dayjs(nextRecord.expiryDate) : dayjs('2099-12-31'),
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
    let prevRecord: API.EmployeeVO | undefined
    const current = Number(paginationParams.current) || 1
    const pageSize = Number(paginationParams.pageSize) || 10

    // 如果上一条记录在当前页
    if (prevIndex >= 0) {
      prevRecord = dataList.value[prevIndex]
      currentEditIndex.value = prevIndex
    } else {
      // 如果上一条记录在上一页
      if (current > 1) {
        const targetPage = current - 1
        // 设置临时序号，避免闪烁
        targetSerialNo.value = (targetPage - 1) * pageSize
        
        // 加载上一页数据
        paginationParams.current = targetPage
        await fetchData()

        await nextTick()
        // 等待数据加载完成后，获取最后一条记录
        if (dataList.value.length > 0) {
          prevRecord = dataList.value[dataList.value.length - 1]
          currentEditIndex.value = dataList.value.length - 1
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
        id: prevRecord.id,
        employeeId: prevRecord.id,
        name: prevRecord.name,
        employeeNo: prevRecord.employeeNo,
        phone: prevRecord.phone,
        idCard: prevRecord.idCard,
        companyId: prevRecord.companyId,
        companyName: getCompanyNameFromRecord(prevRecord),
        department: prevRecord.department,
        permission: prevRecord.permission || '',
        expiryDate: prevRecord.expiryDate ? dayjs(prevRecord.expiryDate) : dayjs('2099-12-31'),
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

onMounted(() => {
  fetchCompanyList()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';

#employeePermissionPage {
  padding: 0;
}

/* 去掉筛选卡片与下方卡片之间的灰色分隔线 */
#employeePermissionPage > .ant-card:first-child {
  border-bottom: none;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#employeePermissionPage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>

