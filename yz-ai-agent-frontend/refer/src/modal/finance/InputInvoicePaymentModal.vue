<template>
  <GlobalModal
    v-model="visible"
    :title="modalTitle"
    width="720px"
  >
    <div v-if="currentRecord" style="margin-bottom: 8px; color: #666;">
      发票号：<strong style="color:#333;">{{ currentRecord.invoiceNo }}</strong>
    </div>

    <div style="font-weight: 600; margin-bottom: 8px;">出账明细</div>
    <a-table
      size="small"
      :pagination="false"
      :data-source="paymentDetailRows"
      :row-key="(r: any) => r.index"
      :loading="loading"
      bordered
    >
      <a-table-column title="序号" data-index="index" width="70" />
      <a-table-column title="出账日期" data-index="paidDate" />
      <a-table-column title="出账金额" data-index="paidAmount" align="right">
        <template #default="{ record: row }">
          <span>{{ row.paidAmountText }}</span>
        </template>
      </a-table-column>
      <a-table-column title="公司账号" data-index="companyAccount" />
      <a-table-column title="转账方式" data-index="transferMethod" />
      <a-table-column title="备注" data-index="remark1" />
    </a-table>

    <a-divider style="margin: 12px 0;" />

    <div v-if="currentRecord" style="display:flex; flex-wrap: wrap; gap: 12px;">
      <div style="flex: 1; min-width: 180px;">
        <div style="color:#999; font-size: 12px;">开票金额</div>
        <div style="font-weight: 600;">
          {{ Number(currentRecord.amount || 0).toFixed(2) }}
        </div>
      </div>
      <div style="flex: 1; min-width: 180px;">
        <div style="color:#999; font-size: 12px;">合计出账金额</div>
        <div style="font-weight: 600; color:#52c41a;">
          {{ headerTotalPaidAmount.toFixed(2) }}
        </div>
      </div>
      <div style="flex: 1; min-width: 180px;">
        <div style="color:#999; font-size: 12px;">发票状态</div>
        <div :style="{ fontWeight: 600, color: getInvoiceStatusColor(currentRecord) }">
          {{ getInvoiceStatusText(currentRecord) }}
        </div>
      </div>
    </div>

    <template #footer>
      <div style="display:flex; justify-content:flex-end; gap: 8px;">
        <a-button @click="handleClose">关闭</a-button>
      </div>
    </template>
  </GlobalModal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import { queryInputPaymentUsingPost, listBankTransactionByIdsUsingPost } from '@/api/caiwuguanlijiekou'

interface Props {
  modelValue: boolean
  record: any | null
}

const props = withDefaults(defineProps<Props>(), {
  record: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = ref(false)
const loading = ref(false)
const currentRecord = ref<any>(null)
const bankTransactionMap = ref<Map<string, API.BankTransactionRelatedInvoiceVO>>(new Map())

const modalTitle = computed(() => {
  if (currentRecord.value?.uniqueKey) {
    return `出账明细（${currentRecord.value.uniqueKey}）`
  }
  return '出账明细'
})

// 头部展示用的合计出账金额：以明细列表求和为准，避免与列表字段不一致
const headerTotalPaidAmount = computed(() => {
  const rec = currentRecord.value
  if (!rec) return 0
  const paidAmountList = (rec.paidAmountList || []) as any[]
  return paidAmountList.reduce((sum, v) => sum + Number(v || 0), 0)
})

// 出账明细行数据
const paymentDetailRows = computed(() => {
  const paidAmountList = (currentRecord.value?.paidAmountList || []) as any[]
  const paidDateList = (currentRecord.value?.paidDateList || []) as any[]
  const bankIdList = (currentRecord.value?.bankIdList || []) as (string | number)[]
  const len = Math.max(paidAmountList.length, paidDateList.length, bankIdList.length)

  return Array.from({ length: len }).map((_, i) => {
    const amount = paidAmountList[i]
    const date = paidDateList[i]
    // 通过 bankIdList 中的 ID 获取对应的银行收支信息（统一转换为字符串匹配）
    const bankId = bankIdList[i]
    const bankIdKey = bankId ? String(bankId) : null
    const bankTransaction = bankIdKey ? bankTransactionMap.value.get(bankIdKey) || null : null
    
    return {
      index: i + 1,
      paidDate: date || '-',
      paidAmountText: amount === null || amount === undefined ? '-' : Number(amount || 0).toFixed(2),
      companyAccount: bankTransaction?.remark3 || '-',
      transferMethod: bankTransaction?.transferMethod || '-',
      remark1: bankTransaction?.remark1 || '-',
    }
  })
})

// 获取发票状态文本
const getInvoiceStatusText = (record: any) => {
  if (!record) return ''
  if ((record.amount ?? 0) < 0) return '红字发票'
  if (record.isRedInvoiceCreated) return '已冲红'
  
  // 根据开票金额和合计出账金额判断状态
  const invoiceAmount = Number(record.amount || 0)
  const totalPaidAmount = headerTotalPaidAmount.value
  
  if (Math.abs(invoiceAmount - totalPaidAmount) < 0.01) {
    // 开票金额 = 合计出账金额（允许0.01的误差）
    return '已付款'
  } else if (invoiceAmount > totalPaidAmount) {
    // 开票金额 > 合计出账金额
    const pendingAmount = invoiceAmount - totalPaidAmount
    return `未付款（待出账${pendingAmount.toFixed(2)}）`
  }
  
  // 其他情况（理论上不应该出现）
  const pendingAmount = invoiceAmount - totalPaidAmount
  return `未付款（待出账${pendingAmount.toFixed(2)}）`
}

// 获取发票状态的颜色
const getInvoiceStatusColor = (record: any) => {
  if (!record) return ''
  if ((record.amount ?? 0) < 0) return '#ff4d4f' // 红字发票：红色
  if (record.isRedInvoiceCreated) return '#ff4d4f' // 已冲红：红色
  
  // 根据开票金额和合计出账金额判断颜色
  const invoiceAmount = Number(record.amount || 0)
  const totalPaidAmount = headerTotalPaidAmount.value
  
  if (Math.abs(invoiceAmount - totalPaidAmount) < 0.01) {
    // 开票金额 = 合计出账金额：绿色
    return '#52c41a'
  } else if (invoiceAmount > totalPaidAmount) {
    // 开票金额 > 合计出账金额：红色
    return '#ff4d4f'
  }
  
  // 其他情况：红色
  return '#ff4d4f'
}

// 获取出账明细数据
const fetchPaymentDetails = async (invoiceId: number | string) => {
  if (!invoiceId) return
  
  loading.value = true
  bankTransactionMap.value.clear()
  
  try {
    // 调用 queryInputPaymentUsingPost 获取出账明细
    const res = (await queryInputPaymentUsingPost({ inputInvoiceId: Number(invoiceId) } as API.InputPaymentQueryDto)) as any
    
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      
      // 更新当前记录，添加出账明细数据
      currentRecord.value = {
        ...props.record,
        paidAmountList: data.paidAmountList || [],
        paidDateList: data.paidDateList || [],
        bankIdList: data.bankIdList || [],
      }
      
      // 如果有 bankIdList，获取银行收支信息
      if (data.bankIdList && Array.isArray(data.bankIdList) && data.bankIdList.length > 0) {
        try {
          // 将字符串数组转换为数字数组
          const bankIds = data.bankIdList.map((id: string | number) => Number(id)).filter((id: number) => !isNaN(id))
          
          if (bankIds.length > 0) {
            const bankRes = (await listBankTransactionByIdsUsingPost(bankIds)) as any
            if (bankRes.data.code === 0 && bankRes.data.data) {
              // 将银行收支信息存储到 Map 中，以 id 为 key（统一使用字符串，因为响应中的 id 可能是字符串）
              const bankTransactions = bankRes.data.data as API.BankTransactionRelatedInvoiceVO[]
              bankTransactions.forEach((bt) => {
                if (bt.id !== undefined && bt.id !== null) {
                  // 统一使用字符串作为 key，因为 bankIdList 中的 ID 可能是字符串
                  const idKey = String(bt.id)
                  bankTransactionMap.value.set(idKey, bt)
                }
              })
            }
          }
        } catch (error) {
          console.error('获取银行收支信息失败', error)
        }
      }
    }
  } catch (error) {
    console.error('获取出账明细失败', error)
  } finally {
    loading.value = false
  }
}

// 监听 visible 变化
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.record) {
    currentRecord.value = props.record
    const invoiceId = props.record.id || props.record.serialNo
    if (invoiceId) {
      fetchPaymentDetails(invoiceId)
    }
  }
})

// 监听 visible 内部变化，同步到外部
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 关闭处理
const handleClose = () => {
  visible.value = false
}
</script>

