<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="1000px"
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
      @reset="handleReset"
    >
      <template #content>
      <a-form
        ref="formRef"
        :validate-trigger="['submit']"
          :model="formData"
          layout="horizontal"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 19 }"
        >
          <!-- 第一行：开票日期、开票金额、发票号码、发票类型 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="6">
              <a-form-item label="开票日期" name="issueDate" :rules="[{ required: true, message: '请选择开票日期' }]">
                <a-date-picker
                  v-model:value="formData.issueDate"
                  placeholder="请选择开票日期"
                  style="width: 100%"
                  format="YYYYMMDD"
                  value-format="YYYY-MM-DD"
                  @change="(val: any) => { if (val) formRef?.clearValidate(['issueDate']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="开票金额" name="amount" :rules="[{ required: true, message: '请输入开票金额' }]">
                <a-input-number
                  v-model:value="formData.amount"
                  placeholder="请输入开票金额"
                  style="width: 100%"
                  :min="0"
                  :precision="2"
                  :step="1000"
                  @change="(val: any) => { if (val !== undefined && val !== null && val !== '') formRef?.clearValidate(['amount']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发票号码" name="invoiceNo" :rules="[{ required: true, message: '请输入发票号码' }]">
                <a-input
                  v-model:value="formData.invoiceNo"
                  placeholder="请输入发票号码"
                  @change="(e: any) => { if ((e?.target?.value || '').trim()) formRef?.clearValidate(['invoiceNo']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="发票类型" name="invoiceType">
                <a-select
                  v-model:value="formData.invoiceType"
                  placeholder="请选择类型"
                  style="width: 100%"
                  allow-clear
                >
                  <a-select-option
                    v-for="invoiceType in invoiceTypeList"
                    :key="invoiceType.id"
                    :value="invoiceType.typeName"
                  >
                    {{ invoiceType.typeName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第二行：客户单位、客户姓名、标号 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="客户单位" name="customerCompany" :rules="[{ required: true, message: '请选择客户单位' }]">
                <a-auto-complete
                  :key="`customer-company-${visible}`"
                  v-model:value="formData.customerCompany"
                  :options="filteredCustomerCompanyOptions"
                  placeholder="选择或输入客户单位"
                  style="width: 100%"
                  allow-clear
                  show-search
                  @select="(value: string) => { formRef?.clearValidate(['customerCompany']); handleCustomerCompanySelect(value) }"
                  @change="handleCustomerCompanyChange"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="客户姓名" name="customerContact" :rules="[{ required: true, message: '请输入客户姓名' }]">
                <a-auto-complete
                  :key="`customer-contact-${visible}-${formData.customerCompany || ''}`"
                  v-model:value="formData.customerContact"
                  :options="filteredCustomerContactOptions"
                  placeholder="选择或输入客户姓名"
                  style="width: 100%"
                  allow-clear
                  :disabled="!formData.customerCompany"
                  @change="(value: string) => { customerContactAutoComplete.handleChange(value); if (value) formRef?.clearValidate(['customerContact']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="标号" name="mark">
                <a-select
                  v-model:value="formData.mark"
                  placeholder="请选择标号"
                  style="width: 100%"
                  allow-clear
                >
                  <a-select-option
                    v-for="mark in markList"
                    :key="mark.value"
                    :value="mark.value"
                  >
                    {{ mark.label || mark.value }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第三行：开票单位、业务员、开票人 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="开票单位" name="issuerCompany" :rules="[{ required: true, message: '请选择开票单位' }]">
                <a-auto-complete
                  :key="`issuer-company-${visible}`"
                  v-model:value="formData.issuerCompany"
                  :options="filteredIssuerCompanyOptions"
                  placeholder="选择或输入开票单位"
                  style="width: 100%"
                  allow-clear
                  @change="(value: string) => { if (value) formRef?.clearValidate(['issuerCompany']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="业务员" name="salespersonName" :rules="[{ required: true, message: '请输入业务员' }]">
                <a-auto-complete
                  :key="`salesperson-${visible}`"
                  v-model:value="formData.salespersonName"
                  :options="filteredSalespersonOptions"
                  placeholder="选择或输入业务员"
                  style="width: 100%"
                  allow-clear
                  @change="(value: string) => { if (value) formRef?.clearValidate(['salespersonName']) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="开票人" name="issuerName">
                <a-auto-complete
                  :key="`issuer-name-${visible}`"
                  v-model:value="formData.issuerName"
                  :options="filteredIssuerNameOptions"
                  placeholder="选择或输入开票人"
                  style="width: 100%"
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第四行：备注1 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注1"
                name="remark1"
                :label-col="{ style: { width: '10.41667%' } }"
                :wrapper-col="{ style: { width: '89.58333%' } }"
              >
                <a-input v-model:value="formData.remark1" placeholder="请输入备注1" allow-clear />
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
import { ref, watch, reactive, computed, nextTick } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { getUserNameByCompanyNameUsingPost } from '@/api/kehuxinxiguanli'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import { createContactSelectHandler } from '@/hooks/useContactSelect'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface FormData {
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
}

interface Props {
  modelValue: boolean
  title: string
  companyList: API.Company[]
  clientList: API.Client_[]
  invoiceTypeList: API.InvoiceType_[]
  employeeList: API.Employee_[]
  markList: Array<{ value: string; label: string }>
  formData?: Partial<FormData>
}

const props = withDefaults(defineProps<Props>(), {
  companyList: () => [],
  clientList: () => [],
  invoiceTypeList: () => [],
  employeeList: () => [],
  markList: () => [],
  formData: () => ({
    issueDate: undefined,
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
  }),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
  'next-edit': [callback: (success: boolean) => void] // 编辑模式的下一条，传递回调函数
  'reset': [] // 重置事件
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

// 保存原始记录数据，用于重置
const originalFormData = ref<Partial<FormData> | null>(null)

const formData = reactive<FormData>({
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
})

// 客户单位自动完成选项（去重）
const customerCompanyOptions = computed(() => {
  const uniqueCompanyNames = new Set<string>()
  const uniqueClients = props.clientList.filter((client: API.Client_) => {
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
  baseOptions: customerCompanyOptions,
  currentValue: computed(() => formData.customerCompany || ''),
  enableAutoAdd: true,
})

// 过滤后的客户单位选项
const filteredCustomerCompanyOptions = customerCompanyAutoComplete.filteredOptions

// 客户联系人名称列表
const contactNameList = ref<string[]>([])

// 客户姓名自动完成选项
const customerContactOptions = computed(() => {
  return contactNameList.value.map(name => ({
    value: name,
    label: name,
  }))
})

// 客户姓名自动填充框（使用通用 composable）
const customerContactAutoComplete = useAutoCompleteWithExtra({
  baseOptions: customerContactOptions,
  currentValue: computed(() => formData.customerContact || ''),
  enableAutoAdd: true,
})

// 过滤后的客户姓名选项
const filteredCustomerContactOptions = customerContactAutoComplete.filteredOptions

// 开票单位自动完成选项
const issuerCompanyOptions = computed(() => {
  return props.companyList.map(company => ({
    value: company.companyName || '',
    label: company.companyName || '',
  }))
})

// 开票单位自动填充框（使用通用 composable）
const issuerCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: issuerCompanyOptions,
  currentValue: computed(() => formData.issuerCompany || ''),
  enableAutoAdd: true,
})

// 过滤后的开票单位选项
const filteredIssuerCompanyOptions = issuerCompanyAutoComplete.filteredOptions

// 业务员自动完成选项
const salespersonOptions = computed(() => {
  return props.employeeList.map(employee => ({
    value: employee.name || '',
    label: `${employee.name}${employee.employeeNo ? ` (${employee.employeeNo})` : ''}`,
  }))
})

// 业务员自动填充框（使用通用 composable）
const salespersonAutoComplete = useAutoCompleteWithExtra({
  baseOptions: salespersonOptions,
  currentValue: computed(() => formData.salespersonName || ''),
  enableAutoAdd: true,
})

// 过滤后的业务员选项
const filteredSalespersonOptions = salespersonAutoComplete.filteredOptions

// 开票人自动完成选项
const issuerNameOptions = computed(() => {
  return props.employeeList.map(employee => ({
    value: employee.name || '',
    label: `${employee.name}${employee.employeeNo ? ` (${employee.employeeNo})` : ''}`,
  }))
})

// 开票人自动填充框（使用通用 composable）
const issuerAutoComplete = useAutoCompleteWithExtra({
  baseOptions: issuerNameOptions,
  currentValue: computed(() => formData.issuerName || ''),
  enableAutoAdd: true,
})

// 过滤后的开票人选项
const filteredIssuerNameOptions = issuerAutoComplete.filteredOptions

// 获取客户联系人列表
const fetchContactNameList = async (companyName: string) => {
  if (!companyName) {
    contactNameList.value = []
    return
  }

  try {
    // 使用新接口获取客户联系人列表（无数据丢失风险）
    const res = (await getUserNameByCompanyNameUsingPost({ companyName } as any)) as any
    if (res?.data?.code === 0 && res?.data?.data) {
      const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
      const contactNames = rows
        .map((r) => (r?.userName || '').trim())
        .filter((name: string) => name && name.trim())
      contactNameList.value = Array.from(new Set(contactNames))
    } else {
      contactNameList.value = []
    }
  } catch (error) {
    console.error('获取联系人列表失败', error)
    contactNameList.value = []
  }
}

// 处理客户单位选择
const handleCustomerCompanySelect = createContactSelectHandler({
  fetchContactList: fetchContactNameList,
  getContactList: () => contactNameList.value,
  getCurrentContact: () => formData.customerContact,
  setContact: (val: string) => {
    formData.customerContact = val
  },
  clearContactList: () => {
    contactNameList.value = []
  },
  clearAssociation: () => {
    // 编辑场景本身未维护关联状态，这里仅保持与销项添加一致的清空逻辑
  },
})

// 处理客户单位变化
const handleCustomerCompanyChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerCompanyAutoComplete.handleChange(value)
  
  if (value) {
    // 如果值不为空，清除该字段的验证错误
    formRef.value?.clearValidate?.(['customerCompany'])
    const exists = customerCompanyOptions.value.some(opt => opt.value === value)
    if (exists) {
      await handleCustomerCompanySelect(value)
    } else {
      contactNameList.value = []
      formData.customerContact = ''
    }
  } else {
    contactNameList.value = []
    formData.customerContact = ''
  }
}

// 监听 props.modelValue
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    if (props.formData && props.formData.invoiceNo) {
      // 编辑模式
      isEditing.value = true
      // 保存原始数据用于重置
      originalFormData.value = {
        issueDate: props.formData.issueDate ? (typeof props.formData.issueDate === 'string' ? dayjs(props.formData.issueDate) : props.formData.issueDate) : undefined,
        amount: props.formData.amount,
        invoiceNo: props.formData.invoiceNo || '',
        customerCompany: props.formData.customerCompany || '',
        customerContact: props.formData.customerContact || '',
        issuerCompany: props.formData.issuerCompany || undefined,
        salespersonName: props.formData.salespersonName || '',
        issuerName: props.formData.issuerName || '',
        mark: props.formData.mark || '000',
        invoiceType: props.formData.invoiceType || '',
        remark1: props.formData.remark1 || '',
        remark2: props.formData.remark2 || '',
        remark3: props.formData.remark3 || '',
      }
      Object.assign(formData, originalFormData.value)
      if (props.formData.customerCompany) {
        handleCustomerCompanySelect(props.formData.customerCompany)
      }
    } else {
      // 新增模式
      isEditing.value = false
      Object.assign(formData, {
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
      })
      contactNameList.value = []
    }
  } else {
    formRef.value?.resetFields()
    // 清空所有表单数据，确保自动填充框状态重置
    Object.assign(formData, {
      issueDate: undefined,
      amount: undefined,
      invoiceNo: '',
      customerCompany: '',
      customerContact: '',
      issuerCompany: undefined,
      salespersonName: '',
      issuerName: '',
      mark: '000',
      invoiceType: '',
      remark1: '',
      remark2: '',
      remark3: '',
    })
    contactNameList.value = []
    isEditing.value = false
    originalFormData.value = null
    upsertModalRef.value?.resetButtonState()
  }
})

// 监听 formData 变化（用于编辑模式下更新数据）
watch(() => props.formData, (newFormData) => {
  if (visible.value && newFormData) {
    if (newFormData.invoiceNo) {
      // 保存原始数据用于重置
      originalFormData.value = {
        issueDate: newFormData.issueDate ? (typeof newFormData.issueDate === 'string' ? dayjs(newFormData.issueDate) : newFormData.issueDate) : undefined,
        amount: newFormData.amount,
        invoiceNo: newFormData.invoiceNo || '',
        customerCompany: newFormData.customerCompany || '',
        customerContact: newFormData.customerContact || '',
        issuerCompany: newFormData.issuerCompany || undefined,
        salespersonName: newFormData.salespersonName || '',
        issuerName: newFormData.issuerName || '',
        mark: newFormData.mark || '000',
        invoiceType: newFormData.invoiceType || '',
        remark1: newFormData.remark1 || '',
        remark2: newFormData.remark2 || '',
        remark3: newFormData.remark3 || '',
      }
      Object.assign(formData, originalFormData.value)
      if (newFormData.customerCompany) {
        handleCustomerCompanySelect(newFormData.customerCompany)
      }
    }
  }
}, { deep: true })

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 保存按钮处理
const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
    emit('ok', { ...formData }, callback)
  } catch (error) {
    console.error('表单验证失败', error)
    // 表单验证失败时，立即调用 callback(false) 通知 upsertModal 停止 loading
    callback(false)
  }
}

// 下一条按钮处理（新增模式）
const handleNext = () => {
  // 新增模式：保留所有已填入的字段，包括唯一字段（发票号码、开票日期、开票金额等）
  // 这样用户可以在旧数据基础上快速修改录入，提高录入效率
  // 不进行任何字段清空操作，完全保留所有数据
  // 只清除验证状态，不清除字段值
  formRef.value?.clearValidate()
  emit('next')
}

// 下一条编辑按钮处理（编辑模式）
const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

const handleReset = () => {
  // 重置表单到初始状态
  formRef.value?.resetFields()
  // 重置表单数据
  if (isEditing.value) {
    // 编辑模式：重置为原始记录的数据
    if (originalFormData.value) {
      Object.assign(formData, {
        issueDate: originalFormData.value.issueDate ? (typeof originalFormData.value.issueDate === 'string' ? dayjs(originalFormData.value.issueDate) : originalFormData.value.issueDate) : undefined,
        amount: originalFormData.value.amount,
        invoiceNo: originalFormData.value.invoiceNo || '',
        customerCompany: originalFormData.value.customerCompany || '',
        customerContact: originalFormData.value.customerContact || '',
        issuerCompany: originalFormData.value.issuerCompany || undefined,
        salespersonName: originalFormData.value.salespersonName || '',
        issuerName: originalFormData.value.issuerName || '',
        mark: originalFormData.value.mark || '000',
        invoiceType: originalFormData.value.invoiceType || '',
        remark1: originalFormData.value.remark1 || '',
        remark2: originalFormData.value.remark2 || '',
        remark3: originalFormData.value.remark3 || '',
      })
      // 如果选择了客户单位，重新加载联系人列表
      if (originalFormData.value.customerCompany) {
        handleCustomerCompanySelect(originalFormData.value.customerCompany)
      }
    } else if (props.formData) {
      // 如果没有保存的原始数据，使用 props.formData
      Object.assign(formData, {
        issueDate: props.formData.issueDate ? (typeof props.formData.issueDate === 'string' ? dayjs(props.formData.issueDate) : props.formData.issueDate) : undefined,
        amount: props.formData.amount,
        invoiceNo: props.formData.invoiceNo || '',
        customerCompany: props.formData.customerCompany || '',
        customerContact: props.formData.customerContact || '',
        issuerCompany: props.formData.issuerCompany || undefined,
        salespersonName: props.formData.salespersonName || '',
        issuerName: props.formData.issuerName || '',
        mark: props.formData.mark || '000',
        invoiceType: props.formData.invoiceType || '',
        remark1: props.formData.remark1 || '',
        remark2: props.formData.remark2 || '',
        remark3: props.formData.remark3 || '',
      })
      // 如果选择了客户单位，重新加载联系人列表
      if (props.formData.customerCompany) {
        handleCustomerCompanySelect(props.formData.customerCompany)
      }
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
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
    })
    contactNameList.value = []
  }
  // 清除验证状态
  formRef.value?.clearValidate()
  // 重置按钮状态
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
@import '@/styles/form-modal.css';
</style>

