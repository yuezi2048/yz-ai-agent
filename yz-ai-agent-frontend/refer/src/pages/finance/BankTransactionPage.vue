<template>
  <div id="bankTransactionPage">
    <!-- 查询条件 -->
    <a-card class="filter-container" style="margin-bottom: 6px">
      <a-collapse
        v-model:activeKey="filterCollapseKey"
        :bordered="false"
        ghost
        class="filter-collapse"
        @change="handleFilterCollapseChange"
      >
        <a-collapse-panel key="filter" :showArrow="false" :header="null">
          <div class="filter-form-container">
            <!-- 第一行：公司名称、客户单位、到账日期 -->
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="公司名称" class="filter-form-item">
                  <a-button @click="showCompanyModal = true" class="filter-select-button" :style="{ width: companySelectButtonWidth + 'px' }">
                    <span v-if="selectedCompanyNamesText" class="filter-selected-text">
                      {{ selectedCompanyNamesText }}
                    </span>
                    <span v-else>请选择公司名称</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="客户单位" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.clientCompanyName"
                    :options="clientCompanyOptions"
                    placeholder="选择或输入客户单位"
                    :style="{ width: clientCompanyWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="customer-company-input"
                    @select="handleClientCompanySelect"
                    @change="handleClientCompanyChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="到账日期" class="filter-form-item">
                  <div class="date-range-wrapper">
                    <a-date-picker
                      v-model:value="searchParams.startDate"
                      placeholder="开始日期"
                      format="YYYYMMDD"
                      value-format="YYYY-MM-DD"
                      :suffix-icon="null"
                      @change="handleStartDateChange"
                    />
                    <span class="date-separator">至</span>
                    <a-date-picker
                      v-model:value="searchParams.endDate"
                      placeholder="结束日期"
                      format="YYYYMMDD"
                      value-format="YYYY-MM-DD"
                      allow-clear
                      @change="handleEndDateChange"
                    />
                  </div>
                </a-form-item>
              </a-col>
            </a-row>
            <!-- 第二行：业务经理（原业务员）、客户姓名、收付金额范围、两个勾选框（收（正）、支（负）） -->
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="业务经理" class="filter-form-item">
                  <a-input
                    v-model:value="searchParams.salespersonName"
                    placeholder="输入业务经理姓名"
                    class="filter-text-input"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="客户姓名" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.userName"
                    :options="filteredClientContactOptions"
                    placeholder="选择或输入客户姓名"
                    :style="{ width: clientContactWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="client-contact-input"
                    :filter-option="(input: string, option: any) => {
                      const value = option.value || option.label || ''
                      return value.toLowerCase().includes(input.toLowerCase())
                    }"
                    @select="handleClientContactSelect"
                    @change="handleClientContactChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="收付金额" class="filter-form-item">
                  <a-input-number
                    v-model:value="searchParams.minAmount"
                    placeholder="输入金额"
                    :precision="2"
                    :min="0"
                    :step="1000"
                    allow-clear
                    class="amount-input-single"
                    :style="{ width: '100%' }"
                    @change="handleAmountChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="收付类型" class="filter-form-item">
                  <a-space>
                    <a-checkbox v-model:checked="searchParams.includePositive">收（正）</a-checkbox>
                    <a-checkbox v-model:checked="searchParams.includeNegative">支（负）</a-checkbox>
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </a-collapse-panel>
      </a-collapse>
      <div class="filter-actions" :class="{ 'is-collapsed': filterCollapsed }">
        <div class="filter-collapse-toggle" @click="handleFilterCollapseToggle">
          <span class="filter-collapse-toggle-text">{{ filterCollapsed ? '展开筛选条件' : '收起筛选条件' }}</span>
          <component :is="filterCollapsed ? CaretDownOutlined : CaretUpOutlined" />
        </div>
        <div class="filter-actions-buttons" v-if="!filterCollapsed">
          <a-space>
            <a-button type="primary" html-type="submit" @click="doSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button class="btn-grey" @click="doReset">
              <template #icon><DeleteOutlined /></template>
              清空
            </a-button>
          </a-space>
        </div>
      </div>
    </a-card>

    <!-- 表格 -->
    <a-card>
      <template #extra>
        <a-space>
          <a-button @click="openImportModal">
            <template #icon><ReloadOutlined /></template>
            导入
          </a-button>
          <a-button @click="openExportModal">
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
          <a-button @click="handleColumnSetting">
            <template #icon><SettingOutlined /></template>
            自定义列
          </a-button>
          <a-button type="primary" @click="handleAddInputInvoice">
            <template #icon><PlusOutlined /></template>
            添加
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="resizableDisplayColumns"
        :data-source="dataListWithSerial"
        :pagination="false"
        :scroll="{ x: tableWidth, y: tableScrollHeight }"
        size="small"
        class="invoice-standard-table"
        @change="doTableChange"
        :customRow="customBankRow"
        :row-class-name="bankRowClassName"
      >
        <template #headerCell="{ column }">
          <ResizableHeaderCell
            :width="column.width"
            :min-width="column.minWidth || 60"
            :max-width="column.maxWidth || 500"
            :column-key="column.key"
            :is-last-column="resizableDisplayColumns.findIndex(c => (c.key || c.dataIndex) === (column.key || column.dataIndex)) === resizableDisplayColumns.length - 1"
            :fixed="column.fixed"
            :on-resize="(width, deltaX) => updateColumnWidth(column.key || '', width, deltaX)"
            :on-resize-stop="(width, deltaX) => updateColumnWidth(column.key || '', width, deltaX)"
            :hideSeparator="true"
          >
            {{ column.title }}
          </ResizableHeaderCell>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'serialNo'">
            <span>{{ record.serialNo }}</span>
          </template>
          <template v-if="column.dataIndex === 'uniqueKey'">
            <!-- 金额>=0：到款入账（销项发票） -->
            <a-button
              v-if="record.uniqueKey && (record.amount || 0) >= 0"
              type="link"
              size="small"
              style="padding: 0; height: auto;"
              @click="handleViewBalanceInvoicesWithSelect(record)"
            >
              <span style="text-decoration: underline;">{{ record.uniqueKey }}</span>
            </a-button>
            <!-- 金额<0：到款出账（进项发票查询） -->
            <a-button
              v-else-if="record.uniqueKey && (record.amount || 0) < 0"
              type="link"
              size="small"
              style="padding: 0; height: auto; color: #ff4d4f;"
              @click="handleViewOutflowPaymentWithSelect(record)"
            >
              <span style="text-decoration: underline;">{{ record.uniqueKey }}</span>
            </a-button>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'arrivalTime'">
            <span v-if="record.arrivalTime">{{ dayjs(record.arrivalTime).format('YYYY-MM-DD') }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'amount'">
            <div class="amount-cell">
              <span
                class="amount-value"
                :style="{
                  fontWeight: '500',
                  color: (record.amount || 0) < 0 ? '#ff4d4f' : 'inherit'
                }"
              >
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'balance'">
            <div class="amount-cell">
              <span
                class="amount-value"
                :style="{
                  fontWeight: '500',
                  color: (record.balance || 0) < 0 ? '#ff4d4f' : 'inherit'
                }"
              >
                {{ (record.balance || 0).toFixed(2) }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'clientCompanyName'">
            <span v-if="record.clientCompanyName" class="table-cell-content">{{ record.clientCompanyName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'userName'">
            <span v-if="record.userName || record.clientPerson" class="table-cell-content">{{ record.userName || record.clientPerson }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark2'">
            <span v-if="record.remark2" class="table-cell-content">{{ record.remark2 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'salespersonName'">
            <span v-if="record.salespersonName" class="table-cell-content">{{ record.salespersonName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'companyName'">
            <span v-if="record.companyName" class="table-cell-content">{{ record.companyName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'invoiceNo'">
            <div v-if="record.invoiceNo" class="invoice-no-list">
              <div
                v-for="(invoice, index) in record.invoiceNo.split(',')"
                :key="index"
                class="invoice-no-item"
                @click="handleViewInvoice(record, invoice.trim())"
              >
                {{ invoice.trim() }}
              </div>
            </div>
            <span v-else style="color: #999">-</span>
          </template>

          <template v-if="column.dataIndex === 'remark2'">
            <span v-if="record.remark2" class="table-cell-content">{{ record.remark2 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark3'">
            <span v-if="record.remark3" class="table-cell-content">{{ record.remark3 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-column-content">
              <a-space :size="4">
                <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
                <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
              </a-space>
            </div>
          </template>
        </template>
      </a-table>
      <InvoicePagination
        :total="pagination.total || 0"
        :current="pagination.current || 1"
        :page-size="pagination.pageSize || 10"
        @update:current="handlePageChange"
        @update:pageSize="handlePageSizeChange"
      />
    </a-card>

    <!-- 查看关联发票弹窗 -->
    <global-modal
      v-model="invoiceModalVisible"
      title="关联发票信息"
      width="900px"
    >
      <div v-if="currentInvoiceInfo || currentInvoiceFinishInfo">
        <!-- 发票基本信息 -->
        <a-descriptions :column="2" bordered v-if="currentInvoiceInfo" style="margin-bottom: 20px">
          <a-descriptions-item label="发票号码" :span="2">
            {{ currentInvoiceInfo.invoiceNo }}
          </a-descriptions-item>
          <a-descriptions-item label="开票日期">
            {{ currentInvoiceInfo.issueDate }}
          </a-descriptions-item>
          <a-descriptions-item label="开票金额">
            {{ (currentInvoiceInfo.amount || 0).toFixed(2) }}
          </a-descriptions-item>
          <a-descriptions-item label="客户单位" :span="2">
            {{ currentInvoiceInfo.clientCompanyName }}
          </a-descriptions-item>
          <a-descriptions-item label="客户联系人">
            {{ currentInvoiceInfo.clientPerson }}
          </a-descriptions-item>
          <a-descriptions-item label="开票单位">
            {{ currentInvoiceInfo.issuerCompanyName }}
          </a-descriptions-item>
          <a-descriptions-item label="发票类型">
            {{ currentInvoiceInfo.invoiceType }}
          </a-descriptions-item>
          <a-descriptions-item label="开票人">
            {{ currentInvoiceInfo.issuerName || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 到款信息 -->
        <a-descriptions :column="2" bordered v-if="currentInvoiceFinishInfo" title="到款信息">
          <a-descriptions-item label="到款日期">
            {{ currentInvoiceFinishInfo.paidDate || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="到款金额">
            {{ (currentInvoiceFinishInfo.paidAmount || 0).toFixed(2) }}
          </a-descriptions-item>
          <a-descriptions-item label="银行收支记录ID">
            {{ currentInvoiceFinishInfo.bankTransactionId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="银行收支编号">
            {{ currentInvoiceFinishInfo.bankTransactionNo || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <div v-else style="text-align: center; padding: 40px; color: #999">
        正在加载...
      </div>
    </global-modal>

    <!-- 添加/编辑银行收支记录弹窗 -->
    <BankTransactionFormModal
      v-model="bankTransactionModalVisible"
      :title="bankTransactionModalTitle"
      :serial-no="currentEditSerialNo"
      :company-list="companyList"
      :employee-list="employeeList"
      :client-list="clientListAll"
      :form-data="bankTransactionFormData"
      :editing-bank-transaction-id="editingBankTransactionId"
      :editing-remaining-amount="editingRemainingAmount"
      :editing-used-amount="editingUsedAmount"
      :editing-original-amount="editingOriginalAmount"
      :editing-invoice-info="editingInvoiceInfo"
      :transfer-method-options="transferMethodOptions"
      @ok="handleSubmitBankTransaction"
      @next="handleNextBankTransaction"
      @next-edit="handleNextBankTransactionEdit"
      @prev-edit="handlePrevBankTransactionEdit"
    />

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="customizableColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导入银行收支明细弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入银行收支明细"
      description="支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。"
      :show-download-template="true"
      :on-download-template="downloadTemplate"
      :on-import="handleImport"
    />

    <!-- 导出排序设置 -->
    <ExportSortModal
      v-model="exportModalVisible"
      :columns="customizableColumns"
      default-sort-field="arrivalTime"
      default-sort-order="desc"
      @ok="({ sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel }) => handleExport(sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel)"
    />

    <!-- 公司名称选择模态框 -->
    <IssuerCompanySelectModal
      v-model="showCompanyModal"
      :company-list="companyList"
      :selected-company-ids="searchParams.issuerCompanyIds"
      @ok="handleCompanyModalOk"
    />

    <!-- 余额关联发票信息查看模态框 -->
    <BalanceInvoicePaymentModal
      v-model="balanceInvoiceModalVisible"
      :current-balance-record="currentBalanceRecord"
      :balance-invoice-list="balanceInvoiceList"
      :balance-used-amount="balanceUsedAmount"
      :balance-remaining-amount="balanceRemainingAmount"
      :balance-original-amount="balanceOriginalAmount"
      :balance-min-allowed-amount="balanceMinAllowedAmount"
      :invoice-list-loading="invoiceListLoading"
      :invoice-list="invoiceList"
      :client-list="clientListAll"
      :company-list="companyList"
      :employee-list="employeeList"
      :payment-salesperson-id="paymentSalespersonId"
      :transfer-method-options="transferMethodOptions"
      v-model:selected-invoice-ids="selectedInvoiceIds"
      :invoice-search-params="invoiceSearchParams"
      @search="fetchInvoiceListForPayment"
      @reset="resetInvoiceSearch"
      @update:payment-salesperson-id="paymentSalespersonId = $event"
      @submit="handleBalancePaymentSubmit"
      @refresh="currentBalanceRecord && handleViewBalanceInvoices(currentBalanceRecord)"
    />

    <!-- 到款出账模态框（进项发票查询） -->
    <OutflowPaymentModal
      v-model="outflowModalVisible"
      :current-record="currentOutflowRecord"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, watch } from 'vue'
import { CaretUpOutlined, CaretDownOutlined, RightOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import BankTransactionFormModal from '@/modal/finance/BankTransactionFormModal.vue'
import BalanceInvoicePaymentModal from '@/modal/finance/BalanceInvoicePaymentModal.vue'
import OutflowPaymentModal from '@/modal/finance/OutflowPaymentModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import GlobalModal from '@/modal/globalModal.vue'
import { useBankTransactionManage } from '@/hooks/finance/useBankTransactionManage'

const {
  // 筛选折叠
  filterCollapsed,
  filterCollapseKey,
  handleFilterCollapseChange,
  handleFilterCollapseToggle,

  // 基础表格
  loading,
  dataListWithSerial,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  searchParams,
  fetchData,
  doTableChange,
  doSearch,
  doReset,

  // 公司 / 客户筛选
  companyList,
  clientList,
  clientListForFilter,
  clientCompanyOptions,
  clientCompanyWidth,
  filteredClientContactOptions,
  clientContactWidth,
  selectedCompanyNamesText,
  companySelectButtonWidth,
  handleClientCompanySelect,
  handleClientCompanyChange,
  handleClientContactSelect,
  handleClientContactChange,

  // 列设置
  allColumns,
  customizableColumns,
  selectedColumns,
  resizableDisplayColumns,
  tableWidth,
  tableScrollHeight,
  updateColumnWidth,
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

  // 导入导出
  handleExport,
  exportModalVisible,
  openExportModal,
  importModalVisible,
  handleImport,
  openImportModal,
  downloadTemplate,

  // 金额筛选
  handleAmountChange,

  // 银行收支记录弹窗
  bankTransactionModalVisible,
  bankTransactionModalTitle,
  bankTransactionFormData,
  employeeList,
  clientListAll,
  uniqueClientList,
  editingBankTransactionId,
  editingRemainingAmount,
  editingUsedAmount,
  editingOriginalAmount,
  editingInvoiceInfo,
  fetchCompanyList,
  fetchEmployeeList,
  fetchClientList,
  fetchClientCompanyOptions,
  fetchAvailableInvoices,
  handleAddInputInvoice,
  handleSubmitBankTransaction,
  handleCancelBankTransaction,
  handleNextBankTransaction,
  handleNextBankTransactionEdit,
  handlePrevBankTransactionEdit,
  currentEditSerialNo,
  handleEdit,
  handleDelete,

  // 查看发票弹窗
  invoiceModalVisible,
  currentInvoiceInfo,
  currentInvoiceFinishInfo,
  handleViewInvoice,

  // 余额关联发票信息查看
  balanceInvoiceModalVisible,
  currentBalanceRecord,
  balanceInvoiceList,
  balanceUsedAmount,
  balanceRemainingAmount,
  balanceOriginalAmount,
  balanceMinAllowedAmount,
  handleViewBalanceInvoices,
  outflowModalVisible,
  currentOutflowRecord,
  handleViewOutflowPayment,
  invoiceListLoading,
  invoiceList,
  selectedInvoiceIds,
  invoiceSearchParams,
  employeeListForPayment,
  paymentSalespersonId,
  transferMethodOptions,
  fetchInvoiceListForPayment,
  resetInvoiceSearch,
  handleBalancePaymentSubmit,

  // 公司选择模态框
  showCompanyModal,
  handleCompanyModalOk,

  // 初始化
  initPageSettings,
} = useBankTransactionManage()

// 当前选中的银行收支行（用于“点击行选中”和“点击入账/出账链接时选中该行”）
const selectedBankRowKey = ref<string | number | null>(null)

const customBankRow = (record: any) => {
  return {
    onClick: () => {
      selectedBankRowKey.value = record?.id ?? record?.serialNo ?? null
    },
  }
}

const bankRowClassName = (record: any) => {
  const key = record?.id ?? record?.serialNo ?? null
  return key != null && key === selectedBankRowKey.value ? 'bank-row-selected' : ''
}

const handleViewBalanceInvoicesWithSelect = (record: any) => {
  selectedBankRowKey.value = record?.id ?? record?.serialNo ?? null
  handleViewBalanceInvoices(record)
}

const handleViewOutflowPaymentWithSelect = (record: any) => {
  selectedBankRowKey.value = record?.id ?? record?.serialNo ?? null
  handleViewOutflowPayment(record)
}

// 发票日期范围
const invoiceDateRange = ref<[string, string] | null>(null)

const handleStartDateChange = (date: dayjs.Dayjs | string | null) => {
  // value-format="YYYY-MM-DD" 会返回字符串，直接使用字符串即可
  searchParams.startDate = date as any
  pagination.value.current = 1
  fetchData()
}

const handleEndDateChange = (date: dayjs.Dayjs | string | null) => {
  // value-format="YYYY-MM-DD" 会返回字符串，直接使用字符串即可
  searchParams.endDate = date as any
  pagination.value.current = 1
  fetchData()
}

onMounted(async () => {
  initPageSettings()
  await Promise.all([fetchCompanyList(), fetchEmployeeList(), fetchClientList(), fetchClientCompanyOptions()])
  fetchData()
})

// 关闭"到款入账"或"到款出账"模态框时，刷新当前分页数据
watch(balanceInvoiceModalVisible, (val) => {
  if (!val) {
    fetchData()
  }
})

watch(outflowModalVisible, (val) => {
  if (!val) {
    fetchData()
  }
})

// 监听收付类型选项变化，自动更新表格
watch([() => searchParams.includePositive, () => searchParams.includeNegative], () => {
  pagination.value.current = 1
  fetchData()
})
</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';

/* 页面整体 */
#bankTransactionPage {
  padding: 0;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#bankTransactionPage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}

.invoice-no-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invoice-no-item {
  cursor: pointer;
  color: #1890ff;
  text-decoration: underline;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background 0.3s;
}

.invoice-no-item:hover {
  background: #e6f7ff;
}

/* 行选中高亮（无 row-selection 时手动实现） */
.bank-row-selected > td {
  background: #e6f7ff !important;
}

/* 表格单元格内容样式 - 确保不换行，超出显示省略号 */
.table-cell-content {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>

