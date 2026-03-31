<template>
  <div id="accountsReceivablePage">
    <!-- 筛选栏 -->
    <AccountsReceivableFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      :client-list="clientList"
      @open-issuer-company-modal="showIssuerCompanyModal = true"
      @search="doSearch"
      @reset="doReset"
      @client-company-select="handleClientCompanySelect"
      @client-company-change="handleClientCompanyChange"
    />

    <!-- 表格 -->
    <a-card>
      <template #extra>
        <a-space>
          <a-button @click="openExportModal">
            <template #icon><ExportOutlined /></template>
            导出
          </a-button>
          <a-button @click="handleColumnSetting">
            <template #icon><SettingOutlined /></template>
            自定义列
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="resizableDisplayColumns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="false"
        @change="handleTableChange"
        :scroll="{ x: tableWidth, y: tableScrollHeight }"
        size="small"
        class="invoice-standard-table"
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
          <template v-if="column.key === 'clientPerson'">
            <a-space>
              <a-button
                type="link"
                size="small"
                @click="handleShowContactInfo(record)"
                style="padding: 0;"
              >
                {{ record.clientPerson || '-' }}
              </a-button>
              <PhoneOutlined
                style="color: #1890ff; cursor: pointer; font-size: 14px;"
                @click="handleShowContactInfo(record)"
                title="查看联系人信息"
              />
            </a-space>
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

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="allColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导出排序设置 -->
    <ExportSortModal
      v-model="exportModalVisible"
      :columns="allColumns"
      default-sort-field="issueDate"
      default-sort-order="desc"
      @ok="({ sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel }) => handleExport(sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel)"
    />

    <!-- 开票单位选择模态框 -->
    <IssuerCompanySelectModal
      v-model="showIssuerCompanyModal"
      :company-list="companyList"
      :selected-company-ids="searchParams.issuerCompanyIds"
      @ok="handleIssuerCompanyModalOk"
    />

    <!-- 联系人信息弹窗 -->
    <global-modal
      v-model="contactInfoModalVisible"
      title="联系人信息"
      width="800px"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="客户单位" :span="2">
          {{ currentContactInfo?.clientCompanyName }}
        </a-descriptions-item>
        <a-descriptions-item label="客户联系人">
          {{ currentContactInfo?.clientPerson }}
        </a-descriptions-item>
        <a-descriptions-item label="开票单位">
          {{ currentContactInfo?.issuerCompanyName }}
        </a-descriptions-item>
        <a-descriptions-item label="发票号码">
          {{ currentContactInfo?.invoiceNo }}
        </a-descriptions-item>
        <a-descriptions-item label="开票日期">
          {{ currentContactInfo?.issueDate }}
        </a-descriptions-item>
        <a-descriptions-item label="开票金额">
          {{ currentContactInfo?.amount?.toFixed(2) }}
        </a-descriptions-item>
      </a-descriptions>
    </global-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue'
import { PhoneOutlined, ExportOutlined, SettingOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import AccountsReceivableFilterBar from '@/components/finance/AccountsReceivableFilterBar.vue'
import GlobalModal from '@/modal/globalModal.vue'
import { useAccountsReceivableManage } from '@/hooks/finance/useAccountsReceivableManage'

const {
  // 基础表格
  loading,
  dataListWithSerial,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  searchParams,
  fetchData,
  handleTableChange,
  doSearch,
  doReset,

  // 列相关
  allColumns,
  selectedColumns,
  resizableDisplayColumns,
  tableWidth,
  tableScrollHeight,
  updateColumnWidth,

  // 列设置
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

  // 公司 / 客户列表
  companyList,
  clientList,
  fetchCompanyList,
  fetchClientList,

  // 客户单位选择
  handleClientCompanySelect,
  handleClientCompanyChange,

  // 开票单位模态框
  showIssuerCompanyModal,
  handleIssuerCompanyModalOk,

  // 联系人信息弹窗
  contactInfoModalVisible,
  currentContactInfo,
  handleShowContactInfo,

  // 导出
  handleExport,
  exportModalVisible,
  openExportModal,

  // 初始化
  initPageSettings,
} = useAccountsReceivableManage()

onMounted(() => {
  initPageSettings()
  fetchData()
  fetchCompanyList()
  fetchClientList()
})

// 监听开票日期变化，自动更新表格
watch([() => searchParams.startDate, () => searchParams.endDate], () => {
  pagination.value.current = 1
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#accountsReceivablePage {
  padding: 0;
}

#accountsReceivablePage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>

