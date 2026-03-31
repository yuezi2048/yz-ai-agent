<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="900px"
    :mask-closable="false"
    :keyboard="true"
  >
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="isEditing"
      :show-footer="true"
      @save="handleSave"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
      @reset="handleReset"
    >
      <template #content>
        <div class="form-modal">
          <a-form
            ref="formRef"
            :model="formData"
            layout="horizontal"
            :validate-trigger="['submit']"
            :label-col="{ span: 8 }"
            :wrapper-col="{ span: 16 }"
          >
          <!-- 新增模式下显示员工选择下拉框 -->
          <a-row :gutter="[16, 16]" v-if="!isEditing">
            <a-col :span="24">
              <a-form-item label="选择员工" name="employeeId" :rules="[{ required: !isEditing, message: '请选择员工' }]"
                 :label-col="{ style: { width: '10.41667%' } }"
                 :wrapper-col="{ style: { width: '89.58333%' } }"
              >
                <a-select
                  v-model:value="formData.employeeId"
                  placeholder="请选择员工（仅显示权限为空的员工）"
                  style="width: 100%"
                  show-search
                  :filter-option="filterEmployeeOption"
                  @change="handleEmployeeChange"
                  :loading="employeeListLoading"
                >
                  <a-select-option
                    v-for="employee in employeeList"
                    :key="employee.id"
                    :value="employee.id"
                  >
                    {{ employee.name }}（{{ employee.employeeNo }}） - {{ employee.companyName }} - {{ employee.department }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 只读字段 - 每行3个输入框（每个占8列） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="姓名">
                <a-input v-model:value="formData.name" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="工号">
                <a-input v-model:value="formData.employeeNo" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="联系电话">
                <a-input v-model:value="formData.phone" disabled />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="身份证号码">
                <a-input v-model:value="formData.idCard" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="所属部门">
                <a-input v-model:value="formData.department" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="公司名称">
                <a-input v-model:value="formData.companyName" disabled />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 可编辑字段 - 每行3个输入框（每个占8列） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="分配权限" name="permission" :rules="[{ required: true, message: '请选择分配权限' }]">
                <a-select
                  v-model:value="formData.permission"
                  placeholder="请选择分配权限"
                  style="width: 100%"
                  allow-clear
                  :loading="permissionListLoading"
                  @change="handlePermissionChange"
                >
                  <a-select-option
                    v-for="permission in permissionList"
                    :key="permission.id"
                    :value="permission.permissionName || ''"
                  >
                    {{ permission.permissionName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="有效期止" name="expiryDate" :rules="[{ required: true, message: '请选择有效期止' }]">
                <a-date-picker
                  v-model:value="formData.expiryDate"
                  placeholder="请选择有效期止"
                  style="width: 100%"
                  format="YYYYMMDD"
                  value-format="YYYY-MM-DD"
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        </div>
      </template>
    </upsert-modal>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed, nextTick, onMounted } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import dayjs, { type Dayjs } from 'dayjs'
import { getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { message } from 'ant-design-vue'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { queryPermissionListEnabledUsingGet } from '@/api/jichuxinxiguanlijiekou'

interface FormData {
  id?: number
  employeeId?: number
  name?: string
  employeeNo?: string
  phone?: string
  idCard?: string
  department?: string
  companyName?: string
  companyId?: number
  permission: string
  permissionCode?: string
  permissionId?: number
  expiryDate: Dayjs | string | null
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  formData?: Partial<FormData>
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({
    permission: '',
    expiryDate: dayjs('2099-12-31'),
  }),
  isEditing: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
  'next-edit': [callback: (success: boolean) => void]
  'prev-edit': [callback: (success: boolean) => void]
  'reset': []
  'refresh-employee-list': []
}>()

// 暴露刷新员工列表的方法，供父组件调用
defineExpose({
  refreshEmployeeList: fetchEmployeeList,
})

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = computed(() => props.isEditing)

const originalFormData = ref<Partial<FormData> | null>(null)

// 员工列表（权限为空的员工）
const employeeList = ref<API.EmployeeBasicInfoVO[]>([])
const employeeListLoading = ref(false)

// 权限列表（启用的权限）
const permissionList = ref<API.PermissionItemVO[]>([])
const permissionListLoading = ref(false)

const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

const formData = reactive<FormData>({
  id: undefined,
  employeeId: undefined,
  name: '',
  employeeNo: '',
  phone: '',
  idCard: '',
  department: '',
  companyName: '',
  companyId: undefined,
  permission: '',
  permissionCode: '',
  permissionId: undefined,
  expiryDate: dayjs('2099-12-31'),
})

// 公司列表：用于把接口返回的 companyName（可能是数字/ID）规范化为真实名称
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

const getCompanyNameFromRecord = (record: Partial<API.EmployeeBasicInfoVO>) => {
  const companyNameField = (record as any).companyName
  const companyIdField = record.companyId

  if (typeof companyNameField === 'string' && companyNameField.trim() && !/^\d+$/.test(companyNameField.trim())) {
    return companyNameField.trim()
  }

  const normalizedId =
    typeof companyNameField === 'number'
      ? companyNameField
      : /^\d+$/.test(companyNameField || '')
        ? Number(companyNameField)
        : companyIdField

  const matched = companyList.value.find((c) => c.id === normalizedId)
  if (matched?.companyName) return matched.companyName
  return ''
}

// 获取启用的权限列表
const fetchPermissionList = async () => {
  permissionListLoading.value = true
  try {
    const res = (await queryPermissionListEnabledUsingGet()) as any
    if (res.data?.code === 0 && res.data?.data) {
      // BaseResponseList_ 的 data 是数组
      permissionList.value = Array.isArray(res.data.data) ? res.data.data : []
    } else {
      permissionList.value = []
    }
  } catch (error) {
    console.error('获取权限列表失败', error)
    permissionList.value = []
    message.error('获取权限列表失败')
  } finally {
    permissionListLoading.value = false
  }
}

// 获取权限为空的员工列表（用函数声明，避免被 defineExpose 提前引用时报错）
async function fetchEmployeeList() {
  employeeListLoading.value = true
  try {
    // 确保公司列表已加载，避免 companyName 规范化时为空
    if (!companyList.value || companyList.value.length === 0) {
      await fetchCompanyList()
    }
    // 使用新接口获取所有员工基本信息（无数据丢失风险）
    const res = (await getAllEmployeeBasicInfoUsingGet({})) as any

    if (res?.data?.code === 0 && Array.isArray(res?.data?.data)) {
      // 筛选权限为空或null或未设置的员工
      // 注意：getAllEmployeeBasicInfoUsingGet 返回的数据可能不包含 permission 字段
      // 如果需要筛选权限为空的员工，可能需要使用其他接口或后端支持
      // 这里先获取所有员工，如果后端接口支持 permission 字段筛选，可以在这里添加筛选逻辑
      employeeList.value = res.data.data
        .filter((emp: API.EmployeeBasicInfoVO) => {
          // 如果 permission 字段存在，筛选权限为空的
          if ('permission' in emp) {
            return !emp.permission || (emp.permission as string).trim() === '' || emp.permission === '未设置'
          }
          // 如果 permission 字段不存在，默认显示（可能需要后端接口支持）
          return true
        })
        .map((emp: API.EmployeeBasicInfoVO) => ({
          ...emp,
          // 将 companyName 统一为可读名称，避免出现数字/ID
          companyName: getCompanyNameFromRecord(emp),
        }))
    } else {
      employeeList.value = []
    }
  } catch (error) {
    console.error('获取员工列表失败', error)
    employeeList.value = []
    message.error('获取员工列表失败')
  } finally {
    employeeListLoading.value = false
  }
}

// 员工选择下拉框过滤
const filterEmployeeOption = (input: string, option: any) => {
  const label = option.children?.[0]?.children || option.label || ''
  return label.toLowerCase().includes(input.toLowerCase())
}

// 员工选择变化处理
const handleEmployeeChange = (employeeId: number) => {
  const employee = employeeList.value.find(emp => emp.id === employeeId)
  if (employee) {
    formData.id = employee.id
    formData.employeeId = employee.id
    formData.name = employee.name || ''
    formData.employeeNo = employee.employeeNo || ''
    formData.phone = employee.phone || ''
    formData.idCard = employee.idCard || ''
    formData.department = employee.department || ''
    formData.companyName = getCompanyNameFromRecord(employee)
    formData.companyId = employee.companyId || 0
  }
}

// 权限选择变化处理
const handlePermissionChange = (permissionName: string) => {
  const permission = permissionList.value.find(p => p.permissionName === permissionName)
  if (permission) {
    formData.permission = permission.permissionName || ''
    formData.permissionCode = permission.permissionCode || ''
    formData.permissionId = permission.id
  } else {
    formData.permission = ''
    formData.permissionCode = ''
    formData.permissionId = undefined
  }
}

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 获取权限列表（添加和编辑模式都需要）
    await fetchPermissionList()
    // 如果是新增模式，获取员工列表
    if (!props.isEditing) {
      await fetchEmployeeList()
    }

    if (props.formData) {
      originalFormData.value = {
        id: props.formData.id,
        employeeId: props.formData.employeeId || props.formData.id,
        name: props.formData.name || '',
        employeeNo: props.formData.employeeNo || '',
        phone: props.formData.phone || '',
        idCard: props.formData.idCard || '',
        department: props.formData.department || '',
        companyName: props.formData.companyName || '',
        companyId: props.formData.companyId,
        permission: props.formData.permission || '',
        permissionCode: props.formData.permissionCode || '',
        permissionId: props.formData.permissionId,
        expiryDate: props.formData.expiryDate ? (typeof props.formData.expiryDate === 'string' ? dayjs(props.formData.expiryDate) : props.formData.expiryDate) : dayjs('2099-12-31'),
      }
      Object.assign(formData, originalFormData.value)
      // 如果已有权限名称，同步设置权限代码和权限ID
      if (formData.permission && (!formData.permissionCode || !formData.permissionId)) {
        const permission = permissionList.value.find(p => p.permissionName === formData.permission)
        if (permission) {
          formData.permissionCode = permission.permissionCode || ''
          formData.permissionId = permission.id
        }
      }
    } else {
      Object.assign(formData, {
        id: undefined,
        employeeId: undefined,
        name: '',
        employeeNo: '',
        phone: '',
        idCard: '',
        department: '',
        companyName: '',
        companyId: undefined,
        permission: '',
        permissionCode: '',
        permissionId: undefined,
        expiryDate: dayjs('2099-12-31'),
      })
    }
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  } else {
    Object.assign(formData, {
      id: undefined,
      employeeId: undefined,
      name: '',
      employeeNo: '',
      phone: '',
      idCard: '',
      department: '',
      companyName: '',
      companyId: undefined,
      permission: '',
      permissionCode: '',
      expiryDate: dayjs('2099-12-31'),
    })
    originalFormData.value = null
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    const submitData = {
      ...formData,
      expiryDate: formData.expiryDate ? (typeof formData.expiryDate === 'string' ? formData.expiryDate : formData.expiryDate.format('YYYY-MM-DD')) : undefined,
    }
    emit('ok', submitData as FormData, callback)
  } catch (error) {
    console.error('表单验证失败', error)
    callback(false)
  }
}

const handleNext = () => {
  // 新增模式：保留所有已填入的字段，包括唯一字段
  // 这样用户可以在旧数据基础上快速修改录入，提高录入效率
  // 不进行任何字段清空操作，完全保留所有数据
  // 只清除验证状态，不清除字段值
  formRef.value?.clearValidate()
  // 重置状态机：保存可用，下一条禁用
  upsertModalRef.value?.resetButtonState()
  // 触发 next 事件
  emit('next')
}

// 监听 formData 变化（用于编辑模式下更新数据，如下一条功能）
watch(() => props.formData, (newFormData) => {
  if (visible.value && newFormData) {
    if (newFormData.id || newFormData.employeeId) {
      // 保存原始数据用于重置
      originalFormData.value = {
        id: newFormData.id,
        employeeId: newFormData.employeeId || newFormData.id,
        name: newFormData.name || '',
        employeeNo: newFormData.employeeNo || '',
        phone: newFormData.phone || '',
        idCard: newFormData.idCard || '',
        department: newFormData.department || '',
        companyName: newFormData.companyName || '',
        companyId: newFormData.companyId,
        permission: newFormData.permission || '',
        permissionCode: newFormData.permissionCode || '',
        permissionId: newFormData.permissionId,
        expiryDate: newFormData.expiryDate ? (typeof newFormData.expiryDate === 'string' ? dayjs(newFormData.expiryDate) : newFormData.expiryDate) : dayjs('2099-12-31'),
      }
      Object.assign(formData, originalFormData.value)
      // 如果已有权限名称，同步设置权限代码和权限ID
      if (formData.permission && (!formData.permissionCode || !formData.permissionId)) {
        const permission = permissionList.value.find(p => p.permissionName === formData.permission)
        if (permission) {
          formData.permissionCode = permission.permissionCode || ''
          formData.permissionId = permission.id
        }
      }
      nextTick().then(() => {
        upsertModalRef.value?.resetButtonState()
      })
    }
  }
}, { deep: true })

const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('prev-edit', callback)
}

const handleReset = () => {
  formRef.value?.resetFields()
  if (isEditing.value && originalFormData.value) {
    Object.assign(formData, originalFormData.value)
  } else {
    Object.assign(formData, {
      id: undefined,
      employeeId: undefined,
      name: '',
      employeeNo: '',
      phone: '',
      idCard: '',
      department: '',
      companyName: '',
      companyId: undefined,
      permission: '',
      permissionCode: '',
      expiryDate: dayjs('2099-12-31'),
    })
  }
  formRef.value?.clearValidate()
  upsertModalRef.value?.resetButtonState()
}

onMounted(() => {
  // 组件挂载时获取权限列表和公司列表
  fetchPermissionList()
  fetchCompanyList()
  if (!props.isEditing) {
    fetchEmployeeList()
  }
})
</script>

<style scoped>
@import '@/styles/form-modal.css';
</style>

