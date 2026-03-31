<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
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
      @prev-edit="handlePrevEdit"
      @reset="handleReset"
    >
      <template #content>
        <div class="form-modal">
          <a-form
            ref="formRef"
            :model="formData"
            layout="horizontal"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 19 }"
            :validate-trigger="['submit']"
          >
      <!-- 第一行：开票日期、开票金额 -->
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-form-item label="开票日期" name="issueDate" :rules="[{ required: true, message: '请选择开票日期' }]">
            <a-date-picker v-model:value="formData.issueDate" placeholder="请选择开票日期" style="width: 100%" format="YYYYMMDD" value-format="YYYY-MM-DD" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="开票金额" name="amount" :rules="[{ required: true, message: '请输入开票金额' }]">
            <!-- 金额允许为负数（红字发票） -->
            <a-input-number v-model:value="formData.amount" placeholder="请输入开票金额" style="width: 100%" :min="-999999999" :precision="2" :step="1000" />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 第二行：发票号码、客户单位 -->
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-form-item label="发票号码" name="invoiceNo" :rules="[{ required: true, message: '请输入发票号码' }]">
            <a-input v-model:value="formData.invoiceNo" placeholder="请输入发票号码" allow-clear />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="客户单位" name="customerCompany" :rules="[{ required: true, message: '请选择客户单位' }]">
            <a-input-group compact>
              <a-auto-complete
                :key="`customer-company-${visible}`"
                v-model:value="formData.customerCompany"
                :options="filteredCustomerCompanyOptions"
                placeholder="选择或输入客户单位"
                style="width: calc(100% - 32px)"
                allow-clear
                show-search
                @select="(value: string) => { formRef?.clearValidate(['customerCompany']); handleCustomerCompanySelect(value) }"
                @change="handleCustomerCompanyChange"
              />
              <a-button
                type="primary"
                :icon="clientActionIcon"
                @click="handleClientAction"
                style="width: 32px; padding: 0;"
              />
            </a-input-group>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 第三行：客户姓名、发票种类 -->
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-form-item label="客户姓名" name="customerContact" :rules="[{ required: true, message: '请输入客户姓名' }]">
            <a-auto-complete
              :key="`customer-contact-${visible}-${formData.customerCompany || ''}`"
              v-model:value="formData.customerContact"
              :options="filteredCustomerContactOptions"
              placeholder="选择或输入客户姓名"
              style="width: 100%"
              allow-clear
              :disabled="!formData.customerCompany"
              @change="handleCustomerContactChange"
              @blur="handleCustomerContactBlur"
            />
            <!-- 客户关联验证提示（也显示在客户姓名下方） -->
            <div v-if="clientValidationMessage && formData.customerContact" class="validation-message" :class="clientValidationMessage.type">
              <span v-html="sanitizedClientValidationText"></span>
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="发票种类" name="invoiceType">
            <a-button @click="showInvoiceTypeModal = true" class="filter-select-button" :style="{ width: '100%', textAlign: 'left' }">
              <span v-if="formData.invoiceType" class="filter-selected-text">
                {{ formData.invoiceType }}
              </span>
              <span v-else>请选择发票种类</span>
              <RightOutlined class="filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 第四行：公司名称、业务经理 -->
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-form-item label="公司名称" name="issuerCompany" :rules="[{ required: true, message: '请选择公司名称' }]">
            <a-input-group compact>
              <a-auto-complete
                :key="`issuer-company-${visible}`"
                v-model:value="formData.issuerCompany"
                :options="filteredIssuerCompanyOptions"
                placeholder="选择或输入公司名称"
                style="width: calc(100% - 32px)"
                allow-clear
                @change="handleIssuerCompanyChange"
                @blur="handleIssuerCompanyBlur"
              />
              <a-button
                type="primary"
                :icon="issuerCompanyActionIcon"
                @click="handleIssuerCompanyAction"
                style="width: 32px; padding: 0;"
              />
            </a-input-group>
            <!-- 公司名称关联验证提示 -->
            <div v-if="companyValidationMessage" class="validation-message" :class="companyValidationMessage.type">
              <span v-html="sanitizedCompanyValidationText"></span>
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="业务经理" name="salespersonName" :rules="[{ required: true, message: '请输入业务经理' }]">
            <a-input-group compact>
              <a-auto-complete
                :key="`salesperson-${visible}`"
                v-model:value="formData.salespersonName"
                :options="filteredSalespersonOptions"
                placeholder="选择或输入业务经理"
                style="width: calc(100% - 32px)"
                allow-clear
                @select="handleSalespersonSelect"
                @change="handleSalespersonChange"
                @blur="handleSalespersonBlur"
              />
              <a-button
                :type="salespersonCanEdit ? 'default' : 'primary'"
                :icon="salespersonActionIcon"
                @click="handleEmployeeAction('salesperson')"
                :class="{ 'check-button': salespersonCanEdit }"
                :style="salespersonCanEdit ? 'width: 32px; padding: 0; background: transparent; border-color: #d9d9d9;' : 'width: 32px; padding: 0;'"
              />
            </a-input-group>
            <!-- 业务经理关联验证提示 -->
            <div v-if="salespersonValidationMessage" class="validation-message" :class="salespersonValidationMessage.type">
              <span v-html="sanitizedSalespersonValidationText"></span>
            </div>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 第五行：开票人、销项标识 -->
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-form-item label="开票人" name="issuerName">
            <a-input-group compact>
              <a-auto-complete
                :key="`issuer-name-${visible}`"
                v-model:value="formData.issuerName"
                :options="filteredIssuerNameOptions"
                placeholder="选择或输入开票人"
                style="width: calc(100% - 32px)"
                allow-clear
                @select="handleIssuerSelect"
                @change="handleIssuerChange"
                @blur="handleIssuerBlur"
              />
              <a-button
                :type="issuerCanEdit ? 'default' : 'primary'"
                :icon="issuerActionIcon"
                @click="handleEmployeeAction('issuer')"
                :class="{ 'check-button': issuerCanEdit }"
                :style="issuerCanEdit ? 'width: 32px; padding: 0; background: transparent; border-color: #d9d9d9;' : 'width: 32px; padding: 0;'"
              />
            </a-input-group>
            <!-- 开票人关联验证提示 -->
            <div v-if="issuerValidationMessage" class="validation-message" :class="issuerValidationMessage.type">
              <span v-html="sanitizedIssuerValidationText"></span>
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="销项标识" name="mark">
            <a-button @click="showMarkModal = true" class="filter-select-button" :style="{ width: '100%', textAlign: 'left' }">
              <span v-if="formData.mark && markDisplayText" class="filter-selected-text">
                {{ markDisplayText }}
              </span>
              <span v-else>请选择销项标识</span>
              <RightOutlined class="filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 第六行：备注 -->
      <!-- 标题行占比：$$\frac{1}{2} \times \frac{5}{24} = \frac{5}{48}$$-->
      <!--  比例计算 $$\frac{X}{24} = \frac{5}{48} \implies X = 2.5$$，使用比例来适应布局 -->
          <a-row :gutter="[16, 16]">
        <a-col :span="24">
          <a-form-item
            label="备注"
            name="remark1"
            :label-col="{ style: { width: '10.41667%' } }"
            :wrapper-col="{ style: { width: '89.58333%' } }"
          >
            <a-textarea v-model:value="formData.remark1" placeholder="请输入备注" :rows="3" />
          </a-form-item>
        </a-col>
      </a-row>
        </a-form>
        </div>
      </template>
    </upsert-modal>

    <!-- 发票种类选择模态框 -->
    <InvoiceTypeSelectModalForForm
      v-model="showInvoiceTypeModal"
      :type-list="props.invoiceTypeList"
      :selected-type-name="formData.invoiceType"
      @ok="handleInvoiceTypeSelect"
    />

    <!-- 销项标识选择模态框 -->
    <MarkSelectModalForForm
      v-model="showMarkModal"
      :mark-list="props.markList"
      :selected-mark-value="formData.mark"
      @ok="handleMarkSelect"
    />

    <!-- 客户表单模态框 -->
    <ClientFormModal
      v-model="showClientFormModal"
      :title="clientFormTitle"
      :form-data="clientFormData"
      :show-next-button="false"
      :show-prev-button="false"
      :show-reset-button="true"
      @ok="handleClientFormOk"
    />

    <!-- 员工表单模态框 -->
    <EmployeeEditModal
      v-model="showEmployeeFormModal"
      :title="employeeFormTitle"
      :company-list="props.companyList"
      :form-data="employeeFormData"
      :show-next-button="false"
      :show-prev-button="false"
      :show-reset-button="true"
      @ok="handleEmployeeFormOk"
    />

    <!-- 公司表单模态框 -->
    <CompanyFormModal
      v-model="showCompanyFormModal"
      :title="companyFormTitle"
      :form-data="companyFormData"
      :show-next-button="false"
      :show-prev-button="false"
      :show-reset-button="true"
      @ok="handleCompanyFormOk"
    />
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed, nextTick, h } from 'vue'
import { Modal, message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { RightOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import InvoiceTypeSelectModalForForm from '@/modal/base/InvoiceTypeSelectModalForForm.vue'
import MarkSelectModalForForm from '@/modal/base/MarkSelectModalForForm.vue'
import ClientFormModal from '@/modal/base/ClientFormModal.vue'
import EmployeeEditModal from '@/modal/employee/EmployeeEditModal.vue'
import CompanyFormModal from '@/modal/base/CompanyFormModal.vue'
import { listClientByPageUsingPost, existsClientUsingPost, addClientUsingPost, getClientByIdUsingGet, updateClientUsingPost, getClientCompanyNamesUsingGet, getUserNameByCompanyNameUsingPost } from '@/api/kehuxinxiguanli.ts'
import { existsEmployeeUsingPost, addEmployeeUsingPost, listEmployeeUsingPost, updateEmployeeUsingPost, getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { checkExistsUsingPost, addCompanyUsingPost, listCompanyByPageUsingPost, updateCompanyUsingPost } from '@/api/gongsixinxijiekou'
import { useDraggableModal } from '@/composables/useDraggableModal'
import { createContactSelectHandler } from '@/hooks/useContactSelect'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

interface FormData {
  issueDate: Dayjs | string | null // 支持 Dayjs 对象或字符串（value-format 返回字符串）
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
  serialNo?: number | null
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
    issueDate: dayjs(),
    amount: undefined,
    invoiceNo: '',
    customerCompany: '',
    customerContact: '',
    issuerCompany: '',
    salespersonName: '',
    issuerName: '',
    mark: '',
    invoiceType: '',
    remark1: '',
    remark2: '',
    remark3: '',
  }),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void] // 添加回调函数
  'next': [] // 新增模式的下一条
  'next-edit': [callback: (success: boolean) => void] // 编辑模式的下一条，传递回调函数
  'prev-edit': [callback: (success: boolean) => void] // 编辑模式的上一条，传递回调函数
  'reset': [] // 重置事件
  'client-created': [] // 客户创建成功事件
  'employee-created': [] // 员工创建成功事件
}>()

const visible = ref(false)

// 启用拖拽功能
useDraggableModal(visible)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
// 连续录入状态机
const isEditing = ref(false) // 是否为编辑模式

// 保存原始记录数据，用于重置
const originalFormData = ref<Partial<FormData> | null>(null)
// 保存新增模式的默认值，用于重置
const defaultFormDataForAddMode = ref<Partial<FormData> | null>(null)

// 模态框显示状态
const showInvoiceTypeModal = ref(false)
const showMarkModal = ref(false)
const showClientFormModal = ref(false)
const showEmployeeFormModal = ref(false)
const showCompanyFormModal = ref(false)

// 员工表单类型（业务员或开票人）
const employeeFormType = ref<'salesperson' | 'issuer'>('salesperson')
const employeeFormTitle = ref('添加员工（业务员）')

// 客户表单数据
const clientFormData = ref<Record<string, any>>({
  companyName: '',
  userName: '',
})
const clientFormTitle = ref('添加客户')

// 员工表单数据
const employeeFormData = ref<Record<string, any>>({
  name: '',
  companyId: undefined as number | undefined,
  companyName: '',
})

// 公司表单数据
const companyFormData = ref<Record<string, any>>({
  companyName: '',
})
const companyFormTitle = ref('添加公司')

// 销项标识显示文本
const markDisplayText = computed(() => {
  if (!formData.mark) return ''
  const mark = props.markList.find(m => m.value === formData.mark)
  return mark ? (mark.label || mark.value) : formData.mark
})

// 计算显示的标题（包含序号和唯一标识）
const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    const uniqueKey = props.formData?.uniqueKey
    if (uniqueKey) {
      return `${props.title}（第 ${props.serialNo} 条-${uniqueKey}）`
    }
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

const formData = reactive<FormData>({
  issueDate: dayjs(), // 默认选中当天
  amount: undefined,
  invoiceNo: '',
  customerCompany: '',
  customerContact: '',
  issuerCompany: undefined as any, // 初始为 undefined，显示 placeholder
  salespersonName: '',
  issuerName: '',
  mark: '000', // 默认值设为 "000"
  invoiceType: '',
  remark1: '',
  remark2: '',
  remark3: '',
})

// 客户单位选项（使用接口获取）
const customerCompanyOptions = ref<Array<{ value: string; label: string }>>([])

// 获取客户单位列表
const fetchCustomerCompanyOptions = async () => {
  try {
    const res = await getClientCompanyNamesUsingGet()
    if (res.data?.code === 0 && res.data?.data) {
      customerCompanyOptions.value = res.data.data.map((name: string) => ({
        value: name,
        label: name,
      }))
    }
  } catch (error) {
    console.error('获取客户单位列表失败:', error)
    customerCompanyOptions.value = []
  }
}

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

// 客户姓名自动完成选项（根据客户单位过滤）
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

// 公司名称自动完成选项
const issuerCompanyOptions = computed(() => {
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string }> = []

  for (const company of props.companyList) {
    const name = (company.companyName || '').trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      options.push({ value: name, label: name })
    }
  }

  return options
})

// 公司名称自动填充框（使用通用 composable）
const issuerCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: issuerCompanyOptions,
  currentValue: computed(() => formData.issuerCompany || ''),
  enableAutoAdd: true,
})

// 过滤后的公司名称选项
const filteredIssuerCompanyOptions = issuerCompanyAutoComplete.filteredOptions

// 员工基本信息列表（来自 getAllEmployeeBasicInfoUsingGet，含 id/name/employeeNo）
const employeeBasicList = ref<API.EmployeeBasicInfoVO[]>([])

// 获取员工基本信息列表，支持 companyName 筛选（如 "九华云" 默认展示九华云员工）
const fetchEmployeeBasicList = async (companyName?: string) => {
  try {
    const res = (await getAllEmployeeBasicInfoUsingGet(
      companyName != null ? { companyName } : {},
    )) as any
    if (res?.data?.code === 0 && Array.isArray(res?.data?.data)) {
      employeeBasicList.value = res.data.data
    } else {
      employeeBasicList.value = []
    }
  } catch (error) {
    console.error('获取员工基本信息列表失败', error)
    employeeBasicList.value = []
  }
}

// 业务员自动完成选项（统一使用 getAllEmployeeBasicInfoUsingGet 数据，新增默认九华云通过 companyName 传入）
const salespersonOptions = computed(() => {
  const options: Array<{ value: string; label: string; id?: number; employeeNo?: string }> = []
  const seen = new Set<string>()

  for (const e of employeeBasicList.value) {
    const name = (e.name || '').trim()
    if (!name) continue
    // 使用 名字+工号 作为唯一键，确保同名不同工号的员工都能显示
    const uniqueKey = name + (e.employeeNo ? `|${e.employeeNo}` : '')
    if (seen.has(uniqueKey)) continue
    seen.add(uniqueKey)

    // 核心修复：使用 name|employeeNo 作为 value，确保每个选项的 value 都是唯一的
    // 这样可以解决 AutoComplete 在滚动时因重复 value 导致的显示异常问题
    const uniqueValue = e.employeeNo ? `${name}|${e.employeeNo}` : name

    options.push({
      value: uniqueValue, // 使用唯一值作为 value，解决滚动显示异常
      label: e.employeeNo ? `${name} (${e.employeeNo})` : name, // 下拉列表显示 名字(工号)
      id: e.id,    // 携带 ID
      employeeNo: e.employeeNo // 携带工号
    })
  }

  return options
})

// 业务经理自动填充框（使用通用 composable）
const salespersonAutoComplete = useAutoCompleteWithExtra({
  baseOptions: salespersonOptions,
  currentValue: computed(() => formData.salespersonName || ''),
  extractValue: (value: string) => {
    // 从 name|employeeNo 格式中提取名字
    return value.includes('|') ? value.split('|')[0] : value.trim()
  },
  enableAutoAdd: true,
})

// 过滤后的业务员选项
const filteredSalespersonOptions = salespersonAutoComplete.filteredOptions

// 开票人自动完成选项（与业务员共用 employeeBasicList，但需要独立的选项数组以避免 value 冲突）
const issuerNameOptions = computed(() => {
  // 复用业务员的选项生成逻辑，但使用不同的 value 格式以避免冲突
  const options: Array<{ value: string; label: string; id?: number; employeeNo?: string }> = []
  const seen = new Set<string>()

  for (const e of employeeBasicList.value) {
    const name = (e.name || '').trim()
    if (!name) continue
    const uniqueKey = name + (e.employeeNo ? `|${e.employeeNo}` : '')
    if (seen.has(uniqueKey)) continue
    seen.add(uniqueKey)

    // 使用 issuer- 前缀区分开票人和业务经理的 value
    const uniqueValue = e.employeeNo ? `issuer-${name}|${e.employeeNo}` : `issuer-${name}`

    options.push({
      value: uniqueValue,
      label: e.employeeNo ? `${name} (${e.employeeNo})` : name,
      id: e.id,
      employeeNo: e.employeeNo
    })
  }

  return options
})

// 开票人自动填充框（使用通用 composable）
const issuerAutoComplete = useAutoCompleteWithExtra({
  baseOptions: issuerNameOptions,
  currentValue: computed(() => formData.issuerName || ''),
  extractValue: (value: string) => {
    // 从 issuer-name|employeeNo 格式中提取名字
    let name = value.trim()
    if (name.startsWith('issuer-')) {
      name = name.substring(7) // 移除 'issuer-' 前缀
    }
    if (name.includes('|')) {
      name = name.split('|')[0] // 提取名字部分
    }
    return name
  },
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
    const res = await getUserNameByCompanyNameUsingPost({
      companyName: companyName,
    })

    if (res.data?.code === 0 && res.data?.data) {
      contactNameList.value = res.data.data
        .map((item: any) => item.userName)
        .filter((name: string) => name && name.trim())
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
    clientValidationMessage.value = null
    clientId.value = null
  },
})

// 处理客户单位变化（输入时）
const handleCustomerCompanyChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerCompanyAutoComplete.handleChange(value)
  
  // 如果值不为空，清除该字段的验证错误
  if (value) {
    formRef.value?.clearValidate(['customerCompany'])
    
    // 检查是否是列表中的选项
    const exists = customerCompanyOptions.value.some(opt => opt.value === value)
    if (exists) {
      await handleCustomerCompanySelect(value)
    } else {
      // 如果输入的是新值，清空联系人
      contactNameList.value = []
      formData.customerContact = ''
      // 清空客户关联状态
      clientValidationMessage.value = null
      clientId.value = null
    }
  } else {
    contactNameList.value = []
    formData.customerContact = ''
    // 清空客户关联状态
    clientValidationMessage.value = null
    clientId.value = null
  }
}

// 处理客户姓名变化（输入时）
const handleCustomerContactChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerContactAutoComplete.handleChange(value)
  
  if (value) {
    formRef.value?.clearValidate(['customerContact'])
  } else {
    // 清空客户关联状态
    clientValidationMessage.value = null
    clientId.value = null
  }
}

// 处理公司名称变化（输入时）
const handleIssuerCompanyChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  issuerCompanyAutoComplete.handleChange(value)
  
  if (value) {
    formRef.value?.clearValidate(['issuerCompany'])
  } else {
    // 清空公司关联状态
    companyValidationMessage.value = null
    companyId.value = null
  }
}

// 根据公司名称设置发票种类默认值
const setInvoiceTypeByCompanyName = (companyName: string) => {
  if (!companyName) {
    formData.invoiceType = ''
    return
  }

  // 如果公司名称包含"九华云"，默认选择"专票13%"，否则默认"普票1%"
  if (companyName.includes('九华云')) {
    // 查找"专票13%"
    const specialTicket13 = props.invoiceTypeList.find(type => type.typeName === '专票13%')
    if (specialTicket13) {
      formData.invoiceType = specialTicket13.typeName
    }
  } else {
    // 查找"普票1%"
    const normalTicket1 = props.invoiceTypeList.find(type => type.typeName === '普票1%')
    if (normalTicket1) {
      formData.invoiceType = normalTicket1.typeName
    }
  }
}

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 当模态框打开时，更新表单数据
    if (props.formData && props.formData.invoiceNo) {
      // 编辑模式：有发票号码说明是编辑
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
      // 等待 DOM 更新，确保 upsertModalRef 已经准备好
      await nextTick()
      // 重置按钮状态（编辑模式下，保存、上一条、下一条都可用）
      upsertModalRef.value?.resetButtonState()
      // 如果选择了客户单位，加载联系人列表
      if (props.formData.customerCompany) {
        await handleCustomerCompanySelect(props.formData.customerCompany)
        // 如果已有客户姓名，自动验证
        if (props.formData.customerContact) {
          await checkClientExists(props.formData.customerCompany, props.formData.customerContact)
        }
      }
      // 如果已有业务经理，自动验证
      if (props.formData.salespersonName) {
        await checkEmployeeExists(props.formData.salespersonName, 'salesperson')
      }
      // 如果已有开票人，自动验证
      if (props.formData.issuerName) {
        await checkEmployeeExists(props.formData.issuerName, 'issuer')
      }
      // 如果已有公司名称，自动验证
      if (props.formData.issuerCompany) {
        await checkCompanyExists(props.formData.issuerCompany)
      }
      // 编辑模式：拉取全部员工基本信息（业务经理/开票人下拉）
      await fetchEmployeeBasicList()
    } else {
      // 新增模式：初始化状态机
      isEditing.value = false
      // 获取员工列表（统一筛选所有员工）
      await fetchEmployeeBasicList()
      await nextTick()
      upsertModalRef.value?.resetButtonState()

      // 默认填充公司名称为"西安九华云信息科技有限公司"
      const defaultCompanyName = '西安九华云信息科技有限公司'
      formData.issuerCompany = defaultCompanyName
      // 自动验证默认公司名称
      await checkCompanyExists(defaultCompanyName)

      // 根据公司名称设置发票种类默认值
      setInvoiceTypeByCompanyName(defaultCompanyName)

      Object.assign(formData, {
        issueDate: dayjs(), // 默认填充为当天日期
        amount: undefined,
        invoiceNo: '',
        customerCompany: '',
        customerContact: '',
        salespersonName: '',
        issuerName: '',
        mark: '000', // 默认值设为 "000"
        remark1: '',
        remark2: '',
        remark3: '',
      })
      contactNameList.value = []

      // 保存新增模式的默认值，用于重置
      defaultFormDataForAddMode.value = {
        issueDate: dayjs(),
        issuerCompany: defaultCompanyName,
        invoiceType: formData.invoiceType,
        mark: '000',
        amount: undefined,
        invoiceNo: '',
        customerCompany: '',
        customerContact: '',
        salespersonName: '',
        issuerName: '',
        remark1: '',
        remark2: '',
        remark3: '',
      }
    }
  } else {
    // 模态框关闭时，重置表单和状态机
    formRef.value?.resetFields()
    // 清空所有表单数据，确保自动填充框状态重置
    Object.assign(formData, {
      issueDate: dayjs(),
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
    // 清空验证信息
    clientValidationMessage.value = null
    clientId.value = null
    salespersonValidationMessage.value = null
    salespersonId.value = null
    issuerValidationMessage.value = null
    issuerId.value = null
    companyValidationMessage.value = null
    companyId.value = null
  }
})

// 监听 formData 变化（用于编辑模式下更新数据，如下一条功能）
watch(() => props.formData, async (newFormData) => {
  if (visible.value && newFormData) {
    // 如果模态框已打开且是编辑模式，更新表单数据
    if (newFormData.invoiceNo) {
      // 保存原始数据用于重置
      originalFormData.value = {
        issueDate: newFormData.issueDate ? (typeof newFormData.issueDate === 'string' ? dayjs(newFormData.issueDate) : newFormData.issueDate) : undefined,
        amount: newFormData.amount,
        invoiceNo: newFormData.invoiceNo || '',
        customerCompany: newFormData.customerCompany || '',
        customerContact: newFormData.customerContact || '', // 正确映射 clientPerson 字段
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
      // 如果客户单位发生变化，重新加载联系人列表
      if (newFormData.customerCompany) {
        await handleCustomerCompanySelect(newFormData.customerCompany)
        // 如果已有客户姓名，自动验证
        if (newFormData.customerContact) {
          await checkClientExists(newFormData.customerCompany, newFormData.customerContact)
        }
      }
      // 如果已有业务经理，自动验证
      if (newFormData.salespersonName) {
        await checkEmployeeExists(newFormData.salespersonName, 'salesperson')
      }
      // 如果已有开票人，自动验证
      if (newFormData.issuerName) {
        await checkEmployeeExists(newFormData.issuerName, 'issuer')
      }
      // 如果已有公司名称，自动验证
      if (newFormData.issuerCompany) {
        await checkCompanyExists(newFormData.issuerCompany)
      }
    }
  }
}, { deep: true })

watch(visible, async (val) => {
  emit('update:modelValue', val)
  // 模态框打开时获取客户单位列表
  if (val) {
    await fetchCustomerCompanyOptions()
  }
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
  // 重置状态机：保存可用，下一条禁用
  upsertModalRef.value?.resetButtonState()
  // 触发 next 事件
  emit('next')
}

const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('prev-edit', callback)
}

const handleReset = async () => {
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
      // 如果选择了客户单位，重新加载联系人列表并重新执行关联校验
      if (originalFormData.value.customerCompany) {
        await handleCustomerCompanySelect(originalFormData.value.customerCompany)
        // 如果已有客户姓名，自动验证
        if (originalFormData.value.customerContact) {
          await checkClientExists(originalFormData.value.customerCompany, originalFormData.value.customerContact)
        }
      }
      // 如果已有业务经理，自动验证
      if (originalFormData.value.salespersonName) {
        await checkEmployeeExists(originalFormData.value.salespersonName, 'salesperson')
      }
      // 如果已有开票人，自动验证
      if (originalFormData.value.issuerName) {
        await checkEmployeeExists(originalFormData.value.issuerName, 'issuer')
      }
      // 如果已有公司名称，自动验证
      if (originalFormData.value.issuerCompany) {
        await checkCompanyExists(originalFormData.value.issuerCompany)
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
      // 如果选择了客户单位，重新加载联系人列表并重新执行关联校验
      if (props.formData.customerCompany) {
        await handleCustomerCompanySelect(props.formData.customerCompany)
        // 如果已有客户姓名，自动验证
        if (props.formData.customerContact) {
          await checkClientExists(props.formData.customerCompany, props.formData.customerContact)
        }
      }
      // 如果已有业务经理，自动验证
      if (props.formData.salespersonName) {
        await checkEmployeeExists(props.formData.salespersonName, 'salesperson')
      }
      // 如果已有开票人，自动验证
      if (props.formData.issuerName) {
        await checkEmployeeExists(props.formData.issuerName, 'issuer')
      }
      // 如果已有公司名称，自动验证
      if (props.formData.issuerCompany) {
        await checkCompanyExists(props.formData.issuerCompany)
      }
    }
  } else {
    // 新增模式：重置为默认值（保留打开模态框时的默认值）
    if (defaultFormDataForAddMode.value) {
      Object.assign(formData, {
        issueDate: defaultFormDataForAddMode.value.issueDate ? (typeof defaultFormDataForAddMode.value.issueDate === 'string' ? dayjs(defaultFormDataForAddMode.value.issueDate) : defaultFormDataForAddMode.value.issueDate) : dayjs(),
        amount: defaultFormDataForAddMode.value.amount,
        invoiceNo: defaultFormDataForAddMode.value.invoiceNo || '',
        customerCompany: defaultFormDataForAddMode.value.customerCompany || '',
        customerContact: defaultFormDataForAddMode.value.customerContact || '',
        issuerCompany: defaultFormDataForAddMode.value.issuerCompany || undefined,
        salespersonName: defaultFormDataForAddMode.value.salespersonName || '',
        issuerName: defaultFormDataForAddMode.value.issuerName || '',
        mark: defaultFormDataForAddMode.value.mark || '000',
        invoiceType: defaultFormDataForAddMode.value.invoiceType || '',
        remark1: defaultFormDataForAddMode.value.remark1 || '',
        remark2: defaultFormDataForAddMode.value.remark2 || '',
        remark3: defaultFormDataForAddMode.value.remark3 || '',
      })
      // 如果有默认公司名称，重新执行关联校验
      if (defaultFormDataForAddMode.value.issuerCompany) {
        await checkCompanyExists(defaultFormDataForAddMode.value.issuerCompany)
      }
    } else {
      // 如果没有保存的默认值，使用基础默认值
      const defaultCompanyName = '西安九华云信息科技有限公司'
      formData.issuerCompany = defaultCompanyName
      await checkCompanyExists(defaultCompanyName)
      setInvoiceTypeByCompanyName(defaultCompanyName)
      Object.assign(formData, {
        issueDate: dayjs(),
        amount: undefined,
        invoiceNo: '',
        customerCompany: '',
        customerContact: '',
        salespersonName: '',
        issuerName: '',
        mark: '000',
        remark1: '',
        remark2: '',
        remark3: '',
      })
    }
    contactNameList.value = []
  }
  // 清除验证状态
  formRef.value?.clearValidate()
  // 重置按钮状态
  upsertModalRef.value?.resetButtonState()
}

// 处理发票种类选择
const handleInvoiceTypeSelect = (typeName: string) => {
  formData.invoiceType = typeName
  formRef.value?.clearValidate(['invoiceType'])
}

// 处理销项标识选择
const handleMarkSelect = (markValue: string) => {
  formData.mark = markValue || '000'
  if (formRef.value && typeof formRef.value.clearValidate === 'function') {
    formRef.value.clearValidate(['mark'])
  }
}

// ==================== 客户关联验证 ====================

interface ValidationMessage {
  type: 'success' | 'error'
  text: string
}

const clientValidationMessage = ref<ValidationMessage | null>(null)
const clientId = ref<number | null>(null)

const clientActionIcon = computed(() => {
  const canEdit = !!(
    formData.customerCompany &&
    formData.customerContact &&
    clientValidationMessage.value?.type === 'success' &&
    clientId.value
  )
  return h(canEdit ? EditOutlined : PlusOutlined)
})

// 检查客户是否存在
const checkClientExists = async (companyName: string, userName: string) => {
  if (!companyName || !userName) {
    clientValidationMessage.value = null
    clientId.value = null
    return
  }

  try {
    const res = (await existsClientUsingPost({
      companyName,
      userName,
    })) as any

    if (res.data.code === 0 && res.data.data) {
      const { exists, clientId: id } = res.data.data
      const normalizedId = Array.isArray(id) ? id[0] : id
      clientId.value = normalizedId || null

      if (exists && normalizedId) {
        clientValidationMessage.value = {
          type: 'success',
          text: `已成功关联客户信息：${companyName}-${userName}`,
        }
      } else {
        clientValidationMessage.value = {
          type: 'error',
          text: `客户信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link">点此链接</a>快速创建`,
        }
      }
    } else {
      clientValidationMessage.value = {
        type: 'error',
        text: `客户信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link">点此链接</a>快速创建`,
      }
      clientId.value = null
    }
  } catch (error) {
    console.error('检查客户是否存在失败', error)
    clientValidationMessage.value = {
      type: 'error',
      text: `客户信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link">点此链接</a>快速创建`,
    }
    clientId.value = null
  }
}

// 客户姓名失去焦点时验证
const handleCustomerContactBlur = () => {
  if (formData.customerCompany && formData.customerContact) {
    checkClientExists(formData.customerCompany, formData.customerContact)
  } else {
    clientValidationMessage.value = null
    clientId.value = null
  }
}

// 创建客户模态框
const showCreateClientModal = ref(false)

// 处理创建客户链接点击
const handleCreateClientClick = (e: Event) => {
  e.preventDefault()
  if (!formData.customerCompany || !formData.customerContact) {
    message.warning('请先填写客户单位和客户姓名')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建客户单位"${formData.customerCompany}"-客户姓名"${formData.customerContact}"的客户信息？`,
    onOk: async () => {
      try {
        const res = (await addClientUsingPost({
          companyName: formData.customerCompany,
          userName: formData.customerContact,
        })) as any

        if (res.data.code === 0) {
          message.success('客户创建成功')
          // 重新验证
          await checkClientExists(formData.customerCompany, formData.customerContact)
          // 触发父组件刷新客户列表
          emit('client-created')
        } else {
          message.error('客户创建失败：' + (res.data.message || ''))
        }
      } catch (error: any) {
        console.error('创建客户失败', error)
        message.error('创建客户失败：' + (error.message || '未知错误'))
      }
    },
  })
}

// 事件委托处理函数（使用函数引用，便于移除）
const handleLinkClick = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.classList.contains('create-link')) {
    e.preventDefault()
    e.stopPropagation()
    handleCreateClientClick(e)
  } else if (target.classList.contains('create-link-salesperson')) {
    e.preventDefault()
    e.stopPropagation()
    handleCreateSalespersonClick(e)
  } else if (target.classList.contains('create-link-issuer')) {
    e.preventDefault()
    e.stopPropagation()
    handleCreateIssuerClick(e)
  } else if (target.classList.contains('create-link-company')) {
    e.preventDefault()
    e.stopPropagation()
    handleCreateCompanyClick(e)
  }
}

// 监听验证消息中的链接点击（使用事件委托）
watch(() => visible.value, (val) => {
  nextTick(() => {
    const formElement = formRef.value?.$el
    if (formElement) {
      // 先移除旧的监听器（如果存在）
      formElement.removeEventListener('click', handleLinkClick)
      // 只在模态框打开时添加监听器
      if (val) {
        formElement.addEventListener('click', handleLinkClick)
      }
    }
  })
})

// ==================== 业务经理关联验证 ====================

const salespersonValidationMessage = ref<ValidationMessage | null>(null)
const salespersonId = ref<number | null>(null)
// 判断业务经理是否满足关联条件
const salespersonCanEdit = computed(() => {
  return !!(formData.salespersonName && salespersonValidationMessage.value?.type === 'success' && salespersonId.value)
})
const salespersonActionIcon = computed(() => {
  // 满足关联条件时显示打勾图标，否则显示添加图标
  return h(salespersonCanEdit.value ? CheckCircleOutlined : PlusOutlined)
})

// 检查员工是否存在：优先用 getAllEmployeeBasicInfo 返回的 id，否则 exists 接口兜底
const checkEmployeeExists = async (name: string, type: 'salesperson' | 'issuer') => {
  if (!name) {
    if (type === 'salesperson') {
      salespersonValidationMessage.value = null
      salespersonId.value = null
    } else {
      issuerValidationMessage.value = null
      issuerId.value = null
    }
    return
  }

  const setSuccess = (id: number) => {
    if (type === 'salesperson') {
      salespersonId.value = id
      salespersonValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${name}` }
    } else {
      issuerId.value = id
      issuerValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${name}` }
    }
  }
  const setError = () => {
    if (type === 'salesperson') {
      salespersonId.value = null
      salespersonValidationMessage.value = {
        type: 'error',
        text: `员工信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-salesperson">点此链接</a>快速创建`,
      }
    } else {
      issuerId.value = null
      issuerValidationMessage.value = {
        type: 'error',
        text: `员工信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-issuer">点此链接</a>快速创建`,
      }
    }
  }

  // 1. 优先从 employeeBasicList（getAllEmployeeBasicInfo 结果）匹配
  const n = (name || '').trim()
  const found = employeeBasicList.value.find((e) => (e.name || '').trim() === n && e.id != null)
  if (found?.id) {
    setSuccess(found.id)
    return
  }

  // 2. exists 接口兜底
  try {
    const res = (await existsEmployeeUsingPost({ name })) as any
    if (res?.data?.code === 0 && res?.data?.data) {
      const { exists, employeeId: id } = res.data.data
      if (exists && id) {
        setSuccess(id)
        return
      }
    }
  } catch (e) {
    console.error('检查员工是否存在失败', e)
  }
  setError()
}

// 判断开票人是否满足关联条件
const issuerCanEdit = computed(() => {
  return !!(formData.issuerName && issuerValidationMessage.value?.type === 'success' && issuerId.value)
})
const issuerActionIcon = computed(() => {
  // 满足关联条件时显示打勾图标，否则显示添加图标
  return h(issuerCanEdit.value ? CheckCircleOutlined : PlusOutlined)
})

// 业务经理下拉选择：直接从 option 中获取 id，支持同名员工精准选择
const handleSalespersonSelect = (value: string, option: any) => {
  if (!value) return

  formRef.value?.clearValidate?.(['salespersonName'])

  // 核心修复：从 value 中提取名字（value 可能是 name|employeeNo 格式）
  const name = value.includes('|') ? value.split('|')[0] : value.trim()
  if (!name) return

  // 更新表单数据为纯名字（输入框显示）
  formData.salespersonName = name

  // 直接使用 option 中的 id，而不是用名字去 list 里 find
  // 这样即使有两个 "张三"，也能根据用户点击的那一行准确获取到对应的 ID
  if (option && option.id) {
    salespersonId.value = option.id
    salespersonValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${option.label || name}` }
  } else {
    // 兜底逻辑：如果是手动输入的或者没有ID的选项
    checkEmployeeExists(name, 'salesperson')
  }
}

// 业务经理 change：只要内容变化，立即重置关联状态，避免输入过程中报错
const handleSalespersonChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  salespersonAutoComplete.handleChange(value)
  
  // 1. 清除表单字段本身的验证结果
  formRef.value?.clearValidate?.(['salespersonName'])

  // 2. 核心修复：无论是有值还是清空，只要用户在打字，就先移除"关联成功/失败"的提示
  // 只有等到用户"选中"或者"失去焦点"时，再重新计算关联状态
  salespersonValidationMessage.value = null
  salespersonId.value = null
}

// 业务经理失去焦点时验证
const handleSalespersonBlur = () => {
  if (formData.salespersonName) {
    checkEmployeeExists(formData.salespersonName, 'salesperson')
  } else {
    salespersonValidationMessage.value = null
    salespersonId.value = null
  }
}

// 处理创建业务经理链接点击
const handleCreateSalespersonClick = (e: Event) => {
  e.preventDefault()
  if (!formData.salespersonName) {
    message.warning('请先填写业务经理姓名')
    return
  }

  // 获取当前选中的公司ID
  const selectedCompany = props.companyList.find(c => c.companyName === formData.issuerCompany)
  const companyId = selectedCompany?.id || (props.companyList.length > 0 ? props.companyList[0].id : undefined)

  if (!companyId) {
    message.error('请先选择公司名称')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建业务经理"${formData.salespersonName}"的员工信息？`,
    onOk: async () => {
      try {
        const payload: any = {
          name: formData.salespersonName,
          companyId: companyId!,
          // employeeNo 由后端自动生成，不传递此字段
        }
        // 新增模式下，不传递 employeeNo，让后端自动生成
        const res = (await addEmployeeUsingPost(payload)) as any

        if (res.data.code === 0) {
          message.success('员工创建成功')
          // 重新验证
          await checkEmployeeExists(formData.salespersonName, 'salesperson')
          // 触发父组件刷新员工列表
          emit('employee-created')
        } else {
          message.error('员工创建失败：' + (res.data.message || ''))
        }
      } catch (error: any) {
        console.error('创建员工失败', error)
        message.error('创建员工失败：' + (error.message || '未知错误'))
      }
    },
  })
}

// 业务经理和开票人的链接点击已通过事件委托处理

// ==================== 开票人关联验证 ====================

const issuerValidationMessage = ref<ValidationMessage | null>(null)
const issuerId = ref<number | null>(null)

// 开票人 change：只要内容变化，立即重置关联状态
const handleIssuerChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  issuerAutoComplete.handleChange(value)
  
  formRef.value?.clearValidate?.(['issuerName'])

  // 立即清除关联提示
  issuerValidationMessage.value = null
  issuerId.value = null
}

// 开票人下拉选择
const handleIssuerSelect = (value: string, option: any) => {
  if (!value) return

  // 核心修复：从 value 中提取名字（value 可能是 issuer-name|employeeNo 格式）
  let name = value.trim()
  if (name.startsWith('issuer-')) {
    name = name.substring(7) // 移除 'issuer-' 前缀
  }
  if (name.includes('|')) {
    name = name.split('|')[0] // 提取名字部分
  }
  if (!name) return

  // 更新表单数据为纯名字（输入框显示）
  formData.issuerName = name

  // 直接使用 option 中的 id
  if (option && option.id) {
    issuerId.value = option.id
    issuerValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${option.label || name}` }
  } else {
    checkEmployeeExists(name, 'issuer')
  }
}

// 开票人失去焦点时验证
const handleIssuerBlur = () => {
  if (formData.issuerName) {
    checkEmployeeExists(formData.issuerName, 'issuer')
  } else {
    issuerValidationMessage.value = null
    issuerId.value = null
  }
}

// 处理创建开票人链接点击
const handleCreateIssuerClick = (e: Event) => {
  e.preventDefault()
  if (!formData.issuerName) {
    message.warning('请先填写开票人姓名')
    return
  }

  // 获取当前选中的公司ID
  const selectedCompany = props.companyList.find(c => c.companyName === formData.issuerCompany)
  const companyId = selectedCompany?.id || (props.companyList.length > 0 ? props.companyList[0].id : undefined)

  if (!companyId) {
    message.error('请先选择公司名称')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建开票人"${formData.issuerName}"的员工信息？`,
    onOk: async () => {
      try {
        const payload: any = {
          name: formData.issuerName,
          companyId: companyId!,
          // employeeNo 由后端自动生成，不传递此字段
        }
        // 新增模式下，不传递 employeeNo，让后端自动生成
        const res = (await addEmployeeUsingPost(payload)) as any

        if (res.data.code === 0) {
          message.success('员工创建成功')
          // 重新验证
          await checkEmployeeExists(formData.issuerName, 'issuer')
          // 触发父组件刷新员工列表
          emit('employee-created')
        } else {
          message.error('员工创建失败：' + (res.data.message || ''))
        }
      } catch (error: any) {
        console.error('创建员工失败', error)
        message.error('创建员工失败：' + (error.message || '未知错误'))
      }
    },
  })
}

// 开票人的链接点击已通过事件委托处理

// ==================== 公司名称关联验证 ====================

const companyValidationMessage = ref<ValidationMessage | null>(null)
const companyId = ref<number | null>(null)

// 安全清理验证消息 HTML 的计算属性（必须在所有验证消息变量定义之后）
const sanitizedClientValidationText = computed(() => {
  return clientValidationMessage.value?.text ? sanitizeHtml(clientValidationMessage.value.text) : ''
})

const sanitizedCompanyValidationText = computed(() => {
  return companyValidationMessage.value?.text ? sanitizeHtml(companyValidationMessage.value.text) : ''
})

const sanitizedSalespersonValidationText = computed(() => {
  return salespersonValidationMessage.value?.text ? sanitizeHtml(salespersonValidationMessage.value.text) : ''
})

const sanitizedIssuerValidationText = computed(() => {
  return issuerValidationMessage.value?.text ? sanitizeHtml(issuerValidationMessage.value.text) : ''
})

// 检查公司是否存在
const checkCompanyExists = async (companyName: string) => {
  if (!companyName) {
    companyValidationMessage.value = null
    companyId.value = null
    return
  }

  try {
    const res = (await checkExistsUsingPost({
      companyName,
    })) as any

    if (res.data.code === 0 && res.data.data) {
      const { exists, id } = res.data.data

      companyId.value = id || null
      if (exists) {
        companyValidationMessage.value = {
          type: 'success',
          text: `已成功关联公司信息：${companyName}`,
        }
      } else {
        companyValidationMessage.value = {
          type: 'error',
          text: `公司信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-company">点此链接</a>快速创建`,
        }
      }
    } else {
      companyValidationMessage.value = {
        type: 'error',
        text: `公司信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-company">点此链接</a>快速创建`,
      }
      companyId.value = null
    }
  } catch (error) {
    console.error('检查公司是否存在失败', error)
    companyValidationMessage.value = {
      type: 'error',
      text: `公司信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-company">点此链接</a>快速创建`,
    }
    companyId.value = null
  }
}

// 公司名称失去焦点时验证
const handleIssuerCompanyBlur = () => {
  if (formData.issuerCompany) {
    checkCompanyExists(formData.issuerCompany)
  } else {
    companyValidationMessage.value = null
    companyId.value = null
  }
}

// 处理创建公司链接点击
const handleCreateCompanyClick = (e: Event) => {
  e.preventDefault()
  if (!formData.issuerCompany) {
    message.warning('请先填写公司名称')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建公司"${formData.issuerCompany}"的公司信息？`,
    onOk: async () => {
      try {
        const res = (await addCompanyUsingPost({
          companyName: formData.issuerCompany,
        })) as any

        if (res.data.code === 0) {
          message.success('公司创建成功')
          // 重新验证
          await checkCompanyExists(formData.issuerCompany)
          // 触发父组件刷新公司列表（如果有这个事件）
          // emit('company-created')
        } else {
          message.error('公司创建失败：' + (res.data.message || ''))
        }
      } catch (error: any) {
        console.error('创建公司失败', error)
        message.error('创建公司失败：' + (error.message || '未知错误'))
      }
    },
  })
}

// 公司名称的链接点击已通过事件委托处理

// 监听公司名称变化，更新发票种类默认值（仅在新增模式且发票种类为空时）
watch(() => formData.issuerCompany, (newCompanyName) => {
  // 只有在新增模式下，且发票种类为空时才自动设置默认值
  if (!isEditing.value && !formData.invoiceType) {
    setInvoiceTypeByCompanyName(newCompanyName || '')
  }
})

// 监听客户单位变化，清空验证信息
watch(() => formData.customerCompany, () => {
  clientValidationMessage.value = null
  clientId.value = null
})

// 监听客户姓名变化，清空验证信息（等待失去焦点时重新验证）
watch(() => formData.customerContact, () => {
  // 不清空，等待失去焦点时验证
})

// 监听业务经理变化
watch(() => formData.salespersonName, () => {
  // 不清空，等待失去焦点时验证
})

// 监听开票人变化
watch(() => formData.issuerName, () => {
  // 不清空，等待失去焦点时验证
})

// ==================== 快捷添加功能 ====================

const loadClientDetail = async (id: number) => {
  const res = (await getClientByIdUsingGet({ id })) as any
  if (res?.data?.code === 0 && res?.data?.data) {
    const clientData = { ...res.data.data }
    // 将后端的 remark2 映射到前端的 wechat 字段
    if (clientData.remark2 !== undefined && !clientData.wechat) {
      clientData.wechat = clientData.remark2
    }
    clientFormData.value = clientData
    return
  }
  clientFormData.value = {
    id,
    companyName: formData.customerCompany || '',
    userName: formData.customerContact || '',
  }
}

const handleClientAction = async () => {
  const canEdit = !!(
    formData.customerCompany &&
    formData.customerContact &&
    clientValidationMessage.value?.type === 'success' &&
    clientId.value
  )
  if (canEdit) {
    clientFormTitle.value = '编辑客户'
    await loadClientDetail(clientId.value!)
  } else {
    clientFormTitle.value = '添加客户'
    clientFormData.value = {
      companyName: formData.customerCompany || '',
      userName: formData.customerContact || '',
    }
  }
  showClientFormModal.value = true
}

// 客户表单保存成功
const handleClientFormOk = async (data: any, callback: (success: boolean) => void) => {
  try {
    const companyName = (data?.companyName || '').trim()
    const userName = (data?.userName || '').trim()
    if (!companyName || !userName) {
      message.warning('请填写客户单位和客户姓名')
      callback(false)
      return
    }

    const isEdit = !!data?.id
    // 将微信字段 wechat 映射到 remark2（后端存储字段）
    const payload: any = { ...data, companyName, userName }
    if (data?.wechat !== undefined) {
      payload.remark2 = data.wechat
      delete payload.wechat // 删除前端字段，使用后端字段
    }
    const res = (await (isEdit ? updateClientUsingPost(payload as any) : addClientUsingPost(payload as any))) as any
    if (res?.data?.code !== 0) {
      message.error(`客户${isEdit ? '更新' : '添加'}失败：` + (res?.data?.message || ''))
      callback(false)
      return
    }

    // 触发父组件刷新客户列表
    emit('client-created')
    callback(true)

    // 立即回填 + 立即置为成功（避免仍显示失败）
    formData.customerCompany = companyName
    customerCompanyAutoComplete.addExtraItem(companyName)
    await handleCustomerCompanySelect(companyName)
    formData.customerContact = userName
    if (!isEdit && res?.data?.data) {
      clientId.value = Number(res.data.data) || clientId.value
    } else if (isEdit) {
      clientId.value = data.id || clientId.value
    }
    clientValidationMessage.value = { type: 'success', text: `已成功关联客户信息：${companyName}` }
    await nextTick()
    await checkClientExists(companyName, userName)
    message.success(`客户${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理客户表单保存失败', error)
    callback(false)
  }
}

// 加载员工详情（编辑功能已注释，此函数暂时保留但不再使用）
// const loadEmployeeDetail = async (id: number, fallbackName: string) => {
//   try {
//     const res = (await listEmployeeUsingPost({
//       current: 1,
//       pageSize: 1,
//       id,
//     } as any)) as any
//     const record = res?.data?.data?.records?.[0]
//     if (record) {
//       employeeFormData.value = { ...record }
//       return
//     }
//   } catch (error) {
//     console.error('加载员工详情失败', error)
//   }
//   // 兜底：至少带上 id + name，避免弹窗为空
//   employeeFormData.value = {
//     id,
//     name: fallbackName,
//     companyId: undefined,
//     companyName: formData.issuerCompany || '',
//   }
// }

const handleEmployeeAction = async (type: 'salesperson' | 'issuer') => {
  // 判断是否满足关联条件
  const canEdit = type === 'salesperson' ? salespersonCanEdit.value : issuerCanEdit.value
  
  // 如果满足关联条件，不打开模态框，直接返回
  if (canEdit) {
    return
  }
  
  // 不满足关联条件时，打开添加员工模态框
  employeeFormType.value = type
  const name = type === 'salesperson' ? (formData.salespersonName || '') : (formData.issuerName || '')
  
  // 始终设置为添加模式
  employeeFormTitle.value = type === 'salesperson' ? '添加员工（业务员）' : '添加员工（开票人）'

  // 获取当前选中的公司ID
  const selectedCompany = props.companyList.find(c => c.companyName === formData.issuerCompany)
  const companyId = selectedCompany?.id || (props.companyList.length > 0 ? props.companyList[0].id : undefined)
  employeeFormData.value = {
    name,
    companyId,
    companyName: formData.issuerCompany || '',
  }

  showEmployeeFormModal.value = true
}

// 员工表单保存成功
const handleEmployeeFormOk = async (data: any, callback: (success: boolean) => void) => {
  try {
    const name = (data?.name || '').trim()
    if (!name) {
      message.warning('请填写员工姓名')
      callback(false)
      return
    }

    // companyId：优先用表单提交的 companyId，其次用当前选择公司名称映射
    const selectedCompany = props.companyList.find(c => c.companyName === (data?.companyName || formData.issuerCompany))
    const companyId = data?.companyId || selectedCompany?.id
    if (!companyId) {
      message.error('请先选择公司名称')
      callback(false)
      return
    }

    const isEdit = !!data?.id
    const payload: any = {
      ...data,
      name,
      companyId,
    }
    
    if (isEdit) {
      // 编辑模式：使用已有的 employeeNo（如果存在）
      if (data?.employeeNo) {
        payload.employeeNo = data.employeeNo
      }
    } else {
      // 新增模式：不设置 employeeNo，由后端自动生成
      // 不应带 id
      delete payload.id
      delete payload.employeeNo
    }

    const res = (await (isEdit ? updateEmployeeUsingPost(payload as any) : addEmployeeUsingPost(payload as any))) as any
    if (res?.data?.code !== 0) {
      message.error(`员工${isEdit ? '更新' : '添加'}失败：` + (res?.data?.message || ''))
      callback(false)
      return
    }

    emit('employee-created')
    callback(true)

    // 立即回填 + 立即置为成功（避免仍显示失败）
    if (employeeFormType.value === 'salesperson') {
      formData.salespersonName = name
      salespersonAutoComplete.addExtraItem(name)
      salespersonValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${name}` }
      await nextTick()
      await checkEmployeeExists(name, 'salesperson')
    } else {
      formData.issuerName = name
      issuerAutoComplete.addExtraItem(name)
      issuerValidationMessage.value = { type: 'success', text: `已成功关联员工信息：${name}` }
      await nextTick()
      await checkEmployeeExists(name, 'issuer')
    }
    // 更新员工 id（编辑沿用；新增接口返回 id）
    if (!isEdit && res?.data?.data) {
      const newId = Number(res.data.data)
      if (employeeFormType.value === 'salesperson') salespersonId.value = newId || salespersonId.value
      else issuerId.value = newId || issuerId.value
    } else if (isEdit) {
      if (employeeFormType.value === 'salesperson') salespersonId.value = data.id || salespersonId.value
      else issuerId.value = data.id || issuerId.value
    }

    message.success(`员工${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理员工表单保存失败', error)
    callback(false)
  }
}

const issuerCompanyActionIcon = computed(() => {
  const canEdit = !!(formData.issuerCompany && companyValidationMessage.value?.type === 'success' && companyId.value)
  return h(canEdit ? EditOutlined : PlusOutlined)
})

// 加载公司详情用于编辑
const loadCompanyDetail = async (companyName: string, id?: number) => {
  try {
    const res = (await listCompanyByPageUsingPost({
      current: 1,
      pageSize: 1,
      companyName,
    } as any)) as any
    const record = res?.data?.data?.records?.[0]
    if (record) {
      companyFormData.value = { ...record }
      return
    }
  } catch (error) {
    console.error('加载公司详情失败', error)
  }
  companyFormData.value = {
    id,
    companyName,
  }
}

// 打开公司表单模态框（根据关联状态切换添加/编辑）
const handleIssuerCompanyAction = async () => {
  const canEdit = !!(formData.issuerCompany && companyValidationMessage.value?.type === 'success' && companyId.value)
  if (canEdit) {
    companyFormTitle.value = '编辑公司'
    await loadCompanyDetail(formData.issuerCompany!, companyId.value!)
  } else {
    companyFormTitle.value = '添加公司'
    companyFormData.value = {
      companyName: formData.issuerCompany || '',
    }
  }
  showCompanyFormModal.value = true
}

// 公司表单保存成功
const handleCompanyFormOk = async (data: any, callback: (success: boolean) => void) => {
  try {
    const companyName = (data?.companyName || '').trim()
    if (!companyName) {
      message.warning('请填写公司名称')
      callback(false)
      return
    }

    const isEdit = !!data?.id
    const payload = { ...data, companyName }
    const res = (await (isEdit ? updateCompanyUsingPost(payload as any) : addCompanyUsingPost(payload as any))) as any
    if (res?.data?.code !== 0) {
      message.error(`公司${isEdit ? '更新' : '添加'}失败：` + (res?.data?.message || ''))
      callback(false)
      return
    }

    callback(true)

    formData.issuerCompany = companyName
    issuerCompanyAutoComplete.addExtraItem(companyName)
    companyValidationMessage.value = { type: 'success', text: `已成功关联公司信息：${companyName}` }
    await nextTick()
    await checkCompanyExists(companyName)
    setInvoiceTypeByCompanyName(companyName)
    message.success(`公司${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理公司表单保存失败', error)
    callback(false)
  }
}

</script>

<style scoped>
@import '@/styles/form-modal.css';
@import '@/styles/filter.css';

/* 验证消息样式 */
.validation-message {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
}

.validation-message.success {
  color: #52c41a;
}

.validation-message.error {
  color: #ff4d4f;
}

.validation-message a {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
}

.validation-message a:hover {
  text-decoration: underline;
}

/* 打勾图标按钮样式 */
.check-button {
  color: #52c41a !important;
}

.check-button:hover {
  color: #73d13d !important;
  border-color: #52c41a !important;
}
</style>

