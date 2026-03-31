<template>
  <div id="companyManagePage">
    <!-- 筛选栏 -->
    <CompanyFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      :selected-company-ids="selectedCompanyIds"
      @update:searchParams="(params) => Object.assign(searchParams, params)"
      @open-company-modal="companySelectModalVisible = true"
      @search="doSearch"
      @reset="doReset"
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
          <a-button type="primary" @click="doAddCompany">
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
          <template v-else-if="column.key === 'isEnabled'">
            <a-tag :color="record.isEnabled === 1 ? 'green' : 'red'" style="margin: 0;">
              {{ record.isEnabled === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'sortOrder'">
            <span>{{ record.sortOrder ?? 0 }}</span>
          </template>
          <template v-else-if="column.key === 'remark'">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <a-tag v-if="record.remark1" color="blue" style="margin: 0;">{{ record.remark1 }}</a-tag>
              <a-tag v-if="record.remark2" color="green" style="margin: 0;">{{ record.remark2 }}</a-tag>
              <a-tag v-if="record.remark3" color="orange" style="margin: 0;">{{ record.remark3 }}</a-tag>
              <span v-if="!record.remark1 && !record.remark2 && !record.remark3" style="color: #999">-</span>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
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
        @update:pageSize="(size) => handlePageSizeChange(pagination.current || 1, size)"
      />
    </a-card>

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="customizableColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导入公司弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入公司信息"
      description="支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。"
      :show-download-template="true"
      :on-download-template="downloadTemplate"
      :on-import="handleImport"
    />

    <!-- 导出排序设置 -->
    <ExportSortModal
      v-model="exportModalVisible"
      :columns="customizableColumns"
      default-sort-field="createTime"
      default-sort-order="desc"
      @ok="({ sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel }) => handleExport(sortField, sortOrder, abortSignal, onProgress, onComplete, onCancel)"
    />

    <!-- 添加/编辑弹窗 -->
    <CompanyEditModal
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
    <!-- 公司名称选择模态框（多选） -->
    <IssuerCompanySelectModal
      v-model="companySelectModalVisible"
      :company-list="companyList"
      :selected-company-ids="selectedCompanyIds"
      @ok="handleCompanyModalOk"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import CompanyEditModal from '@/modal/base/CompanyEditModal.vue'
import CompanyFilterBar from '@/components/base/CompanyFilterBar.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useCompanyManage } from '@/hooks/base/useCompanyManage'

// 使用完整的管理 Hook
const {
  // 基础表格数据和方法
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
  resizableDisplayColumns,
  tableWidth,
  tableScrollHeight,
  updateColumnWidth,
  customizableColumns,
  selectedColumns,

  // 列设置
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

  // 导入导出
  importModalVisible,
  openImportModal,
  handleImport,
  downloadTemplate,
  handleExport,
  exportModalVisible,
  openExportModal,

  // CRUD
  modalVisible,
  modalTitle,
  formData,
  currentEditSerialNo,
  doAddCompany,
  doEdit,
  handleSubmit,
  handleNext,
  handleNextEdit,
  handlePrevEdit,
  doDelete,

  // 公司列表
  companyList,
  fetchCompanyList,

  // 初始化
  initPageSettings,
} = useCompanyManage()

// 公司名称多选模态框
const companySelectModalVisible = ref(false)
const selectedCompanyIds = ref<number[]>([])

const handleCompanyModalOk = (selectedIds: number[]) => {
  selectedCompanyIds.value = selectedIds
  // 将选择的公司 ID 列表写入 searchParams，让请求体使用 companyIds 过滤
  ;(searchParams as any).companyIds = selectedIds
  doSearch()
}

// 页面挂载时初始化
onMounted(() => {
  initPageSettings()
  fetchCompanyList()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#companyManagePage {
  padding: 0;
}

#companyManagePage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
