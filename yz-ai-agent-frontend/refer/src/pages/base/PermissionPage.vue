<template>
  <div id="permissionPage">
    <!-- 筛选栏 -->
    <PermissionFilterBar
      :search-params="searchParams"
      :permission-list="permissionList"
      @update:searchParams="(params) => Object.assign(searchParams, params)"
      @open-permission-modal="permissionSelectModalVisible = true"
      @open-status-modal="statusSelectModalVisible = true"
      @search="doSearch"
      @reset="doReset"
    />

    <!-- 表格 -->
    <a-card>
      <template #extra>
        <a-space>
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
          <template v-if="column.dataIndex === 'isEnabled'">
            <a-tag :color="record.isEnabled === 1 ? 'green' : 'default'">
              {{ record.isEnabled === 1 ? '启用' : '禁用' }}
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
    <PermissionEditModal
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

    <!-- 权限选择模态框 -->
    <PermissionSelectModal
      v-model="permissionSelectModalVisible"
      :permission-list="permissionList"
      :selected-permission-ids="selectedPermissionIds"
      @ok="handlePermissionModalOk"
    />
    <!-- 启用状态选择模态框 -->
    <EnableStatusSelectModal
      v-model="statusSelectModalVisible"
      :selected-status-list="selectedStatusList"
      @ok="handleStatusModalOk"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import PermissionEditModal from '@/modal/base/PermissionEditModal.vue'
import PermissionFilterBar from '@/components/base/PermissionFilterBar.vue'
import PermissionSelectModal from '@/modal/base/PermissionSelectModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import EnableStatusSelectModal from '@/modal/base/EnableStatusSelectModal.vue'
import { usePermissionManage } from '@/hooks/base/usePermissionManage'

const {
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

  allColumns,
  selectedColumns,
  resizableDisplayColumns,
  tableWidth,
  tableScrollHeight,
  updateColumnWidth,

  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

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

  initPageSettings,

  permissionList,
  fetchPermissionList,
} = usePermissionManage()

const permissionSelectModalVisible = ref(false)
const selectedPermissionIds = ref<number[]>([])

// 启用状态选择模态框
const statusSelectModalVisible = ref(false)
const selectedStatusList = ref<number[]>([])

const handlePermissionModalOk = (selectedIds: number[]) => {
  selectedPermissionIds.value = selectedIds
  // 将ID数组转换为名称数组
  const selectedNames = permissionList.value
    .filter(p => p.id && selectedIds.includes(p.id))
    .map(p => p.permissionName || '')
    .filter(Boolean)
  ;(searchParams as any).permissionNames = selectedNames
  doSearch()
}

const handleStatusModalOk = (selected: number[]) => {
  selectedStatusList.value = selected
  ;(searchParams as any).isEnabledList = selected
  doSearch()
}

onMounted(() => {
  initPageSettings()
  fetchPermissionList()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#permissionPage {
  padding: 0;
}

#permissionPage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>


