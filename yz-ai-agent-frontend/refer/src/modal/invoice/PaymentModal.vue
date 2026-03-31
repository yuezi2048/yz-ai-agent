<template>
  <global-modal
    v-model="visible"
    title="入账"
    width="900px"
    :mask-closable="false"
    :keyboard="true"
  >
    <div class="payment-records">
      <div
        v-for="(record, index) in paymentRecords"
        :key="index"
        class="payment-record-item"
      >
        <a-card :title="`入账记录 ${index + 1}`" size="small" style="margin-bottom: 16px">
          <template #extra>
            <a-button
              type="text"
              danger
              size="small"
              @click="removePaymentRecord(index)"
            >
              <DeleteOutlined />
              删除此记录
            </a-button>
          </template>

          <a-form
            :model="record"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            :validate-trigger="['submit']"
          >
            <a-form-item
              label="银行收支记录"
              :rules="[{ required: true, message: '请选择银行收支记录' }]"
            >
              <a-select
                v-model:value="record.bankTransactionId"
                placeholder="请选择银行收支记录"
                style="width: 100%"
                show-search
                :filter-option="filterBankTransaction"
                @change="handleBankTransactionChange(index)"
                :loading="record.bankTransactionId ? false : false"
              >
                <a-select-option
                  v-for="transaction in filteredBankTransactions"
                  :key="transaction.id"
                  :value="transaction.id"
                >
                  {{ transaction.companyName }} - {{ transaction.arrivalTime }} - {{ (transaction.amount || 0).toFixed(2) }}
                  <span v-if="transaction.invoiceNo"> (已关联: {{ transaction.invoiceNo }})</span>
                </a-select-option>
              </a-select>
              <!-- 展示选中的银行收支记录信息 -->
              <div v-if="record.bankTransactionInfo" style="margin-top: 8px; padding: 8px; background-color: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 12px; color: #666;">
                  <div><strong>公司名称：</strong>{{ record.bankTransactionInfo.companyName }}</div>
                  <div><strong>客户名称：</strong>{{ record.bankTransactionInfo.clientCompanyName }}</div>
                  <div><strong>到账时间：</strong>{{ record.bankTransactionInfo.arrivalTime }}</div>
                  <div><strong>原始金额：</strong>{{ (record.bankTransactionInfo.amount || 0).toFixed(2) }}</div>
                  <!-- 展示已入账的记录支票和金额 -->
                  <div v-if="record.bankTransactionInvoices && record.bankTransactionInvoices.length > 0" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e0e0e0;">
                    <div><strong>已入账记录：</strong></div>
                    <div v-for="(invoice, idx) in record.bankTransactionInvoices" :key="idx" style="margin-left: 12px; margin-top: 2px;">
                      {{ invoice.invoiceNo }} - {{ (invoice.paidAmount || 0).toFixed(2) }}
                    </div>
                  </div>
                  <div style="margin-top: 4px;">
                    <strong>剩余可用金额：</strong><span style="color: #1890ff; font-weight: bold;">{{ record.remainingAmount.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </a-form-item>

            <a-form-item
              label="业务员"
              :rules="[{ required: true, message: '请选择业务员' }]"
            >
              <a-auto-complete
                :key="`salesperson-${index}-${visible}`"
                v-model:value="record.salespersonName"
                :options="filteredSalespersonOptions(index)"
                placeholder="选择或输入业务员"
                style="width: 100%"
                allow-clear
                @select="(value: string, option: any) => handleSalespersonSelect(value, option, index)"
                @change="(value: string) => handleSalespersonChange(value, index)"
                @blur="() => handleSalespersonBlur(index)"
              />
            </a-form-item>

            <a-form-item
              label="入账金额"
              :rules="[
                { required: true, message: '请输入入账金额' }
              ]"
            >
              <a-input-number
                v-model:value="record.contributionAmount"
                placeholder="请输入入账金额"
                style="width: 100%"
                :min="0"
                :precision="2"
              />
              <div style="margin-top: 4px; font-size: 12px; color: #999;">
                剩余可用金额: {{ record.remainingAmount.toFixed(2) }}
              </div>
            </a-form-item>

            <a-form-item label="备注">
              <a-input v-model:value="record.remark1" placeholder="请输入备注" allow-clear />
            </a-form-item>

            <a-form-item label="账号">
              <a-input v-model:value="record.remark2" placeholder="请输入账号" allow-clear />
            </a-form-item>

            <a-form-item label="公司账号">
              <a-input v-model:value="record.remark3" placeholder="请输入公司账号" allow-clear />
            </a-form-item>
          </a-form>
        </a-card>
      </div>

      <a-button
        type="dashed"
        block
        @click="addPaymentRecord"
        style="margin-top: 16px"
      >
        <PlusOutlined />
        添加入账记录
      </a-button>
    </div>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <a-button class="btn-grey" @click="handleCancel">
          <template #icon><CloseOutlined /></template>
          关闭
        </a-button>
        <a-button type="primary" @click="handleOk">
          <template #icon><CheckOutlined /></template>
          保存
        </a-button>
      </div>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { queryBankTransactionWithremainAmountUsingPost, queryBankTransactionWithInvoicesUsingPost } from '@/api/caiwuguanlijiekou.ts'
import {cancelPaymentUsingPost} from "@/api/fapiaoxinxiguanli.ts";
import { getAllEmployeeBasicInfoUsingGet } from '@/api/yuangongguanlijiekou'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import GlobalModal from '@/modal/globalModal.vue'

interface PaymentRecord {
  id?: number // 入账记录ID（用于判断是更新还是新增）
  bankTransactionId: number | undefined
  salespersonId: number | undefined
  salespersonName?: string // 业务员姓名（用于显示和输入）
  contributionAmount: number | undefined
  maxAmount: number
  remainingAmount: number // 剩余可用金额
  bankTransactionInfo: API.BankTransaction_ | null // 选中的银行收支记录信息
  bankTransactionInvoices: API.InvoiceDetailVO_[] // 银行收支记录关联的发票信息
  originalContributionAmount?: number // 原有入账金额（用于自动填充的记录）
  remark1: string
  remark2: string
  remark3: string
}

interface Props {
  modelValue: boolean
  invoiceAmount: number
  availableBankTransactions: API.BankTransaction_[]
  employeeList: API.Employee_[]
  existingPayments?: API.InvoiceFinish_[] // 已有的入账记录（用于自动填充）
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [paymentDtos: API.InvoicePaymentDto[]]
  'delete': [paymentId: number] // 删除入账记录事件
}>()

const loginUserStore = useLoginUserStore()
const visible = ref(false)
const paymentRecords = ref<PaymentRecord[]>([])

const bankTransactionRemainingAmounts = ref<Map<number, number>>(new Map()) // 缓存银行收支记录的剩余可用金额
const filteredBankTransactions = ref<API.BankTransaction_[]>([]) // 筛选后的银行收支记录

// 员工基本信息列表（来自 getAllEmployeeBasicInfoUsingGet，含 id/name/employeeNo）
const employeeBasicList = ref<API.EmployeeBasicInfoVO[]>([])
const extraEmployeeNames = ref<string[]>([]) // 用户手动输入的员工姓名

// 获取员工基本信息列表
const fetchEmployeeBasicList = async () => {
  try {
    const res = (await getAllEmployeeBasicInfoUsingGet({})) as any
    if (res?.data?.code === 0 && Array.isArray(res?.data?.data)) {
      employeeBasicList.value = res.data.data
    } else {
      employeeBasicList.value = []
    }
  } catch (error) {
    console.error('获取员工基本信息列表失败', error)
    employeeBasicList.value = []
  }
}

// 业务员自动完成选项
const salespersonOptions = computed(() => {
  const options: Array<{ value: string; label: string; id?: number; employeeNo?: string }> = []
  const seen = new Set<string>()

  for (const e of employeeBasicList.value) {
    const name = (e.name || '').trim()
    if (!name) continue
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

  // 处理额外的手动输入项
  for (const nameRaw of extraEmployeeNames.value) {
    const name = (nameRaw || '').trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      options.push({ value: name, label: name })
    }
  }
  return options
})

// 过滤后的业务员选项（根据输入值过滤，包含用户输入的内容）
const filteredSalespersonOptions = computed(() => {
  // 由于 paymentRecords 是数组，我们需要为每个记录单独计算
  // 这里返回一个函数，接收索引来获取对应记录的输入值
  return (index: number) => {
    const input = paymentRecords.value[index]?.salespersonName || ''
    if (!input) {
      return salespersonOptions.value
    }
    const lowerInput = input.toLowerCase()
    const baseOptions = salespersonOptions.value

    // 如果用户输入了内容，检查是否在选项中
    const existsInOptions = baseOptions.some(opt => opt.value.toLowerCase() === lowerInput)

    // 如果输入的内容不在选项中，将其添加到过滤结果中
    if (!existsInOptions && input.trim()) {
      return [
        { value: input, label: input },
        ...baseOptions.filter(opt =>
          opt.value.toLowerCase().includes(lowerInput) || opt.label.toLowerCase().includes(lowerInput)
        )
      ]
    }

    return baseOptions.filter(opt =>
      opt.value.toLowerCase().includes(lowerInput) || opt.label.toLowerCase().includes(lowerInput)
    )
  }
})

// 处理业务员选择
const handleSalespersonSelect = (value: string, option: any, index: number) => {
  const n = (value || '').trim()
  if (!n) return

  // 直接使用 option 中的 id
  if (option && option.id) {
    paymentRecords.value[index].salespersonId = option.id
    paymentRecords.value[index].salespersonName = n
  } else {
    // 如果没有ID，尝试从 employeeBasicList 中查找
    const found = employeeBasicList.value.find((e) => (e.name || '').trim() === n && e.id != null)
    if (found?.id) {
      paymentRecords.value[index].salespersonId = found.id
      paymentRecords.value[index].salespersonName = n
    } else {
      // 如果找不到，清空ID
      paymentRecords.value[index].salespersonId = undefined
    }
  }
}

// 处理业务员变化
const handleSalespersonChange = (value: string, index: number) => {
  paymentRecords.value[index].salespersonName = value

  // 将用户输入的内容添加到 extra 数组中（如果不存在）
  const trimmedValue = (value || '').trim()
  if (trimmedValue && !extraEmployeeNames.value.includes(trimmedValue)) {
    extraEmployeeNames.value = [...extraEmployeeNames.value, trimmedValue]
  }

  // 尝试从 employeeBasicList 中查找匹配的员工
  if (value) {
    const found = employeeBasicList.value.find((e) => (e.name || '').trim() === (value || '').trim() && e.id != null)
    if (found?.id) {
      paymentRecords.value[index].salespersonId = found.id
    } else {
      // 如果找不到，清空ID（但保留姓名用于显示）
      paymentRecords.value[index].salespersonId = undefined
    }
  } else {
    paymentRecords.value[index].salespersonId = undefined
  }
}

// 处理业务员失去焦点
const handleSalespersonBlur = (index: number) => {
  const name = paymentRecords.value[index]?.salespersonName
  if (name) {
    // 再次尝试匹配
    const found = employeeBasicList.value.find((e) => (e.name || '').trim() === (name || '').trim() && e.id != null)
    if (found?.id) {
      paymentRecords.value[index].salespersonId = found.id
    }
  }
}

// 预加载所有银行收支记录的剩余可用金额并筛选
const preloadBankTransactionAmounts = async () => {
  const promises = props.availableBankTransactions.map(async (transaction) => {
    if (!transaction.id) return null
    try {
      const res = await queryBankTransactionWithremainAmountUsingPost({
        bankTransactionId: transaction.id,
      }) as any
      if (res.data.code === 0 && res.data.data) {
        const data: API.BankTransactionRemainingAmountVO_ = res.data.data
        const remainingAmount = data.remainingAmount || 0
        bankTransactionRemainingAmounts.value.set(transaction.id, remainingAmount)
        return { transaction, remainingAmount }
      }
    } catch (error) {
      console.error('获取剩余可用金额失败', error)
    }
    return null
  })
  const results = await Promise.all(promises)
  // 筛选出剩余可用余额大于0的记录
  filteredBankTransactions.value = results
    .filter((result): result is { transaction: API.BankTransaction_; remainingAmount: number } =>
      result !== null && result !== undefined && result.remainingAmount > 0
    )
    .map(result => result.transaction)
}

// 获取当前登录用户对应的员工ID
const getCurrentUserEmployeeId = (): number | undefined => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser) return undefined

  // 检查 loginUser 是否有 id 属性
  const userId = 'id' in loginUser ? loginUser.id : undefined
  const userName = 'name' in loginUser ? loginUser.name : undefined

  if (!userId && !userName) return undefined

  // 根据登录用户的ID或名称匹配员工列表
  const matchedEmployee = props.employeeList.find(employee => {
    // 优先通过ID匹配
    if (userId && employee.id === userId) return true
    // 其次通过名称匹配
    if (userName && employee.name === userName) return true
    return false
  })

  return matchedEmployee?.id
}

// 根据员工ID获取员工姓名
const getEmployeeNameById = (id: number | undefined): string => {
  if (!id) return ''
  const employee = employeeBasicList.value.find(e => e.id === id)
  return employee?.name || props.employeeList.find(e => e.id === id)?.name || ''
}

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 获取员工基本信息列表
    await fetchEmployeeBasicList()

    // 预加载所有银行收支记录的剩余可用金额
    await preloadBankTransactionAmounts()

    // 获取当前登录用户对应的员工ID
    const currentUserEmployeeId = getCurrentUserEmployeeId()


    // 如果有已有入账记录，自动填充
    if (props.existingPayments && props.existingPayments.length > 0) {
      paymentRecords.value = await Promise.all(
        props.existingPayments.map(async (payment) => {
          const salespersonId = payment.salespersonId || currentUserEmployeeId
          const record: PaymentRecord = {
            id: payment.id,
            bankTransactionId: payment.bankTransactionId,
            salespersonId: salespersonId,
            salespersonName: getEmployeeNameById(salespersonId),
            contributionAmount: payment.paidAmount,
            maxAmount: props.invoiceAmount || 0,
            remainingAmount: 0,
            bankTransactionInfo: null,
            bankTransactionInvoices: [],
            originalContributionAmount: payment.paidAmount, // 保存原有入账金额
            remark1: payment.remark1 || '',
            remark2: payment.remark2 || '',
            remark3: payment.remark3 || '',
          }

          // 如果有关联的银行收支记录，获取剩余可用金额和关联发票信息
          if (payment.bankTransactionId) {
            try {
              const res = await queryBankTransactionWithremainAmountUsingPost({
                bankTransactionId: payment.bankTransactionId,
              }) as any

              if (res.data.code === 0 && res.data.data) {
                const data: API.BankTransactionRemainingAmountVO_ = res.data.data
                // 剩余可用金额直接使用接口返回的值，不加上原有入账金额
                record.remainingAmount = data.remainingAmount || 0
                bankTransactionRemainingAmounts.value.set(payment.bankTransactionId, data.remainingAmount || 0)

                // 获取关联的发票信息
                try {
                  const invoiceRes = await queryBankTransactionWithInvoicesUsingPost({
                    bankTransactionId: payment.bankTransactionId,
                  }) as any
                  if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
                    const invoiceData: API.BankTransactionWithInvoicesVO_ = invoiceRes.data.data
                    record.bankTransactionInvoices = invoiceData.invoiceList || []
                  }
                } catch (error) {
                  console.error('获取关联发票信息失败', error)
                }

                // 找到对应的银行收支记录信息
                const transaction = props.availableBankTransactions.find(
                  t => t.id === payment.bankTransactionId
                )
                if (transaction) {
                  record.bankTransactionInfo = transaction
                }
              }
            } catch (error) {
              console.error('获取剩余可用金额失败', error)
            }
          }

          return record
        })
      )
    } else {
      // 没有已有记录，创建一条空记录，默认设置当前登录用户为业务员
      paymentRecords.value = [{
        bankTransactionId: undefined,
        salespersonId: currentUserEmployeeId,
        salespersonName: getEmployeeNameById(currentUserEmployeeId),
        contributionAmount: undefined,
        maxAmount: props.invoiceAmount || 0,
        remainingAmount: 0,
        bankTransactionInfo: null,
        bankTransactionInvoices: [],
        remark1: '',
        remark2: '',
        remark3: '',
      }]
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const filterBankTransaction = (input: string, option: any) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

const handleBankTransactionChange = async (index: number) => {
  const record = paymentRecords.value[index]
  if (!record.bankTransactionId) {
    record.bankTransactionInfo = null
    record.remainingAmount = 0
    record.maxAmount = props.invoiceAmount || 0
    record.contributionAmount = undefined
    record.bankTransactionInvoices = []
    return
  }

  // 找到选中的银行收支记录
  const transaction = props.availableBankTransactions.find(t => t.id === record.bankTransactionId)
  if (!transaction) {
    message.error('未找到选中的银行收支记录')
    return
  }

  // 调用接口获取剩余可用金额和关联发票信息
  try {
    const res = await queryBankTransactionWithremainAmountUsingPost({
      bankTransactionId: record.bankTransactionId,
    }) as any

    if (res.data.code === 0 && res.data.data) {
      const data: API.BankTransactionRemainingAmountVO_ = res.data.data
      // 剩余可用金额直接使用接口返回的值，不加上原有入账金额
      record.remainingAmount = data.remainingAmount || 0

      record.bankTransactionInfo = transaction
      bankTransactionRemainingAmounts.value.set(record.bankTransactionId, record.remainingAmount)

      // 获取关联的发票信息
      try {
        const invoiceRes = await queryBankTransactionWithInvoicesUsingPost({
          bankTransactionId: record.bankTransactionId,
        }) as any
        if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
          const invoiceData: API.BankTransactionWithInvoicesVO_ = invoiceRes.data.data
          record.bankTransactionInvoices = invoiceData.invoiceList || []
        }
      } catch (error) {
        console.error('获取关联发票信息失败', error)
        record.bankTransactionInvoices = []
      }

      // 计算前面入账记录的金额总和
      const previousTotal = paymentRecords.value
        .slice(0, index)
        .reduce((sum, r) => sum + (r.contributionAmount || 0), 0)

      // 计算发票剩余未入账金额
      const invoiceRemainingAmount = props.invoiceAmount - previousTotal

      // 设置最大金额为剩余可用金额和发票剩余未入账金额的较小值（仅用于默认值计算）
      record.maxAmount = Math.min(record.remainingAmount, invoiceRemainingAmount)

      // 如果没有设置入账金额，则默认设置为（发票剩余未入账金额，银行收支可用金额）的最小值
      if (!record.contributionAmount) {
        record.contributionAmount = record.maxAmount
      }
    } else {
      message.error('获取剩余可用金额失败 ' + (res.data.message || ''))
      record.bankTransactionInfo = null
      record.remainingAmount = 0
      record.maxAmount = props.invoiceAmount || 0
      record.bankTransactionInvoices = []
    }
  } catch (error: any) {
    console.error('获取剩余可用金额失败', error)
    message.error('获取剩余可用金额失败 ' + (error.message || '未知错误'))
    record.bankTransactionInfo = null
    record.remainingAmount = 0
    record.maxAmount = props.invoiceAmount || 0
    record.bankTransactionInvoices = []
  }
}

const addPaymentRecord = () => {
  // 获取当前登录用户对应的员工ID
  const currentUserEmployeeId = getCurrentUserEmployeeId()

  paymentRecords.value.push({
    id: undefined, // 新增记录，id为undefined
    bankTransactionId: undefined,
    salespersonId: currentUserEmployeeId, // 默认使用当前登录用户
    salespersonName: getEmployeeNameById(currentUserEmployeeId),
    contributionAmount: undefined,
    maxAmount: props.invoiceAmount || 0,
    remainingAmount: 0,
    bankTransactionInfo: null,
    bankTransactionInvoices: [],
    remark1: '',
    remark2: '',
    remark3: '',
  })
}

// 更新所有记录的剩余可用金额和已入账记录信息
const updateAllRecordsInfo = async () => {
  // 收集所有需要更新的银行收支记录ID（去重）
  const bankTransactionIds = new Set<number>()
  paymentRecords.value.forEach(record => {
    if (record.bankTransactionId) {
      bankTransactionIds.add(record.bankTransactionId)
    }
  })

  // 为每个银行收支记录更新信息
  const updatePromises = Array.from(bankTransactionIds).map(async (bankTransactionId) => {
    try {
      // 获取剩余可用金额
      const res = await queryBankTransactionWithremainAmountUsingPost({
        bankTransactionId: bankTransactionId,
      }) as any

      if (res.data.code === 0 && res.data.data) {
        const data: API.BankTransactionRemainingAmountVO_ = res.data.data
        const remainingAmount = data.remainingAmount || 0
        bankTransactionRemainingAmounts.value.set(bankTransactionId, remainingAmount)

        // 获取关联的发票信息
        let invoices: API.InvoiceDetailVO_[] = []
        try {
          const invoiceRes = await queryBankTransactionWithInvoicesUsingPost({
            bankTransactionId: bankTransactionId,
          }) as any
          if (invoiceRes.data.code === 0 && invoiceRes.data.data) {
            const invoiceData: API.BankTransactionWithInvoicesVO_ = invoiceRes.data.data
            invoices = invoiceData.invoiceList || []
          }
        } catch (error) {
          console.error('获取关联发票信息失败', error)
        }

        // 更新所有使用该银行收支记录的记录
        paymentRecords.value.forEach((record, idx) => {
          if (record.bankTransactionId === bankTransactionId) {
            record.remainingAmount = remainingAmount
            record.bankTransactionInvoices = invoices

            // 重新计算默认入账金额
            const previousTotal = paymentRecords.value
              .slice(0, idx)
              .reduce((sum, r) => sum + (r.contributionAmount || 0), 0)
            const invoiceRemainingAmount = props.invoiceAmount - previousTotal
            record.maxAmount = Math.min(record.remainingAmount, invoiceRemainingAmount)
          }
        })
      }
    } catch (error) {
      console.error(`更新银行收支记录 ${bankTransactionId} 信息失败`, error)
    }
  })

  await Promise.all(updatePromises)
}

const removePaymentRecord = async (index: number) => {
  const record = paymentRecords.value[index]
  const deletedBankTransactionId = record.bankTransactionId

  // 如果是已有记录（有id），需要调用接口删除
  if (record.id) {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条入账记录吗？此操作不可撤销！',
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await cancelPaymentUsingPost({ id: record.id! }) as any
          if (res.data.code === 0) {
            message.success('删除成功')
            // 从列表中移除
            paymentRecords.value.splice(index, 1)
            // 如果删除后没有记录了，创建一个空记录，默认设置当前登录用户为业务员
            if (paymentRecords.value.length === 0) {
              const currentUserEmployeeId = getCurrentUserEmployeeId()
              paymentRecords.value = [{
                id: undefined,
                bankTransactionId: undefined,
                salespersonId: currentUserEmployeeId,
                salespersonName: getEmployeeNameById(currentUserEmployeeId),
                contributionAmount: undefined,
                maxAmount: props.invoiceAmount || 0,
                remainingAmount: 0,
                bankTransactionInfo: null,
                bankTransactionInvoices: [],
                remark1: '',
                remark2: '',
                remark3: '',
              }]
            } else {
              // 更新所有记录的剩余可用金额和已入账记录信息
              await updateAllRecordsInfo()
            }
            // 通知父组件删除成功，以便更新已有记录列表
            emit('delete', record.id!)
          } else {
            message.error('删除失败: ' + (res.data.message || ''))
          }
        } catch (error) {
          console.error('删除入账记录失败', error)
          message.error('删除失败')
        }
      },
    })
  } else {
    // 如果是新记录（没有id），直接从前端列表中移除
    if (index === 0 && paymentRecords.value.length === 1) {
      // 如果删除后没有记录了，创建一个空记录，默认设置当前登录用户为业务员
      const currentUserEmployeeId = getCurrentUserEmployeeId()
      paymentRecords.value = [{
        id: undefined,
        bankTransactionId: undefined,
        salespersonId: currentUserEmployeeId,
        salespersonName: getEmployeeNameById(currentUserEmployeeId),
        contributionAmount: undefined,
        maxAmount: props.invoiceAmount || 0,
        remainingAmount: 0,
        bankTransactionInfo: null,
        bankTransactionInvoices: [],
        remark1: '',
        remark2: '',
        remark3: '',
      }]
    } else {
      paymentRecords.value.splice(index, 1)
      // 如果删除的记录有银行收支记录ID，需要更新相关信息
      if (deletedBankTransactionId) {
        await updateAllRecordsInfo()
      }
    }
  }
}

const handleOk = async () => {
  // 验证所有记录
  for (let i = 0; i < paymentRecords.value.length; i++) {
    const record = paymentRecords.value[i]
    if (!record.bankTransactionId) {
      message.error(`入账记录 ${i + 1} 请选择银行收支记录`)
      return
    }
    if (!record.salespersonId) {
      message.error(`入账记录 ${i + 1} 请选择业务员`)
      return
    }
    if (!record.contributionAmount || record.contributionAmount <= 0) {
      message.error(`入账记录 ${i + 1} 请输入有效的入账金额`)
      return
    }

    // 前端不再校验入账金额是否超过剩余可用金额，全部交给后端判断
  }

  // 计算总入账金额
  const totalContribution = paymentRecords.value.reduce((sum, record) => sum + (record.contributionAmount || 0), 0)
  if (totalContribution > props.invoiceAmount) {
    message.error('总入账金额不能超过发票金额')
    return
  }

  // 构建入账记录数组
  const paymentDtos: API.InvoicePaymentDto[] = paymentRecords.value.map(record => {
    // 确保 bankTransactionId 存在（已验证）
    if (!record.bankTransactionId) {
      throw new Error('银行收支记录ID不能为空')
    }

    const transaction = props.availableBankTransactions.find(t => t.id === record.bankTransactionId)

    // 确定到款日期：优先使用已有记录的paidDate，否则使用银行收支记录的到账时间或当前日期
    let paidDate: string
    if (record.id && props.existingPayments) {
      const existingPayment = props.existingPayments.find(p => p.id === record.id)
      if (existingPayment?.paidDate) {
        paidDate = existingPayment.paidDate
      } else if (transaction?.arrivalTime) {
        paidDate = dayjs(transaction.arrivalTime).format('YYYY-MM-DD')
      } else {
        paidDate = dayjs().format('YYYY-MM-DD')
      }
    } else if (transaction?.arrivalTime) {
      paidDate = dayjs(transaction.arrivalTime).format('YYYY-MM-DD')
    } else {
      paidDate = dayjs().format('YYYY-MM-DD')
    }

    // 确定转账方式：优先使用已有记录的transferMethod，否则使用默认值
    let transferMethod: string = '对公转账'
    if (record.id && props.existingPayments) {
      const existingPayment = props.existingPayments.find(p => p.id === record.id)
      if (existingPayment?.transferMethod) {
        transferMethod = existingPayment.transferMethod
      }
    }

    return {
      id: record.id, // 如果有id，则更新；如果没有，则新增
      invoiceBaseId: 0, // 由父组件设置
      paidDate: paidDate,
      paidAmount: record.contributionAmount!,
      bankTransactionId: record.bankTransactionId, // 确保传递 bankTransactionId
      salespersonId: record.salespersonId,
      transferMethod: transferMethod,
      remark1: record.remark1 || undefined,
      remark2: record.remark2 || undefined,
      remark3: record.remark3 || undefined,
    }
  })

  emit('ok', paymentDtos)
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
  paymentRecords.value = []
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

<style scoped>
.payment-records {
  max-height: 600px;
  overflow-y: auto;
}
</style>

