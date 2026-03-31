    <template>
  <div id="clientManagePage">
    <!-- 筛选条件 -->
    <a-card class="filter-container" style="margin-bottom: 6px">
      <a-collapse
        v-model:activeKey="filterCollapseKey"
        :bordered="false"
        ghost
        class="filter-collapse"
        @change="handleFilterCollapseChange"
        :label-col="{ span: 18 }"
        :wrapper-col="{ span: 6 }"
      >
        <a-collapse-panel key="filter" :showArrow="false" :header="null">
          <div class="filter-form-container">
            <a-row :gutter="[16, 16]">
              <!-- 第一行：客户单位、客户姓名、客户电话 -->
              <a-col :span="8">
                <a-form-item label="客户单位" class="filter-form-item">
                  <a-auto-complete
                    v-model:value="searchParams.companyName"
                    :options="clientCompanyOptions"
                    placeholder="选择或输入客户单位"
                    :style="{ width: customerCompanyWidth + 'px', maxWidth: '100%' }"
                    allow-clear
                    class="customer-company-input"
                    :filter-option="(input: string, option: any) => {
                      const value = option.value || option.label || ''
                      return value.toLowerCase().includes(input.toLowerCase())
                    }"
                    @select="handleClientCompanySelect"
                    @change="handleClientCompanyChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="客户姓名" class="filter-form-item">
                  <a-input v-model:value="searchParams.userName" placeholder="输入客户姓名" class="filter-text-input" allow-clear @change="handleFilterChange" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="客户电话" class="filter-form-item">
                  <a-input v-model:value="searchParams.userPhone" placeholder="输入客户电话" class="filter-text-input" allow-clear @change="handleFilterChange" />
                </a-form-item>
              </a-col>
              <!-- 第二行：公司税号、法人、注册地址 -->
              <a-col :span="8">
                <a-form-item label="公司税号" class="filter-form-item">
                  <a-input v-model:value="searchParams.taxNo" placeholder="输入公司税号" class="filter-text-input" allow-clear @change="handleFilterChange" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="法人" class="filter-form-item">
                  <a-input v-model:value="searchParams.legalPerson" placeholder="输入法人" class="filter-text-input" allow-clear @change="handleFilterChange" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="注册地址" class="filter-form-item">
                  <a-input v-model:value="searchParams.registerAddress" placeholder="输入注册地址" class="filter-text-input" allow-clear @change="handleFilterChange" />
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
          <a-button type="primary" @click="doAddClient">
            <template #icon><PlusOutlined /></template>
            添加
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="resizableDisplayColumns"
        :data-source="dataListWithSerial"
        :pagination="false"
        @change="doTableChange"
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
        <template v-if="column.dataIndex === 'userName'">
          <span v-if="record.userName" class="table-cell-content">{{ record.userName }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'userPhone'">
          <span v-if="record.userPhone" class="table-cell-content">{{ record.userPhone }}</span>
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
        <template v-if="column.dataIndex === 'legalPerson'">
          <span v-if="record.legalPerson" class="table-cell-content">{{ record.legalPerson }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'registerPhone'">
          <span v-if="record.registerPhone" class="table-cell-content">{{ record.registerPhone }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'registerAddress'">
          <span v-if="record.registerAddress" class="table-cell-content">{{ record.registerAddress }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'email'">
          <span v-if="record.email" class="table-cell-content">{{ record.email }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.key === 'wechat'">
          <span v-if="record.remark2" class="table-cell-content">{{ record.remark2 }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'businessScope'">
          <span v-if="record.businessScope" class="table-cell-content">{{ record.businessScope }}</span>
          <span v-else style="color: #999">-</span>
        </template>
        <template v-if="column.dataIndex === 'salespersonName'">
          <span v-if="record.salespersonName" class="table-cell-content">{{ record.salespersonName }}</span>
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

    <!-- 添加/编辑弹窗 -->
    <ClientFormModal
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

    <!-- 自定义列设置弹窗 -->
    <ColumnSettingModal
      v-model="columnSettingVisible"
      :columns="customizableColumns"
      :selected-columns="selectedColumns"
      @ok="handleColumnSettingOk"
    />

    <!-- 导入客户弹窗 -->
    <ImportModal
      v-model="importModalVisible"
      title="导入客户信息"
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
  </div>
</template>

<script lang="ts" setup>
import { CaretUpOutlined, CaretDownOutlined, DownloadOutlined, SearchOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import ImportModal from '@/modal/ImportModal.vue'
import ClientFormModal from '@/modal/base/ClientFormModal.vue'
import ColumnSettingModal from '@/modal/ColumnSettingModal.vue'
import ExportSortModal from '@/modal/ExportSortModal.vue'
import InvoicePagination from '@/components/common/InvoicePagination.vue'
import { useClientManage } from '@/hooks/invoice/useClientManage'
import dayjs from 'dayjs'

const {
  // 筛选收缩
  filterCollapsed,
  filterCollapseKey,
  handleFilterCollapseChange,
  handleFilterCollapseToggle,

  // 列 & 列设置
  allColumns,
  selectedColumns,
  customizableColumns,
  resizableDisplayColumns,
  tableWidth,
  updateColumnWidth,
  tableScrollHeight,
  columnSettingVisible,
  handleColumnSetting,
  handleColumnSettingOk,

    // 数据 & 分页
    dataListWithSerial,
    pagination,
    handlePageChange,
    handlePageSizeChange,
    doTableChange,

  // 筛选
  searchParams,
  clientCompanyOptions,
  customerCompanyWidth,
  handleClientCompanySelect,
  handleClientCompanyChange,
  handleFilterChange,
  doSearch,
  doReset,

  // 表单弹窗
  modalVisible,
  modalTitle,
  formData,
  currentEditSerialNo,
  doAddClient,
  doEdit,
  handleSubmit,
  doDelete,
  handleNext,
  handleNextEdit,
  handlePrevEdit,

  // 导入 / 导出
  importModalVisible,
  openImportModal,
  handleImport,
  downloadTemplate,
  handleExport,

  // 导出弹窗
  exportModalVisible,
  openExportModal,
} = useClientManage()
</script>

<style scoped>
@import '@/styles/filter.css';

#clientManagePage {
}

/* 去掉筛选卡片与下方卡片之间的灰色分隔线 */
#clientManagePage > .ant-card:first-child {
  border-bottom: none;
}

/* 设置卡片内容区域的上下padding为12px，使布局更紧凑 */
#clientManagePage :deep(.ant-card-body) {
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
