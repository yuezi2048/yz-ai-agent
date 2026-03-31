<template>
  <div id="supplierManagePage">
    <!-- 筛选栏 -->
    <SupplierFilterBar
      :search-params="searchParams"
      :supplier-list="dataList"
      @update:search-params="(params) => Object.assign(searchParams, params)"
      @search="doSearch"
      @reset="doReset"
      @supplier-company-select="handleSupplierCompanySelect"
      @supplier-company-change="handleSupplierCompanyChange"
      @filter-change="handleFilterChange"
    />

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
          <a-button type="primary" @click="doAdd">
            <template #icon><PlusOutlined /></template>
            添加
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
          <template v-if="column.dataIndex === 'serialNo'">
            <span>{{ record.serialNo }}</span>
          </template>
          <template v-if="column.dataIndex === 'companyName'">
            <span v-if="record.companyName" class="table-cell-content">{{ record.companyName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'taxNo'">
            <span v-if="record.taxNo" class="table-cell-content">{{ record.taxNo }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'legalPerson'">
            <span v-if="record.legalPerson" class="table-cell-content">{{ record.legalPerson }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'supplierName'">
            <span v-if="record.supplierName" class="table-cell-content">{{ record.supplierName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'supplierPhone'">
            <span v-if="record.supplierPhone" class="table-cell-content">{{ record.supplierPhone }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'registerAddress'">
            <span v-if="record.registerAddress" class="table-cell-content">{{ record.registerAddress }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'registerPhone'">
            <span v-if="record.registerPhone" class="table-cell-content">{{ record.registerPhone }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'bankName'">
            <span v-if="record.bankName" class="table-cell-content">{{ record.bankName }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'bankAccount'">
            <span v-if="record.bankAccount" class="table-cell-content">{{ record.bankAccount }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'email'">
            <span v-if="record.email" class="table-cell-content">{{ record.email }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'businessScope'">
            <span v-if="record.businessScope" class="table-cell-content">{{ record.businessScope }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'createTime'">
            <span v-if="record.createTime" class="table-cell-content">{{ record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD') : '' }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.dataIndex === 'remark1'">
            <span v-if="record.remark1" class="table-cell-content">{{ record.remark1 }}</span>
            <span v-else style="color: #999">-</span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-column-content">
              <a-space :size="4">
                <a-button type="link" size="small" @click="doEdit(record)">编辑</a-button>
                <a-button danger type="link" size="small" @click="doDelete(record.id)">删除</a-button>
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

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="allColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 添加/编辑弹窗 -->
    <SupplierEditModal
      v-model="modalVisible"
      :title="modalTitle"
      :serial-no="currentEditSerialNo"
      :form-data="formData"
      @ok="handleSubmit"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
      @reset="() => {}"
    />

    <!-- 导入弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入供应商信息"
      description="支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。"
      :show-download-template="true"
      :on-download-template="downloadTemplate"
      :on-import="handleImport"
    />

    <!-- 导出排序设置 -->
    <ExportSortModal
      v-model="exportModalVisible"
      :columns="allColumns"
      default-sort-field="createTime"
      default-sort-order="desc"
      @ok="({ sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel }) => handleExport(sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel)"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import SupplierEditModal from '@/modal/supplier/SupplierEditModal.vue'
import SupplierFilterBar from '@/components/supplier/SupplierFilterBar.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useSupplierManage } from '@/hooks/supplier/useSupplierManage'
import dayjs from 'dayjs'

const {
  // 基础表格
  loading,
  dataList,
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

  // 供应商公司筛选
  handleSupplierCompanySelect,
  handleSupplierCompanyChange,
  handleFilterChange,

  // 模态框 / 表单
  modalVisible,
  modalTitle,
  formData,
  currentEditSerialNo,
  doAdd,
  doEdit,
  handleSubmit,
  handleNext,
  handleNextEdit,
  handlePrevEdit,
  doDelete,

  // 导入导出
  handleExport,
  exportModalVisible,
  openExportModal,
  importModalVisible,
  handleImport,
  openImportModal,
  downloadTemplate,

  // 初始化
  initPageSettings,
} = useSupplierManage()

onMounted(() => {
  initPageSettings()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#supplierManagePage {
  padding: 0;
}

#supplierManagePage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}

.table-cell-content {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

