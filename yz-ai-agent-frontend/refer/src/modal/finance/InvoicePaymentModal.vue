<template>
  <global-modal
    v-model="visible"
    :title="modalTitle"
    width="90vw"
    :body-style="{ padding: '16px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden' }"
    wrap-class-name="invoice-payment-modal-wrap"
    :mask-closable="false"
    :keyboard="true"
  >
    <div>
      <!-- 筛选框 -->
      <a-card size="small" class="filter-container" style="margin-bottom: 16px;">
        <a-row :gutter="[16, 16]">
          <a-col :span="6">
            <a-form-item label="客户单位" class="filter-form-item">
              <a-auto-complete
                v-model:value="searchParams.clientCompanyName"
                :options="filteredClientCompanyOptions"
                placeholder="选择或输入客户单位"
                allow-clear
                class="customer-company-input"
                style="width: 100%"
                :filter-option="false"
                @change="clientCompanyAutoComplete.handleChange"
                @search="clientCompanyAutoComplete.handleChange"
                @focus="updateClientCompanyOptions"
                @clear="updateClientCompanyOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="公司账号" class="filter-form-item">
              <a-auto-complete
                v-model:value="searchParams.accountNumber"
                :options="filteredAccountNumberOptions"
                placeholder="选择或输入公司账号"
                allow-clear
                class="account-number-input"
                :filter-option="false"
                @change="accountNumberAutoComplete.handleChange"
                @search="accountNumberAutoComplete.handleChange"
                @focus="updateAccountNumberOptions"
                @clear="updateAccountNumberOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="到款金额" class="filter-form-item">
              <a-input-number
                v-model:value="searchParams.amount"
                placeholder="输入到款金额"
                :precision="2"
                :min="0"
                allow-clear
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <div class="filter-actions" style="margin-top: 16px;">
          <div class="filter-actions-buttons">
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <template #icon><SearchOutlined /></template>
                查询
              </a-button>
              <a-button class="btn-grey" @click="handleReset">
                <template #icon><DeleteOutlined /></template>
                清空
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>

      <!-- 银行收支信息展示 -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">{{ paymentType === 'in' ? '收款信息' : '付款信息' }}：</div>
        <a-table
          :columns="bankTransactionColumns"
          :data-source="displayedBankTransactions"
          :pagination="false"
          size="small"
          bordered
          :loading="bankTransactionLoading"
          :scroll="{ y: 224 }"
          :row-selection="rowSelectionConfig"
          :row-key="(record: API.BankTransaction_) => String(record.id || 0)"
          :customRow="customBankRow"
          @change="handleBankTableChange"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'serialNo'">
              {{ index + 1 }}
            </template>
            <template v-else-if="column.dataIndex === 'arrivalTime'">
              {{ formatDate(record.arrivalTime) }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span :style="{ color: (record.amount || 0) < 0 ? '#ff4d4f' : '#1890ff' }">
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'balance'">
              <span style="color: #1890ff; font-weight: 600;">
                {{ (record.balance || 0).toFixed(2) }}
              </span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 银行收支摘要信息（默认展示，未选中显示 -） -->
      <div style="margin-bottom: 20px;">
        <a-card size="small" style="background: #f5f5f5;">
          <a-row :gutter="[16, 8]" justify="space-around" align="middle">
            <a-col :span="6" style="text-align: center;">
              <span style="color: #666;">已入账金额：</span>
              <span style="color: #52c41a; font-weight: 600; margin-left: 8px;">
                {{ bankUsedAmountText }}
              </span>
            </a-col>
            <a-col :span="6" style="text-align: center;">
              <span style="color: #666;">待入账金额：</span>
              <span style="color: #1890ff; font-weight: 600; margin-left: 8px;">
                {{ bankRemainingAmountText }}
              </span>
            </a-col>
            <a-col :span="6" style="text-align: center;">
              <span style="color: #666;">可入账金额：</span>
              <span style="color: #1890ff; font-weight: 600; margin-left: 8px;">
                {{ bankBalanceText }}
              </span>
            </a-col>
            <a-col :span="6" style="text-align: center;">
              <span style="color: #666;">业务经理：</span>
              <span style="margin-left: 8px;">
                {{ bankSalespersonText }}
              </span>
            </a-col>
          </a-row>
        </a-card>
      </div>

      <!-- 发票信息表格 -->
      <div>
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">发票信息：</div>
        <a-table
          :columns="invoiceColumns"
          :data-source="invoiceList"
          :pagination="false"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'paymentAmount'">
              <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                <a-input-number
                  v-model:value="record.paymentAmount"
                  :precision="2"
                  :min="0"
                  :max="getPaymentAmountMax(record)"
                  class="payment-amount-input"
                  :placeholder="paymentType === 'in' ? '输入收款金额' : '输入付款金额'"
                />
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span style="color: #1890ff; font-weight: 500;">
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'amountDue'">
              <span
                :style="{
                  color: (record.amountDue || 0) === 0 ? '#52c41a' : '#ff4d4f',
                  fontWeight: 500,
                }"
              >
                {{ (record.amountDue || 0).toFixed(2) }}
              </span>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="white-space: nowrap;">{{ paymentType === 'in' ? '入账' : '出账' }}业务经理：</span>
          <a-auto-complete
            v-model:value="paymentSalespersonName"
            :options="filteredPaymentSalespersonOptions"
            allow-clear
            placeholder="选择业务经理"
            style="min-width: 200px; text-align: left;"
            class="salesperson-auto-complete"
            :dropdown-match-select-width="false"
            @select="handleSalespersonSelect"
            @change="handlePaymentSalespersonInput"
          />
        </div>
        <div style="display: flex; gap: 8px;">
          <a-button class="btn-grey" @click="handleClose">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <a-button type="primary" @click="handleSubmit" :disabled="!canSubmit">
            <template #icon><CheckOutlined /></template>
            {{ paymentType === 'in' ? '入账' : '出账' }}
          </a-button>
        </div>
      </div>
    </template>
  </global-modal>

  <!-- 确认框 -->
  <a-modal
    v-model:open="confirmModalVisible"
    :title="confirmModalTitle"
    width="800px"
    @ok="handleConfirmSubmit"
    @cancel="confirmModalVisible = false"
  >
    <!-- 银行收支信息 -->
    <div v-if="selectedBankTransaction" style="margin-bottom: 16px;">
      <a-card size="small" style="background: #f5f5f5;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">银行收支信息：</div>
        <a-descriptions :column="2" size="small" bordered>
          <!-- 第一行：到款日期、到款金额 -->
          <a-descriptions-item label="到款日期">
            {{ formatDate(selectedBankTransaction.arrivalTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="到款金额">
            <span :style="{ color: (selectedBankTransaction.amount || 0) < 0 ? '#ff4d4f' : '#1890ff' }">
              {{ (selectedBankTransaction.amount || 0).toFixed(2) }}
            </span>
          </a-descriptions-item>
          <!-- 第二行：已到账金额、待入账金额 -->
          <a-descriptions-item label="已到账金额">
            <span style="color: #52c41a; font-weight: 600;">
              {{ (bankTransactionInfo?.usedAmount || 0).toFixed(2) }}
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="待入账金额">
            <span style="color: #1890ff; font-weight: 600;">
              {{ (bankTransactionInfo?.remainingAmount || 0).toFixed(2) }}
            </span>
          </a-descriptions-item>
          <!-- 第三行：客户单位、账号（remark2） -->
          <a-descriptions-item label="客户单位">
            {{ selectedBankTransaction.clientCompanyName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="账号">
            {{ selectedBankTransaction.remark2 || '-' }}
          </a-descriptions-item>
          <!-- 第四行：公司名称、公司账号（remark3） -->
          <a-descriptions-item label="公司名称">
            {{ selectedBankTransaction.companyName || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="公司账号">
            {{ selectedBankTransaction.remark3 || '-' }}
          </a-descriptions-item>
          <!-- 第五行：备注（remark1）、业务经理 -->
          <a-descriptions-item label="备注">
            {{ selectedBankTransaction.remark1 || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="业务经理">
            {{ selectedBankTransaction.salespersonName || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>
    </div>

    <!-- 发票信息 -->
    <div>
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">发票信息：</div>
      <a-table
        :columns="confirmColumns"
        :data-source="invoiceList"
        :pagination="false"
        size="small"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'amount'">
            <span style="color: #1890ff; font-weight: 500;">
              {{ (record.amount || 0).toFixed(2) }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'amountDue'">
            <span
              :style="{
                color: (record.amountDue || 0) === 0 ? '#52c41a' : '#ff4d4f',
                fontWeight: 500,
              }"
            >
              {{ (record.amountDue || 0).toFixed(2) }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'paymentAmount'">
            {{ (record.paymentAmount || 0).toFixed(2) }}
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { SearchOutlined, DeleteOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import dayjs from 'dayjs'
import { Modal, message } from 'ant-design-vue'
import { listTransactionByPageUsingPost, queryBankTransactionWithremainAmountUsingPost } from '@/api/caiwuguanlijiekou'
import { addPaymentUsingPost } from '@/api/fapiaoxinxiguanli'
import { addInputPaymentUsingPost } from '@/api/caiwuguanlijiekou'
import { getAllEmployeeBasicInfoUsingGet, getLoginUserUsingGet } from '@/api/yuangongguanlijiekou'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  modelValue: boolean
  paymentType: 'in' | 'out' // 'in' 表示入账（销项发票），'out' 表示出账（进项发票）
  selectedInvoices: API.InvoiceItem[] // 选中的发票列表
}

const props = withDefaults(defineProps<Props>(), {
  selectedInvoices: () => [],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'ok'): void
}>()

const visible = ref(false)
const confirmModalVisible = ref(false)
const bankTransactionLoading = ref(false)

const modalTitle = computed(() => {
  return props.paymentType === 'in' ? '发票入账' : '发票出账'
})

const confirmModalTitle = computed(() => {
  return `确认${props.paymentType === 'in' ? '入账' : '出账'}信息`
})

// 银行收支列表
const bankTransactionList = ref<API.BankTransaction_[]>([])
const filteredBankTransactions = ref<API.BankTransaction_[]>([])

// 筛选参数
const searchParams = ref({
  clientCompanyName: '',
  accountNumber: '',
  amount: null as number | null,
})

// 发票列表（带可编辑字段）
const invoiceList = ref<Array<API.InvoiceItem & { paymentAmount: number; remark: string }>>([])

// 银行收支记录详细信息
const bankTransactionInfo = ref<API.BankTransactionRemainingAmountVO_ | null>(null)

// 选中的银行收支记录ID（使用字符串数组，因为row-key返回字符串）
const selectedBankTransactionIds = ref<(string | number)[]>([])

// 排序状态：银行收支表
const bankSortState = ref<{ field?: string; order?: 'ascend' | 'descend' }>({})

// 当前选中的银行收支ID（统一用这个做联动，保证每次切换都能更新 bankTransactionInfo）
const selectedBankTransactionId = computed<number | null>(() => {
  if (selectedBankTransactionIds.value.length === 0) return null
  const id = Number(selectedBankTransactionIds.value[0])
  return id > 0 ? id : null
})

// 处理银行收支记录选择变化
const handleBankTransactionSelectionChange = async (selectedRowKeys: (string | number)[]) => {
  selectedBankTransactionIds.value = selectedRowKeys
}

// 更新发票列表的默认收款金额
const updateInvoicePaymentAmounts = () => {
  if (!selectedBankTransaction.value || !bankTransactionInfo.value) {
    return
  }

  // 获取待入账金额（银行收支余额）
  const remainingAmount = Math.abs(bankTransactionInfo.value.remainingAmount || 0)

  // 更新每个发票的收款金额
  invoiceList.value.forEach(inv => {
    // 如果当前收款金额为0或者是默认的应收金额，则更新为银行收支余额和应收金额的较小值
    // 否则保持用户已输入的值
    const currentAmount = inv.paymentAmount || 0
    const defaultAmount = (inv as any).amountDue || 0

    // 如果当前金额等于默认应收金额或者是0，则更新为银行收支余额和应收金额的较小值
    if (currentAmount === defaultAmount || currentAmount === 0) {
      // 取银行收支余额和应收金额的较小值
      inv.paymentAmount = Math.min(remainingAmount, defaultAmount)
    }
  })
}

// 获取收款金额的最大值（银行收支余额和发票开票金额的较小值）
const getPaymentAmountMax = (record: API.InvoiceItem & { paymentAmount: number; remark: string }) => {
  if (!bankTransactionInfo.value) {
    return (record as any).amountDue || 0
  }
  const remainingAmount = Math.abs(bankTransactionInfo.value.remainingAmount || 0)
  const invoiceAmount = record.amount || 0
  return Math.min(remainingAmount, invoiceAmount, (record as any).amountDue || 0)
}

// 点击整行选中（radio：只选中不反选）
const handleRowClick = (record: API.BankTransaction_) => {
  const id = String(record.id || 0)
  if (id !== '0') {
    selectedBankTransactionIds.value = [id]
  }
}

// Ant Design Vue 表格行事件：customRow
const customBankRow = (record: API.BankTransaction_) => {
  return {
    onClick: () => handleRowClick(record),
  }
}

// 选中银行收支变化时：双向绑定更新 bankTransactionInfo，并联动更新默认收款金额
watch(
  selectedBankTransactionId,
  async (id) => {
    if (!id) {
      bankTransactionInfo.value = null
      return
    }
    await fetchBankTransactionInfo(id)
    updateInvoicePaymentAmounts()
  },
  { immediate: false },
)

// 获取银行收支记录详细信息
const fetchBankTransactionInfo = async (bankTransactionId: number) => {
  try {
    const res = (await queryBankTransactionWithremainAmountUsingPost({
      bankTransactionId,
    })) as any

    if (res.data.code === 0 && res.data.data) {
      bankTransactionInfo.value = res.data.data
    } else {
      bankTransactionInfo.value = null
      message.error('获取银行收支记录信息失败')
    }
  } catch (error) {
    console.error('获取银行收支记录信息失败', error)
    bankTransactionInfo.value = null
  }
}

// 银行收支摘要展示（默认 -）
const bankUsedAmountText = computed(() => {
  if (!bankTransactionInfo.value) return '-'
  return Number(bankTransactionInfo.value.usedAmount || 0).toFixed(2)
})
const bankRemainingAmountText = computed(() => {
  if (!bankTransactionInfo.value) return '-'
  return Number(bankTransactionInfo.value.remainingAmount || 0).toFixed(2)
})
const bankSalespersonText = computed(() => {
  return selectedBankTransaction.value?.salespersonName || '-'
})
const bankBalanceText = computed(() => {
  if (!selectedBankTransaction.value) return '-'
  return Number(selectedBankTransaction.value.balance || 0).toFixed(2)
})

// 银行收支表格列
const bankTransactionColumns = [
  { title: '序号', dataIndex: 'serialNo', key: 'serialNo', width: 70, align: 'center' },
  { title: '到款日期', dataIndex: 'arrivalTime', key: 'arrivalTime', width: 120, align: 'center', sorter: true },
  { title: '到款金额', dataIndex: 'amount', key: 'amount', width: 160, align: 'right', sorter: true },
  { title: '待入账金额', dataIndex: 'balance', key: 'balance', width: 120, align: 'right', sorter: true },
  { title: '客户单位', dataIndex: 'clientCompanyName', key: 'clientCompanyName', width: 200, sorter: true },
  { title: '账号', dataIndex: 'remark2', key: 'remark2', width: 150, sorter: true },
  { title: '公司账号', dataIndex: 'remark3', key: 'remark3', width: 200, sorter: true },
  { title: '备注', dataIndex: 'remark1', key: 'remark1', width: 200, sorter: true },
]

const normalizeSorterOrder = (order: any): 'ascend' | 'descend' | undefined => {
  return order === 'ascend' || order === 'descend' ? order : undefined
}

const handleBankTableChange = (_pagination: any, _filters: any, sorter: any) => {
  const s = Array.isArray(sorter) ? sorter[0] : sorter
  bankSortState.value = {
    field: s?.field || s?.columnKey,
    order: normalizeSorterOrder(s?.order),
  }
}

const compareByField = (a: any, b: any, field?: string) => {
  if (!field) return 0
  const av = a?.[field]
  const bv = b?.[field]

  if (field === 'arrivalTime') {
    const at = av ? dayjs(av).valueOf() : 0
    const bt = bv ? dayjs(bv).valueOf() : 0
    return at - bt
  }

  if (field === 'amount' || field === 'balance') {
    return Number(av || 0) - Number(bv || 0)
  }

  return String(av || '').localeCompare(String(bv || ''), 'zh-Hans-CN')
}

const displayedBankTransactions = computed(() => {
  const list = [...filteredBankTransactions.value]
  const { field, order } = bankSortState.value
  if (!field || !order) return list
  const dir = order === 'ascend' ? 1 : -1
  return list.sort((a, b) => dir * compareByField(a, b, field))
})

// 发票表格列
const invoiceColumns = computed(() => {
  const isIn = props.paymentType === 'in'
  const companyTitle = isIn ? '客户名称' : '供货单位'
  const companyDataIndex = isIn ? 'clientCompanyName' : 'supplierName'
  return [
    { title: '发票编号', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 150, align: 'center' },
    { title: companyTitle, dataIndex: companyDataIndex, key: companyDataIndex, width: 200 },
    { title: '开票金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
    { title: '应收金额', dataIndex: 'amountDue', key: 'amountDue', width: 120, align: 'right' },
    { title: isIn ? '收款金额' : '付款金额', dataIndex: 'paymentAmount', key: 'paymentAmount', width: 100, align: 'center' },
  ]
})

// 确认框表格列
const confirmColumns = computed(() => {
  const isIn = props.paymentType === 'in'
  const companyTitle = isIn ? '客户名称' : '供货单位'
  const companyDataIndex = isIn ? 'clientCompanyName' : 'supplierName'
  return [
    { title: '发票编号', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 150, align: 'center' },
    { title: companyTitle, dataIndex: companyDataIndex, key: companyDataIndex, width: 200 },
    { title: '开票金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
    { title: '应收金额', dataIndex: 'amountDue', key: 'amountDue', width: 120, align: 'right' },
    { title: isIn ? '收款金额' : '付款金额', dataIndex: 'paymentAmount', key: 'paymentAmount', width: 120, align: 'right' },
  ]
})

// row-selection配置
const rowSelectionConfig = computed(() => ({
  type: 'radio' as const,
  selectedRowKeys: selectedBankTransactionIds.value,
  onChange: handleBankTransactionSelectionChange,
}))

// 选中的银行收支记录
const selectedBankTransaction = computed(() => {
  if (selectedBankTransactionIds.value.length === 0) {
    return null
  }
  const id = Number(selectedBankTransactionIds.value[0])
  return filteredBankTransactions.value.find((t: API.BankTransaction_) => Number(t.id) === id) || null
})

// 选中银行收支记录的备注拼接结果
const selectedBankTransactionRemarks = computed(() => {
  if (!selectedBankTransaction.value) {
    return '-'
  }
  const remarks: string[] = []
  if (selectedBankTransaction.value.remark1) {
    remarks.push(selectedBankTransaction.value.remark1)
  }
  if (selectedBankTransaction.value.remark2) {
    remarks.push(selectedBankTransaction.value.remark2)
  }
  if (selectedBankTransaction.value.remark3) {
    remarks.push(selectedBankTransaction.value.remark3)
  }
  return remarks.length > 0 ? remarks.join(' / ') : '-'
})

// 客户单位选项
const clientCompanyOptions = ref<Array<{ label: string; value: string }>>([])
const accountNumberOptions = ref<Array<{ label: string; value: string }>>([])

// 客户单位自动完成（使用通用 composable）
const clientCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: clientCompanyOptions,
  currentValue: computed(() => searchParams.value.clientCompanyName || ''),
  enableAutoAdd: true,
})

// 公司账号自动完成（使用通用 composable）
const accountNumberAutoComplete = useAutoCompleteWithExtra({
  baseOptions: accountNumberOptions,
  currentValue: computed(() => searchParams.value.accountNumber || ''),
  enableAutoAdd: true,
})

// 过滤后的选项
const filteredClientCompanyOptions = clientCompanyAutoComplete.filteredOptions
const filteredAccountNumberOptions = accountNumberAutoComplete.filteredOptions

// 业务经理相关
const paymentSalespersonName = ref<string>('')
const paymentSalespersonId = ref<number | undefined>(undefined)
const employeeBasicList = ref<API.EmployeeBasicInfoVO[]>([])

// 获取员工基本信息列表
const fetchEmployeeBasicList = async () => {
  try {
    const res = (await getAllEmployeeBasicInfoUsingGet({})) as any
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

// 获取当前登录用户，作为业务经理默认值
const fetchLoginUser = async () => {
  try {
    const res = (await getLoginUserUsingGet()) as any
    if (res?.data?.code === 0 && res.data.data) {
      const loginUser = res.data.data
      // 设置业务经理名称和ID
      if (loginUser.name) {
        paymentSalespersonName.value = loginUser.name
      }
      if (loginUser.id) {
        paymentSalespersonId.value = loginUser.id
      }
    }
  } catch (error) {
    console.error('获取当前登录用户失败', error)
  }
}

// 业务经理自动完成选项
const paymentSalespersonOptions = computed(() => {
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string }> = []

  for (const emp of employeeBasicList.value) {
    const name = (emp.name || '').trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      options.push({ value: name, label: name })
    }
  }

  return options
})

// 业务经理自动完成（使用通用 composable）
const paymentSalespersonAutoComplete = useAutoCompleteWithExtra({
  baseOptions: paymentSalespersonOptions,
  currentValue: computed(() => paymentSalespersonName.value || ''),
  enableAutoAdd: false,
})

// 过滤后的业务经理选项
const filteredPaymentSalespersonOptions = paymentSalespersonAutoComplete.filteredOptions

// 处理业务经理选择
const handleSalespersonSelect = (value: string) => {
  const emp = employeeBasicList.value.find(e => e.name === value)
  if (emp) {
    paymentSalespersonId.value = emp.id
  } else {
    paymentSalespersonId.value = undefined
  }
}

// 处理业务经理输入变化
const handlePaymentSalespersonInput = (value: string) => {
  if (!value) {
    paymentSalespersonId.value = undefined
  } else {
    const emp = employeeBasicList.value.find(e => e.name === value)
    if (emp) {
      paymentSalespersonId.value = emp.id
    } else {
      paymentSalespersonId.value = undefined
    }
  }
}

// 格式化日期
const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

// 是否可以提交
const canSubmit = computed(() => {
  return invoiceList.value.length > 0
    && invoiceList.value.every(inv => (inv.paymentAmount || 0) > 0)
    && selectedBankTransactionIds.value.length > 0
})

// 监听 visible 变化
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    initData()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 初始化数据
const initData = async () => {
  // 初始化发票列表（应收金额尽量与列表“未付金额”保持一致）
  invoiceList.value = props.selectedInvoices.map(inv => {
    const invoiceAmount = inv.amount || 0
    // 统一规则：应收金额 = 开票金额 - 总已付金额（totalPaidAmount 或 paymentAmount）
    const totalPaidAmount =
      (inv as any).totalPaidAmount != null
        ? (inv as any).totalPaidAmount
        : (inv as any).paymentAmount || 0
    const amountDue = Math.max(0, invoiceAmount - totalPaidAmount)
    return {
      ...inv,
      amountDue: amountDue, // 重新计算应收金额
      paymentAmount: 0, // 初始收款金额为0，等待选择银行收支后自动填充
      remark: '', // 保留字段用于确认框显示
    }
  })

  // 重置选中状态
  selectedBankTransactionIds.value = []
  bankTransactionInfo.value = null
  paymentSalespersonName.value = ''
  paymentSalespersonId.value = undefined

  // 加载员工列表
  await fetchEmployeeBasicList()

  // 获取当前登录用户，设置业务经理默认值
  await fetchLoginUser()

  // 加载银行收支数据（余额>0的记录）
  await fetchBankTransactions()
}

// 获取银行收支数据（委托后端按条件筛选，并只取未完成的记录）
const fetchBankTransactions = async () => {
  try {
    bankTransactionLoading.value = true
    const params: API.TransactionPageDTO = {
      current: 1,
      pageSize: 1000, // 获取所有数据
    }

    // 方向筛选：入账查正金额，出账查负金额
    if (props.paymentType === 'in') {
      // 入账：查询正金额（余额>0）
      ;(params as any).minAmount = 0.01
    } else {
      // 出账：查询负金额（余额<0，但显示为负数）
      ;(params as any).maxAmount = -0.01
    }

    // 只查询“未完成入账/出账”的记录（后端根据 isFinished=0 判断）
    ;(params as any).isFinished = 0

    // 顶部筛选条件：交给后端做模糊匹配
    if (searchParams.value.clientCompanyName) {
      params.clientCompanyName = searchParams.value.clientCompanyName
    }
    if (searchParams.value.accountNumber) {
      // 公司账号对应 remark3，由后端按 remark3 做模糊匹配
      ;(params as any).remark3 = searchParams.value.accountNumber
    }
    if (searchParams.value.amount !== null) {
      // 金额按绝对值匹配由后端处理
      params.amount = searchParams.value.amount
    }

    const res = (await listTransactionByPageUsingPost(params)) as any
    if (res.data.code === 0 && res.data.data) {
      const transactions = res.data.data.records || []
      // 二次筛选：后端已做方向 & 未完成的过滤，这里只做“符号兜底”
      bankTransactionList.value = transactions.filter((t: API.BankTransaction_) => {
        const balance = Number(t.balance || 0)
        const amount = Number(t.amount || 0)
        if (props.paymentType === 'in') {
          return balance > 0 || amount > 0
        }
        return balance < 0 || amount < 0
      })
      filteredBankTransactions.value = [...bankTransactionList.value]

      // 提取客户单位选项
      updateClientCompanyOptions()

      // 提取公司账号选项（remark3字段）
      updateAccountNumberOptions()
    }
  } catch (error) {
    console.error('获取银行收支数据失败', error)
    message.error('获取银行收支数据失败')
  } finally {
    bankTransactionLoading.value = false
  }
}

// 查询
const handleSearch = () => {
  // 直接让后端按当前筛选条件查询（含模糊匹配与未完成状态）
  fetchBankTransactions()
}

// 更新客户单位选项
const updateClientCompanyOptions = () => {
  const companies = new Set<string>()
  bankTransactionList.value.forEach((t: API.BankTransaction_) => {
    if (t.clientCompanyName) {
      companies.add(t.clientCompanyName)
    }
  })
  clientCompanyOptions.value = Array.from(companies).map(c => ({ label: c, value: c }))
}

// 更新公司账号选项
const updateAccountNumberOptions = () => {
  const accountNumbers = new Set<string>()
  bankTransactionList.value.forEach((t: API.BankTransaction_) => {
    if (t.remark3) {
      accountNumbers.add(t.remark3)
    }
  })
  accountNumberOptions.value = Array.from(accountNumbers).map(a => ({ label: a, value: a }))
}

// 清空
const handleReset = () => {
  searchParams.value = {
    clientCompanyName: '',
    accountNumber: '',
    amount: null,
  }
  // 清空自动完成组件的额外项
  clientCompanyAutoComplete.clearExtraItems()
  accountNumberAutoComplete.clearExtraItems()
  // 重新查询，恢复为仅按方向 + 未完成的默认筛选
  fetchBankTransactions()
}

// 关闭
const handleClose = () => {
  visible.value = false
}

// 提交
const handleSubmit = () => {
  if (!canSubmit.value) {
    if (selectedBankTransactionIds.value.length === 0) {
      message.warning('请选择银行收支记录')
      return
    }
    message.warning('请填写收款金额')
    return
  }
  confirmModalVisible.value = true
}

// 确认提交
const handleConfirmSubmit = async () => {
  try {
    if (!selectedBankTransaction.value || !selectedBankTransaction.value.id) {
      message.error('请选择银行收支记录')
      return
    }

    if (props.paymentType === 'in') {
      // 入账：使用 addPaymentUsingPost
      // 构建入账DTO
      const paymentDtos: API.InvoicePaymentDto[] = invoiceList.value
        .filter(inv => (inv.paymentAmount || 0) > 0)
        .map(inv => ({
          invoiceBaseId: inv.id || 0,
          bankTransactionId: selectedBankTransaction.value ? selectedBankTransaction.value.id! : 0,
          paidAmount: inv.paymentAmount || 0,
          paidDate: dayjs().format('YYYY-MM-DD'),
          salespersonId: paymentSalespersonId.value || selectedBankTransaction.value?.salespersonId || undefined,
          remark1: selectedBankTransaction.value?.remark1 || undefined,
          remark2: selectedBankTransaction.value?.remark2 || undefined,
          remark3: selectedBankTransaction.value?.remark3 || undefined,
        }))

      if (paymentDtos.length === 0) {
        message.warning('没有有效的入账记录')
        return
      }

      // 验证入账金额不能超过剩余可用金额
      const totalPaymentAmount = paymentDtos.reduce((sum, dto) => sum + (dto.paidAmount || 0), 0)
      const remainingAmount = bankTransactionInfo.value?.remainingAmount || 0

      if (totalPaymentAmount > remainingAmount) {
        message.error(`入账金额（${totalPaymentAmount.toFixed(2)}）不能超过银行收支记录的剩余可用金额（${remainingAmount.toFixed(2)}）`)
        return
      }

      const res = (await addPaymentUsingPost(paymentDtos)) as any

      if (res.data.code === 0) {
        message.success(`成功入账 ${totalPaymentAmount.toFixed(2)} 元`)
        confirmModalVisible.value = false
        visible.value = false
        emit('ok')
      } else {
        message.error(`入账失败: ${res.data.message || ''}`)
      }
    } else {
      // 出账：使用 addInputPaymentUsingPost
      // 构建出账DTO
      const paymentDtos: API.InputPaymentDto[] = invoiceList.value
        .filter(inv => (inv.paymentAmount || 0) > 0)
        .map(inv => ({
          inputInvoiceId: inv.id || 0,
          bankTransactionId: selectedBankTransaction.value!.id!,
          paymentAmount: inv.paymentAmount || 0,
          paymentDate: dayjs().format('YYYY-MM-DD'),
        }))

      if (paymentDtos.length === 0) {
        message.warning('没有有效的出账记录')
        return
      }

      // 验证出账金额不能超过剩余可用金额（对于出账，剩余金额是负数，所以需要取绝对值比较）
      const totalPaymentAmount = paymentDtos.reduce((sum, dto) => sum + (dto.paymentAmount || 0), 0)
      const remainingAmount = Math.abs(bankTransactionInfo.value?.remainingAmount || 0)

      if (totalPaymentAmount > remainingAmount) {
        message.error(`出账金额（${totalPaymentAmount.toFixed(2)}）不能超过银行收支记录的剩余可用金额（${remainingAmount.toFixed(2)}）`)
        return
      }

      const res = (await addInputPaymentUsingPost(paymentDtos)) as any

      if (res.data.code === 0) {
        message.success(`成功出账 ${totalPaymentAmount.toFixed(2)} 元`)
        confirmModalVisible.value = false
        visible.value = false
        emit('ok')
      } else {
        message.error(`出账失败: ${res.data.message || ''}`)
      }
    }
  } catch (error: any) {
    console.error(`${props.paymentType === 'in' ? '入账' : '出账'}失败`, error)
    message.error(`${props.paymentType === 'in' ? '入账' : '出账'}失败: ${error.message || '未知错误'}`)
  }
}
</script>

<style scoped>
@import '@/styles/filter.css';

/* 收款金额输入框样式 */
.payment-amount-input {
  width: 90px !important;
}

.payment-amount-input :deep(.ant-input-number-input) {
  text-align: center !important;
}

/* 业务经理自动完成：placeholder/输入左对齐 */
.salesperson-auto-complete :deep(.ant-select-selection-search-input) {
  text-align: left !important;
}

/* 公司账号输入框：防止 flex 布局压缩 - 参考其他自动填充框的样式 */
.filter-form-item :deep(.ant-form-item-control-input-content .account-number-input) {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  flex-basis: auto !important;
  width: 100% !important;
  min-width: 150px !important;
}

.filter-form-item :deep(.account-number-input) {
  width: 100%;
  min-width: 150px;
  flex-shrink: 0;
  flex-grow: 0;
  flex-basis: auto;
}

.filter-form-item :deep(.account-number-input .ant-select) {
  width: 100% !important;
  min-width: 150px !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
}

.filter-form-item :deep(.account-number-input .ant-select-selector) {
  min-width: 150px !important;
  width: 100% !important;
  flex-shrink: 0 !important;
}

.filter-form-item :deep(.account-number-input .ant-input) {
  min-width: 150px !important;
  width: 100% !important;
  flex-shrink: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-form-item :deep(.account-number-input .ant-select-selection-search) {
  flex: 1 1 auto !important;
  min-width: 0 !important;
}

.filter-form-item :deep(.account-number-input .ant-select-selection-search-input) {
  width: 100% !important;
  min-width: 0 !important;
}
</style>

