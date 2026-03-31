<template>
  <div id="invoiceQueryPage">
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
            <a-row :gutter="[16, 16]">
              <!-- 第一行：公司名称、业务经理、客户单位、客户姓名、开票人 -->
              <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <a-form-item label="公司名称" class="filter-form-item">
                  <a-button @click="showIssuerCompanyModal = true" class="filter-select-button" :style="{ width: companySelectButtonWidth + 'px' }">
                    <span v-if="selectedCompanyNamesText" class="filter-selected-text">
                      {{ selectedCompanyNamesText }}
                    </span>
                    <span v-else>请选择公司名称</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <a-form-item label="业务经理" class="filter-form-item">
                  <a-auto-complete
                      v-model:value="searchParams.salespersonName"
                      :options="salespersonOptions"
                      placeholder="选择或输入业务经理"
                      allow-clear
                      class="salesperson-input"
                      @select="handleSalespersonSelect"
                      @change="handleSalespersonChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="客户单位" class="filter-form-item">
                  <a-auto-complete
                      v-model:value="searchParams.customerCompany"
                      :options="customerCompanyOptions"
                      placeholder="选择或输入客户单位"
                      :style="{ width: customerCompanyWidth + 'px', maxWidth: '100%' }"
                      allow-clear
                      class="customer-company-input"
                      @select="handleCustomerCompanySelect"
                      @change="handleCustomerCompanyChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="客户姓名" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.customerContact"
                    :options="filteredCustomerContactOptions"
                    placeholder="选择或输入客户姓名"
                    :style="{ width: customerContactWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="customer-name-input"
                    :filter-option="(input: string, option: any) => {
                      const value = option.value || option.label || ''
                      return value.toLowerCase().includes(input.toLowerCase())
                    }"
                    @select="handleCustomerContactSelect"
                    @change="handleCustomerContactChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="开票人" class="filter-form-item">
                  <a-auto-complete
                      v-model:value="searchParams.issuerName"
                      :options="issuerOptions"
                      placeholder="选择或输入开票人"
                      allow-clear
                      class="issuer-input"
                      @select="handleIssuerSelect"
                      @change="handleIssuerChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="[16, 16]">
              <!-- 第二行：开票日期、开票金额、发票号码、发票种类、标注 -->
              <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
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
              <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
                <a-form-item label="开票金额" class="filter-form-item">
                  <a-input-number
                    v-model:value="searchParams.minInvoiceAmount"
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
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="发票号码" class="filter-form-item">
                  <a-input v-model:value="searchParams.invoiceNumber" placeholder="输入发票号码" allow-clear class="filter-text-input" @change="handleFilterChange" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="发票种类" class="filter-form-item">
                  <a-button @click="showInvoiceTypeModal = true" class="filter-select-button" :style="{ width: invoiceTypeSelectButtonWidth + 'px' }">
                    <span v-if="selectedInvoiceTypeNamesText" class="filter-selected-text">
                      {{ selectedInvoiceTypeNamesText }}
                    </span>
                    <span v-else>请选择发票种类</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4">
                <a-form-item label="标注" class="filter-form-item">
                  <a-button @click="showMarkModal = true" class="filter-select-button" :style="{ width: markSelectButtonWidth + 'px' }">
                    <span v-if="selectedMarkValuesText" class="filter-selected-text">
                      {{ selectedMarkValuesText }}
                    </span>
                    <span v-else>请选择标注</span>
                    <RightOutlined class="filter-select-icon" />
                  </a-button>
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
        <a-flex justify="space-between" align="center" style="width: 100%; flex-wrap: wrap; gap: 16px;">
          <!-- 统计信息 - 固定位置，不随查询条件变化 -->
          <a-space v-if="statistics" class="statistics-info">
            <span style="color: #666;">开票金额合计: <strong style="color: #333;">{{ (statistics.totalAmount || 0).toFixed(2) }}</strong></span>
            <span style="color: #666;">到账金额合计: <strong style="color: #52c41a;">{{ (statistics.totalPaidAmount || 0).toFixed(2) }}</strong></span>
            <span style="color: #666;">未到账金额合计: <strong style="color: #ff4d4f;">{{ ((statistics.totalAmount || 0) - (statistics.totalPaidAmount || 0)).toFixed(2) }}</strong></span>
            <span style="color: #666;">冲红张数: <strong style="color: #ff4d4f;">{{ statistics.redInvoiceCount || 0 }}</strong>张</span>
          </a-space>
          <a-space>
            <a-button @click="handleBatchImport">
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
            <a-button type="primary" @click="handleCreateInvoice">
              <template #icon><PlusOutlined /></template>
              添加
            </a-button>
          </a-space>
        </a-flex>
      </template>

      <!-- 表格容器，不包含滚动条（滚动条由表格内部处理） -->
      <div class="table-container">
        <a-table
            :columns="resizableDisplayColumns"
            :data-source="dataListWithSerial"
            :pagination="false"
            :scroll="{ x: tableWidth, y: tableScrollHeight }"
            size="small"
            @change="doTableChange"
            class="invoice-standard-table"
            :customRow="customInvoiceRow"
            :row-selection="{
              type: 'radio',
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
              <span class="amount-value" :style="{ color: record.amount < 0 ? 'red' : 'inherit', fontWeight: record.amount < 0 ? 'bold' : 'normal' }">
                {{ (record.amount || 0).toFixed(2) }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'totalPaidAmount'">
            <div class="amount-cell">
              <a-button
                v-if="record.totalPaidAmount !== null && record.totalPaidAmount !== undefined"
                type="link"
                size="small"
                style="padding: 0; height: auto;"
                @click="openPaidAmountList(record)"
              >
                <span class="amount-value" style="text-decoration: underline;">
                  {{ (record.totalPaidAmount || 0).toFixed(2) }}
                </span>
              </a-button>
              <span v-else class="amount-value" style="color: #999;">-</span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'paidDate'">
            <span v-if="record.paidDate">{{ record.paidDate }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.key === 'invoiceStatus'">
            <!-- 红字发票：金额为负数 -->
            <a-tag
                v-if="record.amount < 0"
                color="red"
            >
              红字发票
            </a-tag>
            <!-- 已冲红：原发票已被冲红（存在对应的红字发票） -->
            <a-tag
                v-else-if="record.isRedInvoiceCreated"
                color="orange"
            >
              已冲红
            </a-tag>
            <!-- 已到款：开票金额 = 合计入账金额 -->
            <a-tag
                v-else-if="Math.abs((record.amount || 0) - (record.totalPaidAmount || 0)) < 0.01"
                color="green"
            >
              已到款
            </a-tag>
            <!-- 未到款：开票金额 > 合计入账金额 -->
            <a-tag
                v-else-if="(record.amount || 0) > (record.totalPaidAmount || 0)"
                color="red"
            >
              {{ (() => {
                const invoiceAmount = record.amount || 0
                const totalPaidAmount = record.totalPaidAmount || 0
                const pendingAmount = invoiceAmount - totalPaidAmount
                return `未到款（待入账${pendingAmount.toFixed(2)}）`
              })() }}
            </a-tag>
            <!-- 其他情况 -->
            <a-tag
                v-else
                color="default"
            >
              未到款
            </a-tag>
          </template>
          <template v-if="column.dataIndex === 'remark1'">
            <span v-if="record.remark1">{{ record.remark1 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark2'">
            <span v-if="record.remark2">{{ record.remark2 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark3'">
            <span v-if="record.remark3">{{ record.remark3 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'salespersonName'">
            <span v-if="record.salespersonName">{{ record.salespersonName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'issuerName'">
            <span v-if="record.issuerName">{{ record.issuerName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'mark'">
            <span v-if="record.mark">{{ record.mark }}</span>
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
      </div>

      <!-- 自定义分页器 -->
      <InvoicePagination
        :total="pagination.total || 0"
        :current="pagination.current || 1"
        :page-size="pagination.pageSize || 10"
        @update:current="handlePageChange"
        @update:pageSize="handlePageSizeChange"
      />

      <!-- 入账按钮和撤销入账按钮 -->
      <div v-if="selectedInvoiceIds.length > 0" style="margin-top: 16px; text-align: left;">
        <a-space :size="16">
          <a-button type="primary" size="middle" @click="handleBatchPayment">
            <template #icon><CheckOutlined /></template>
            入账
          </a-button>
          <a-button type="primary" danger size="middle" @click="handleCancelPaymentClick">
            <template #icon><CloseOutlined /></template>
            撤销入账
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
        v-model="columnSettingVisible"
        :columns="customizableColumns"
        :selected-columns="selectedColumns"
        @ok="handleColumnSettingOk"
    />

    <!-- 入账弹窗 -->
    <PaymentModal
        v-model="paymentModalVisible"
        :invoice-amount="currentPaymentRecord?.amount || 0"
        :available-bank-transactions="availableBankTransactions"
        :employee-list="employeeList"
        :existing-payments="existingPayments"
        @ok="handlePaymentSubmit"
        @delete="handlePaymentDelete"
    />

    <!-- 批量导入弹窗 -->
    <ImportModal
        v-model="batchImportModalVisible"
        title="批量导入"
        description="支持格式：.xlsx, .xls"
        :show-upload-icon="true"
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
        v-model="showIssuerCompanyModal"
        :company-list="companyList"
        :selected-company-ids="searchParams.issuerCompanyIds"
        @ok="handleIssuerCompanyModalOk"
    />

    <!-- 批量入账模态框 -->
    <InvoicePaymentModal
        v-model="batchPaymentModalVisible"
        payment-type="in"
        :selected-invoices="selectedInvoices"
        @ok="handleBatchPaymentOk"
    />

    <!-- 标号选择模态框 -->
    <MarkSelectModal
        v-model="showMarkModal"
        :selected-mark-values="searchParams.markValues"
        @ok="handleMarkModalOk"
    />

    <!-- 发票种类选择模态框 -->
    <InvoiceTypeSelectModal
        v-model="showInvoiceTypeModal"
        :type-list="invoiceTypeList"
        :selected-type-names="searchParams.invoiceTypes"
        @ok="handleInvoiceTypeModalOk"
    />

    <!-- 创建/编辑发票弹窗 -->
    <InvoiceFormModal
        v-model="invoiceModalVisible"
        :title="invoiceModalTitle"
        :serial-no="currentEditSerialNo"
        :company-list="companyList"
        :client-list="clientList"
        :invoice-type-list="invoiceTypeList"
        :employee-list="employeeList"
        :mark-list="markList"
        :form-data="invoiceFormData"
        @ok="handleInvoiceSubmit"
        @next="handleInvoiceNext"
        @next-edit="handleInvoiceNextEdit"
        @prev-edit="handleInvoicePrevEditWrapper"
        @reset="handleInvoiceReset"
        @client-created="handleClientCreated"
        @employee-created="handleEmployeeCreated"
    />

    <!-- 到账明细弹窗（到账金额 + 到账日期） -->
    <GlobalModal
      v-model="paidDetailModalVisible"
      :title="paidDetailModalTitle"
      width="720px"
    >
      <div v-if="currentPaidRecord" style="margin-bottom: 8px; color: #666;">
        发票号：<strong style="color:#333;">{{ currentPaidRecord.invoiceNo }}</strong>
      </div>

      <div style="font-weight: 600; margin-bottom: 8px;">到账明细</div>
      <a-table
        size="small"
        :pagination="false"
        :data-source="paidDetailRows"
        :row-key="(r: any) => r.index"
        bordered
      >
        <a-table-column title="序号" data-index="index" width="70" />
        <a-table-column title="到账日期" data-index="paidDate" />
        <a-table-column title="到账金额" data-index="paidAmount" align="right">
          <template #default="{ record: row }">
            <span>{{ row.paidAmountText }}</span>
          </template>
        </a-table-column>
        <a-table-column title="公司账号" data-index="companyAccount" />
        <a-table-column title="转账方式" data-index="transferMethod" />
        <a-table-column title="备注" data-index="remark1" />
      </a-table>

      <a-divider style="margin: 12px 0;" />

      <div v-if="currentPaidRecord" style="display:flex; flex-wrap: wrap; gap: 12px;">
        <div style="flex: 1; min-width: 180px;">
          <div style="color:#999; font-size: 12px;">开票金额</div>
          <div style="font-weight: 600;">
            {{ Number(currentPaidRecord.amount || 0).toFixed(2) }}
          </div>
        </div>
        <div style="flex: 1; min-width: 180px;">
          <div style="color:#999; font-size: 12px;">合计入账金额</div>
          <div style="font-weight: 600; color:#52c41a;">
            {{ Number(currentPaidRecord.totalPaidAmount || 0).toFixed(2) }}
          </div>
        </div>
        <div style="flex: 1; min-width: 180px;">
          <div style="color:#999; font-size: 12px;">发票状态</div>
          <div :style="{ fontWeight: 600, color: getInvoiceStatusColor(currentPaidRecord) }">
            {{ getInvoiceStatusText(currentPaidRecord) }}
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display:flex; justify-content:flex-end; gap: 8px;">
          <a-button @click="paidDetailModalVisible = false">关闭</a-button>
        </div>
      </template>
    </GlobalModal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { CaretUpOutlined, CaretDownOutlined, RightOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import InvoiceFormModal from '@/modal/invoice/InvoiceFormModal.vue'
import PaymentModal from '@/modal/invoice/PaymentModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import MarkSelectModal from '@/modal/MarkSelectModal.vue'
import InvoiceTypeSelectModal from '@/modal/base/InvoiceTypeSelectModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useInvoiceQueryManage } from '@/hooks/invoice/useInvoiceQueryManage'
import GlobalModal from '@/modal/globalModal.vue'
import { message } from 'ant-design-vue'
import InvoicePaymentModal from '@/modal/finance/InvoicePaymentModal.vue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { listBankTransactionByIdsUsingPost } from '@/api/caiwuguanlijiekou'

const {
  // 筛选折叠
  filterCollapsed,
  filterCollapseKey,
  handleFilterCollapseChange,
  handleFilterCollapseToggle,

  // 基础表格
  loading,
  pagination,
  searchParams,
  dataListWithSerial,
  total,
  statistics,
  tableScrollHeight,
  fetchData,
  doTableChange,
  handlePageChange,
  handlePageSizeChange,
  doSearch,
  doReset,

  // 公司 / 客户筛选
  companyList,
  clientList,
  customerCompanyOptions,
  customerCompanyWidth,
  filteredCustomerContactOptions,
  customerContactWidth,
  selectedCompanyNamesText,
  companySelectButtonWidth,
  handleCustomerCompanySelect,
  handleCustomerCompanyChange,
  handleCustomerContactSelect,
  handleCustomerContactChange,

  // 发票类型 / 标记
  invoiceTypeList,
  selectedInvoiceTypeNamesText,
  invoiceTypeSelectButtonWidth,
  markList,
  selectedMarkValuesText,
  markSelectButtonWidth,

  // 业务经理 / 开票人自动填充
  salespersonOptions,
  salespersonWidth,
  handleSalespersonSelect,
  handleSalespersonChange,
  issuerOptions,
  issuerWidth,
  handleIssuerSelect,
  handleIssuerChange,
  handleFilterChange,

  // 列设置
  allColumns,
  customizableColumns,
  selectedColumns,
  resizableDisplayColumns,
  tableWidth,
  updateColumnWidth,
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

  // 导出 / 导入
  handleExport,
  exportModalVisible,
  openExportModal,
  batchImportModalVisible,
  handleBatchImport,
  handleImport,
  downloadTemplate,

  // 金额筛选
  handleAmountChange,

  // 公司名称选择模态框
  showIssuerCompanyModal,
  handleIssuerCompanyModalOk,

  // 标号选择模态框
  showMarkModal,
  handleMarkModalOk,

  // 发票种类选择模态框
  showInvoiceTypeModal,
  handleInvoiceTypeModalOk,

  // 创建/编辑发票
  invoiceModalVisible,
  invoiceModalTitle,
  invoiceFormData,
  editingInvoiceId,
  currentEditIndex,
  currentEditSerialNo,
  employeeList,
  handleCreateInvoice,
  handleEdit,
  handleInvoiceSubmit,
  handleInvoiceNext,
  handleInvoiceNextEdit,
  handleInvoicePrevEdit,
  handleDelete,

  // 入账
  paymentModalVisible,
  currentPaymentRecord,
  availableBankTransactions,
  existingPayments,
  handlePayment,
  handlePaymentDelete,
  handlePaymentSubmit,
  handleCancelPayment,

  // 基础数据加载
  fetchCompanyList,
  fetchClientList,
  fetchEmployeeList,
  fetchInvoiceTypeList,
  fetchMarkList,

  // 初始化
  initPageSettings,
} = useInvoiceQueryManage()

// ===== 到账列表弹窗 =====
const paidDetailModalVisible = ref(false)
const currentPaidRecord = ref<any>(null)
const bankTransactionMap = ref<Map<string, API.BankTransactionRelatedInvoiceVO>>(new Map())

// 到账明细模态框标题
const paidDetailModalTitle = computed(() => {
  if (currentPaidRecord.value?.uniqueKey) {
    return `到账明细（${currentPaidRecord.value.uniqueKey}）`
  }
  return '到账明细'
})

const paidDetailRows = computed(() => {
  const paidAmountList = (currentPaidRecord.value?.paidAmountList || []) as any[]
  const paidDateList = (currentPaidRecord.value?.paidDateList || []) as any[]
  const bankIdList = (currentPaidRecord.value?.bankIdList || []) as (string | number)[]
  const len = Math.max(paidAmountList.length, paidDateList.length, bankIdList.length)

  return Array.from({ length: len }).map((_, i) => {
    const amount = paidAmountList[i]
    const date = paidDateList[i]
    // 通过 bankIdList 中的 ID 获取对应的银行收支信息（统一转换为字符串匹配）
    const bankId = bankIdList[i]
    const bankIdKey = bankId ? String(bankId) : null
    const bankTransaction = bankIdKey ? bankTransactionMap.value.get(bankIdKey) || null : null
    
    return {
      index: i + 1,
      paidDate: date || '-',
      paidAmountText: amount === null || amount === undefined ? '-' : Number(amount || 0).toFixed(2),
      companyAccount: bankTransaction?.remark3 || '-',
      transferMethod: bankTransaction?.transferMethod || '-',
      remark1: bankTransaction?.remark1 || '-',
    }
  })
})

const openPaidAmountList = async (record: any) => {
  currentPaidRecord.value = record
  bankTransactionMap.value.clear()
  
  // 如果有 bankIdList，获取银行收支信息
  if (record.bankIdList && Array.isArray(record.bankIdList) && record.bankIdList.length > 0) {
    try {
      // 将字符串数组转换为数字数组
      const bankIds = record.bankIdList.map((id: string | number) => Number(id)).filter((id: number) => !isNaN(id))
      
      if (bankIds.length > 0) {
        const res = (await listBankTransactionByIdsUsingPost(bankIds)) as any
        if (res.data.code === 0 && res.data.data) {
          // 将银行收支信息存储到 Map 中，以 id 为 key（统一转换为字符串，因为响应中的 id 可能是字符串）
          const bankTransactions = res.data.data as API.BankTransactionRelatedInvoiceVO[]
          bankTransactions.forEach((bt) => {
            if (bt.id !== undefined && bt.id !== null) {
              // 统一使用字符串作为 key，因为 bankIdList 中的 ID 可能是字符串
              const idKey = String(bt.id)
              bankTransactionMap.value.set(idKey, bt)
            }
          })
        }
      }
    } catch (error) {
      console.error('获取银行收支信息失败', error)
    }
  }
  
  paidDetailModalVisible.value = true
}

const getInvoiceStatusText = (record: any) => {
  if (!record) return ''
  if ((record.amount ?? 0) < 0) return '红字发票'
  if (record.isRedInvoiceCreated) return '已冲红'
  
  // 根据开票金额和合计入账金额判断状态
  const invoiceAmount = Number(record.amount || 0)
  const totalPaidAmount = Number(record.totalPaidAmount || 0)
  
  if (Math.abs(invoiceAmount - totalPaidAmount) < 0.01) {
    // 开票金额 = 合计入账金额（允许0.01的误差）
    return '已到款'
  } else if (invoiceAmount > totalPaidAmount) {
    // 开票金额 > 合计入账金额
    const pendingAmount = invoiceAmount - totalPaidAmount
    return `未到款（待入账${pendingAmount.toFixed(2)}）`
  }
  
  // 其他情况（理论上不应该出现）
  const pendingAmount = invoiceAmount - totalPaidAmount
  return `未到款（待入账${pendingAmount.toFixed(2)}）`
}

// 获取发票状态的颜色
const getInvoiceStatusColor = (record: any) => {
  if (!record) return ''
  if ((record.amount ?? 0) < 0) return '#ff4d4f' // 红字发票：红色
  if (record.isRedInvoiceCreated) return '#ff4d4f' // 已冲红：红色
  
  // 根据开票金额和合计入账金额判断颜色
  const invoiceAmount = Number(record.amount || 0)
  const totalPaidAmount = Number(record.totalPaidAmount || 0)
  
  if (Math.abs(invoiceAmount - totalPaidAmount) < 0.01) {
    // 开票金额 = 合计入账金额：绿色
    return '#52c41a'
  } else if (invoiceAmount > totalPaidAmount) {
    // 开票金额 > 合计入账金额：红色
    return '#ff4d4f'
  }
  
  // 其他情况：红色
  return '#ff4d4f'
}

const handleStartDateChange = (date: dayjs.Dayjs | string | null) => {
  searchParams.startDate = date as any
  pagination.value.current = 1
  fetchData()
}

const handleEndDateChange = (date: dayjs.Dayjs | string | null) => {
  searchParams.endDate = date as any
  pagination.value.current = 1
  fetchData()
}

// 处理上一条编辑事件（直接使用 hook 中的方法）
const handleInvoicePrevEditWrapper = async (callback?: (success: boolean) => void) => {
  await handleInvoicePrevEdit(callback)
}

// 处理重置事件
const handleInvoiceReset = () => {
  // 重置功能已在 InvoiceFormModal 内部处理
  // 这里可以添加额外的重置逻辑（如果需要）
}

// 处理客户创建成功事件
const handleClientCreated = async () => {
  // 刷新客户列表
  await fetchClientList()
}

// 处理员工创建成功事件
const handleEmployeeCreated = async () => {
  // 刷新员工列表
  await fetchEmployeeList()
}

// 选中发票ID列表
const selectedInvoiceIds = ref<(number | string)[]>([])
const batchPaymentModalVisible = ref(false)

// 处理表格选中变化
const handleSelectionChange = (selectedRowKeys: (string | number)[]) => {
  selectedInvoiceIds.value = selectedRowKeys
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

// 点击“入账”时，同步选中当前行（避免用户未手动点选）
const handlePaymentWithSelect = (record: any) => {
  const id = record?.id || record?.serialNo
  if (id != null) {
    selectedInvoiceIds.value = [id]
  }
  handlePayment(record)
}

// 获取选中的发票列表
const selectedInvoices = computed(() => {
  return dataListWithSerial.value.filter((item: any) => {
    const id = item.id || item.serialNo
    return selectedInvoiceIds.value.includes(id)
  })
})

// 批量入账
const handleBatchPayment = () => {
  if (selectedInvoices.value.length === 0) {
    return
  }
  batchPaymentModalVisible.value = true
}

// 处理批量入账成功
const handleBatchPaymentOk = () => {
  fetchData()
}

// 处理撤销入账
const handleCancelPaymentClick = () => {
  if (selectedInvoiceIds.value.length === 0) {
    message.warning('请先选择要撤销入账的销项发票')
    return
  }
  handleCancelPayment(selectedInvoiceIds.value)
}

onMounted(async () => {
  initPageSettings()
  await Promise.all([
    fetchCompanyList(),
    fetchClientList(),
    fetchEmployeeList(),
    fetchInvoiceTypeList(),
    fetchMarkList(),
  ])
  fetchData()
})

</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';
@import '@/styles/pagination.css';

#invoiceQueryPage {
  padding: 0;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#invoiceQueryPage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}

/* 统计信息固定位置 */
.statistics-info {
  flex: 1;
  min-width: 0;
  position: sticky;
  left: 0;
  z-index: 10;
}
</style>

