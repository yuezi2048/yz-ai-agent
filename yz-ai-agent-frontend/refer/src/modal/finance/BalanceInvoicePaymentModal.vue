<template>
  <global-modal
    v-model="visible"
    :title="modalTitle"
    width="90vw"
    :body-style="{ padding: '16px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'hidden' }"
    wrap-class-name="balance-payment-modal-wrap"
    :mask-closable="false"
    :keyboard="true"
  >
    <div>
      <!-- 到款入账信息 -->
      <div style="margin-bottom: 20px;">
        <a-table
          v-if="currentBalanceRecord"
          :columns="[
            { title: '序号', dataIndex: 'serialNo', key: 'serialNo', width: 70, align: 'center' },
            { title: '到账时间', dataIndex: 'arrivalTime', key: 'arrivalTime', width: 100, align: 'center' },
            { title: '余额', dataIndex: 'balance', key: 'balance', width: 120, align: 'right' },
            { title: '到账金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
            { title: '单位名称', dataIndex: 'companyName', key: 'companyName', width: 200 },
            { title: '客户姓名', dataIndex: 'userName', key: 'userName', width: 100 },
            { title: '到款编号', dataIndex: 'uniqueKey', key: 'uniqueKey', width: 150 },
            { title: '备注', dataIndex: 'remark1', key: 'remark1' },
          ]"
          :data-source="[currentBalanceRecord]"
          :pagination="false"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'serialNo'">1</template>
            <template v-else-if="column.dataIndex === 'arrivalTime'">
              {{ formatDate(record.arrivalTime) }}
            </template>
            <template v-else-if="column.dataIndex === 'balance'">
              <span :style="{ color: (record.balance || 0) < 0 ? '#ff4d4f' : 'inherit' }">
                {{ (record.balance || 0).toFixed(2) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              {{ (record.amount || 0).toFixed(2) }}
            </template>
          </template>
        </a-table>
      </div>

      <!-- 关联的销项发票列表（参考销项发票金额字段打开的模态框显示字段） -->
      <div style="margin-bottom: 20px">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">关联的销项发票：</div>
        <a-table
          :columns="[
            { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' },
            { title: '到账日期', dataIndex: 'paidDate', key: 'paidDate', width: 120, align: 'center' },
            { title: '到账金额', dataIndex: 'paidAmount', key: 'paidAmount', width: 120, align: 'right' },
            { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 180 },
            { title: '公司账号', dataIndex: 'companyAccount', key: 'companyAccount', width: 150 },
            { title: '转账方式', dataIndex: 'transferMethod', key: 'transferMethod', width: 130 },
            { title: '备注', dataIndex: 'remark1', key: 'remark1' },
          ]"
          :data-source="linkedInvoiceRows"
          :pagination="false"
          size="small"
          bordered
          class="compact-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'paidAmount'">
              {{ (record.paidAmount || 0).toFixed(2) }}
            </template>
            <template v-else>
              {{ record[column.dataIndex] || '-' }}
            </template>
          </template>
          <template #emptyText>
            <div class="table-empty-text">暂无关联的销项发票</div>
          </template>
        </a-table>
      </div>

      <!-- 销项发票 -->
<!--      <div>-->
<!--        <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px; padding-bottom: 8px; border-bottom: 2px solid #1890ff;">关联的销项发票</div>-->

<!--        &lt;!&ndash; 搜索条件（已注释：只展示关联的销项发票） &ndash;&gt;-->
<!--        <a-card size="small" class="filter-container" style="margin-bottom: 16px;">-->
<!--          <a-row :gutter="[16, 16]">-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="客户单位" class="filter-form-item">-->
<!--                <a-auto-complete-->
<!--                  :key="`customer-company-${filterResetKey}`"-->
<!--                  v-model:value="invoiceSearchParams.customerCompany"-->
<!--                  :options="customerCompanyOptions"-->
<!--                  placeholder="选择或输入客户单位"-->
<!--                  :style="{ width: customerCompanyWidth + 'px', maxWidth: '100%' }"-->
<!--                  allow-clear-->
<!--                  class="customer-company-input"-->
<!--                  :filter-option="(input: string, option: any) => {-->
<!--                    const value = option.value || option.label || ''-->
<!--                    return value.toLowerCase().includes(input.toLowerCase())-->
<!--                  }"-->
<!--                />-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="客户姓名" class="filter-form-item">-->
<!--                <a-input v-model:value="invoiceSearchParams.customerContact" placeholder="输入客户姓名" allow-clear class="filter-text-input customer-name-input" />-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="公司名称" class="filter-form-item">-->
<!--                <a-button @click="showIssuerCompanyModal = true" class="filter-select-button" :style="{ width: '100%' }">-->
<!--                  <span v-if="selectedIssuerCompanyNamesText" class="filter-selected-text">-->
<!--                    {{ selectedIssuerCompanyNamesText }}-->
<!--                  </span>-->
<!--                  <span v-else>请选择公司名称</span>-->
<!--                  <RightOutlined class="filter-select-icon" />-->
<!--                </a-button>-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="业务经理" class="filter-form-item">-->
<!--                <a-auto-complete-->
<!--                  :key="`salesperson-${filterResetKey}`"-->
<!--                  v-model:value="invoiceSearchParams.salespersonName"-->
<!--                  :options="filteredSalespersonOptionsForFilter"-->
<!--                  placeholder="选择或输入业务经理"-->
<!--                  :style="{ width: salespersonWidth + 'px', maxWidth: '100%' }"-->
<!--                  allow-clear-->
<!--                  class="salesperson-input"-->
<!--                  @change="handleSalespersonFilterChange"-->
<!--                />-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="开票日期" class="filter-form-item">-->
<!--                <div class="date-range-wrapper">-->
<!--                  <a-date-picker-->
<!--                    v-model:value="localStartDate"-->
<!--                    placeholder="开始日期"-->
<!--                    format="YYYYMMDD"-->
<!--                    value-format="YYYY-MM-DD"-->
<!--                    :suffix-icon="null"-->
<!--                    @change="handleStartDateChange"-->
<!--                  />-->
<!--                  <span class="date-separator">至</span>-->
<!--                  <a-date-picker-->
<!--                    v-model:value="localEndDate"-->
<!--                    placeholder="结束日期"-->
<!--                    format="YYYYMMDD"-->
<!--                    value-format="YYYY-MM-DD"-->
<!--                    allow-clear-->
<!--                    @change="handleEndDateChange"-->
<!--                  />-->
<!--                </div>-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="6">-->
<!--              <a-form-item label="发票号码" class="filter-form-item">-->
<!--                <a-input v-model:value="invoiceSearchParams.invoiceNumber" placeholder="输入发票号码" allow-clear class="filter-text-input" />-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--            <a-col :span="12">-->
<!--              <a-form-item label="开票金额" class="filter-form-item">-->
<!--                <div class="amount-input-group">-->
<!--                  <a-input-number-->
<!--                    v-model:value="invoiceSearchParams.minInvoiceAmount"-->
<!--                    placeholder="最小金额"-->
<!--                    :precision="2"-->
<!--                    :min="0"-->
<!--                    allow-clear-->
<!--                    class="amount-input-left"-->
<!--                    :style="{ width: '100%' }"-->
<!--                  />-->
<!--                  <span class="amount-separator-text">至</span>-->
<!--                  <a-input-number-->
<!--                    v-model:value="invoiceSearchParams.maxInvoiceAmount"-->
<!--                    placeholder="最大金额"-->
<!--                    :precision="2"-->
<!--                    :min="0"-->
<!--                    allow-clear-->
<!--                    class="amount-input-right"-->
<!--                    :style="{ width: '100%' }"-->
<!--                  />-->
<!--                </div>-->
<!--              </a-form-item>-->
<!--            </a-col>-->
<!--          </a-row>-->
<!--        </a-card>-->
<!--        <div class="filter-actions">-->
<!--          <div class="filter-actions-buttons">-->
<!--            <a-space>-->
<!--              <a-button type="primary" @click="handleSearch">-->
<!--                <template #icon><SearchOutlined /></template>-->
<!--                查询-->
<!--              </a-button>-->
<!--              <a-button class="btn-grey" @click="handleReset">-->
<!--                <template #icon><DeleteOutlined /></template>-->
<!--                清空-->
<!--              </a-button>-->
<!--            </a-space>-->
<!--          </div>-->
<!--        </div>-->

<!--        &lt;!&ndash; 发票列表 &ndash;&gt;-->
<!--        <a-table-->
<!--          :columns="[-->
<!--            { title: '开票日期', dataIndex: 'issueDate', key: 'issueDate', width: 100, align: 'center', sorter: true, fixed: 'left' },-->
<!--            { title: '欠款金额', dataIndex: 'amountDue', key: 'amountDue', width: 120, align: 'right', sorter: true, fixed: 'left' },-->
<!--            { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 150, sorter: true, fixed: 'left' },-->
<!--            { title: '客户单位', dataIndex: 'clientCompanyName', key: 'clientCompanyName', width: 200, sorter: true, fixed: 'left' },-->
<!--            { title: '客户姓名', dataIndex: 'clientPerson', key: 'clientPerson', width: 100, sorter: true },-->
<!--            { title: '到账金额', dataIndex: 'totalPaidAmount', key: 'totalPaidAmount', width: 120, align: 'right', sorter: true },-->
<!--            { title: '到账日期', dataIndex: 'paidDate', key: 'paidDate', width: 120, align: 'center', sorter: true },-->
<!--            { title: '录入日期', dataIndex: 'createTime', key: 'createTime', width: 100, align: 'center', sorter: true },-->
<!--            { title: '业务经理', dataIndex: 'salespersonName', key: 'salespersonName', width: 120, align: 'center', sorter: true },-->
<!--            { title: '转账方式', dataIndex: 'transferMethod', key: 'transferMethod', width: 130, align: 'center', sorter: true },-->
<!--            { title: '入账金额', dataIndex: 'paymentAmount', key: 'paymentAmount', width: 130, align: 'right' },-->
<!--          ]"-->
<!--          :data-source="sortedInvoiceList"-->
<!--          :loading="invoiceListLoading"-->
<!--          :pagination="false"-->
<!--          size="small"-->
<!--          bordered-->
<!--          class="compact-table invoice-list-table"-->
<!--          :row-key="(record: API.InvoiceItem) => record.id || 0"-->
<!--          :row-selection="{-->
<!--            selectedRowKeys: selectedInvoiceIds,-->
<!--            onChange: handleSelectionChange-->
<!--          }"-->
<!--          :scroll="{ x: 'max-content', y: tableScrollHeight }"-->
<!--          @change="handleInvoiceTableChange"-->
<!--        >-->
<!--          <template #bodyCell="{ column, record }">-->
<!--            <template v-if="column.dataIndex === 'amountDue'">-->
<!--              <span :style="{ color: (getAmountDue(record) || 0) > 0 ? '#ff4d4f' : 'inherit' }">-->
<!--                {{ (getAmountDue(record) || 0).toFixed(2) }}-->
<!--              </span>-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'totalPaidAmount'">-->
<!--              {{ (record.totalPaidAmount || 0).toFixed(2) }}-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'paidDate'">-->
<!--              <a-input-->
<!--                :value="getDisplayPaidDate(record)"-->
<!--                disabled-->
<!--                size="small"-->
<!--                class="readonly-cell-input"-->
<!--              />-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'createTime'">-->
<!--              {{ record.createTime ? '系统自动' : '-' }}-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'salespersonName'">-->
<!--              <span>{{ record.salespersonName || '-' }}</span>-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'transferMethod'">-->
<!--              <a-select-->
<!--                v-model:value="transferMethodMap[record.id!]"-->
<!--                :options="transferMethodSelectOptions || []"-->
<!--                allow-clear-->
<!--                size="small"-->
<!--                style="width: 100%;"-->
<!--                :disabled="!selectedInvoiceIds.includes(record.id!)"-->
<!--                :placeholder="selectedInvoiceIds.includes(record.id!) ? '选择转账方式' : '-'"-->
<!--              />-->
<!--            </template>-->
<!--            <template v-else-if="column.dataIndex === 'paymentAmount'">-->
<!--              <a-input-number-->
<!--                :value="selectedInvoiceIds.includes(record.id!) ? (paymentAmountMap[record.id!] ?? 0) : undefined"-->
<!--                :disabled="!selectedInvoiceIds.includes(record.id!)"-->
<!--                :min="0"-->
<!--                :max="getAmountDue(record)"-->
<!--                :precision="2"-->
<!--                :step="1000"-->
<!--                :placeholder="selectedInvoiceIds.includes(record.id!) ? `最大${getAmountDue(record).toFixed(2)}` : '-'"-->
<!--                size="small"-->
<!--                class="payment-amount-input"-->
<!--                allow-clear-->
<!--                @change="handlePaymentAmountChange(record.id!, $event)"-->
<!--              />-->
<!--            </template>-->
<!--          </template>-->
<!--          <template #emptyText>-->
<!--            <div class="table-empty-text">暂无数据</div>-->
<!--          </template>-->
<!--        </a-table>-->
<!--      </div>-->
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 12px; color: #666; font-size: 14px; flex-wrap: wrap;">
<!--          <span>-->
<!--            <span>总入账金额：</span>-->
<!--            <span style="color: #52c41a; font-weight: 600;">{{ totalPaymentAmount.toFixed(2) }}</span>-->
<!--            <span style="color: #999; margin-left: 8px;">（待入账金额：{{ balanceRemainingAmount.toFixed(2) }}）</span>-->
<!--          </span>-->
<!--          <span style="display: inline-flex; align-items: center; gap: 8px; min-width: 260px;">-->
<!--            <span style="width: 72px; text-align: left;">业务经理：</span>-->
<!--            <a-auto-complete-->
<!--              v-model:value="paymentSalespersonName"-->
<!--              :options="filteredPaymentSalespersonOptions"-->
<!--              allow-clear-->
<!--              placeholder="选择业务经理"-->
<!--              style="min-width: 200px; text-align: left;"-->
<!--              :dropdown-match-select-width="false"-->
<!--              @select="handleSalespersonSelect"-->
<!--              @change="handlePaymentSalespersonInput"-->
<!--            />-->
<!--          </span>-->
        </div>
        <div style="display: flex; gap: 8px;">
          <a-button @click="handleClose">
            <template #icon><CloseOutlined /></template>
            关闭
          </a-button>
          <!-- 入账功能已注释：只展示关联的销项发票 -->
          <!--
          <a-button type="primary" @click="handleSubmit" :disabled="totalPaymentAmount <= 0 || selectedInvoiceIds.length === 0">
            <template #icon><CheckOutlined /></template>
            入账
          </a-button>
          -->
        </div>
      </div>
    </template>
  </global-modal>

  <!-- 公司名称多选弹窗 -->
  <IssuerCompanySelectModal
    v-model="showIssuerCompanyModal"
    :company-list="companyList"
    :selected-company-ids="invoiceSearchParams.issuerCompanyIds"
    @ok="handleIssuerCompanyOk"
  />
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { SearchOutlined, DeleteOutlined, CloseOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import dayjs from 'dayjs'
import { Modal, message } from 'ant-design-vue'
import { useBalanceInvoicePayment } from '@/hooks/finance/useBalanceInvoicePayment'
import { addPaymentUsingPost, cancelPaymentUsingPost } from '@/api/fapiaoxinxiguanli.ts'
import { getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  modelValue: boolean
  currentBalanceRecord: API.BankTransaction_ | null
  balanceInvoiceList: Array<{ invoiceNo: string; paidAmount: number }>
  balanceUsedAmount: number
  balanceRemainingAmount: number
  balanceOriginalAmount: number
  balanceMinAllowedAmount: number
  invoiceListLoading: boolean
  invoiceList: API.InvoiceItem[]
  selectedInvoiceIds: number[]
  paymentSalespersonId: number | null
  transferMethodOptions: Array<{ label: string; value: string }>
  invoiceSearchParams: {
    customerCompany: string
    customerContact: string
    issuerCompanyIds: number[]
    salespersonName: string
    startDate: string | null
    endDate: string | null
    invoiceNumber: string
    minInvoiceAmount: number | null
    maxInvoiceAmount: number | null
  }
  clientList: API.Client_[]
  companyList: API.Company[]
  employeeList: API.Employee_[]
}

interface PaymentInfo {
  invoiceId: number
  invoiceNo: string
  amountDue: number
  paymentAmount: number
  paidDate: string
  salespersonId: number | null
  transferMethod?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedInvoiceIds', value: number[]): void
  (e: 'update:paymentSalespersonId', value: number | null): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'submit', paymentInfos: PaymentInfo[]): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedInvoiceIds = computed({
  get: () => props.selectedInvoiceIds,
  set: (val) => emit('update:selectedInvoiceIds', val)
})

const paymentSalespersonId = computed({
  get: () => props.paymentSalespersonId,
  set: (val) => emit('update:paymentSalespersonId', val)
})

// 对于 invoiceSearchParams，由于父组件传递的是 reactive 对象，直接使用即可
const invoiceSearchParams = computed(() => props.invoiceSearchParams)

// 本地日期状态（用于双向绑定）
const localStartDate = ref<string | null>(props.invoiceSearchParams.startDate || null)
const localEndDate = ref<string | null>(props.invoiceSearchParams.endDate || null)

// 监听 props 变化，同步本地状态
watch(() => props.invoiceSearchParams.startDate, (val) => {
  localStartDate.value = val || null
}, { immediate: true })

watch(() => props.invoiceSearchParams.endDate, (val) => {
  localEndDate.value = val || null
}, { immediate: true })

const handleStartDateChange = (date: string | null) => {
  localStartDate.value = date
  // 直接修改父组件传递的 reactive 对象
  props.invoiceSearchParams.startDate = date
}

const handleEndDateChange = (date: string | null) => {
  localEndDate.value = date
  // 直接修改父组件传递的 reactive 对象
  props.invoiceSearchParams.endDate = date
}

// 使用hook管理支付相关逻辑
const {
  paymentAmountMap,
  transferMethodMap,
  getAmountDue,
  totalPaymentAmount,
  handlePaymentAmountChange,
  getPaymentInfos,
  paymentSalespersonOptions,
  transferMethodSelectOptions,
} = useBalanceInvoicePayment({
  invoiceList: computed(() => props.invoiceList),
  selectedInvoiceIds: computed(() => props.selectedInvoiceIds),
  paymentSalespersonId: computed(() => props.paymentSalespersonId),
  employeeList: computed(() => props.employeeList),
  transferMethodOptions: computed(() => props.transferMethodOptions),
})

// 强制重建自动完成组件，清理其内部搜索缓存（解决清空后仍保留上一次过滤结果）
const filterResetKey = ref(0)

// ==================== 已关联入账记录：编辑/删除 ====================
const editingLinkedId = ref<number | null>(null)
const editingLinkedPaidAmount = ref<number | null>(null)
const editingLinkedTransferMethod = ref<string | undefined>(undefined)

const isEditingLinkedRow = (record: any) => {
  const rid = record?.id ?? record?.invoiceFinishId
  return !!rid && editingLinkedId.value === Number(rid)
}

const startEditLinkedRow = (record: any) => {
  const rid = record?.id ?? record?.invoiceFinishId
  if (!rid) {
    message.warning('缺少入账记录ID，无法编辑')
    return
  }
  editingLinkedId.value = Number(rid)
  editingLinkedPaidAmount.value = typeof record?.paidAmount === 'number' ? record.paidAmount : Number(record?.paidAmount || 0)
  editingLinkedTransferMethod.value = record?.transferMethod
}

const cancelEditLinkedRow = () => {
  editingLinkedId.value = null
  editingLinkedPaidAmount.value = null
  editingLinkedTransferMethod.value = undefined
}

const saveEditLinkedRow = async (record: any) => {
  try {
    const bankTransactionId = props.currentBalanceRecord?.id
    const id = record?.id ?? record?.invoiceFinishId
    const invoiceBaseId = record?.invoiceBaseId
    if (!bankTransactionId) {
      message.error('银行收支记录不存在')
      return
    }
    if (!id) {
      message.error('入账记录ID不存在')
      return
    }
    if (!invoiceBaseId) {
      message.error('发票ID不存在，无法更新入账记录')
      return
    }
    const amt = editingLinkedPaidAmount.value
    if (amt === null || amt === undefined || Number.isNaN(Number(amt)) || Number(amt) <= 0) {
      message.warning('请输入有效的入账金额')
      return
    }
    const paidDate = record?.paidDate || dayjs().format('YYYY-MM-DD')
    // 金额上限校验：不能超过“当前记录金额 + 当前剩余可用金额”
    const currentPaid = Number(record?.paidAmount || 0)
    const remaining = Number(props.balanceRemainingAmount || 0)
    const maxByBank = currentPaid + remaining
    if (amt > maxByBank) {
      message.error(
        `入账金额不能超过 ${maxByBank.toFixed(2)}（当前记录金额 ${currentPaid.toFixed(
          2,
        )} + 剩余可用金额 ${remaining.toFixed(2)}）`,
      )
      return
    }

    const dto: API.InvoicePaymentDto = {
      id: Number(id),
      bankTransactionId: Number(bankTransactionId),
      invoiceBaseId: Number(invoiceBaseId),
      paidAmount: Number(amt),
      paidDate,
      salespersonId: props.paymentSalespersonId ?? undefined,
      transferMethod: editingLinkedTransferMethod.value,
    }
    const res = (await addPaymentUsingPost([dto])) as any
    if (res?.data?.code !== 0) {
      message.error('更新失败：' + (res?.data?.message || ''))
      return
    }
    message.success('更新成功')
    cancelEditLinkedRow()
    emit('refresh')
  } catch (error: any) {
    console.error('更新入账记录失败', error)
    message.error('更新失败：' + (error?.message || '未知错误'))
  }
}

const deleteLinkedRow = (record: any) => {
  const id = record?.id ?? record?.invoiceFinishId
  if (!id) {
    message.error('入账记录ID不存在')
    return
  }
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条入账记录吗？此操作不可撤销！',
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = (await cancelPaymentUsingPost({ id: Number(id) } as any)) as any
        if (res?.data?.code !== 0) {
          message.error('删除失败：' + (res?.data?.message || ''))
          return
        }
        message.success('删除成功')
        cancelEditLinkedRow()
        emit('refresh')
      } catch (error: any) {
        console.error('删除入账记录失败', error)
        message.error('删除失败：' + (error?.message || '未知错误'))
      }
    },
  })
}

// 业务经理展示用姓名，与ID分离，保证输入框显示姓名
const paymentSalespersonName = ref<string>('')

// 初始化时根据已知ID填充姓名（包括父组件传入的登录用户ID）
watch(() => props.paymentSalespersonId, (val) => {
  if (val) {
    paymentSalespersonName.value = employeeNameMap.value[val] || ''
  }
}, { immediate: true })

const handleSelectionChange = (keys: any[]) => {
  emit('update:selectedInvoiceIds', keys as number[])
}

const handleCheckboxChange = (e: any, invoiceId: number) => {
  if (e.target.checked) {
    if (!selectedInvoiceIds.value.includes(invoiceId)) {
      selectedInvoiceIds.value = [...selectedInvoiceIds.value, invoiceId]
    }
  } else {
    selectedInvoiceIds.value = selectedInvoiceIds.value.filter(id => id !== invoiceId)
  }
}

// 业务经理选择/输入处理，保持输入框显示姓名，提交时使用 ID
const handleSalespersonSelect = (_: any, option: any) => {
  if (option?.id) {
    paymentSalespersonId.value = option.id as number
    paymentSalespersonName.value = option.value || option.label || ''
  }
}

// 业务经理入账自动填充框（使用通用 composable）
const paymentSalespersonAutoComplete = useAutoCompleteWithExtra({
  baseOptions: paymentSalespersonOptions,
  currentValue: computed(() => paymentSalespersonName.value || ''),
  extractValue: (value: string) => {
    // 从可能包含工号的 value 中提取名字
    return value.includes('|') ? value.split('|')[0] : value.trim()
  },
  enableAutoAdd: true,
})

// 业务经理入账选项
const filteredPaymentSalespersonOptions = paymentSalespersonAutoComplete.filteredOptions

const handleSalespersonInput = (val: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  paymentSalespersonAutoComplete.handleChange(val)
  paymentSalespersonName.value = val
}

// 处理筛选业务经理变化（输入时）
const handleSalespersonFilterChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  salespersonFilterAutoComplete.handleChange(value)
}

const handleSearch = () => {
  // 确保日期参数已同步
  props.invoiceSearchParams.startDate = localStartDate.value
  props.invoiceSearchParams.endDate = localEndDate.value
  // 触发查询事件
  emit('search')
}

const handleReset = () => {
  filterResetKey.value++
  emit('reset')
}

// 公司选择
const showIssuerCompanyModal = ref(false)
const selectedIssuerCompanyNamesText = computed(() => {
  const ids = props.invoiceSearchParams.issuerCompanyIds || []
  if (!ids.length) return ''
  const names = props.companyList
    .filter((c) => c.id && ids.includes(c.id))
    .map((c) => c.companyName || '')
    .filter(Boolean)
  return names.join('、')
})

const handleIssuerCompanyOk = (ids: number[]) => {
  // 直接修改父级传入的 reactive 对象，确保筛选参数即时生效
  props.invoiceSearchParams.issuerCompanyIds = ids
  showIssuerCompanyModal.value = false
}

const handleSubmit = () => {
  const paymentInfos = getPaymentInfos()
  if (paymentInfos.length === 0) {
    return
  }
  emit('submit', paymentInfos)
}

const handleClose = () => {
  visible.value = false
}

// 格式化日期，只显示日期部分
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  // 如果已经是YYYYMMDD格式，直接返回
  if (/^\d{8}$/.test(dateStr)) {
    return dateStr
  }
  // 如果是YYYY-MM-DD格式，转换为YYYYMMDD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.replace(/-/g, '').substring(0, 8)
  }
  // 尝试使用dayjs解析
  const date = dayjs(dateStr)
  if (date.isValid()) {
    return date.format('YYYYMMDD')
  }
  return dateStr
}

// 计算模态框标题
const modalTitle = computed(() => {
  if (!props.currentBalanceRecord) {
    return '到款入账'
  }
  const record = props.currentBalanceRecord
  const uniqueKey = record.uniqueKey || ''
  const originalAmount = props.balanceOriginalAmount || 0
  const usedAmount = props.balanceUsedAmount || 0
  const remainingAmount = props.balanceRemainingAmount || 0

  return `到款入账-${uniqueKey}（收支金额：${originalAmount.toFixed(2)} | 已入账金额：${usedAmount.toFixed(2)} | 待入账金额：${remainingAmount.toFixed(2)}）`
})


// 获取到账日期（使用余额记录的到账时间）
const paidDate = computed(() => {
  if (!props.currentBalanceRecord?.arrivalTime) {
    return dayjs().format('YYYY-MM-DD')
  }
  const arrivalTime = props.currentBalanceRecord.arrivalTime
  // 如果已经是YYYY-MM-DD格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}/.test(arrivalTime)) {
    return arrivalTime.substring(0, 10)
  }
  // 如果是YYYYMMDD格式，转换为YYYY-MM-DD
  if (/^\d{8}$/.test(arrivalTime)) {
    return `${arrivalTime.substring(0, 4)}-${arrivalTime.substring(4, 6)}-${arrivalTime.substring(6, 8)}`
  }
  // 尝试使用dayjs解析
  const date = dayjs(arrivalTime)
  if (date.isValid()) {
    return date.format('YYYY-MM-DD')
  }
  return dayjs().format('YYYY-MM-DD')
})

// 选中行：显示/提交用“今天”；未选中：显示后端返回的到账日期
const todayPaidDate = computed(() => dayjs().format('YYYY-MM-DD'))

const getDisplayPaidDate = (record: any) => {
  if (selectedInvoiceIds.value.includes(record?.id)) {
    return todayPaidDate.value
  }
  const backend = record?.paidDate
  if (!backend) return '-'
  const s = String(backend)
  if (/^\d{8}$/.test(s)) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10)
  }
  const d = dayjs(s)
  return d.isValid() ? d.format('YYYY-MM-DD') : s
}

// 过滤发票列表，只显示欠款金额大于0的发票
const filteredInvoiceList = computed(() => {
  return props.invoiceList.filter((invoice: any) => {
    return getAmountDue(invoice) > 0
  })
})

// 表格排序（前端排序，保证和其他页面一样可点表头排序）
const sortState = ref<{ field: string | null; order: 'ascend' | 'descend' | null }>({ field: null, order: null })

const normalizeDateLike = (val: any) => {
  if (!val) return ''
  const s = String(val)
  // YYYY-MM-DD / YYYYMMDD / 带时间的 YYYY-MM-DD HH:mm:ss
  return s.replace(/-/g, '').substring(0, 8)
}

const sortedInvoiceList = computed(() => {
  const list = [...filteredInvoiceList.value]
  const field = sortState.value.field
  const order = sortState.value.order
  if (!field || !order) return list

  const factor = order === 'ascend' ? 1 : -1
  return list.sort((a: any, b: any) => {
    let av: any = a[field]
    let bv: any = b[field]

    if (field === 'amountDue') {
      av = getAmountDue(a)
      bv = getAmountDue(b)
    } else if (field === 'issueDate' || field === 'createTime' || field === 'paidDate') {
      av = field === 'paidDate' ? normalizeDateLike(getDisplayPaidDate(a)) : normalizeDateLike(av)
      bv = field === 'paidDate' ? normalizeDateLike(getDisplayPaidDate(b)) : normalizeDateLike(bv)
    }

    // number compare
    if (typeof av === 'number' || typeof bv === 'number') {
      const an = Number(av || 0)
      const bn = Number(bv || 0)
      return (an - bn) * factor
    }

    const as = String(av ?? '')
    const bs = String(bv ?? '')
    return as.localeCompare(bs) * factor
  })
})

const handleInvoiceTableChange = (_pagination: any, _filters: any, sorter: any) => {
  const field = sorter?.field || sorter?.columnKey || null
  const order = sorter?.order || null
  sortState.value = { field, order }
}

// 计算文本宽度
const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

// 客户单位选项（基础选项，不包含"全部"）
const baseCustomerCompanyOptions = computed(() => {
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
  baseOptions: baseCustomerCompanyOptions,
  currentValue: computed(() => props.invoiceSearchParams.customerCompany || ''),
  enableAutoAdd: true,
})

// 客户单位选项（包含"全部"选项）
const customerCompanyOptions = computed(() => {
  return [{ value: '', label: '全部' }, ...customerCompanyAutoComplete.filteredOptions.value]
})

// 客户单位宽度
const customerCompanyWidth = computed(() => {
  let maxWidth = calculateTextWidth('选择或输入客户单位', 150)
  if (customerCompanyOptions.value.length > 0) {
    customerCompanyOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 150)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
  }
  return maxWidth
})

// 客户经理选项（筛选用：名称字符串）
const baseSalespersonOptions = computed(() => {
  const names = props.employeeList.map((e) => e.name || '').filter(Boolean)
  const unique = Array.from(new Set(names))
  return unique.map((n) => ({ value: n, label: n }))
})

// 业务经理筛选自动填充框（使用通用 composable）
const salespersonFilterAutoComplete = useAutoCompleteWithExtra({
  baseOptions: baseSalespersonOptions,
  currentValue: computed(() => props.invoiceSearchParams.salespersonName || ''),
  enableAutoAdd: true,
})

// 业务经理筛选选项
const filteredSalespersonOptionsForFilter = salespersonFilterAutoComplete.filteredOptions

// 保留原 salespersonOptions 用于宽度计算
const salespersonOptions = baseSalespersonOptions

// 客户经理宽度（筛选用）
const salespersonWidth = computed(() => {
  let maxWidth = calculateTextWidth('选择或输入客户经理', 150)
  salespersonOptions.value.forEach((opt: any) => {
    const text = opt.label || opt.value || ''
    const width = calculateTextWidth(text, 150)
    if (width > maxWidth) maxWidth = width
  })
  return maxWidth
})

// 业务经理姓名 <-> ID 映射，保持输入框显示姓名
const employeeNameMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}
  props.employeeList.forEach((e) => {
    if (e.id && e.name) map[e.id] = e.name
  })
  return map
})

// ------- 业务经理默认值：如果未选择且有员工列表，自动选中第一条 -------
watch(paymentSalespersonId, (val) => {
  if (val !== undefined && val !== null) {
    // 已有ID时，同步显示姓名
    paymentSalespersonName.value = employeeNameMap.value[val] || ''
    return
  }
  const first = paymentSalespersonOptions.value[0]
  if (first) {
    // 默认ID
    paymentSalespersonId.value = first.id as number
    paymentSalespersonName.value = first.label || ''
  }
}, { immediate: true })

// 同步员工列表变化到姓名
watch(() => props.employeeList, () => {
  if (paymentSalespersonId.value) {
    paymentSalespersonName.value = employeeNameMap.value[paymentSalespersonId.value] || ''
  }
})

// 发票表格：默认展示 5 行，超出可滚动
const tableScrollHeight = computed(() => {
  const rowHeight = 39
  const maxRows = 5
  return maxRows * rowHeight
})

// 关联的销项发票列表（参考销项发票金额字段打开的模态框显示字段）
const linkedInvoiceRows = computed(() => {
  if (!props.currentBalanceRecord || !props.balanceInvoiceList || props.balanceInvoiceList.length === 0) {
    return []
  }

  return props.balanceInvoiceList.map((invoice: any, index: number) => {
    return {
      index: index + 1,
      paidDate: invoice.paidDate || '-',
      paidAmount: invoice.paidAmount || 0,
      invoiceNo: invoice.invoiceNo || '-',
      companyAccount: props.currentBalanceRecord?.remark3 || '-',
      transferMethod: invoice.transferMethod || '-',
      remark1: props.currentBalanceRecord?.remark1 || '-',
    }
  })
})
</script>

<style scoped>
@import '@/styles/filter.css';

/* 紧凑表格样式 - 暂无数据时减少高度 */
.compact-table :deep(.ant-table-placeholder) {
  min-height: 60px;
  padding: 16px 0;
}

.compact-table :deep(.ant-empty) {
  margin: 8px 0;
}

.table-empty-text {
  color: #999;
  font-size: 14px;
}

/* 固定表格单元格内控件高度，避免选中后行高跳变 */
.readonly-cell-input :deep(.ant-input) {
  height: 24px;
  line-height: 24px;
  padding: 0 8px;
}

.payment-amount-input {
  width: 100%;
}

.payment-amount-input :deep(.ant-input-number) {
  width: 100%;
  height: 24px;
  line-height: 24px;
}

.payment-amount-input :deep(.ant-input-number-input) {
  height: 22px;
  line-height: 22px;
}

/* 确保筛选操作按钮位置正确 */
.filter-actions {
  margin-top: 0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 发票列表表格样式 - 固定表头，只滚动内容 */
.invoice-list-table {
  margin-top: 0;
}

/* 使用 ant-table scroll.y 控制滚动，避免覆盖其内部滚动容器 */

.invoice-list-table :deep(.ant-table-thead > tr > th) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fafafa;
}
</style>

<style>
/* 防止模态框打开时页面出现滚动条 */
.balance-payment-modal-wrap {
  overflow: hidden !important;
}

.balance-payment-modal-wrap .ant-modal {
  top: 20px;
  padding-bottom: 20px;
  max-height: calc(100vh - 40px);
}

.balance-payment-modal-wrap .ant-modal-content {
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.balance-payment-modal-wrap .ant-modal-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
</style>

