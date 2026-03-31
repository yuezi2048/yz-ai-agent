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
      <!-- 到账出账信息 -->
      <div style="margin-bottom: 20px;">
        <a-table
          v-if="currentRecord"
          :columns="summaryColumns"
          :data-source="[currentRecord]"
          :pagination="false"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'serialNo'">1</template>
            <template v-else-if="column.dataIndex === 'arrivalTime'">
              {{ formatDate(record.arrivalTime) }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span :style="{ color: (record.amount || 0) < 0 ? '#ff4d4f' : 'inherit' }">
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </template>
            <template v-else>
              <span>{{ record[column.dataIndex] }}</span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 关联的进项发票出账明细（类比出账明细模态框的表格结构） -->
      <div style="margin-bottom: 20px">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">
          关联的进项发票出账明细：
        </div>
        <a-table
          :columns="[
            { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' },
            { title: '出账日期', dataIndex: 'paidDate', key: 'paidDate', width: 120, align: 'center' },
            { title: '出账金额', dataIndex: 'paidAmount', key: 'paidAmount', width: 120, align: 'right' },
            { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 180 },
            { title: '公司账号', dataIndex: 'companyAccount', key: 'companyAccount', width: 150 },
            { title: '转账方式', dataIndex: 'transferMethod', key: 'transferMethod', width: 130 },
            { title: '备注', dataIndex: 'remark1', key: 'remark1' },
          ]"
          :data-source="linkedInvoiceRows"
          :loading="loading"
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
            <div class="table-empty-text">暂无关联的进项发票出账记录</div>
          </template>
        </a-table>
      </div>

      <!-- 进项发票筛选区域（筛选卡片保留，可根据需要再次隐藏） -->
<!--      <a-card class="filter-container" style="margin-bottom: 6px">-->
<!--        <a-collapse-->
<!--          v-model:activeKey="filterCollapseKey"-->
<!--          :bordered="false"-->
<!--          ghost-->
<!--          class="filter-collapse"-->
<!--          @change="handleFilterCollapseChange"-->
<!--        >-->
<!--          <a-collapse-panel key="filter" :showArrow="false" :header="null">-->
<!--            <div class="filter-form-container">-->
<!--              &lt;!&ndash; 第一行（4个）：公司名称（复选模态框）、发票类型（复选模态框）、发票用途（复选模态框）、两个勾选框（财务入账、财务付款） &ndash;&gt;-->
<!--              <a-row :gutter="[16, 16]">-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="公司名称" class="filter-form-item">-->
<!--                    <a-button @click="showCompanyModal = true" class="filter-select-button" :style="{ width: companySelectButtonWidth + 'px' }">-->
<!--                      <span v-if="selectedCompanyNamesText" class="filter-selected-text">-->
<!--                        {{ selectedCompanyNamesText }}-->
<!--                      </span>-->
<!--                      <span v-else>请选择公司名称</span>-->
<!--                      <RightOutlined class="filter-select-icon" />-->
<!--                    </a-button>-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="发票类型" class="filter-form-item">-->
<!--                    <a-button @click="showInvoiceTypeModal = true" class="filter-select-button" :style="{ width: invoiceTypeSelectButtonWidth + 'px' }">-->
<!--                      <span v-if="selectedInvoiceTypeNamesText" class="filter-selected-text">-->
<!--                        {{ selectedInvoiceTypeNamesText }}-->
<!--                      </span>-->
<!--                      <span v-else>请选择发票类型</span>-->
<!--                      <RightOutlined class="filter-select-icon" />-->
<!--                    </a-button>-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="发票用途" class="filter-form-item">-->
<!--                    <a-button @click="showInvoicePurposeModal = true" class="filter-select-button" :style="{ width: invoicePurposeSelectButtonWidth + 'px' }">-->
<!--                      <span v-if="selectedInvoicePurposeNamesText" class="filter-selected-text">-->
<!--                        {{ selectedInvoicePurposeNamesText }}-->
<!--                      </span>-->
<!--                      <span v-else>请选择发票用途</span>-->
<!--                      <RightOutlined class="filter-select-icon" />-->
<!--                    </a-button>-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="财务状态" class="filter-form-item">-->
<!--                    <a-space>-->
<!--                      <a-checkbox v-model:checked="searchParams.isAccounted">财务入账</a-checkbox>-->
<!--                      <a-checkbox v-model:checked="searchParams.isPaid">财务付款</a-checkbox>-->
<!--                    </a-space>-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--              </a-row>-->
<!--              &lt;!&ndash; 第二行（3个）：开票日期、供货单位、供货姓名 &ndash;&gt;-->
<!--              <a-row :gutter="[16, 16]">-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="开票日期" class="filter-form-item">-->
<!--                    <div class="date-range-wrapper">-->
<!--                      <a-date-picker-->
<!--                        v-model:value="searchParams.startDate"-->
<!--                        placeholder="开始日期"-->
<!--                        format="YYYYMMDD"-->
<!--                        value-format="YYYY-MM-DD"-->
<!--                        :suffix-icon="null"-->
<!--                        @change="handleStartDateChange"-->
<!--                      />-->
<!--                      <span class="date-separator">至</span>-->
<!--                      <a-date-picker-->
<!--                        v-model:value="searchParams.endDate"-->
<!--                        placeholder="结束日期"-->
<!--                        format="YYYYMMDD"-->
<!--                        value-format="YYYY-MM-DD"-->
<!--                        allow-clear-->
<!--                        @change="handleEndDateChange"-->
<!--                      />-->
<!--                    </div>-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="供货单位" class="filter-form-item">-->
<!--                    <a-auto-complete-->
<!--                      :key="`supplier-${filterResetKey}`"-->
<!--                      v-model:value="searchParams.supplierName"-->
<!--                      :options="supplierCompanyOptions"-->
<!--                      placeholder="选择或输入供货单位"-->
<!--                      :style="{ width: supplierCompanyWidth + 'px', maxWidth: '100%' }"-->
<!--                      allow-clear-->
<!--                      class="customer-company-input"-->
<!--                      :filter-option="(input: string, option: any) => {-->
<!--                        const value = option.value || option.label || ''-->
<!--                        return value.toLowerCase().includes(input.toLowerCase())-->
<!--                      }"-->
<!--                      @select="handleSupplierCompanySelect"-->
<!--                      @change="handleSupplierCompanyChange"-->
<!--                    />-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--                <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">-->
<!--                  <a-form-item label="供货姓名" class="filter-form-item">-->
<!--                    <a-input-->
<!--                      v-model:value="searchParams.salespersonName"-->
<!--                      placeholder="输入供货姓名"-->
<!--                      class="filter-text-input"-->
<!--                      allow-clear-->
<!--                      @change="handleFilterChange"-->
<!--                    />-->
<!--                  </a-form-item>-->
<!--                </a-col>-->
<!--              </a-row>-->
<!--            </div>-->
<!--          </a-collapse-panel>-->
<!--        </a-collapse>-->
<!--        <div class="filter-actions" :class="{ 'is-collapsed': filterCollapsed }">-->
<!--          <div class="filter-collapse-toggle" @click="handleFilterCollapseToggle">-->
<!--            <span class="filter-collapse-toggle-text">{{ filterCollapsed ? '展开筛选条件' : '收起筛选条件' }}</span>-->
<!--            <component :is="filterCollapsed ? CaretDownOutlined : CaretUpOutlined" />-->
<!--          </div>-->
<!--          <div class="filter-actions-buttons" v-if="!filterCollapsed">-->
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
<!--      </a-card>-->

      <!-- 关联的进项发票列表（参考进项发票金额字段打开的模态框显示字段） -->
<!--      <div style="margin-bottom: 20px">-->
<!--        <div style="font-size: 14px; font-weight: 500; margin-bottom: 12px;">关联的进项发票：</div>-->
<!--        <a-table-->
<!--          :columns="[-->
<!--            { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' },-->
<!--            { title: '出账日期', dataIndex: 'paidDate', key: 'paidDate', width: 120, align: 'center' },-->
<!--            { title: '出账金额', dataIndex: 'paidAmount', key: 'paidAmount', width: 120, align: 'right' },-->
<!--            { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 180 },-->
<!--            { title: '公司账号', dataIndex: 'companyAccount', key: 'companyAccount', width: 150, align: 'center' },-->
<!--            { title: '转账方式', dataIndex: 'transferMethod', key: 'transferMethod', width: 130 },-->
<!--            { title: '备注', dataIndex: 'remark1', key: 'remark1' },-->
<!--          ]"-->
<!--          :data-source="linkedInvoiceRows"-->
<!--          :loading="loading"-->
<!--          :pagination="false"-->
<!--          size="small"-->
<!--          bordered-->
<!--          class="compact-table"-->
<!--        >-->
<!--          <template #bodyCell="{ column, record }">-->
<!--            <template v-if="column.dataIndex === 'paidAmount'">-->
<!--              {{ (record.paidAmount || 0).toFixed(2) }}-->
<!--            </template>-->
<!--            <template v-else>-->
<!--              {{ record[column.dataIndex] || '-' }}-->
<!--            </template>-->
<!--          </template>-->
<!--          <template #emptyText>-->
<!--            <div class="table-empty-text">暂无关联的进项发票</div>-->
<!--          </template>-->
<!--        </a-table>-->
<!--      </div>-->

      <!-- 底部操作 -->
      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="font-size: 14px; color: #666; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
<!--          <span>-->
<!--            <span>总出账金额：</span>-->
<!--            <span style="color: #52c41a; font-weight: 600;">{{ totalPaymentAmount.toFixed(2) }}</span>-->
<!--            <span style="color: #999; margin-left: 8px;">（待出账金额：{{ balanceRemainingAmount.toFixed(2) }}）</span>-->
<!--          </span>-->
        </div>
        <a-space>
          <a-button class="btn-grey" @click="handleCancel">
            关闭
          </a-button>
          <!-- 出账功能已注释：只展示关联的进项发票 -->
          <!--
          <a-button type="primary" @click="handleOutflow" :disabled="totalPaymentAmount <= 0 || selectedInvoiceIds.length === 0">
            出账
          </a-button>
          -->
        </a-space>
      </div>

      <!-- 公司名称选择模态框 -->
      <IssuerCompanySelectModal
        v-model="showCompanyModal"
        :company-list="companyList"
        :selected-company-ids="searchParams.companyIds"
        @ok="handleCompanyModalOk"
      />

      <!-- 发票类型选择模态框 -->
      <InvoiceTypeSelectModal
        v-model="showInvoiceTypeModal"
        :type-list="invoiceTypeList"
        :selected-type-ids="searchParams.invoiceTypeIds"
        @ok="handleInvoiceTypeModalOk"
      />

      <!-- 发票用途选择模态框 -->
      <InputInvoicePurposeSelectModal
        v-model="showInvoicePurposeModal"
        :purpose-list="invoicePurposeList"
        :selected-purpose-ids="searchParams.invoicePurposeIds"
        @ok="handleInvoicePurposeModalOk"
      />
    </div>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { CaretUpOutlined, CaretDownOutlined, RightOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import { listInputInvoiceByPageUsingPost, addInputPaymentUsingPost, queryInputPaymentUsingPost, listBankTransactionByIdsUsingPost } from '@/api/caiwuguanlijiekou'
import { queryInvoicePurposeListEnabledUsingGet, queryInvoicePurposePageUsingPost, queryInvoiceTypeListEnabledUsingPost } from '@/api/jichuxinxiguanlijiekou'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import { getSupplierCompanyNamesUsingGet, getSupplierNameByCompanyNameUsingPost } from '@/api/gongyingshangguanlijiekou'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import InvoiceTypeSelectModal from '@/modal/base/InvoiceTypeSelectModal.vue'
import InputInvoicePurposeSelectModal from '@/modal/base/InputInvoicePurposeSelectModal.vue'

interface Props {
  modelValue: boolean
  currentRecord: API.BankTransaction_ | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentRecord: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': []
}>()

const visible = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      initAndFetch()
    }
  },
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const modalTitle = computed(() => {
  if (props.currentRecord?.uniqueKey) {
    return `到款出账（${props.currentRecord.uniqueKey}）`
  }
  return '到款出账'
})

const currentRecord = computed(() => props.currentRecord)

const summaryColumns = [
  { title: '序号', dataIndex: 'serialNo', key: 'serialNo', width: 70, align: 'center' as const },
  { title: '到账时间', dataIndex: 'arrivalTime', key: 'arrivalTime', width: 110, align: 'center' as const },
  { title: '到账金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' as const },
  { title: '单位名称', dataIndex: 'companyName', key: 'companyName', width: 220 },
  { title: '客户姓名', dataIndex: 'userName', key: 'userName', width: 120 },
  { title: '到账编号', dataIndex: 'uniqueKey', key: 'uniqueKey', width: 160 },
  { title: '备注', dataIndex: 'remark1', key: 'remark1' },
]

const invoiceColumns = [
  { title: '开票日期', dataIndex: 'issueDate', key: 'issueDate', width: 120, align: 'center' as const },
  { title: '欠款金额', dataIndex: 'amountDue', key: 'amountDue', width: 120, align: 'right' as const },
  { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 180 },
  { title: '供货单位', dataIndex: 'supplierName', key: 'supplierName', width: 220 },
  { title: '供货姓名', dataIndex: 'supplierContact', key: 'supplierContact', width: 120 },
  { title: '发票类型', dataIndex: 'invoiceType', key: 'invoiceType', width: 120 },
  { title: '发票用途', dataIndex: 'invoicePurpose', key: 'invoicePurpose', width: 120 },
  { title: '公司名称', dataIndex: 'companyName', key: 'companyName', width: 220 },
  { title: '出账金额', dataIndex: 'paymentAmount', key: 'paymentAmount', width: 130, align: 'right' as const },
  { title: '备注', dataIndex: 'remark1', key: 'remark1', width: 200 },
]

// ==== 筛选条件，与进项发票页面保持一致 ====
const searchParams = reactive({
  companyIds: [] as number[],
  supplierName: '',
  salespersonName: '',
  invoiceTypeIds: [] as number[],
  invoicePurposeIds: [] as number[],
  isAccounted: false,
  isPaid: false,
  startDate: null as string | null,
  endDate: null as string | null,
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
})

const loading = ref(false)
const invoiceList = ref<any[]>([])
const selectedInvoiceIds = ref<number[]>([])
const paymentAmountMap = ref<Record<number, number>>({})
const linkedInvoiceRows = ref<any[]>([])
const bankTransactionMap = ref<Map<string, API.BankTransactionRelatedInvoiceVO>>(new Map())

// ==== 公司 & 供应商，与 useInputInvoiceManage 保持一致 ====
const companyList = ref<API.Company[]>([])
const supplierList = ref<string[]>([])
const invoiceTypeList = ref<API.InvoiceType_[]>([])
const invoicePurposeList = ref<API.InvoicePurposeItemVO[]>([])

const selectedCompanyNamesText = computed(() => {
  if (!searchParams.companyIds || searchParams.companyIds.length === 0) {
    return ''
  }
  const selectedCompanies = companyList.value.filter((company: API.Company) => company.id && searchParams.companyIds.includes(company.id))
  return selectedCompanies.map((c: API.Company) => c.companyName || '').join(', ')
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const companySelectButtonWidth = computed(() => {
  const placeholder = '请选择公司名称'
  if (selectedCompanyNamesText.value) {
    const contentWidth = calculateTextWidth(selectedCompanyNamesText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

const supplierCompanyOptions = computed(() => {
  return supplierList.value.map((name) => ({
    value: name,
    label: name,
  }))
})

const supplierCompanyWidth = computed(() => {
  let maxWidth = calculateTextWidth('选择或输入供货单位', 120)
  supplierCompanyOptions.value.forEach((option: any) => {
    const text = option.label || option.value || ''
    const width = calculateTextWidth(text, 120)
    if (width > maxWidth) {
      maxWidth = width
    }
  })
  return maxWidth
})

// 公司多选模态框 & 发票类型 / 用途模态框
const showCompanyModal = ref(false)
const showInvoiceTypeModal = ref(false)
const showInvoicePurposeModal = ref(false)

const handleCompanyModalOk = (selectedIds: number[]) => {
  searchParams.companyIds = selectedIds
}

const handleInvoiceTypeModalOk = (selectedIds: number[]) => {
  searchParams.invoiceTypeIds = selectedIds
}

const handleInvoicePurposeModalOk = (selectedIds: number[]) => {
  searchParams.invoicePurposeIds = selectedIds
}

const selectedInvoiceTypeNamesText = computed(() => {
  if (!searchParams.invoiceTypeIds || searchParams.invoiceTypeIds.length === 0) {
    return ''
  }
  const selected = invoiceTypeList.value.filter((item: API.InvoiceType_) => item.id && searchParams.invoiceTypeIds.includes(item.id))
  return selected.map((i: API.InvoiceType_) => i.typeName || '').join(', ')
})

const invoiceTypeSelectButtonWidth = computed(() => {
  const placeholder = '请选择发票类型'
  if (selectedInvoiceTypeNamesText.value) {
    const contentWidth = calculateTextWidth(selectedInvoiceTypeNamesText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

const selectedInvoicePurposeNamesText = computed(() => {
  if (!searchParams.invoicePurposeIds || searchParams.invoicePurposeIds.length === 0) {
    return ''
  }
  const selected = invoicePurposeList.value.filter((item: API.InvoicePurposeItemVO) => item.id && searchParams.invoicePurposeIds.includes(item.id))
  return selected.map((i: API.InvoicePurposeItemVO) => i.purposeName || '').join(', ')
})

const invoicePurposeSelectButtonWidth = computed(() => {
  const placeholder = '请选择发票用途'
  if (selectedInvoicePurposeNamesText.value) {
    const contentWidth = calculateTextWidth(selectedInvoicePurposeNamesText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

// 供货单位选择 / 输入
const handleSupplierCompanySelect = (value: string) => {
  if (value === '') {
    searchParams.supplierName = ''
  }
}

const handleSupplierCompanyChange = (value: string) => {
  searchParams.supplierName = value
}

const handleFilterChange = () => {
  // 保持与进项发票页面一致：输入即更新 searchParams，查询仍由"查询"按钮触发
}

const handleStartDateChange = () => {
  // 保持与进项发票页面一致：输入即更新 searchParams，查询仍由"查询"按钮触发
}

const handleEndDateChange = () => {
  // 保持与进项发票页面一致：输入即更新 searchParams，查询仍由"查询"按钮触发
}

const filterCollapseKey = ref<string[] | string[]>(['filter'])
const filterCollapsed = ref(false)

// 强制重建自动完成组件，清理其内部搜索缓存（解决清空后仍保留上一次过滤结果）
const filterResetKey = ref(0)

// 发票表格：默认展示 5 行，超出可滚动
const tableScrollHeight = computed(() => {
  const rowHeight = 39
  const maxRows = 5
  return maxRows * rowHeight
})

const handleFilterCollapseChange = (keys: string[] | string) => {
  const arr = Array.isArray(keys) ? keys : [keys]
  filterCollapsed.value = !arr.includes('filter')
}

const handleFilterCollapseToggle = () => {
  const willCollapse = !filterCollapsed.value
  filterCollapsed.value = willCollapse
  filterCollapseKey.value = willCollapse ? [] : ['filter']
}

const formatDate = (value: any) => {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DD')
}

const buildQueryParams = () => {
  const params: any = {
    current: 1,
    pageSize: 500,
  }
  // 4) 公司名称：传 companyIds（ID 列表），不传名称
  if (searchParams.companyIds && searchParams.companyIds.length > 0) {
    params.companyIds = searchParams.companyIds
  }
  if (searchParams.supplierName) {
    params.supplierName = searchParams.supplierName
  }
  // 1) 供货姓名：接口字段使用 salespersonName（不再用 supplierContact）
  if (searchParams.salespersonName) {
    params.salespersonName = searchParams.salespersonName
  }
  if (searchParams.startDate) {
    params.startDate = searchParams.startDate
  }
  if (searchParams.endDate) {
    params.endDate = searchParams.endDate
  }
  if ((searchParams as any).invoiceNo) {
    params.invoiceNo = (searchParams as any).invoiceNo
  }
  // 2/3) 发票用途/类型：传名称列表 invoicePurposes / invoiceTypes
  if (searchParams.invoiceTypeIds && searchParams.invoiceTypeIds.length > 0) {
    const types = invoiceTypeList.value
      .filter((t: any) => t?.id && searchParams.invoiceTypeIds.includes(t.id))
      .map((t: any) => t?.typeName)
      .filter((name: any) => !!name)
    if (types.length > 0) {
      params.invoiceTypes = types
    }
  }
  if (searchParams.invoicePurposeIds && searchParams.invoicePurposeIds.length > 0) {
    const purposes = invoicePurposeList.value
      .filter((p: any) => p?.id && searchParams.invoicePurposeIds.includes(p.id))
      .map((p: any) => p?.purposeName)
      .filter((name: any) => !!name)
    if (purposes.length > 0) {
      params.invoicePurposes = purposes
    }
  }
  if (searchParams.isAccounted) {
    params.isAccounted = 1
  }
  // 兼容：接口 DTO 未声明 isPaid，但后端若支持可透传（不影响现有）
  if (searchParams.isPaid) {
    ;(params as any).isPaid = 1
  }
  if (typeof searchParams.minAmount === 'number') {
    params.minAmount = searchParams.minAmount
  }
  if (typeof searchParams.maxAmount === 'number') {
    params.maxAmount = searchParams.maxAmount
  }
  return params
}

const fetchInvoiceList = async () => {
  try {
    loading.value = true
    const params = buildQueryParams()
    const res = (await listInputInvoiceByPageUsingPost(params)) as any
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      invoiceList.value = records
    } else {
      invoiceList.value = []
    }
  } catch (error) {
    console.error('查询进项发票列表失败', error)
    message.error('查询进项发票失败')
    invoiceList.value = []
  } finally {
    loading.value = false
  }
}

const initAndFetch = async () => {
  // 默认按公司信息预填部分筛选条件
  searchParams.companyIds = []
  searchParams.supplierName = ''
  searchParams.salespersonName = ''
  searchParams.invoiceTypeIds = []
  searchParams.invoicePurposeIds = []
  searchParams.isAccounted = false
  searchParams.isPaid = false
  searchParams.startDate = null
  searchParams.endDate = null
  searchParams.minAmount = undefined
  searchParams.maxAmount = undefined

  // 如果当前收支记录有公司名称，尽量匹配公司ID 作为默认选中
  if (currentRecord.value?.companyName) {
    const matched = companyList.value.filter((c: API.Company) => c.companyName === currentRecord.value?.companyName && c.id)
    searchParams.companyIds = matched.map((c) => c.id!) as number[]
  }

  await fetchBasicOptions()
  // 注释掉查询所有进项发票的逻辑，改为查询关联的进项发票
  // await fetchInvoiceList()
  await fetchLinkedInvoices()
}

// 获取关联的进项发票出账记录
const fetchLinkedInvoices = async () => {
  if (!props.currentRecord?.id) {
    linkedInvoiceRows.value = []
    return
  }

  loading.value = true
  linkedInvoiceRows.value = []
  bankTransactionMap.value.clear()

  try {
    // 查询所有进项发票，然后过滤出与当前银行收支记录关联的发票
    const allInvoicesRes = (await listInputInvoiceByPageUsingPost({
      current: 1,
      pageSize: 1000,
    })) as any

    if (allInvoicesRes.data.code === 0 && allInvoicesRes.data.data) {
      const allInvoices = allInvoicesRes.data.data.records || []
      const linkedRows: any[] = []
      let index = 1
      const bankTransactionId = props.currentRecord.id

      // 对每个发票查询出账记录
      for (const invoice of allInvoices) {
        if (!invoice.id) continue

        try {
          const paymentRes = (await queryInputPaymentUsingPost({
            inputInvoiceId: invoice.id,
          } as API.InputPaymentQueryDto)) as any

          if (paymentRes.data.code === 0 && paymentRes.data.data) {
            const paymentData = paymentRes.data.data
            const paidAmountList = paymentData.paidAmountList || []
            const paidDateList = paymentData.paidDateList || []
            const bankIdList = paymentData.bankIdList || []

            // 检查是否有与当前银行收支记录关联的出账记录
            const hasLinkedPayment = bankIdList.some((bankId: string | number) => Number(bankId) === bankTransactionId)

            if (hasLinkedPayment) {
              // 找到所有关联的出账记录索引
              bankIdList.forEach((bankId: string | number, idx: number) => {
                if (Number(bankId) === bankTransactionId) {
                  const paidAmount = paidAmountList[idx]
                  const paidDate = paidDateList[idx]

                  // 获取银行收支信息
                  const bankIdKey = String(bankId)
                  let bankTransaction = bankTransactionMap.value.get(bankIdKey) as API.BankTransactionRelatedInvoiceVO | undefined

                  if (!bankTransaction) {
                    // 使用当前银行收支记录的信息
                    bankTransaction = {
                      id: bankTransactionId,
                      remark3: props.currentRecord?.remark3,
                      transferMethod: props.currentRecord?.transferMethod,
                      remark1: props.currentRecord?.remark1,
                    } as any
                    bankTransactionMap.value.set(bankIdKey, bankTransaction as API.BankTransactionRelatedInvoiceVO)
                  }

                  linkedRows.push({
                    index: index++,
                    paidDate: paidDate || '-',
                    paidAmount: paidAmount || 0,
                    invoiceNo: invoice.invoiceNo || '-',
                    companyAccount: bankTransaction?.remark3 || props.currentRecord?.remark3 || '-',
                    transferMethod: bankTransaction?.transferMethod || props.currentRecord?.transferMethod || '-',
                    remark1: bankTransaction?.remark1 || props.currentRecord?.remark1 || '-',
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error(`查询发票 ${invoice.id} 的出账记录失败`, error)
        }
      }

      linkedInvoiceRows.value = linkedRows
    }
  } catch (error) {
    console.error('获取关联的进项发票失败', error)
    message.error('获取关联的进项发票失败')
    linkedInvoiceRows.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  await fetchInvoiceList()
}

const handleReset = async () => {
  filterResetKey.value++
  searchParams.companyIds = []
  searchParams.supplierName = ''
  searchParams.salespersonName = ''
  searchParams.invoiceTypeIds = []
  searchParams.invoicePurposeIds = []
  searchParams.isAccounted = false
  searchParams.isPaid = false
  searchParams.startDate = null
  searchParams.endDate = null
  searchParams.minAmount = undefined
  searchParams.maxAmount = undefined
  await fetchInvoiceList()
}

const handleCancel = () => {
  visible.value = false
}

// 计算欠款金额（开票金额 - 已出账金额）
const getAmountDue = (record: any) => {
  const totalAmount = record.amount || 0
  const paidAmount = record.totalPaidAmount || 0
  return Math.max(0, totalAmount - paidAmount)
}

// 处理选择变化
const handleSelectionChange = (selectedKeys: number[]) => {
  selectedInvoiceIds.value = selectedKeys
  // 清除未选中发票的出账金额
  Object.keys(paymentAmountMap.value).forEach((id) => {
    const invoiceId = Number(id)
    if (!selectedKeys.includes(invoiceId)) {
      delete paymentAmountMap.value[invoiceId]
    }
  })
}

// 处理出账金额变化
const handlePaymentAmountChange = (invoiceId: number, value: number | null) => {
  if (value === null || value === undefined) {
    delete paymentAmountMap.value[invoiceId]
  } else {
    paymentAmountMap.value[invoiceId] = value
  }
}

// 计算总出账金额
const totalPaymentAmount = computed(() => {
  return selectedInvoiceIds.value.reduce((sum, id) => {
    return sum + (paymentAmountMap.value[id] || 0)
  }, 0)
})

// 计算剩余可用金额（收支记录的金额 - 总出账金额）
const balanceRemainingAmount = computed(() => {
  const recordAmount = currentRecord.value?.amount || 0
  return Math.max(0, recordAmount - totalPaymentAmount.value)
})

// 处理出账
const handleOutflow = async () => {
  try {
    if (!currentRecord.value || !currentRecord.value.id) {
      message.error('收支记录信息不存在')
      return
    }

    if (selectedInvoiceIds.value.length === 0) {
      message.warning('请至少选择一条进项发票')
      return
    }

    // 验证出账金额
    const invalidInvoices = selectedInvoiceIds.value.filter((id) => {
      const paymentAmount = paymentAmountMap.value[id] || 0
      if (paymentAmount <= 0) {
        return true
      }
      const invoice = invoiceList.value.find((inv) => inv.id === id)
      if (!invoice) {
        return true
      }
      const amountDue = getAmountDue(invoice)
      if (paymentAmount > amountDue) {
        return true
      }
      return false
    })

    if (invalidInvoices.length > 0) {
      message.error('部分发票的出账金额无效，请检查')
      return
    }

    // 验证总出账金额不能超过收支记录金额
    const recordAmount = currentRecord.value.amount || 0
    if (totalPaymentAmount.value > recordAmount) {
      message.error(`出账金额（${totalPaymentAmount.value.toFixed(2)}）不能超过收支记录的金额（${recordAmount.toFixed(2)}）`)
      return
    }

    // 构建出账DTO
    const paymentDtos: API.InputPaymentDto[] = selectedInvoiceIds.value
      .filter((id) => (paymentAmountMap.value[id] || 0) > 0)
      .map((id) => {
        const invoice = invoiceList.value.find((inv) => inv.id === id)
        return {
          inputInvoiceId: id,
          bankTransactionId: currentRecord.value!.id!,
          paymentAmount: paymentAmountMap.value[id] || 0,
          paymentDate: dayjs().format('YYYY-MM-DD'),
        } as API.InputPaymentDto
      })

    if (paymentDtos.length === 0) {
      message.warning('没有有效的出账记录')
      return
    }

    const res = (await addInputPaymentUsingPost(paymentDtos)) as any

    if (res.data.code === 0) {
      message.success(`成功出账 ${totalPaymentAmount.value.toFixed(2)} 元`)
      // 清空选择
      selectedInvoiceIds.value = []
      paymentAmountMap.value = {}
      // 刷新发票列表
      await fetchInvoiceList()
      // 触发刷新事件
      emit('ok')
    } else {
      // 出账失败：直接展示后端返回的 message
      message.error(res.data.message || '出账失败')
    }
  } catch (error: any) {
    console.error('出账失败', error)
    message.error(error.message || '出账失败')
  }
}

// ==== 初始化基础选项数据 ====
const fetchCompanyList = async () => {
  try {
    const res = (await getAllCompanyIdNameUsingGet()) as any
    if (res.data.code === 0 && Array.isArray(res.data.data)) {
      const raw = res.data.data || []
      companyList.value = raw.map((item: any) => ({
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

const fetchSupplierList = async () => {
  try {
    // 使用新接口获取供应商公司名称列表（无数据丢失风险）
    const res = await getSupplierCompanyNamesUsingGet()
    if (res?.data?.code === 0 && res?.data?.data) {
      const names: string[] = Array.isArray(res.data.data) ? res.data.data : Array.from(res.data.data as any)
      supplierList.value = Array.from(new Set(names.map((n) => (n || '').trim()).filter((n) => !!n)))
    } else {
      supplierList.value = []
    }
  } catch (error) {
    console.error('获取供应商列表失败', error)
    supplierList.value = []
  }
}

const fetchInvoiceTypeList = async () => {
  try {
    const res = (await queryInvoiceTypeListEnabledUsingPost()) as any
    if (res.data.code === 0) {
      // 将返回的 { label, value }[] 格式转换为 { id, typeName }[] 格式
      const data = res.data.data || []
      invoiceTypeList.value = data.map((item: { label: string; value: string }) => ({
        id: Number(item.value),
        typeName: item.label,
      })) as API.InvoiceType_[]
    }
  } catch (error) {
    console.error('获取发票类型失败', error)
  }
}

const fetchInvoicePurposeList = async () => {
  try {
    const res = (await queryInvoicePurposeListEnabledUsingGet()) as any
    if (res.data.code === 0) {
      invoicePurposeList.value = (res.data.data || []) as any[]
    }
  } catch (error) {
    console.error('获取发票用途失败', error)
  }
}

const fetchBasicOptions = async () => {
  await Promise.all([fetchCompanyList(), fetchSupplierList(), fetchInvoiceTypeList(), fetchInvoicePurposeList()])
}
</script>

<style scoped>
@import '@/styles/filter.css';

.filter-container {
  margin-bottom: 6px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
</style>


