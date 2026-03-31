<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="1000px"
    :body-style="{ maxHeight: '70vh', overflowY: 'auto', padding: '16px 24px' }"
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
          <!-- 第一行：到账编号（先占位，不可编辑）、转账方式 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="到账编号" name="uniqueKey">
                <a-input v-model:value="formData.uniqueKey" placeholder="系统自动生成" disabled />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="转账方式" name="transferMethod">
                <a-select
                  v-model:value="formData.transferMethod"
                  :options="transferMethodSelectOptions"
                  placeholder="请选择转账方式"
                  allow-clear
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第二行：*到账日期、*到账金额 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="到账日期" name="arrivalTime" :rules="[{ required: true, message: '请选择到账日期' }]">
                <a-date-picker
                  v-model:value="formData.arrivalTime"
                  placeholder="请选择到账日期"
                  style="width: 100%"
                  format="YYYYMMDD"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="到账金额" name="amount" :rules="amountRules">
                <a-input-number
                  v-model:value="formData.amount"
                  placeholder="请输入到账金额"
                  style="width: 100%"
                  :precision="2"
                  :step="1000"
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第三行：客户账号、客户单位（客户账号 + 客户单位，占 2/3 宽度） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="客户账号" name="remark2">
                <a-input v-model:value="formData.remark2" placeholder="请输入客户账号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="16">
              <a-form-item
                  label="客户单位"
                  name="clientCompanyName"
                  :rules="[{ required: true, message: '请选择客户单位' }] "
                  :label-col="{ style: { width: '16.66667%' } }"
                  :wrapper-col="{ style: { width: '83.33333%' } }"
              >
                <a-input-group compact>
                  <a-auto-complete
                    :key="`client-company-${visible}`"
                    v-model:value="formData.clientCompanyName"
                    :options="filteredCustomerCompanyOptions"
                    placeholder="选择或输入客户单位"
                    style="width: calc(100% - 32px)"
                    allow-clear
                    show-search
                    @select="(value: string) => { formRef?.clearValidate(['clientCompanyName']); handleCustomerCompanySelect(value) }"
                    @change="handleCustomerCompanyChange"
                  />
                  <a-button
                    type="primary"
                    :icon="clientActionIcon"
                    @click="handleClientAction"
                    style="width: 32px; padding: 0;"
                  />
                </a-input-group>
                <div v-if="formData.clientCompanyName" style="margin-top: 4px; font-size: 12px;">
                  <span v-if="clientAssociationStatus === 'success'" style="color: #52c41a;">
                    已成功关联客户信息：{{ formData.clientCompanyName }}-{{ formData.userName }}
                  </span>
                  <span v-else-if="clientAssociationStatus === 'failed'" style="color: #ff4d4f;">
                    客户信息关联失败，请点击右侧加号或<a @click="handleCreateClient" style="color: #1890ff; cursor: pointer; text-decoration: underline;">点此链接</a>快速创建
                  </span>
                </div>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第四行：客户姓名、业务经理（客户姓名 + 业务经理，占 2/3 宽度） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="客户姓名" name="userName" :rules="[{ required: true, message: '请输入客户姓名' }]">
                <a-auto-complete
                  :key="`client-contact-${visible}-${formData.clientCompanyName || ''}`"
                  v-model:value="formData.userName"
                  :options="filteredCustomerContactOptions"
                  placeholder="选择或输入客户姓名"
                  style="width: 100%"
                  allow-clear
                  :disabled="!formData.clientCompanyName"
                  @change="(value: string) => { if (value) formRef?.clearValidate(['userName']); handleCustomerContactChange(value) }"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
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
                    type="primary"
                    :icon="salespersonActionIcon"
                    @click="handleEmployeeAction"
                    style="width: 32px; padding: 0;"
                  />
                </a-input-group>
                <div v-if="formData.salespersonName" style="margin-top: 4px; font-size: 12px;">
                  <span v-if="salespersonAssociationStatus === 'success'" style="color: #52c41a;">
                    已成功关联业务经理信息：{{ formData.salespersonName }}
                  </span>
                  <span v-else-if="salespersonAssociationStatus === 'failed'" style="color: #ff4d4f;">
                    业务经理信息关联失败，请点击右侧加号或<a @click="handleEmployeeAction" style="color: #1890ff; cursor: pointer; text-decoration: underline;">点此链接</a>快速创建
                  </span>
                </div>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第五行：公司名称、公司账号 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="公司名称" name="companyName" :rules="[{ required: true, message: '请选择公司名称' }]">
                <a-input-group compact>
                  <a-auto-complete
                    :key="`company-${visible}`"
                    v-model:value="formData.companyName"
                    :options="filteredCompanyOptions"
                    placeholder="选择或输入公司名称"
                    style="width: calc(100% - 32px)"
                    allow-clear
                    @select="handleCompanyNameSelect"
                    @change="handleCompanyNameChange"
                    @blur="handleCompanyNameBlur"
                  />
                  <a-button
                    type="primary"
                    :icon="companyActionIcon"
                    @click="handleCompanyAction"
                    style="width: 32px; padding: 0;"
                  />
                </a-input-group>
                <!-- 公司名称关联验证提示 -->
                <div v-if="companyAssociationStatus" style="margin-top: 4px; font-size: 12px;">
                  <span v-if="companyAssociationStatus === 'success'" style="color: #52c41a;">
                    已成功关联公司信息：{{ formData.companyName }}
                  </span>
                  <span v-else-if="companyAssociationStatus === 'failed'" style="color: #ff4d4f;">
                    公司信息关联失败，请点击右侧加号或<a href="javascript:void(0)" class="create-link-company" @click.prevent="handleCreateCompanyClick">点此链接</a>快速创建
                  </span>
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="16">
              <a-form-item 
                label="公司账号" 
                name="remark3"
                :label-col="{ style: { width: '16.66667%' } }"
                :wrapper-col="{ style: { width: '83.33333%' } }"
              >
                <a-input v-model:value="formData.remark3" placeholder="请选择公司后自动带出或手工输入公司账号" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第六行：备注（整行） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注"
                name="remark1"
                :label-col="{ style: { width: '11%' } }"
                :wrapper-col="{ style: { width: '89%' } }"
              >
                <a-input v-model:value="formData.remark1" placeholder="请输入备注" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <div v-if="showEditingInvoiceInfo" style="margin-top: 8px; padding: 8px; background-color: #fff7e6; border-radius: 4px; border: 1px solid #ffd591;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
              <strong>已关联发票金额信息：</strong>
            </div>
            <div style="font-size: 12px; color: #666;">
              <div v-for="(invoice, idx) in editingInvoiceInfo" :key="idx" style="margin-bottom: 2px;">
                • {{ invoice.invoiceNo }}：{{ invoice.paidAmount.toFixed(2) }}
              </div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ffd591;">
                <strong>已使用金额：</strong>{{ editingUsedAmount.toFixed(2) }} |
                <strong>剩余可用金额：</strong>{{ editingRemainingAmount.toFixed(2) }} |
                <strong>当前金额：</strong>{{ editingOriginalAmount.toFixed(2) }}
              </div>
            </div>
          </div>
        </a-form>
        </div>
      </template>
    </upsert-modal>

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
import dayjs, { type Dayjs } from 'dayjs'
import { Modal, message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import ClientFormModal from '@/modal/base/ClientFormModal.vue'
import EmployeeEditModal from '@/modal/employee/EmployeeEditModal.vue'
import CompanyFormModal from '@/modal/base/CompanyFormModal.vue'
import { existsClientUsingPost, addClientUsingPost, getClientByIdUsingGet, updateClientUsingPost, getClientCompanyNamesUsingGet, getUserNameByCompanyNameUsingPost } from '@/api/kehuxinxiguanli'
import { existsEmployeeUsingPost, listEmployeeUsingPost, addEmployeeUsingPost, updateEmployeeUsingPost, getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { checkExistsUsingPost, addCompanyUsingPost, listCompanyByPageUsingPost, updateCompanyUsingPost } from '@/api/gongsixinxijiekou'
import { createContactSelectHandler } from '@/hooks/useContactSelect'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

const DEFAULT_COMPANY_NAME = '西安九华云信息科技有限公司'

interface FormData {
  uniqueKey?: string
  companyName?: string
  companyId?: number
  clientCompanyName?: string
  userName?: string
  clientId?: number
  clientPhone?: string
  salespersonName?: string
  salespersonId?: number
  transferMethod?: string
  arrivalTime?: Dayjs | null
  amount?: number
  remark1?: string
  remark2?: string
  remark3?: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  companyList: API.Company[]
  employeeList: API.EmployeeVO[]
  clientList: API.Client_[]
  formData?: Partial<FormData>
  editingBankTransactionId?: number | null
  editingRemainingAmount?: number
  editingUsedAmount?: number
  editingOriginalAmount?: number
  editingInvoiceInfo?: Array<{ invoiceNo: string; paidAmount: number }>
  // 兼容外部传入的业务经理/转账方式（当前文件未使用，但对齐父组件接口以消除缺失报错）
  paymentSalespersonId?: number | null
  transferMethodOptions?: Array<{ label: string; value: string }>
}

const props = withDefaults(defineProps<Props>(), {
  companyList: () => [],
  employeeList: () => [],
  clientList: () => [],
  paymentSalespersonId: null,
  transferMethodOptions: () => [],
  formData: () => ({
    uniqueKey: '',
    companyName: DEFAULT_COMPANY_NAME,
    clientCompanyName: '',
    userName: '',
    clientPhone: '',
    salespersonName: '',
    arrivalTime: dayjs(),
    amount: undefined,
    remark1: '',
    remark2: '',
    remark3: '',
  }),
  editingBankTransactionId: null,
  editingRemainingAmount: 0,
  editingUsedAmount: 0,
  editingOriginalAmount: 0,
  editingInvoiceInfo: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': [] // 新增模式的下一条
  'next-edit': [callback: (success: boolean) => void] // 编辑模式的下一条，传递回调函数
  'prev-edit': [callback: (success: boolean) => void] // 编辑模式的上一条，传递回调函数
  'reset': [] // 重置事件
  'client-company-change': [value: string | undefined]
  'user-name-change': [value: string | undefined]
  'client-created': [] // 客户创建成功事件
  'employee-created': [] // 员工（业务经理）创建成功事件
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

const contactNameList = ref<string[]>([])
const currentClientRecords = ref<API.Client_[]>([])

// 保存原始记录数据，用于重置
const originalFormData = ref<Partial<FormData> | null>(null)

// 快捷添加模态框状态
const showClientFormModal = ref(false)
const showEmployeeFormModal = ref(false)
const showCompanyFormModal = ref(false)

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
const employeeFormTitle = ref('添加员工（业务经理）')

// 公司表单数据
const companyFormData = ref<Record<string, any>>({
  companyName: '',
})
const companyFormTitle = ref('添加公司')

// 计算显示的标题（包含序号）
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
  uniqueKey: '',
  companyName: DEFAULT_COMPANY_NAME,
  companyId: undefined,
  clientCompanyName: '',
  userName: '',
  clientId: undefined,
  clientPhone: '',
  salespersonName: '',
  salespersonId: undefined,
  transferMethod: '对公转账',
  arrivalTime: dayjs(),
  amount: undefined,
  remark1: '',
  remark2: '',
  remark3: '',
})

// 关联状态管理
const clientAssociationStatus = ref<'success' | 'failed' | null>(null)
const clientAssociationId = ref<number | null>(null)
const salespersonAssociationStatus = ref<'success' | 'failed' | null>(null)
const salespersonAssociationId = ref<number | null>(null)
const companyAssociationStatus = ref<'success' | 'failed' | null>(null)
const companyAssociationId = ref<number | null>(null)

// 将关联出来的 ID 写回到表单数据中，供父组件提交时直接传入
watch(clientAssociationId, (id) => {
  formData.clientId = id ?? undefined
})
watch(salespersonAssociationId, (id) => {
  formData.salespersonId = id ?? undefined
})
watch(companyAssociationId, (id) => {
  formData.companyId = id ?? undefined
})

const clientActionIcon = computed(() => {
  const canEdit = !!(formData.clientCompanyName && formData.userName && clientAssociationStatus.value === 'success' && clientAssociationId.value)
  return h(canEdit ? EditOutlined : PlusOutlined)
})
const salespersonActionIcon = computed(() => {
  const canEdit = !!(formData.salespersonName && salespersonAssociationStatus.value === 'success' && salespersonAssociationId.value)
  return h(canEdit ? EditOutlined : PlusOutlined)
})
const companyActionIcon = computed(() => {
  const canEdit = !!(formData.companyName && companyAssociationStatus.value === 'success' && companyAssociationId.value)
  return h(canEdit ? EditOutlined : PlusOutlined)
})

// 客户单位选项：使用后端接口获取（避免前端本地过滤不全/不一致）
const customerCompanyOptions = ref<Array<{ value: string; label: string }>>([])

const fetchCustomerCompanyOptions = async () => {
  try {
    const res = await getClientCompanyNamesUsingGet()
    if (res?.data?.code === 0 && res?.data?.data) {
      const names: string[] = Array.isArray(res.data.data) ? res.data.data : Array.from(res.data.data as any)
      customerCompanyOptions.value = names
        .map((n) => (n || '').trim())
        .filter((n) => !!n)
        .map((n) => ({ value: n, label: n }))
    } else {
      customerCompanyOptions.value = []
    }
  } catch (error) {
    console.error('获取客户单位列表失败', error)
    customerCompanyOptions.value = []
  }
}

// 客户单位自动填充框（使用通用 composable）
const customerCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: customerCompanyOptions,
  currentValue: computed(() => formData.clientCompanyName || ''),
  enableAutoAdd: true,
})

// 过滤后的客户单位选项
const filteredCustomerCompanyOptions = customerCompanyAutoComplete.filteredOptions

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
  currentValue: computed(() => formData.userName || ''),
  enableAutoAdd: true,
})

// 过滤后的客户姓名选项
const filteredCustomerContactOptions = customerContactAutoComplete.filteredOptions

// 公司名称自动完成选项
const companyOptions = computed(() => {
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string }> = []

  for (const company of props.companyList) {
    const name = (company.companyName || '').trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      options.push({ value: name, label: name })
    }
  }

  // 在公司名称下拉列表中追加“其他账号”选项
  options.push({ value: '其他账号', label: '其他账号' })

  return options
})

// 公司名称自动填充框（使用通用 composable）
const companyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: companyOptions,
  currentValue: computed(() => formData.companyName || ''),
  enableAutoAdd: true,
})

// 过滤后的公司名称选项
const filteredCompanyOptions = companyAutoComplete.filteredOptions

// 转账方式下拉选项（从父组件传入的 transferMethodOptions 衍生）
const transferMethodSelectOptions = computed(() => props.transferMethodOptions || [])

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

// 业务经理自动完成选项（统一使用 getAllEmployeeBasicInfoUsingGet 数据，默认九华云通过 companyName 传入）
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

// 过滤后的业务经理选项
const filteredSalespersonOptions = salespersonAutoComplete.filteredOptions

// 去重后的客户列表
const uniqueClientList = computed(() => {
  const seen = new Set<string>()
  const unique: API.Client_[] = []
  for (const client of props.clientList) {
    if (client.companyName && !seen.has(client.companyName)) {
      seen.add(client.companyName)
      unique.push(client)
    }
  }
  return unique
})

// 是否显示编辑发票信息
const showEditingInvoiceInfo = computed(() => {
  return !!props.editingBankTransactionId && props.editingInvoiceInfo.length > 0
})

// 金额验证规则（只保留必填校验，金额校验交给后端）
const amountRules = computed(() => {
  return [{ required: true, message: '请输入到款金额' }]
})

// 获取联系人列表
const fetchContactNameList = async (companyName: string) => {
  const name = (companyName || '').trim()
  if (!name) {
    contactNameList.value = []
    currentClientRecords.value = []
    return
  }
  try {
    const res = (await getUserNameByCompanyNameUsingPost({ companyName: name } as any)) as any
    if (res?.data?.code === 0 && res?.data?.data) {
      const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
      const names = rows
        .map((r) => (r?.userName || '').trim())
        .filter((n) => !!n)
      contactNameList.value = Array.from(new Set(names))
      // 该接口不返回电话等详细信息，保持为空即可
      currentClientRecords.value = []
    } else {
      contactNameList.value = []
      currentClientRecords.value = []
    }
  } catch (error) {
    console.error('获取联系人列表失败', error)
    contactNameList.value = []
    currentClientRecords.value = []
  }
}

// 检查客户关联状态
const checkClientAssociation = async (companyName: string, userName: string) => {
  if (!companyName || !userName) {
    clientAssociationStatus.value = null
    clientAssociationId.value = null
    return
  }
  try {
    const res = await existsClientUsingPost({
      companyName,
      userName,
    }) as any
    if (res.data.code === 0 && res.data.data && res.data.data.exists) {
      const cid = res.data.data.clientId
      const normalizedId = Array.isArray(cid) ? cid[0] : cid
      clientAssociationStatus.value = 'success'
      clientAssociationId.value = normalizedId || null
    } else {
      clientAssociationStatus.value = 'failed'
      clientAssociationId.value = null
    }
  } catch (error) {
    console.error('检查客户关联失败', error)
    clientAssociationStatus.value = 'failed'
    clientAssociationId.value = null
  }
}

// 检查业务经理关联状态：优先用 getAllEmployeeBasicInfo 返回的 id，否则 exists 接口兜底
const checkSalespersonAssociation = async (name: string) => {
  if (!name) {
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
    return
  }
  const n = (name || '').trim()
  const found = employeeBasicList.value.find((e) => (e.name || '').trim() === n && e.id != null)
  if (found?.id) {
    salespersonAssociationStatus.value = 'success'
    salespersonAssociationId.value = found.id
    return
  }
  try {
    const res = (await existsEmployeeUsingPost({ name })) as any
    if (res?.data?.code === 0 && res?.data?.data?.exists && res?.data?.data?.employeeId) {
      salespersonAssociationStatus.value = 'success'
      salespersonAssociationId.value = res.data.data.employeeId
    } else {
      salespersonAssociationStatus.value = 'failed'
      salespersonAssociationId.value = null
    }
  } catch (error) {
    console.error('检查业务经理关联失败', error)
    salespersonAssociationStatus.value = 'failed'
    salespersonAssociationId.value = null
  }
}

// 检查公司关联状态（排除“其他账号”这种特殊占位项）
const checkCompanyAssociation = async (companyName: string) => {
  if (!companyName) {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    return
  }

  // “其他账号”是人工录入账号的占位值，不参与公司关联校验，也不提示失败
  if (companyName === '其他账号') {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    return
  }
  try {
    const res = await checkExistsUsingPost({
      companyName,
    }) as any
    if (res.data.code === 0 && res.data.data && res.data.data.exists) {
      const companyData = res.data.data
      companyAssociationStatus.value = 'success'
      companyAssociationId.value = companyData.id || null

      // 优先使用接口返回的公司账号字段自动填充“公司账号”输入框
      const apiCompanyAccount = (companyData.companyAccount || '').trim?.() || companyData.companyAccount || ''
      if (apiCompanyAccount) {
        formData.remark3 = apiCompanyAccount
      } else {
        // 兜底：如果在公司列表中能找到对应公司，则使用“银行名称-公司账号”格式填充
        const matchedCompany = props.companyList.find(
          (c) => (c.companyName || '').trim() === (companyName || '').trim(),
        )
        if (matchedCompany && matchedCompany.bankName && matchedCompany.bankAccount) {
          formData.remark3 = `${matchedCompany.bankName}-${matchedCompany.bankAccount}`
        }
      }
    } else {
      companyAssociationStatus.value = 'failed'
      companyAssociationId.value = null
    }
  } catch (error) {
    console.error('检查公司关联失败', error)
    companyAssociationStatus.value = 'failed'
    companyAssociationId.value = null
  }
}

// 处理公司名称变化（输入时）
const handleCompanyNameChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  companyAutoComplete.handleChange(value)

  if (value) {
    // 如果选择的是“其他账号”，则不自动填充公司账号，并清空已有公司账号，也不做关联校验
    if (value === '其他账号') {
      formData.remark3 = ''
      companyAssociationStatus.value = null
      companyAssociationId.value = null
    }
    formRef.value?.clearValidate(['companyName'])
  } else {
    // 清空公司关联状态
    companyAssociationStatus.value = null
    companyAssociationId.value = null
  }
}

// 公司名称失去焦点时验证
const handleCompanyNameBlur = () => {
  if (formData.companyName) {
    checkCompanyAssociation(formData.companyName)
  } else {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
  }
}

// 公司名称选择时：立即触发关联校验，确保 companyId 回填（避免用户未触发 blur 直接提交导致 companyId 为空）
const handleCompanyNameSelect = async (value: string) => {
  const name = (value || '').trim()
  if (!name) {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    return
  }
  formRef.value?.clearValidate(['companyName'])
  formData.companyName = name
  // 选择“其他账号”时不做公司关联校验，也不自动带出公司账号
  if (name === '其他账号') {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    formData.remark3 = ''
    return
  }

  await checkCompanyAssociation(name)
}

// 处理创建公司链接点击
const handleCreateCompanyClick = async () => {
  if (!formData.companyName) {
    message.warning('请先填写公司名称')
    return
  }

  Modal.confirm({
    title: '确认创建',
    content: `是否要创建公司"${formData.companyName}"的公司信息？`,
    onOk: async () => {
      try {
        const res = (await addCompanyUsingPost({
          companyName: formData.companyName,
        })) as any

        if (res.data.code === 0) {
          message.success('公司创建成功')
          // 重新验证
          await checkCompanyAssociation(formData.companyName!)
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

// 处理客户单位选择
const handleCustomerCompanySelect = createContactSelectHandler({
  fetchContactList: fetchContactNameList,
  getContactList: () => contactNameList.value,
  getCurrentContact: () => formData.userName || '',
  setContact: (val: string) => {
    formData.userName = val
  },
  clearContactList: () => {
    contactNameList.value = []
  },
  clearAssociation: () => {
    clientAssociationStatus.value = null
    clientAssociationId.value = null
  },
  checkAssociation: async (companyName: string, contactName: string) => {
    await checkClientAssociation(companyName, contactName)
  },
})

// 处理客户单位变化（输入时）
const handleCustomerCompanyChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerCompanyAutoComplete.handleChange(value)
  
  // 如果值不为空，清除该字段的验证错误
  if (value) {
    formRef.value?.clearValidate(['clientCompanyName'])
    
    // 检查是否是列表中的选项
    const exists = customerCompanyOptions.value.some(opt => opt.value === value)
    if (exists) {
      await handleCustomerCompanySelect(value)
    } else {
      // 如果输入的是新值，清空联系人
      contactNameList.value = []
      formData.userName = ''
      clientAssociationStatus.value = null
      clientAssociationId.value = null
    }
  } else {
    contactNameList.value = []
    formData.userName = ''
    clientAssociationStatus.value = null
    clientAssociationId.value = null
  }
}

// 处理客户姓名变化（输入时）
const handleCustomerContactChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerContactAutoComplete.handleChange(value)
  
  if (value) {
    formRef.value?.clearValidate(['userName'])
  }
  if (value && formData.clientCompanyName) {
    await checkClientAssociation(formData.clientCompanyName, value)
  } else {
    clientAssociationStatus.value = null
    clientAssociationId.value = null
  }
}

// 业务经理下拉选择：从 employeeBasicList 取 id，直接关联成功，便于编辑图案
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
    salespersonAssociationStatus.value = 'success'
    salespersonAssociationId.value = option.id
  } else {
    // 兜底逻辑：如果是手动输入的或者没有ID的选项
    checkSalespersonAssociation(name)
  }
}

// 处理业务经理变化：只清空验证状态，不立即验证（避免输入法输入时频繁触发）
const handleSalespersonChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  salespersonAutoComplete.handleChange(value)
  
  if (value) {
    formRef.value?.clearValidate?.(['salespersonName'])
    // 清空之前的验证状态，等待 blur 时再验证
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
  } else {
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
  }
}

// 业务经理失去焦点时验证
const handleSalespersonBlur = async () => {
  if (formData.salespersonName) {
    await checkSalespersonAssociation(formData.salespersonName)
  } else {
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
  }
}

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
    companyName: formData.clientCompanyName || '',
    userName: formData.userName || '',
  }
}

const handleClientAction = async () => {
  const canEdit = !!(formData.clientCompanyName && formData.userName && clientAssociationStatus.value === 'success' && clientAssociationId.value)
  if (canEdit) {
    clientFormTitle.value = '编辑客户'
    await loadClientDetail(clientAssociationId.value!)
  } else {
    clientFormTitle.value = '添加客户'
    clientFormData.value = {
      companyName: formData.clientCompanyName || '',
      userName: formData.userName || '',
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

    emit('client-created')
    callback(true)

    // 立即回填 + 立即置为成功（避免仍显示失败）
    formData.clientCompanyName = companyName
    customerCompanyAutoComplete.addExtraItem(companyName)
    // 立即刷新客户单位列表（后端接口）
    await fetchCustomerCompanyOptions()
    await handleCustomerCompanySelect(companyName)
    formData.userName = userName
    clientAssociationStatus.value = 'success'
    if (!isEdit && res?.data?.data) {
      clientAssociationId.value = Number(res.data.data) || clientAssociationId.value
    } else if (isEdit) {
      clientAssociationId.value = data.id || clientAssociationId.value
    }
    await nextTick()
    await checkClientAssociation(companyName, userName)
    message.success(`客户${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理客户表单保存失败', error)
    callback(false)
  }
}

const loadEmployeeDetail = async (id: number, fallbackName: string) => {
  try {
    const res = (await listEmployeeUsingPost({
      current: 1,
      pageSize: 1,
      id,
    } as any)) as any
    const record = res?.data?.data?.records?.[0]
    if (record) {
      employeeFormData.value = { ...record }
      return
    }
  } catch (error) {
    console.error('加载员工详情失败', error)
  }
  employeeFormData.value = {
    id,
    name: fallbackName,
    companyId: undefined,
    companyName: formData.companyName || '',
  }
}

const handleEmployeeAction = async () => {
  // 优先校验关联状态，避免明明存在却误走新增接口
  if (formData.salespersonName && !salespersonAssociationStatus.value) {
    await checkSalespersonAssociation(formData.salespersonName)
  }
  const canEdit = !!(formData.salespersonName && salespersonAssociationId.value)
  
  // 如果可以编辑，打开编辑表单
  if (canEdit) {
    employeeFormTitle.value = '编辑员工（业务经理）'
    await loadEmployeeDetail(salespersonAssociationId.value!, formData.salespersonName || '')
    showEmployeeFormModal.value = true
  } else {
    // 如果关联失败，使用确认框快速创建（和其他字段保持一致）
    if (!formData.salespersonName) {
      message.warning('请先填写业务经理姓名')
      return
    }

    // 获取当前选中的公司ID
    const selectedCompany = props.companyList.find(c => c.companyName === formData.companyName)
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
            companyId: companyId,
            // employeeNo 由后端自动生成，不传递此字段
          }
          const res = (await addEmployeeUsingPost(payload)) as any

          if (res.data.code === 0) {
            message.success('员工创建成功')
            // 重新验证（name 一定存在，此处强制转换为 string）
            await checkSalespersonAssociation(formData.salespersonName || '')
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

    const selectedCompany = props.companyList.find(c => c.companyName === (data?.companyName || formData.companyName))
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
    
    // 新增模式：删除 employeeNo，让后端自动生成
    if (!isEdit) {
      delete payload.employeeNo
      delete payload.id
    } else {
      // 编辑模式：如果 employeeNo 为空或不存在，删除它，让后端保留原有值
      if (!payload.employeeNo || !payload.employeeNo.trim()) {
        delete payload.employeeNo
      }
    }

    const res = (await (isEdit ? updateEmployeeUsingPost(payload as any) : addEmployeeUsingPost(payload as any))) as any
    if (res?.data?.code !== 0) {
      message.error(`员工${isEdit ? '更新' : '添加'}失败：` + (res?.data?.message || ''))
      callback(false)
      return
    }

    // 新增模式下，需要重新加载员工详情以获取后端生成的 employeeNo
    if (!isEdit && res?.data?.data) {
      const newEmployeeId = Number(res.data.data)
      try {
        const detailRes = (await listEmployeeUsingPost({
          current: 1,
          pageSize: 1,
          id: newEmployeeId,
        } as any)) as any
        const record = detailRes?.data?.data?.records?.[0]
        if (record?.employeeNo) {
          // 更新 payload 中的 employeeNo，以便后续使用
          payload.employeeNo = record.employeeNo
        }
      } catch (error) {
        console.error('加载员工详情失败', error)
      }
    }

    callback(true)

    // 立即回填 + 立即置为成功（避免仍显示失败）
    formData.salespersonName = name
    salespersonAutoComplete.addExtraItem(name)
    salespersonAssociationStatus.value = 'success'
    if (!isEdit && res?.data?.data) {
      salespersonAssociationId.value = Number(res.data.data) || salespersonAssociationId.value
    } else if (isEdit) {
      salespersonAssociationId.value = data.id || salespersonAssociationId.value
    }
    await nextTick()
    await checkSalespersonAssociation(name)
    message.success(`员工${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理员工表单保存失败', error)
    callback(false)
  }
}

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
  companyFormData.value = { id, companyName }
}

const handleCompanyAction = async () => {
  const canEdit = !!(formData.companyName && companyAssociationStatus.value === 'success' && companyAssociationId.value)
  if (canEdit) {
    companyFormTitle.value = '编辑公司'
    await loadCompanyDetail(formData.companyName!, companyAssociationId.value!)
  } else {
    companyFormTitle.value = '添加公司'
    companyFormData.value = { companyName: formData.companyName || '' }
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

    // 立即回填 + 立即置为成功（避免仍显示失败）
    formData.companyName = companyName
    companyAutoComplete.addExtraItem(companyName)
    companyAssociationStatus.value = 'success'
    if (!isEdit && res?.data?.data) {
      companyAssociationId.value = Number(res.data.data) || companyAssociationId.value
    } else if (isEdit) {
      companyAssociationId.value = data.id || companyAssociationId.value
    }
    await nextTick()
    await checkCompanyAssociation(companyName)
    message.success(`公司${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理公司表单保存失败', error)
    callback(false)
  }
}

// 创建客户
const handleCreateClient = () => {
  Modal.confirm({
    title: '创建客户信息',
    content: `是否要创建客户单位"${formData.clientCompanyName}"-客户姓名"${formData.userName}"的客户信息？`,
    onOk: async () => {
      try {
        const res = await addClientUsingPost({
          companyName: formData.clientCompanyName,
          userName: formData.userName,
        }) as any
        if (res.data.code === 0) {
          message.success('客户信息创建成功')
          await checkClientAssociation(formData.clientCompanyName || '', formData.userName || '')
          emit('client-created')
        } else {
          message.error(res.data.message || '创建失败')
        }
      } catch (error) {
        console.error('创建客户失败', error)
        message.error('创建客户失败')
      }
    },
  })
}

// 监听 props.modelValue
watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 打开弹窗时，先拉取客户单位列表（后端接口）
    await fetchCustomerCompanyOptions()
    // 判断是否为编辑模式（有 editingBankTransactionId）
    if (props.editingBankTransactionId) {
      // 编辑模式：拉取全部员工基本信息（业务经理下拉）
      isEditing.value = true
      await fetchEmployeeBasicList()
      if (props.formData) {
        // 保存原始数据用于重置
        originalFormData.value = {
          companyName: props.formData.companyName || '',
          clientCompanyName: props.formData.clientCompanyName || '',
          userName: props.formData.userName || '',
          clientPhone: props.formData.clientPhone || '',
          salespersonName: props.formData.salespersonName || '',
          transferMethod: props.formData.transferMethod || '对公转账',
          arrivalTime: props.formData.arrivalTime ? (typeof props.formData.arrivalTime === 'string' ? dayjs(props.formData.arrivalTime) : props.formData.arrivalTime) : dayjs(),
          amount: props.formData.amount,
          remark1: props.formData.remark1 || '',
          remark2: props.formData.remark2 || '',
          remark3: props.formData.remark3 || '',
        }
        Object.assign(formData, {
          uniqueKey: props.formData.uniqueKey || '',
          companyName: props.formData.companyName || '',
          clientCompanyName: props.formData.clientCompanyName || '',
          userName: props.formData.userName || '',
          clientPhone: props.formData.clientPhone || '',
          salespersonName: props.formData.salespersonName || '',
          transferMethod: props.formData.transferMethod || '对公转账',
          arrivalTime: props.formData.arrivalTime ? (typeof props.formData.arrivalTime === 'string' ? dayjs(props.formData.arrivalTime) : props.formData.arrivalTime) : dayjs(),
          amount: props.formData.amount,
          remark1: props.formData.remark1 || '',
          remark2: props.formData.remark2 || '',
          remark3: props.formData.remark3 || '',
        })
        originalFormData.value = { ...formData }
        // 等待 DOM 更新，确保 upsertModalRef 已经准备好
        await nextTick()
        // 重置按钮状态（编辑模式下，保存、上一条、下一条都可用）
        upsertModalRef.value?.resetButtonState()
        // 如果选择了客户单位，加载联系人列表并检查关联状态
        if (props.formData.clientCompanyName) {
          await fetchContactNameList(props.formData.clientCompanyName)
          if (props.formData.userName) {
            await checkClientAssociation(props.formData.clientCompanyName, props.formData.userName)
          }
        }
        // 如果选择了业务经理，检查关联状态
        if (props.formData.salespersonName) {
          await checkSalespersonAssociation(props.formData.salespersonName)
        }
        // 如果选择了公司名称，检查关联状态
        if (props.formData.companyName) {
          await checkCompanyAssociation(props.formData.companyName)
        }
      }
    } else {
      // 新增模式：初始化状态机（统一筛选所有员工）
      isEditing.value = false
      await fetchEmployeeBasicList()
      // 如果 props.formData 有值，保留这些值（用于下一条功能）
      if (props.formData && Object.keys(props.formData).length > 0) {
        // 保留现有数据，只更新缺失的字段
        Object.assign(formData, {
          uniqueKey: props.formData.uniqueKey || '',
          companyName: props.formData.companyName || '',
          clientCompanyName: props.formData.clientCompanyName || '',
          userName: props.formData.userName || '',
          clientPhone: props.formData.clientPhone || '',
          salespersonName: props.formData.salespersonName || '',
          transferMethod: props.formData.transferMethod || '对公转账',
          arrivalTime: props.formData.arrivalTime ? (typeof props.formData.arrivalTime === 'string' ? dayjs(props.formData.arrivalTime) : props.formData.arrivalTime) : dayjs(),
          amount: props.formData.amount,
          remark1: props.formData.remark1 || '',
          remark2: props.formData.remark2 || '',
          remark3: props.formData.remark3 || '',
        })
        // 如果选择了客户单位，加载联系人列表并检查关联状态
        if (props.formData.clientCompanyName) {
          await fetchContactNameList(props.formData.clientCompanyName)
          if (props.formData.userName) {
            await checkClientAssociation(props.formData.clientCompanyName, props.formData.userName)
          }
        }
        // 如果选择了业务经理，检查关联状态
        if (props.formData.salespersonName) {
          await checkSalespersonAssociation(props.formData.salespersonName)
        }
      } else {
        // 完全清空表单，使用默认公司名称和默认转账方式
        Object.assign(formData, {
          uniqueKey: '',
          companyName: DEFAULT_COMPANY_NAME,
          clientCompanyName: '',
          userName: '',
          clientPhone: '',
          salespersonName: '',
          transferMethod: '对公转账',
          arrivalTime: dayjs(),
          amount: undefined,
          remark1: '',
          remark2: '',
          remark3: '',
        })
        contactNameList.value = []
        currentClientRecords.value = []
        clientAssociationStatus.value = null
        clientAssociationId.value = null
        salespersonAssociationStatus.value = null
        salespersonAssociationId.value = null
      }

      // 新增模式下，无论是否带入了 props.formData，只要当前有公司名称且公司账号为空，就通过 exists 接口回填公司账号
      if (formData.companyName && !formData.remark3 && formData.companyName !== '其他账号') {
        await checkCompanyAssociation(formData.companyName)
      }

      // 等待 DOM 更新，确保 upsertModalRef 已经准备好
      await nextTick()
      upsertModalRef.value?.resetButtonState()
    }
  } else {
    // 模态框关闭时，重置表单和状态机
    formRef.value?.resetFields()
    // 清空所有表单数据，确保自动填充框状态重置
    Object.assign(formData, {
      uniqueKey: '',
      companyName: DEFAULT_COMPANY_NAME,
      companyId: undefined,
      clientCompanyName: '',
      userName: '',
      clientId: undefined,
      clientPhone: '',
      salespersonName: '',
      salespersonId: undefined,
      arrivalTime: dayjs(),
      amount: undefined,
      remark1: '',
      remark2: '',
      remark3: '',
    })
    contactNameList.value = []
    currentClientRecords.value = []
    isEditing.value = false
    originalFormData.value = null
    clientAssociationStatus.value = null
    clientAssociationId.value = null
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    upsertModalRef.value?.resetButtonState()
  }
})

// 监听 formData 变化（用于编辑模式下更新数据）
watch(() => props.formData, async (newFormData) => {
  if (visible.value && newFormData) {
    // 如果模态框已打开且是编辑模式，更新表单数据
    if (props.editingBankTransactionId) {
      // 确保编辑状态正确
      isEditing.value = true
      // 保存原始数据用于重置
      Object.assign(formData, {
        uniqueKey: newFormData.uniqueKey || '',
        companyName: newFormData.companyName || '',
        clientCompanyName: newFormData.clientCompanyName || '',
        userName: newFormData.userName || '',
        clientPhone: newFormData.clientPhone || '',
        salespersonName: newFormData.salespersonName || '',
        transferMethod: newFormData.transferMethod || '',
        arrivalTime: newFormData.arrivalTime ? (typeof newFormData.arrivalTime === 'string' ? dayjs(newFormData.arrivalTime) : newFormData.arrivalTime) : dayjs(),
        amount: newFormData.amount,
        remark1: newFormData.remark1 || '',
        remark2: newFormData.remark2 || '',
        remark3: newFormData.remark3 || '',
      })
      originalFormData.value = { ...formData }
      // 如果客户单位发生变化，重新加载联系人列表并检查关联状态
      if (newFormData.clientCompanyName) {
        await fetchContactNameList(newFormData.clientCompanyName)
        if (newFormData.userName) {
          await checkClientAssociation(newFormData.clientCompanyName, newFormData.userName)
        }
      }
      // 如果业务经理发生变化，检查关联状态
      if (newFormData.salespersonName) {
        await checkSalespersonAssociation(newFormData.salespersonName)
      }
      // 重置按钮状态
      await nextTick()
      upsertModalRef.value?.resetButtonState()
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

// 下一条编辑按钮处理（编辑模式）
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
        uniqueKey: originalFormData.value.uniqueKey || '',
        companyName: originalFormData.value.companyName || '',
        clientCompanyName: originalFormData.value.clientCompanyName || '',
        userName: originalFormData.value.userName || '',
        clientPhone: originalFormData.value.clientPhone || '',
        salespersonName: originalFormData.value.salespersonName || '',
        transferMethod: originalFormData.value.transferMethod || '',
        arrivalTime: originalFormData.value.arrivalTime ? (typeof originalFormData.value.arrivalTime === 'string' ? dayjs(originalFormData.value.arrivalTime) : originalFormData.value.arrivalTime) : dayjs(),
        amount: originalFormData.value.amount,
        remark1: originalFormData.value.remark1 || '',
        remark2: originalFormData.value.remark2 || '',
        remark3: originalFormData.value.remark3 || '',
      })
      // 如果选择了客户单位，重新加载联系人列表并检查关联状态
      if (originalFormData.value.clientCompanyName) {
        await fetchContactNameList(originalFormData.value.clientCompanyName)
        if (originalFormData.value.userName) {
          await checkClientAssociation(originalFormData.value.clientCompanyName, originalFormData.value.userName)
        }
      }
      // 如果选择了业务经理，检查关联状态
      if (originalFormData.value.salespersonName) {
        await checkSalespersonAssociation(originalFormData.value.salespersonName)
      }
    } else if (props.formData) {
      // 如果没有保存的原始数据，使用 props.formData
      Object.assign(formData, {
        uniqueKey: props.formData.uniqueKey || '',
        companyName: props.formData.companyName || '',
        clientCompanyName: props.formData.clientCompanyName || '',
        userName: props.formData.userName || '',
        clientPhone: props.formData.clientPhone || '',
        salespersonName: props.formData.salespersonName || '',
        transferMethod: props.formData.transferMethod || '',
        arrivalTime: props.formData.arrivalTime ? (typeof props.formData.arrivalTime === 'string' ? dayjs(props.formData.arrivalTime) : props.formData.arrivalTime) : dayjs(),
        amount: props.formData.amount,
        remark1: props.formData.remark1 || '',
        remark2: props.formData.remark2 || '',
        remark3: props.formData.remark3 || '',
      })
      // 如果选择了客户单位，重新加载联系人列表并检查关联状态
      if (props.formData.clientCompanyName) {
        await fetchContactNameList(props.formData.clientCompanyName)
        if (props.formData.userName) {
          await checkClientAssociation(props.formData.clientCompanyName, props.formData.userName)
        }
      }
      // 如果选择了业务经理，检查关联状态
      if (props.formData.salespersonName) {
        await checkSalespersonAssociation(props.formData.salespersonName)
      }
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
      uniqueKey: '',
      companyName: DEFAULT_COMPANY_NAME,
      clientCompanyName: '',
      userName: '',
      clientPhone: '',
      salespersonName: '',
      transferMethod: '对公转账',
      arrivalTime: dayjs(),
      amount: undefined,
      remark1: '',
      remark2: '',
      remark3: '',
    })
    contactNameList.value = []
    currentClientRecords.value = []
    clientAssociationStatus.value = null
    clientAssociationId.value = null
    salespersonAssociationStatus.value = null
    salespersonAssociationId.value = null
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

