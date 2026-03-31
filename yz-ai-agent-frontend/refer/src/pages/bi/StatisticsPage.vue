<template>
  <div id="statisticsPage">
    <!-- 筛选栏 -->
    <StatisticsFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      @update:search-params="(params) => Object.assign(searchParams, params)"
      @open-company-modal="showCompanyModal = true"
      @search="doSearch"
      @reset="doReset"
    />

    <!-- 统计信息展示 -->
    <StatisticsSummaryBar :summary-data="summaryData" />

    <!-- 统计表格 -->
    <a-card style="margin-bottom: 6px">
      <template #title>公司开票金额、收款金额、欠款金额分类统计</template>
      <a-table
        :columns="resizableTableColumns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="false"
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
            :is-last-column="resizableTableColumns.findIndex(c => (c.key || c.dataIndex) === (column.key || column.dataIndex)) === resizableTableColumns.length - 1"
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
          <template v-if="column.dataIndex === 'totalInvoiceAmount'">
            <div class="amount-cell">
              <span class="amount-value" style="font-weight: 500;">{{ (record.totalInvoiceAmount || 0).toFixed(2) }}</span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'totalPaidAmount'">
            <div class="amount-cell">
              <span class="amount-value" style="color: #52c41a; font-weight: 500;">{{ (record.totalPaidAmount || 0).toFixed(2) }}</span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'unpaidAmount'">
            <div class="amount-cell">
              <span class="amount-value" style="color: #ff4d4f; font-weight: 500;">{{ (record.unpaidAmount || 0).toFixed(2) }}</span>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 饼图 -->
    <a-card>
      <template #title>
        <a-flex align="center" justify="space-between">
          <span>5家公司开票金额饼形图</span>
          <a-space>
            <!-- 饼图日期与筛选条件共用 startDate / endDate -->
            <a-date-picker
              v-model:value="searchParams.startDate"
              placeholder="开始日期"
              format="YYYYMMDD"
            />
            <span>至</span>
            <a-date-picker
              v-model:value="searchParams.endDate"
              placeholder="结束日期"
              format="YYYYMMDD"
            />
            <a-button type="link" size="small" @click="updatePieChart">更新</a-button>
          </a-space>
        </a-flex>
      </template>
      <div id="pieChart" style="width: 100%; height: 400px;"></div>
    </a-card>

    <!-- 公司名称选择模态框 -->
    <IssuerCompanySelectModal
      v-model="showCompanyModal"
      :company-list="companyList"
      :selected-company-ids="searchParams.issuerCompanyIds"
      @ok="handleCompanyModalOk"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'
import StatisticsFilterBar from '@/components/bi/StatisticsFilterBar.vue'
import StatisticsSummaryBar from '@/components/bi/StatisticsSummaryBar.vue'
import { useStatisticsManage } from '@/hooks/bi/useStatisticsManage'

const {
  // 基础数据
  loading,
  statisticsData,
  summaryData,
  dataListWithSerial,
  searchParams,
  companyList,
  // 表格列
  resizableTableColumns,
  tableWidth,
  updateColumnWidth,
  tableScrollHeight,

  // 公司选择弹窗
  showCompanyModal,
  handleCompanyModalOk,

  // 行为
  fetchCompanyList,
  fetchData,
  updatePieChart,
  doSearch,
  doReset,
  handleResize,

  // 初始化
  initPageSettings,
} = useStatisticsManage()

onMounted(async () => {
  initPageSettings()
  await fetchCompanyList()
  fetchData()
})

// 监听开票日期变化，自动更新表格和统计信息
watch([() => searchParams.startDate, () => searchParams.endDate], () => {
  fetchData()
})
</script>

<style scoped>
@import '@/styles/table.css';

#statisticsPage {
  padding: 0;
}

#statisticsPage :deep(.ant-card-body) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>

