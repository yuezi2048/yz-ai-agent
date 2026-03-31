<template>
  <div id="inputInvoicePage">
    <!-- 筛选条件 -->
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
            <!-- 第一行（4个）：公司名称（复选模态框）、发票类型（复选模态框）、发票用途（复选模态框）、两个勾选框（财务入账、财务付款） -->
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
                <a-form-item label="发票类型" class="filter-form-item">
                  <a-button @click="showInvoiceTypeModal = true" class="filter-select-button" :style="{ width: invoiceTypeSelectButtonWidth + 'px' }">
                    <span v-if="selectedInvoiceTypeNamesText" class="filter-selected-text">
                      {{ selectedInvoiceTypeNamesText }}
                    </span>
                    <span v-else>请选择发票类型</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="发票用途" class="filter-form-item">
                  <a-button @click="showInvoicePurposeModal = true" class="filter-select-button" :style="{ width: invoicePurposeSelectButtonWidth + 'px' }">
                    <span v-if="selectedInvoicePurposeNamesText" class="filter-selected-text">
                      {{ selectedInvoicePurposeNamesText }}
                    </span>
                    <span v-else>请选择发票用途</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="财务状态" class="filter-form-item">
                  <a-space>
                    <a-checkbox v-model:checked="searchParams.isAccounted" @change="handleFinancialStatusChange">财务入账</a-checkbox>
                    <a-checkbox v-model:checked="searchParams.isPaid" @change="handleFinancialStatusChange">财务付款</a-checkbox>
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>
            <!-- 第二行（3个）：开票日期、供货单位、供货姓名 -->
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="开票日期" class="filter-form-item">
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
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="供货单位" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.supplierName"
                    :options="supplierCompanyOptions"
                    placeholder="选择或输入供货单位"
                    :style="{ width: supplierCompanyWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="customer-company-input"
                    :filter-option="(input: string, option: any) => {
                      const value = option.value || option.label || ''
                      return value.toLowerCase().includes(input.toLowerCase())
                    }"
                    @select="handleSupplierCompanySelect"
                    @change="handleSupplierCompanyChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
                <a-form-item label="供货姓名" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.salespersonName"
                    :options="filteredSupplierContactOptions"
                    placeholder="选择或输入供货姓名"
                    :style="{ width: supplierContactWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="supplier-contact-input"
                    :filter-option="(input: string, option: any) => {
                      const value = option.value || option.label || ''
                      return value.toLowerCase().includes(input.toLowerCase())
                    }"
                    @select="handleSupplierContactSelect"
                    @change="handleSupplierContactChange"
                  />
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
          <a-button type="primary" @click="handleCreate">
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
        :customRow="customInvoiceRow"
        :row-selection="{
          type: 'radio',
          columnWidth: 50,
          selectedRowKeys: selectedInvoiceIds,
          onChange: handleSelectionChange,
          getCheckboxProps: (record: any) => ({
            disabled: false,
          }),
        }"
        :row-key="(record: any) => record.id || record.serialNo"
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
            :hideSeparator="true"
          >
            {{ column.title }}
          </ResizableHeaderCell>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'serialNo'">
            <span>{{ record.serialNo }}</span>
          </template>
          <template v-if="column.dataIndex === 'amount'">
            <div class="amount-cell">
              <span class="amount-value" style="font-weight: 500; color: #1890ff;">
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'paymentAmount'">
            <div class="amount-cell">
              <!-- 计算统一的已付金额：优先使用 totalPaidAmount，其次 paymentAmount -->
              <template v-if="(record.totalPaidAmount ?? record.paymentAmount ?? 0) === 0">
                <!-- 已付金额为 0：红色 -->
                <span class="amount-value" style="color: #ff4d4f; text-decoration: underline;">
                  {{ ((record.totalPaidAmount ?? record.paymentAmount ?? 0) as number).toFixed(2) }}
                </span>
              </template>
              <template v-else>
                <a-button
                  type="link"
                  size="small"
                  style="padding: 0; height: auto;"
                  @click="openPaymentDetailModal(record)"
                >
                  <!-- 已付金额 > 0：默认蓝色；如果等于开票金额则为绿色 -->
                  <span
                    class="amount-value"
                    :style="{
                      color:
                        Number((record.totalPaidAmount ?? record.paymentAmount ?? 0) as number).toFixed(2)
                        === Number(record.amount || 0).toFixed(2)
                          ? '#52c41a'
                          : '#1890ff',
                      textDecoration: 'underline'
                    }"
                  >
                    {{ ((record.totalPaidAmount ?? record.paymentAmount ?? 0) as number).toFixed(2) }}
                  </span>
                </a-button>
              </template>
            </div>
          </template>
          <template v-if="column.dataIndex === 'unpaidAmount'">
            <div class="amount-cell">
              <!-- 未付金额 = 开票金额 - 已付金额 -->
              <span
                class="amount-value"
                :style="{
                  fontWeight: '500',
                  color:
                    ((record.amount || 0) - ((record.totalPaidAmount ?? record.paymentAmount ?? 0) as number)) > 0
                      ? '#ff4d4f'
                      : '#52c41a'
                }"
              >
                {{ ((record.amount || 0) - ((record.totalPaidAmount ?? record.paymentAmount ?? 0) as number)).toFixed(2) }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'transferMethod'">
            <span v-if="record.transferMethod" class="table-cell-content">{{ record.transferMethod }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'isAccounted'">
            <a-tag :color="record.isAccounted === 1 ? 'green' : 'default'">
              {{ record.isAccounted === 1 ? '是' : '否' }}
            </a-tag>
          </template>
          <template v-if="column.dataIndex === 'companyName'">
            <span v-if="record.companyName" class="table-cell-content">{{ record.companyName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'salespersonName'">
            <span v-if="record.salespersonName" class="table-cell-content">{{ record.salespersonName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'issueDate'">
            <span v-if="record.issueDate">{{ dayjs(record.issueDate).format('YYYY-MM-DD') }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'invoiceNo'">
            <span v-if="record.invoiceNo" class="table-cell-content">{{ record.invoiceNo }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'invoiceType'">
            <span v-if="record.invoiceType" class="table-cell-content">{{ record.invoiceType }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'invoicePurpose'">
            <span v-if="record.invoicePurpose" class="table-cell-content">{{ record.invoicePurpose }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'supplierName'">
            <span v-if="record.supplierName" class="table-cell-content">{{ record.supplierName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'supplierContact'">
            <span v-if="record.supplierContact" class="table-cell-content">{{ record.supplierContact }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'invoiceStatus'">
            <span v-if="record.invoiceStatus" class="table-cell-content">{{ record.invoiceStatus }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark1'">
            <span v-if="record.remark1" class="table-cell-content">{{ record.remark1 }}</span>
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

      <!-- 出账按钮和撤销出账按钮 -->
      <div v-if="selectedInvoiceIds.length > 0" style="margin-top: 16px; text-align: left;">
        <a-space :size="16">
          <a-button type="primary" size="middle" @click="handleBatchPayment">
            <template #icon><CheckOutlined /></template>
            出账
          </a-button>
          <a-button type="primary" danger size="middle" @click="handleCancelPaymentClick">
            <template #icon><CloseOutlined /></template>
            撤销出账
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- 创建/编辑弹窗 -->
    <InputInvoiceFormModal
      v-model="modalVisible"
      :title="modalTitle"
      :serial-no="currentEditSerialNo"
      :company-list="companyList"
      :employee-list="employeeList"
      :invoice-type-list="invoiceTypeList"
      :invoice-purpose-list="invoicePurposeList"
      :form-data="formData"
      @ok="handleSubmit"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
    />

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="customizableColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导入进项发票弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入进项发票"
      description="支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。"
      :show-download-template="true"
      :on-download-template="downloadTemplate"
      :on-import="handleImport"
    />

    <!-- 导出排序设置 -->
    <ExportSortModal
      v-model="exportModalVisible"
      :columns="customizableColumns"
      default-sort-field="issueDate"
      default-sort-order="desc"
      @ok="({ sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel }) => handleExport(sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel)"
    />

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

    <!-- 批量出账模态框 -->
    <InvoicePaymentModal
        v-model="batchPaymentModalVisible"
        payment-type="out"
        :selected-invoices="selectedInvoices"
        @ok="handleBatchPaymentOk"
    />

    <!-- 出账明细模态框 -->
    <InputInvoicePaymentModal
        v-model="paymentDetailModalVisible"
        :record="currentPaymentRecord"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import dayjs from 'dayjs'
import { CaretUpOutlined, CaretDownOutlined, RightOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import InvoiceTypeSelectModal from '@/modal/base/InvoiceTypeSelectModal.vue'
import InputInvoicePurposeSelectModal from '@/modal/base/InputInvoicePurposeSelectModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import InputInvoiceFormModal from '@/modal/finance/InputInvoiceFormModal.vue'
import { useInputInvoiceManage } from '@/hooks/finance/useInputInvoiceManage'
import InvoicePaymentModal from '@/modal/finance/InvoicePaymentModal.vue'
import InputInvoicePaymentModal from '@/modal/finance/InputInvoicePaymentModal.vue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const {
  // 折叠
  filterCollapsed,
  filterCollapseKey,
  handleFilterCollapseChange,
  handleFilterCollapseToggle,

  // 基础表格
  loading,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  dataListWithSerial,
  searchParams,
  fetchData,
  doTableChange,
  doSearch,
  handleFilterChange,
  doReset,

  // 公司 / 供应商
  companyList,
  employeeList,
  supplierCompanyOptions,
  supplierCompanyWidth,
  filteredSupplierContactOptions,
  supplierContactWidth,
  selectedCompanyNamesText,
  companySelectButtonWidth,
  handleSupplierCompanySelect,
  handleSupplierCompanyChange,
  handleSupplierContactSelect,
  handleSupplierContactChange,
  handleFinancialStatusChange,
  showCompanyModal,
  handleCompanyModalOk,

  // 发票类型选择模态框
  showInvoiceTypeModal,
  invoiceTypeList,
  selectedInvoiceTypeNamesText,
  invoiceTypeSelectButtonWidth,
  handleInvoiceTypeModalOk,

  // 发票用途选择模态框
  showInvoicePurposeModal,
  invoicePurposeList,
  selectedInvoicePurposeNamesText,
  invoicePurposeSelectButtonWidth,
  handleInvoicePurposeModalOk,

  // 列设置
  resizableDisplayColumns,
  tableWidth,
  tableScrollHeight,
  updateColumnWidth,
  customizableColumns,
  selectedColumns,
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

  // 导入 / 导出
  handleExport,
  exportModalVisible,
  openExportModal,
  importModalVisible,
  openImportModal,
  handleImport,
  downloadTemplate,

  // 创建 / 编辑弹窗
  modalVisible,
  modalTitle,
  formData,
  handleCreate,
  handleEdit,
  handleSubmit,
  handleNext,
  handleNextEdit,
  handlePrevEdit,
  currentEditSerialNo,
  handleDelete,
  handleCancelPayment,

  // 额外
  dateRange,
  handleDateRangeChange,

  // 初始化
  fetchCompanyList,
  fetchEmployeeList,
  fetchSupplierCompanyOptions,
  fetchInvoiceTypeList,
  fetchInvoicePurposeList,
  initPageSettings,
} = useInputInvoiceManage()

const handleStartDateChange = (date: dayjs.Dayjs | string | null) => {
  searchParams.startDate = date as any
  pagination.current = 1
  fetchData()
}

const handleEndDateChange = (date: dayjs.Dayjs | string | null) => {
  searchParams.endDate = date as any
  pagination.current = 1
  fetchData()
}

// 选中发票ID列表
const selectedInvoiceIds = ref<(number | string)[]>([])
const batchPaymentModalVisible = ref(false)

// 出账明细模态框
const paymentDetailModalVisible = ref(false)
const currentPaymentRecord = ref<any>(null)

// 处理表格选中变化
const handleSelectionChange = (selectedRowKeys: (string | number)[]) => {
  selectedInvoiceIds.value = selectedRowKeys
}

// 打开出账明细模态框
const openPaymentDetailModal = (record: any) => {
  currentPaymentRecord.value = record
  paymentDetailModalVisible.value = true
}

// 点击整行选中（单选）
const customInvoiceRow = (record: any) => {
  return {
    onClick: () => {
      const id = record.id || record.serialNo
      if (id == null) return
      selectedInvoiceIds.value = [id]
    },
  }
}

// 获取选中的发票列表
const selectedInvoices = computed(() => {
  return dataListWithSerial.value.filter((item: any) => {
    const id = item.id || item.serialNo
    return selectedInvoiceIds.value.includes(id)
  })
})

// 批量出账
const handleBatchPayment = () => {
  if (selectedInvoices.value.length === 0) {
    return
  }
  batchPaymentModalVisible.value = true
}

// 处理批量出账成功
const handleBatchPaymentOk = () => {
  fetchData()
}

// 处理撤销出账
const handleCancelPaymentClick = () => {
  if (selectedInvoiceIds.value.length === 0) {
    message.warning('请先选择要撤销出账的进项发票')
    return
  }
  handleCancelPayment(selectedInvoiceIds.value)
}

onMounted(async () => {
  initPageSettings()
  await Promise.all([
    fetchCompanyList(),
    fetchEmployeeList(),
    fetchSupplierCompanyOptions(),
    fetchInvoiceTypeList(),
    fetchInvoicePurposeList()
  ])
  fetchData()
})
</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';

/* 页面整体 */
#inputInvoicePage {
  padding: 0;
}

/* 去掉筛选卡片与下方卡片之间的灰色分隔线 */
#inputInvoicePage > .ant-card:first-child {
  border-bottom: none;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#inputInvoicePage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
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

/* 金额范围样式 */
.amount-range-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.amount-range-separator {
  color: #999;
  flex-shrink: 0;
  padding: 0 2px;
}

/* 列宽拖拽样式 */
.resizable-header {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
}

.header-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resize-handle {
  width: 4px;
  cursor: col-resize;
  align-self: stretch;
  margin-left: 4px;
}

.resize-handle:hover {
  background-color: #d9d9d9;
}
</style>

