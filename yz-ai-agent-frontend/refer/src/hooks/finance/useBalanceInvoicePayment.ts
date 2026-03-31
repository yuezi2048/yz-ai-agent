import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import dayjs from 'dayjs'

/**
 * BalanceInvoicePaymentModal 的业务逻辑 Hook
 * 管理发票选择、入账金额、转账方式、业务经理等状态
 */
export function useBalanceInvoicePayment(props: {
  invoiceList: ComputedRef<API.InvoiceItem[]> | Ref<API.InvoiceItem[]>
  selectedInvoiceIds: ComputedRef<number[]> | Ref<number[]>
  paymentSalespersonId: ComputedRef<number | null> | Ref<number | null>
  employeeList: ComputedRef<API.Employee_[]> | Ref<API.Employee_[]>
  transferMethodOptions: ComputedRef<Array<{ label: string; value: string }>> | Ref<Array<{ label: string; value: string }>>
}) {
  // 获取实际值（支持computed和ref）
  const invoiceList = computed(() => 'value' in props.invoiceList ? props.invoiceList.value : props.invoiceList)
  const selectedInvoiceIds = computed(() => 'value' in props.selectedInvoiceIds ? props.selectedInvoiceIds.value : props.selectedInvoiceIds)
  const paymentSalespersonId = computed(() => 'value' in props.paymentSalespersonId ? props.paymentSalespersonId.value : props.paymentSalespersonId)
  const employeeList = computed(() => 'value' in props.employeeList ? props.employeeList.value : props.employeeList)
  const transferMethodOptions = computed(() => {
    const val = 'value' in props.transferMethodOptions ? props.transferMethodOptions.value : props.transferMethodOptions
    return Array.isArray(val) ? val : []
  })
  // 存储每张发票的入账金额
  const paymentAmountMap = ref<Record<number, number>>({})
  // 存储每张发票的转账方式
  const transferMethodMap = ref<Record<number, string>>({})

  // 获取欠款金额
  const getAmountDue = (invoice: any) => {
    return invoice.amountDue || ((invoice.amount || 0) - (invoice.totalPaidAmount || 0))
  }

  // 监听选中发票变化，初始化入账金额
  watch(selectedInvoiceIds, (newIds, oldIds) => {
    // 移除未选中的发票的入账金额
    if (oldIds) {
      oldIds.forEach((id: number) => {
        if (!newIds.includes(id)) {
          delete paymentAmountMap.value[id]
          delete transferMethodMap.value[id]
        }
      })
    }
    // 为新选中的发票初始化入账金额（默认为欠款金额）和转账方式
    newIds.forEach((id: number) => {
      if (!(id in paymentAmountMap.value)) {
        const invoice = invoiceList.value.find((inv: any) => inv.id === id)
        if (invoice) {
          const amountDue = getAmountDue(invoice)
          paymentAmountMap.value[id] = amountDue > 0 ? amountDue : 0
        }
      }
      if (!(id in transferMethodMap.value)) {
        const invoice = invoiceList.value.find((inv: any) => inv.id === id)
        if (invoice && invoice.transferMethod) {
          transferMethodMap.value[id] = invoice.transferMethod
        }
      }
    })
  }, { immediate: true })

  // 监听发票列表变化，更新已选中发票的入账金额上限
  watch(invoiceList, () => {
    // 当发票列表更新时，更新已选中发票的入账金额上限
    selectedInvoiceIds.value.forEach((id: number) => {
      const invoice = invoiceList.value.find((inv: any) => inv.id === id)
      if (invoice) {
        const amountDue = getAmountDue(invoice)
        // 如果当前入账金额超过新的欠款金额，则调整为欠款金额
        if (paymentAmountMap.value[id] > amountDue) {
          paymentAmountMap.value[id] = amountDue
        }
        // 如果还没有设置入账金额，则初始化为欠款金额
        if (!(id in paymentAmountMap.value) && amountDue > 0) {
          paymentAmountMap.value[id] = amountDue
        }
        // 同步转账方式
        if (invoice.transferMethod && !(id in transferMethodMap.value)) {
          transferMethodMap.value[id] = invoice.transferMethod
        }
      }
    })
  }, { deep: true })

  // 计算总入账金额
  const totalPaymentAmount = computed(() => {
    return Object.values(paymentAmountMap.value).reduce((sum, amount) => sum + (amount || 0), 0)
  })

  // 处理入账金额变化
  const handlePaymentAmountChange = (invoiceId: number, value: number | null) => {
    if (value !== null && value >= 0) {
      paymentAmountMap.value[invoiceId] = value
    }
  }

  // 获取支付信息列表（用于提交）
  const getPaymentInfos = (): Array<{
    invoiceId: number
    invoiceNo: string
    amountDue: number
    paymentAmount: number
    paidDate: string
    salespersonId: number | null
    transferMethod?: string
  }> => {
    const paymentInfos: Array<{
      invoiceId: number
      invoiceNo: string
      amountDue: number
      paymentAmount: number
      paidDate: string
      salespersonId: number | null
      transferMethod?: string
    }> = []
    const selectedInvoices = invoiceList.value.filter((inv: any) =>
      selectedInvoiceIds.value.includes(inv.id!) && getAmountDue(inv) > 0
    )

    const todayPaidDate = dayjs().format('YYYY-MM-DD')

    for (const invoice of selectedInvoices) {
      const invoiceId = invoice.id!
      const paymentAmount = paymentAmountMap.value[invoiceId] || 0
      const amountDue = getAmountDue(invoice)

      // 验证入账金额
      if (paymentAmount <= 0) {
        continue // 跳过金额为0的发票
      }

      paymentInfos.push({
        invoiceId,
        invoiceNo: invoice.invoiceNo || '',
        amountDue,
        paymentAmount: Math.min(paymentAmount, amountDue),
        paidDate: todayPaidDate,
        salespersonId: paymentSalespersonId.value ?? null,
        transferMethod: transferMethodMap.value[invoiceId],
      })
    }

    return paymentInfos
  }

  // 业务经理选项（入账用：带 ID，显示 name (employeeNo) 格式）
  const paymentSalespersonOptions = computed(() => {
    const options: Array<{ value: string; label: string; id?: number; employeeNo?: string }> = []
    const seen = new Set<string>()

    for (const e of employeeList.value) {
      const name = (e.name || '').trim()
      if (!name || !e.id) continue
      // 使用 名字+工号 作为唯一键，确保同名不同工号的员工都能显示
      const key = name + (e.employeeNo ? `|${e.employeeNo}` : '')
      if (seen.has(key)) continue
      seen.add(key)

      options.push({
        value: name, // 输入框显示的是名字
        label: e.employeeNo ? `${name} (${e.employeeNo})` : name, // 下拉列表显示 名字(工号)
        id: e.id,    // 携带 ID
        employeeNo: e.employeeNo // 携带工号
      })
    }

    return options
  })

  // 转账方式选项，确保标签和值都使用 methodName
  const transferMethodSelectOptions = computed(() => transferMethodOptions.value || [])

  return {
    paymentAmountMap,
    transferMethodMap,
    getAmountDue,
    totalPaymentAmount,
    handlePaymentAmountChange,
    getPaymentInfos,
    paymentSalespersonOptions,
    transferMethodSelectOptions,
  }
}

