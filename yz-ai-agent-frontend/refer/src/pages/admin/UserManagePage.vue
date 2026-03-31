<template>
  <div id="userManagePage">
    <!-- 筛选栏 -->
    <UserFilterBar
      :search-params="searchParams"
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
          <a-button type="primary" @click="doAddUser">
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
        :scroll="{ x: tableWidth, y: tableScrollHeight }"
        @change="handleTableChange"
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
            <div v-if="record.permission === '管理员'">
              <a-tag color="red">管理员</a-tag>
            </div>
            <div v-else-if="record.permission === '财务岗位'">
              <a-tag color="green">财务岗位</a-tag>
            </div>
            <div v-else-if="record.permission === '业务岗位'">
              <a-tag color="blue">业务岗位</a-tag>
            </div>
            <div v-else>
              <a-tag color="yellow">{{ record.permission || '未设置' }}</a-tag>
            </div>
          </template>
          <template v-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-if="column.dataIndex === 'updateTime'">
            {{ dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-column-content">
              <a-button danger @click="doDelete(record.id)">删除</a-button>
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

    <AddUserModal
      v-model="addUserModalVisible"
      :onSuccess="onAddUserSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import AddUserModal from '@/modal/AddUserModal.vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import UserFilterBar from '@/components/admin/UserFilterBar.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useUserManage } from '@/hooks/admin/useUserManage'

const {
  // 表格基础
  loading,
  dataListWithSerial,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  searchParams,
  fetchData,
  handleTableChange,
  doSearch,

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

  // 操作
  handleDelete,

  // 初始化
  initPageSettings,
} = useUserManage()

// 用户添加弹窗引用
const addUserModalVisible = ref(false)

const onAddUserSuccess = () => {
  fetchData()
}

const doAddUser = () => {
  addUserModalVisible.value = true
}

onMounted(() => {
  initPageSettings()
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#userManagePage {
  padding: 0;
}

#userManagePage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>

