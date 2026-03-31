<template>
  <div id="employeeManagePage">
    <!-- 筛选栏 -->
    <EmployeeFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      @update:searchParams="(params) => Object.assign(searchParams, params)"
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
          <template v-if="column.dataIndex === 'permission'">
            <a-tag :color="getPermissionColor(record.permission)">
              {{ record.permission || '未设置' }}
            </a-tag>
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
        @update:pageSize="(size) => handlePageSizeChange(1, size)"
      />
    </a-card>

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="allColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导入弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入员工信息"
      description="支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。"
      :show-download-template="true"
      :on-download-template="downloadTemplate"
      :on-import="handleImport"
    />

    <!-- 添加/编辑弹窗 -->
    <EmployeeEditModal
      v-model="modalVisible"
      :title="modalTitle"
      :serial-no="currentEditSerialNo"
      :company-list="companyList"
      :form-data="formData"
      @ok="handleEmployeeModalOk"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @prev-edit="handlePrevEdit"
      @reset="() => {}"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { ReloadOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ImportModal from '@/modal/ImportModal.vue'
import EmployeeEditModal from '@/modal/employee/EmployeeEditModal.vue'
import EmployeeFilterBar from '@/components/employee/EmployeeFilterBar.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useEmployeeManage } from '@/hooks/employee/useEmployeeManage'

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

  // 权限展示
  getPermissionColor,

  // 公司列表
  companyList,
  fetchCompanyList,

  // 导入相关
  importModalVisible,
  handleImport,
  openImportModal,
  downloadTemplate,

  // CRUD
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

  // 初始化
  initPageSettings,
} = useEmployeeManage()

const handleEmployeeModalOk = (data: any, callback: (success: boolean) => void) => {
  handleSubmit(data as API.EmployeeAddDTO, callback)
}

// 页面挂载时初始化
onMounted(() => {
  initPageSettings()
  fetchCompanyList()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';

#employeeManagePage {
  padding: 0;
}

/* 去掉筛选卡片与下方卡片之间的灰色分隔线 */
#employeeManagePage > .ant-card:first-child {
  border-bottom: none;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#employeeManagePage :deep(.ant-card-body) {
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
</style>
