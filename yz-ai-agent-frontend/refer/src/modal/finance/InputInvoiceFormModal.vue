<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="1200px"
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
            :validate-trigger="['submit']"
            layout="horizontal"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
          >
          <!-- 第一行（3个）：*公司名称（自动填充框）、供货单位（自动填充框）、供货姓名（自动填充框） -->
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
                    @change="handleCompanyNameChange"
                    @blur="handleCompanyNameBlur"
                    @select="(value: string) => { if (value) formRef?.clearValidate(['companyName']) }"
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
                    公司信息关联失败，请<a @click="handleCreateCompanyClick" style="color: #1890ff; cursor: pointer; text-decoration: underline;">点此链接</a>创建
                  </span>
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="供货单位" name="supplierName" :rules="[{ required: true, message: '请选择供货单位' }]">
                <a-input-group compact>
                  <a-auto-complete
                    :key="`supplier-company-${visible}`"
                    v-model:value="formData.supplierName"
                    :options="filteredSupplierCompanyOptions"
                    placeholder="选择或输入供货单位"
                    style="width: calc(100% - 32px)"
                    allow-clear
                    show-search
                    @select="(value: string) => { formRef?.clearValidate(['supplierName']); handleSupplierCompanySelect(value) }"
                    @change="handleSupplierCompanyChange"
                  />
                  <a-button
                    type="primary"
                    :icon="supplierActionIcon"
                    @click="handleSupplierAction"
                    style="width: 32px; padding: 0;"
                  />
                </a-input-group>
                <div v-if="formData.supplierName && formData.supplierContact" style="margin-top: 4px; font-size: 12px;">
                  <span v-if="supplierAssociationStatus === 'success'" style="color: #52c41a;">
                    已成功关联供货单位-{{ formData.companyName  }}-{{ formData.supplierName }}
                  </span>
                  <span v-else-if="supplierAssociationStatus === 'failed'" style="color: #ff4d4f;">
                    供货单位关联失败，请<a @click="handleCreateSupplier" style="color: #1890ff; cursor: pointer; text-decoration: underline;">点此链接</a>创建
                  </span>
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="供货姓名" name="supplierContact" :rules="[{ required: true, message: '请输入供货姓名' }]">
                <a-auto-complete
                  :key="`supplier-contact-${visible}-${formData.supplierName || ''}`"
                  v-model:value="formData.supplierContact"
                  :options="filteredSupplierContactOptions"
                  placeholder="选择或输入供货姓名"
                  style="width: 100%"
                  allow-clear
                  show-search
                  :disabled="!formData.supplierName"
                  @change="(value: string) => { if (value) formRef?.clearValidate(['supplierContact']); handleSupplierContactChange(value) }"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第二行（3个）：开票日期（日期选择框）、开票金额、发票号码 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="开票日期" name="issueDate" :rules="[{ required: true, message: '请选择开票日期' }]">
                <a-date-picker
                  v-model:value="formData.issueDate"
                  placeholder="请选择开票日期"
                  style="width: 100%"
                  format="YYYYMMDD"
                  value-format="YYYY-MM-DD"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="开票金额" name="amount" :rules="[{ required: true, message: '请输入开票金额' }]">
                <a-input-number
                  v-model:value="formData.amount"
                  placeholder="请输入开票金额"
                  style="width: 100%"
                  :min="0"
                  :precision="2"
                  :step="1000"
                  allow-clear
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发票号码" name="invoiceNo" :rules="[{ required: true, message: '请输入发票号码' }]">
                <a-input v-model:value="formData.invoiceNo" placeholder="请输入发票号码" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第三行（2个）：发票类型、发票用途 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item label="发票类型" name="invoiceType">
                <a-button @click="showInvoiceTypeModal = true" class="filter-select-button" :style="{ width: invoiceTypeSelectButtonWidth + 'px' }">
                  <span v-if="formData.invoiceType" class="filter-selected-text">
                    {{ formData.invoiceType }}
                  </span>
                  <span v-else>请选择发票类型</span>
                  <RightOutlined class="filter-select-icon" />
                </a-button>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="发票用途" name="invoicePurpose">
                <a-button @click="showInvoicePurposeModal = true" class="filter-select-button" :style="{ width: invoicePurposeSelectButtonWidth + 'px' }">
                  <span v-if="formData.invoicePurpose" class="filter-selected-text">
                    {{ formData.invoicePurpose }}
                  </span>
                  <span v-else>请选择发票用途</span>
                  <RightOutlined class="filter-select-icon" />
                </a-button>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第四行（1个）：备注 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注"
                name="remark1"
                :label-col="{ span: 2 }"
                :wrapper-col="{ span: 22 }"
              >
                <a-input v-model:value="formData.remark1" placeholder="请输入备注" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        </div>
      </template>
    </upsert-modal>
  </global-modal>
  <!-- 发票类型选择模态框 -->
  <InvoiceTypeSelectModalForForm
    v-model="showInvoiceTypeModal"
    :type-list="props.invoiceTypeList"
    :selected-type-name="formData.invoiceType"
    @ok="handleInvoiceTypeModalOk"
  />

  <!-- 发票用途选择模态框 -->
  <InputInvoicePurposeSelectModalForForm
    v-model="showInvoicePurposeModal"
    :purpose-list="props.invoicePurposeList"
    :selected-purpose-name="formData.invoicePurpose"
    @ok="handleInvoicePurposeModalOk"
  />

  <CompanyFormModal
    v-model="showCompanyFormModal"
    :title="companyFormTitle"
    :form-data="companyFormData"
    :show-next-button="false"
    :show-prev-button="false"
    :show-reset-button="true"
    @ok="handleCompanyFormOk"
  />
  <SupplierEditModal
    v-model="showSupplierFormModal"
    :title="supplierFormTitle"
    :form-data="supplierFormData"
    :show-next-button="false"
    :show-prev-button="false"
    :show-reset-button="true"
    @ok="handleSupplierFormOk"
  />
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed, nextTick, h } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { Modal, message } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, RightOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'
import CompanyFormModal from '@/modal/base/CompanyFormModal.vue'
import SupplierEditModal from '@/modal/supplier/SupplierEditModal.vue'
import InvoiceTypeSelectModalForForm from '@/modal/base/InvoiceTypeSelectModalForForm.vue'
import InputInvoicePurposeSelectModalForForm from '@/modal/base/InputInvoicePurposeSelectModalForForm.vue'
import { listSupplierUsingPost, existsSupplierUsingPost, addSupplierUsingPost, updateSupplierUsingPost, getSupplierCompanyNamesUsingGet, getSupplierNameByCompanyNameUsingPost } from '@/api/gongyingshangguanlijiekou'
import { checkExistsUsingPost, addCompanyUsingPost, listCompanyByPageUsingPost, updateCompanyUsingPost } from '@/api/gongsixinxijiekou'
import { createContactSelectHandler } from '@/hooks/useContactSelect'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface FormData {
  companyId?: number
  companyName?: string
  salespersonId?: number
  supplierId?: number
  issueDate: Dayjs | string | null
  amount: number | undefined
  invoiceNo: string
  invoiceType: string
  invoicePurpose: string
  invoiceStatus: string
  supplierName: string
  supplierContact: string
  remark1: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  companyList: API.Company[]
  employeeList: API.EmployeeVO[]
  invoiceTypeList?: API.InvoiceType_[]
  invoicePurposeList?: API.InvoicePurposeItemVO[]
  formData?: Partial<FormData>
}

const props = withDefaults(defineProps<Props>(), {
  companyList: () => [],
  employeeList: () => [],
  invoiceTypeList: () => [],
  invoicePurposeList: () => [],
  formData: () => ({
    companyId: undefined,
    salespersonId: undefined,
    issueDate: dayjs(),
    amount: undefined,
    invoiceNo: '',
    invoiceType: '',
    invoicePurpose: '',
    invoiceStatus: '',
    supplierName: '',
    supplierContact: '',
    remark1: '',
  }),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: Partial<FormData>, callback: (success: boolean) => void]
  'next': [] // 新增模式的下一条
  'next-edit': [callback: (success: boolean) => void] // 编辑模式的下一条，传递回调函数
  'prev-edit': [callback: (success: boolean) => void] // 编辑模式的上一条，传递回调函数
  'reset': [] // 重置事件
  'supplier-created': [] // 供应商创建成功事件
}>()

const visible = ref(props.modelValue)
const isEditing = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()

// 计算显示的标题（包含序号）
const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

// 关联状态管理
const supplierAssociationStatus = ref<'success' | 'failed' | null>(null)
const supplierAssociationId = ref<number | null>(null)
const supplierActionIcon = computed(() => h(formData.supplierName && supplierAssociationId.value ? EditOutlined : PlusOutlined))
const showSupplierFormModal = ref(false)
const supplierFormTitle = ref('添加供应商')
const supplierFormData = ref<Record<string, any>>({
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
})

const companyAssociationStatus = ref<'success' | 'failed' | null>(null)
const companyAssociationId = ref<number | null>(null)
const companyActionIcon = computed(() => h(formData.companyName && companyAssociationId.value ? EditOutlined : PlusOutlined))
const showCompanyFormModal = ref(false)
const companyFormTitle = ref('添加公司')
const companyFormData = ref<Record<string, any>>({ companyName: '' })

const formData = reactive<FormData>({
  companyId: undefined,
  companyName: '',
  salespersonId: undefined,
  supplierId: undefined,
  issueDate: dayjs(),
  amount: undefined,
  invoiceNo: '',
  invoiceType: '',
  invoicePurpose: '',
  invoiceStatus: '',
  supplierName: '',
  supplierContact: '',
  remark1: '',
})

// 发票类型和发票用途模态框
const showInvoiceTypeModal = ref(false)
const showInvoicePurposeModal = ref(false)

// 计算按钮宽度
const calculateTextWidth = (text: string, minWidth: number = 160, maxWidth: number = 320) => {
  const charWidth = 10
  const padding = 48
  const width = text.length * charWidth + padding
  return Math.max(minWidth, Math.min(maxWidth, width))
}

const invoiceTypeSelectButtonWidth = computed(() => {
  const placeholder = '请选择发票类型'
  if (formData.invoiceType) {
    const contentWidth = calculateTextWidth(formData.invoiceType, 180, 260)
    const placeholderWidth = calculateTextWidth(placeholder, 180, 260)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 180, 260)
})

const invoicePurposeSelectButtonWidth = computed(() => {
  const placeholder = '请选择发票用途'
  if (formData.invoicePurpose) {
    const contentWidth = calculateTextWidth(formData.invoicePurpose, 180, 260)
    const placeholderWidth = calculateTextWidth(placeholder, 180, 260)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 180, 260)
})

// 处理发票类型选择
const handleInvoiceTypeModalOk = (selectedTypeName: string) => {
  formData.invoiceType = selectedTypeName
  // 确保 formRef.value 存在且有 clearValidate 方法（Antd Form 实例）
  if (formRef.value && typeof formRef.value.clearValidate === 'function') {
    formRef.value.clearValidate(['invoiceType'])
  }
}

// 处理发票用途选择
const handleInvoicePurposeModalOk = (selectedPurposeName: string) => {
  formData.invoicePurpose = selectedPurposeName
  if (formRef.value && typeof formRef.value.clearValidate === 'function') {
    formRef.value.clearValidate(['invoicePurpose'])
  }
}

// 将关联出来的供应商ID写回表单数据，供父组件提交时直接传入
watch(supplierAssociationId, (id) => {
  formData.supplierId = id ?? undefined
})

// 公司名称自动完成选项（使用通用 composable）
const companyOptions = computed(() => {
  return props.companyList.map(company => ({
    value: company.companyName || '',
    label: company.companyName || '',
  }))
})

const companyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: companyOptions,
  currentValue: computed(() => formData.companyName || ''),
  enableAutoAdd: true,
})

// 过滤后的公司名称选项
const filteredCompanyOptions = companyAutoComplete.filteredOptions

// 处理公司名称变化
const handleCompanyNameChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  companyAutoComplete.handleChange(value)
  
  // 如果值不为空，清除该字段的验证错误
  if (value) {
    formRef.value?.clearValidate(['companyName'])
  }
  if (value) {
    const company = props.companyList.find(c => c.companyName === value)
    if (company) {
      formData.companyId = company.id
    } else {
      formData.companyId = undefined
    }
  } else {
    formData.companyId = undefined
    // 清空公司关联状态
    companyAssociationStatus.value = null
    companyAssociationId.value = null
  }
}

// 检查公司关联状态
const checkCompanyAssociation = async (companyName: string) => {
  if (!companyName) {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    return
  }
  try {
    const res = await checkExistsUsingPost({
      companyName,
    }) as any
    if (res.data.code === 0 && res.data.data && res.data.data.exists) {
      companyAssociationStatus.value = 'success'
      companyAssociationId.value = res.data.data.id || null
      // 如果关联成功，更新 companyId
      if (res.data.data.id) {
        formData.companyId = res.data.data.id
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

// 公司名称失去焦点时验证
const handleCompanyNameBlur = () => {
  if (formData.companyName) {
    checkCompanyAssociation(formData.companyName as string)
  } else {
    companyAssociationStatus.value = null
    companyAssociationId.value = null
  }
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
          companyName: (formData.companyName || '') as string,
        })) as any

        if (res.data.code === 0) {
          message.success('公司创建成功')
          // 重新验证
          await checkCompanyAssociation((formData.companyName || '') as string)
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
  const canEdit = !!(formData.companyName && companyAssociationId.value)
  companyFormTitle.value = canEdit ? '编辑公司' : '添加公司'
  if (canEdit) {
    await loadCompanyDetail(formData.companyName!, companyAssociationId.value!)
  } else {
    companyFormData.value = { companyName: formData.companyName || '' }
  }
  showCompanyFormModal.value = true
}

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
    formData.companyName = companyName
    await checkCompanyAssociation(companyName)
    // 使用 composable 的 addExtraItem 添加项到下拉列表
    companyAutoComplete.addExtraItem(companyName)
    // 公司已回填，清掉"请选择公司名称"的校验提示
    formRef.value?.clearValidate?.(['companyName'])
    message.success(`公司${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理公司表单保存失败', error)
    callback(false)
  }
}

// 所有供货单位列表（从API获取）
const allSupplierCompanyList = ref<string[]>([])

// 获取所有供货单位列表
const fetchAllSupplierCompanies = async () => {
  try {
    const res = await getSupplierCompanyNamesUsingGet()
    if (res?.data?.code === 0 && res?.data?.data) {
      const names: string[] = res.data.data || []
      allSupplierCompanyList.value = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n)))
    } else allSupplierCompanyList.value = []
  } catch (error) {
    console.error('获取所有供货单位列表失败', error)
    allSupplierCompanyList.value = []
  }
}

// 供货单位自动完成选项（使用通用 composable）
const supplierCompanyOptions = computed(() => {
  return allSupplierCompanyList.value.map(companyName => ({
    value: companyName,
    label: companyName,
  }))
})

const supplierCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: supplierCompanyOptions,
  currentValue: computed(() => formData.supplierName || ''),
  enableAutoAdd: true,
})

// 过滤后的供货单位选项
const filteredSupplierCompanyOptions = supplierCompanyAutoComplete.filteredOptions

// 供货联系人名称列表
const contactNameList = ref<string[]>([])

// 供货姓名自动完成选项（使用通用 composable）
const supplierContactOptions = computed(() => {
  return contactNameList.value.map(name => ({
    value: name,
    label: name,
  }))
})

const supplierContactAutoComplete = useAutoCompleteWithExtra({
  baseOptions: supplierContactOptions,
  currentValue: computed(() => formData.supplierContact || ''),
  enableAutoAdd: true,
})

// 过滤后的供货姓名选项
const filteredSupplierContactOptions = supplierContactAutoComplete.filteredOptions

// 获取供货联系人列表
const fetchContactNameList = async (companyName: string) => {
  const name = (companyName || '').trim()
  if (!name) {
    contactNameList.value = []
    return
  }

  try {
    const res = (await getSupplierNameByCompanyNameUsingPost({ companyName: name } as any)) as any
    if (res?.data?.code === 0 && res?.data?.data) {
      const rows: API.UserNameByCompanyNameVo[] = res.data.data || []
      const names = rows.map((r) => (r?.userName || '').trim()).filter((n) => !!n)
      contactNameList.value = Array.from(new Set(names))
    } else contactNameList.value = []
  } catch (error) {
    console.error('获取供货联系人列表失败', error)
    contactNameList.value = []
  }
}

// 处理供货单位选择
const handleSupplierCompanySelect = createContactSelectHandler({
  fetchContactList: fetchContactNameList,
  getContactList: () => contactNameList.value,
  getCurrentContact: () => formData.supplierContact,
  setContact: (val: string) => {
    formData.supplierContact = val
  },
  clearContactList: () => {
    contactNameList.value = []
  },
  clearAssociation: () => {
    supplierAssociationStatus.value = null
    supplierAssociationId.value = null
  },
  checkAssociation: async (companyName: string, contactName: string) => {
    await checkSupplierAssociation(companyName, contactName)
  },
})

// 检查供应商关联状态
const checkSupplierAssociation = async (companyName: string, supplierName: string) => {
  if (!companyName || !supplierName) {
    supplierAssociationStatus.value = null
    supplierAssociationId.value = null
    return
  }
  try {
    const res = await existsSupplierUsingPost({
      companyName,
      supplierName,
    }) as any
    if (res.data.code === 0 && res.data.data && res.data.data.exists) {
      supplierAssociationStatus.value = 'success'
      // 后端 supplierId 为 number[]，这里做归一化
      const sid = res.data.data.supplierId
      supplierAssociationId.value = (Array.isArray(sid) ? sid[0] : sid) || null
    } else {
      supplierAssociationStatus.value = 'failed'
      supplierAssociationId.value = null
    }
  } catch (error) {
    console.error('检查供应商关联失败', error)
    supplierAssociationStatus.value = 'failed'
    supplierAssociationId.value = null
  }
}

// 处理供货单位变化（输入时）
const handleSupplierCompanyChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  supplierCompanyAutoComplete.handleChange(value)
  
  // 如果值不为空，清除该字段的验证错误
  if (value) {
    formRef.value?.clearValidate(['supplierName'])
    // 检查是否是列表中的选项
    const exists = supplierCompanyOptions.value.some(opt => opt.value === value)
    if (exists) {
      await handleSupplierCompanySelect(value)
    } else {
      // 如果输入的是新值，清空联系人
      contactNameList.value = []
      formData.supplierContact = ''
      supplierAssociationStatus.value = null
      supplierAssociationId.value = null
    }
  } else {
    contactNameList.value = []
    formData.supplierContact = ''
    supplierAssociationStatus.value = null
    supplierAssociationId.value = null
  }
}

// 处理供货姓名变化
const handleSupplierContactChange = async (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  supplierContactAutoComplete.handleChange(value)
  
  if (value && formData.supplierName) {
    await checkSupplierAssociation(formData.supplierName, value)
  } else {
    supplierAssociationStatus.value = null
    supplierAssociationId.value = null
  }
}

const loadSupplierDetail = async (id: number, fallbackCompany: string, fallbackName: string) => {
  try {
    const res = (await listSupplierUsingPost({
      current: 1,
      pageSize: 1,
      id,
    } as any)) as any
    const record = res?.data?.data?.records?.[0]
    if (record) {
      supplierFormData.value = {
        id: record.id,
        companyName: record.companyName || fallbackCompany,
        supplierName: record.supplierName || fallbackName,
        supplierPhone: record.supplierPhone || '',
        taxNo: record.taxNo || '',
        legalPerson: record.legalPerson || '',
        registerPhone: record.registerPhone || '',
        registerAddress: record.registerAddress || '',
        email: record.email || '',
        wechat: record.remark2 || '',
        bankName: record.bankName || '',
        bankAccount: record.bankAccount || '',
        businessScope: record.businessScope || '',
        remark1: record.remark1 || '',
      }
      return
    }
  } catch (error) {
    console.error('加载供应商详情失败', error)
  }
  supplierFormData.value = {
    id,
    companyName: fallbackCompany,
    supplierName: fallbackName,
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
  }
}

const handleSupplierAction = async () => {
  if (formData.supplierName && !supplierAssociationStatus.value) {
    await checkSupplierAssociation(formData.supplierName, formData.supplierContact || '')
  }
  const canEdit = !!(formData.supplierName && supplierAssociationId.value)
  supplierFormTitle.value = canEdit ? '编辑供应商' : '添加供应商'
  if (canEdit) {
    await loadSupplierDetail(supplierAssociationId.value!, formData.supplierName || '', formData.supplierContact || '')
  } else {
    supplierFormData.value = {
      companyName: formData.supplierName || '',
      supplierName: formData.supplierContact || '',
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
    }
  }
  showSupplierFormModal.value = true
}

const handleSupplierFormOk = async (data: any, callback: (success: boolean) => void) => {
  try {
    const companyName = (data?.companyName || '').trim()
    const supplierName = (data?.supplierName || '').trim()
    if (!companyName || !supplierName) {
      message.warning('请填写供货单位和供货姓名')
      callback(false)
      return
    }
    // 与供应商管理保持一致：wechat → remark2
    const submitData: any = { ...data, companyName, supplierName }
    if (submitData.wechat !== undefined) {
      submitData.remark2 = submitData.wechat
      delete submitData.wechat
    }
    // 归一化 id：避免出现后端/组件传回 number[] 导致 update 传入“id列表”
    const normalizedId = Array.isArray(data?.id) ? data.id[0] : data?.id
    if (normalizedId !== undefined) {
      submitData.id = normalizedId
    }
    const isEdit = !!normalizedId
    const res = (await (isEdit
      ? updateSupplierUsingPost(submitData as API.SupplierUpdateDTO)
      : addSupplierUsingPost(submitData as API.SupplierAddDTO)
    )) as any
    if (res?.data?.code !== 0) {
      message.error(`供应商${isEdit ? '更新' : '添加'}失败：` + (res?.data?.message || ''))
      callback(false)
      return
    }
    callback(true)
    formData.supplierName = companyName
    formData.supplierContact = supplierName
    supplierAssociationStatus.value = 'success'
    supplierAssociationId.value = isEdit ? data.id || supplierAssociationId.value : (res?.data?.data ? Number(res.data.data) : supplierAssociationId.value)
    await checkSupplierAssociation(companyName, supplierName)
    if (!allSupplierCompanyList.value.includes(companyName)) {
      allSupplierCompanyList.value = [...allSupplierCompanyList.value, companyName]
    }
    // 使用 composable 的 addExtraItem 添加项到下拉列表
    supplierCompanyAutoComplete.addExtraItem(companyName)
    supplierContactAutoComplete.addExtraItem(supplierName)
    message.success(`供应商${isEdit ? '更新' : '添加'}成功`)
  } catch (error) {
    console.error('处理供应商表单保存失败', error)
    callback(false)
  }
}

// 创建供应商
const handleCreateSupplier = () => {
  Modal.confirm({
    title: '创建供应商信息',
    content: `是否要创建供货单位"${formData.supplierName}"-供货姓名"${formData.supplierContact}"的供应商信息？`,
    onOk: async () => {
      try {
        const res = await addSupplierUsingPost({
          companyName: formData.supplierName,
          supplierName: formData.supplierContact,
        }) as any
        if (res.data.code === 0) {
          message.success('供应商信息创建成功')
          await checkSupplierAssociation(formData.supplierName, formData.supplierContact)
          emit('supplier-created')
        } else {
          message.error(res.data.message || '创建失败')
        }
      } catch (error) {
        console.error('创建供应商失败', error)
        message.error('创建供应商失败')
      }
    },
  })
}

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 当模态框打开时，先获取所有供货单位列表
    await fetchAllSupplierCompanies()

    // 当模态框打开时，更新表单数据
    if (props.formData && props.formData.invoiceNo) {
      // 编辑模式：有发票号码说明是编辑
      isEditing.value = true
      Object.assign(formData, {
        companyId: props.formData.companyId,
        companyName: props.formData.companyName || '',
        salespersonId: props.formData.salespersonId,
        issueDate: props.formData.issueDate ? (typeof props.formData.issueDate === 'string' ? dayjs(props.formData.issueDate) : props.formData.issueDate) : dayjs(),
        amount: props.formData.amount,
        invoiceNo: props.formData.invoiceNo || '',
        invoiceType: props.formData.invoiceType || '',
        invoicePurpose: props.formData.invoicePurpose || '',
        invoiceStatus: props.formData.invoiceStatus || '',
        supplierName: props.formData.supplierName || '',
        supplierContact: props.formData.supplierContact || '',
        remark1: props.formData.remark1 || '',
      })
      // 同步更新复选框状态
      // 等待 DOM 更新，确保 upsertModalRef 已经准备好
      await nextTick()
      // 重置按钮状态（编辑模式下，保存、上一条、下一条都可用）
      upsertModalRef.value?.resetButtonState()
      // 如果选择了供货单位，加载联系人列表并检查关联状态
      if (props.formData.supplierName) {
        await handleSupplierCompanySelect(props.formData.supplierName)
        if (props.formData.supplierContact) {
          await checkSupplierAssociation(props.formData.supplierName, props.formData.supplierContact)
        }
      }
      // 如果选择了公司名称，更新companyId
      if (props.formData.companyName) {
        handleCompanyNameChange(props.formData.companyName)
      }
    } else {
      // 新增模式：初始化状态机
      isEditing.value = false
      // 如果 props.formData 有值，保留这些值（用于下一条功能）
      if (props.formData && Object.keys(props.formData).length > 0) {
        // 保留现有数据，只更新缺失的字段
        Object.assign(formData, {
          companyId: props.formData.companyId,
          companyName: props.formData.companyName || '',
          salespersonId: props.formData.salespersonId,
          issueDate: props.formData.issueDate ? (typeof props.formData.issueDate === 'string' ? dayjs(props.formData.issueDate) : props.formData.issueDate) : dayjs(),
          amount: props.formData.amount,
          invoiceNo: props.formData.invoiceNo || '',
          invoiceType: props.formData.invoiceType || '',
          invoicePurpose: props.formData.invoicePurpose || '',
          invoiceStatus: props.formData.invoiceStatus || '',
          supplierName: props.formData.supplierName || '',
          supplierContact: props.formData.supplierContact || '',
          remark1: props.formData.remark1 || '',
        })
        // 如果选择了供货单位，加载联系人列表并检查关联状态
        if (props.formData.supplierName) {
          await handleSupplierCompanySelect(props.formData.supplierName)
          if (props.formData.supplierContact) {
            await checkSupplierAssociation(props.formData.supplierName, props.formData.supplierContact)
          }
        }
        // 如果选择了公司名称，更新companyId并验证
        if (props.formData.companyName) {
          handleCompanyNameChange(props.formData.companyName)
          await checkCompanyAssociation(props.formData.companyName)
        }
      } else {
        // 完全清空表单
        Object.assign(formData, {
          companyId: undefined,
          companyName: '',
          salespersonId: undefined,
          issueDate: dayjs(),
          amount: undefined,
          invoiceNo: '',
          invoiceType: '',
          invoicePurpose: '',
          invoiceStatus: '',
        })
        Object.assign(formData, {
          supplierName: '',
          supplierContact: '',
          remark1: '',
        })
        contactNameList.value = []
        supplierAssociationStatus.value = null
        supplierAssociationId.value = null
        companyAssociationStatus.value = null
        companyAssociationId.value = null
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
      companyId: undefined,
      companyName: '',
      salespersonId: undefined,
      supplierId: undefined,
      issueDate: dayjs(),
      amount: undefined,
      invoiceNo: '',
      invoiceType: '',
      invoicePurpose: '',
      invoiceStatus: '',
      supplierName: '',
      supplierContact: '',
      remark1: '',
    })
    contactNameList.value = []
    allSupplierCompanyList.value = []
    supplierAssociationStatus.value = null
    supplierAssociationId.value = null
    companyAssociationStatus.value = null
    companyAssociationId.value = null
    isEditing.value = false
    upsertModalRef.value?.resetButtonState()
  }
})

watch(() => props.formData, async (newFormData) => {
  if (visible.value && newFormData) {
    // 如果模态框已打开且是编辑模式，更新表单数据
    if (newFormData.invoiceNo) {
      // 确保编辑状态正确
      isEditing.value = true
      Object.assign(formData, {
        companyId: newFormData.companyId,
        companyName: newFormData.companyName || '',
        salespersonId: newFormData.salespersonId,
        issueDate: newFormData.issueDate ? (typeof newFormData.issueDate === 'string' ? dayjs(newFormData.issueDate) : newFormData.issueDate) : dayjs(),
        amount: newFormData.amount,
        invoiceNo: newFormData.invoiceNo || '',
        invoiceType: newFormData.invoiceType || '',
        invoicePurpose: newFormData.invoicePurpose || '',
        invoiceStatus: newFormData.invoiceStatus || '',
        supplierName: newFormData.supplierName || '',
        supplierContact: newFormData.supplierContact || '',
        remark1: newFormData.remark1 || '',
      })
      // 同步更新复选框状态
      // 如果供货单位发生变化，重新加载联系人列表并检查关联状态
      if (newFormData.supplierName) {
        await handleSupplierCompanySelect(newFormData.supplierName)
        if (newFormData.supplierContact) {
          await checkSupplierAssociation(newFormData.supplierName, newFormData.supplierContact)
        }
      }
      // 如果选择了公司名称，更新companyId
      if (newFormData.companyName) {
        handleCompanyNameChange(newFormData.companyName)
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

// 下一条按钮处理（编辑模式）
const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('prev-edit', callback)
}

const handleReset = () => {
  // 重置表单到初始状态
  formRef.value?.resetFields()
  // 重置表单数据
  if (isEditing.value) {
    // 编辑模式：重置为当前编辑的数据
    if (props.formData && props.formData.invoiceNo) {
      Object.assign(formData, {
        companyId: props.formData.companyId,
        salespersonId: props.formData.salespersonId,
        issueDate: props.formData.issueDate ? (typeof props.formData.issueDate === 'string' ? dayjs(props.formData.issueDate) : props.formData.issueDate) : dayjs(),
        amount: props.formData.amount,
        invoiceNo: props.formData.invoiceNo || '',
        invoiceType: props.formData.invoiceType || '',
        invoicePurpose: props.formData.invoicePurpose || '',
        invoiceStatus: props.formData.invoiceStatus || '',
        supplierName: props.formData.supplierName || '',
        supplierContact: props.formData.supplierContact || '',
        remark1: props.formData.remark1 || '',
      })
      // 同步更新复选框状态
      // 如果选择了供货单位，重新加载联系人列表
      if (props.formData.supplierName) {
        handleSupplierCompanySelect(props.formData.supplierName)
      }
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
      companyId: undefined,
      salespersonId: undefined,
      issueDate: dayjs(),
      amount: undefined,
      invoiceNo: '',
      invoiceType: '',
      invoicePurpose: '',
      invoiceStatus: '',
      supplierName: '',
      supplierContact: '',
      remark1: '',
    })
    contactNameList.value = []
  }
  // 清除验证状态
  formRef.value?.clearValidate()
  // 清空关联状态，避免保留重置前的关联提示
  supplierAssociationStatus.value = null
  supplierAssociationId.value = null
  companyAssociationStatus.value = null
  companyAssociationId.value = null
  // 重置按钮状态
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
@import '@/styles/form-modal.css';
</style>

