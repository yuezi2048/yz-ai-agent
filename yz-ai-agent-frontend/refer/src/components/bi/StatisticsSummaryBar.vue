<template>
  <a-card v-if="summaryData" style="margin-bottom: 6px">
    <div class="statistics-info">
      <a-row :gutter="16">
        <a-col :span="6">
          <div class="stat-item">
            <span class="stat-label">开票金额：</span>
            <span class="stat-value">{{ (summaryData.totalInvoiceAmount || 0).toFixed(2) }}</span>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <span class="stat-label">收款金额：</span>
            <span class="stat-value">{{ (summaryData.totalPaidAmount || 0).toFixed(2) }}</span>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <span class="stat-label">欠款金额：</span>
            <span class="stat-value">{{ (summaryData.totalUnpaidAmount || 0).toFixed(2) }}</span>
          </div>
        </a-col>
        <a-col :span="6">
          <div class="stat-item">
            <span class="stat-label">发票张数：</span>
            <span class="stat-value">{{ summaryData.totalInvoiceCount || 0 }}</span>
          </div>
        </a-col>
      </a-row>
    </div>
  </a-card>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

interface Props {
  summaryData: API.CompanyStatisticsSummary | null
}

defineProps<Props>()
</script>

<style scoped>
.statistics-info {
  padding: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  color: #000;
  font-weight: 500;
}

.stat-value {
  color: #ff4d4f;
  font-weight: 500;
  margin-left: 4px;
}
</style>

