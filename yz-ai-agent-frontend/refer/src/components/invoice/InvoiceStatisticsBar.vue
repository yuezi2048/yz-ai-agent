<template>
  <a-space v-if="statistics" class="invoice-statistics-info">
    <span class="statistics-amount-total">
      开票金额合计: <strong>{{ (statistics.totalAmount || 0).toFixed(2) }}</strong>
    </span>
    <span class="statistics-amount-paid">
      到账金额合计: <strong>{{ (statistics.totalPaidAmount || 0).toFixed(2) }}</strong>
    </span>
    <span class="statistics-amount-unpaid">
      未到账金额合计: <strong>{{ ((statistics.totalAmount || 0) - (statistics.totalPaidAmount || 0)).toFixed(2) }}</strong>
    </span>
    <span class="statistics-count-red">
      冲红张数: <strong>{{ statistics.redInvoiceCount || 0 }}</strong>张
    </span>
  </a-space>
</template>

<script lang="ts" setup>
interface Props {
  statistics: API.InvoiceStatistics | null
}

defineProps<Props>()
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

