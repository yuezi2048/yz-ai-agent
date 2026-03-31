<template>
  <div id="homePage">
    <!-- Tabs 标签页 -->
    <a-tabs v-model:activeKey="activeTab" style="margin: 8px 0 0 20px;">
      <a-tab-pane key="invoice" tab="发票">
        <!-- 核心数据卡片 -->
        <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
          <!-- 本月开票金额 -->
          <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <a-card class="statistics-card">
              <div class="statistics-title">
                <span style="color: #000; font-weight: bold;">本月开票金额（{{ currentMonthText }}）</span>
              </div>
              <div class="statistics-content">
                <div class="statistics-value" style="color: #1890ff;">
                  {{ formatAmount(monthlyInvoiceAmount) }} 元
                </div>
                <div class="statistics-subtitle">
                  <span style="margin-left: 0;">上月（{{ lastMonthText }}）: {{ formatAmount(lastMonthInvoiceAmount) }} 元</span>
                  <a-button type="link" size="small" @click="showCompanyStatisticsModal('month')" class="company-statistics-btn">
                    各公司统计数
                  </a-button>
                </div>
              </div>
            </a-card>
          </a-col>

          <!-- 本季度开票金额 -->
          <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <a-card class="statistics-card">
              <div class="statistics-title">
                <span style="color: #000; font-weight: bold;">本季度开票金额（{{ currentQuarterText }}）</span>
              </div>
              <div class="statistics-content">
                <div class="statistics-value" style="color: #1890ff;">
                  {{ formatAmount(quarterlyInvoiceAmount) }} 元
                </div>
                <div class="statistics-subtitle">
                  <span style="margin-left: 0;">上季度（{{ lastQuarterText }}）: {{ formatAmount(lastQuarterInvoiceAmount) }} 元</span>
                  <a-button type="link" size="small" @click="showCompanyStatisticsModal('quarter')" class="company-statistics-btn">
                    各公司统计数
                  </a-button>
                </div>
              </div>
            </a-card>
          </a-col>

          <!-- 本月收款金额 -->
          <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <a-card class="statistics-card">
              <div class="statistics-title">
                <span style="color: #000; font-weight: bold;">本月收款金额（{{ currentMonthText }}）</span>
              </div>
              <div class="statistics-content">
                <div class="statistics-value" style="color: #1890ff;">
                  {{ formatAmount(monthlyCollectionAmount) }} 元
                </div>
                <div class="statistics-subtitle">
                  <span style="margin-left: 0;">上月（{{ lastMonthText }}）: {{ formatAmount(lastMonthCollectionAmount) }} 元</span>
                </div>
              </div>
            </a-card>
          </a-col>

          <!-- 应收账款 -->
          <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
            <a-card class="statistics-card">
              <div class="statistics-title">
                <span style="color: #000; font-weight: bold;">应收账款（累计）</span>
              </div>
              <div class="statistics-content">
                <div class="statistics-value" style="color: #1890ff;">
                  {{ formatAmount(accountsReceivable) }} 元
                </div>
                <div class="statistics-subtitle">
                  <span style="margin-left: 0; color: #ff4d4f;">
                    逾期金额 {{ formatAmount(overdueAmount) }} 元
                    <span v-if="overdueEndDateText">（在 {{ overdueEndDateText }} 前）</span>
                  </span>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 快捷入口 -->
        <a-card style="margin-bottom: 20px">
          <template #title>
            <span style="color: #000; font-weight: bold; font-size: 16px;">快捷入口</span>
          </template>
          <div class="quick-access">
            <div
              v-for="item in quickAccessItems"
              :key="item.key"
              class="quick-access-item"
              @click="handleQuickAccess(item.path)"
            >
              <div class="quick-access-icon" :style="{ backgroundColor: item.color }">
                <component :is="item.icon" style="font-size: 24px; color: white;" />
              </div>
              <div class="quick-access-label">{{ item.label }}</div>
            </div>
          </div>
        </a-card>
      </a-tab-pane>
    </a-tabs>


    <!-- 公司统计模态框 -->
    <global-modal
      v-model="companyStatisticsModalVisible"
      :title="companyStatisticsModalTitle"
      width="900px"
    >
      <a-table
        :columns="companyStatisticsColumns"
        :data-source="companyStatisticsData"
        :pagination="false"
        size="small"
        style="margin-bottom: 24px;"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'totalInvoiceAmount'">
            <div class="amount-cell">
              <span class="amount-value" style="font-weight: 500;">{{ formatAmount(record.totalInvoiceAmount || 0) }}</span>
            </div>
          </template>
        </template>
      </a-table>
      <!-- 饼图 -->
      <div id="companyStatisticsPieChart" style="width: 100%; height: 400px;"></div>
    </global-modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { FileTextOutlined, DollarOutlined, BarChartOutlined, UserOutlined, ShopOutlined, FileSearchOutlined, BankOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { companyStatisticsUsingPost } from '@/api/zhinengjiekou'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import { listCompanyByPageUsingPost } from '@/api/gongsixinxijiekou'
import GlobalModal from '@/modal/globalModal.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import checkAccess from '@/access/checkAccess'
import ACCESS_ENUM from '@/access/accessEnum'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// Tabs 标签页
const activeTab = ref('invoice')

// 当前月份文本（用于显示）
const currentMonthText = computed(() => {
  const now = dayjs()
  return `${now.year()}年${now.month() + 1}月`
})

// 上月文本（用于显示）
const lastMonthText = computed(() => {
  const now = dayjs()
  const lastMonth = now.subtract(1, 'month')
  return `${lastMonth.year()}年${lastMonth.month() + 1}月`
})

// 当前季度文本（用于显示）- 整个季度
const currentQuarterText = computed(() => {
  const now = dayjs()
  const quarterStart = now.startOf('quarter')
  const quarterEnd = now.endOf('quarter') // 使用整个季度，允许超过当前日期

  const startYear = quarterStart.year()
  const startMonth = quarterStart.month() + 1
  const endYear = quarterEnd.year()
  const endMonth = quarterEnd.month() + 1

  if (startYear === endYear) {
    return `${startYear}年${startMonth}月-${endYear}年${endMonth}月`
  } else {
    return `${startYear}年${startMonth}月-${endYear}年${endMonth}月`
  }
})

// 上季度文本（用于显示）
const lastQuarterText = computed(() => {
  const now = dayjs()
  const lastQuarterStart = now.subtract(1, 'quarter').startOf('quarter')
  const lastQuarterEnd = now.subtract(1, 'quarter').endOf('quarter')

  const startYear = lastQuarterStart.year()
  const startMonth = lastQuarterStart.month() + 1
  const endYear = lastQuarterEnd.year()
  const endMonth = lastQuarterEnd.month() + 1

  if (startYear === endYear) {
    return `${startYear}年${startMonth}月-${endYear}年${endMonth}月`
  } else {
    return `${startYear}年${startMonth}月-${endYear}年${endMonth}月`
  }
})

// 包含"九华云"的公司ID列表
const jiuhuayunCompanyIds = ref<number[]>([])

// 统计数据
const monthlyInvoiceAmount = ref<number>(0) // 本月开票金额
const lastMonthInvoiceAmount = ref<number>(0) // 上月开票金额
const quarterlyInvoiceAmount = ref<number>(0) // 本季度开票金额
const lastQuarterInvoiceAmount = ref<number>(0) // 上季度开票金额
const monthlyCollectionAmount = ref<number>(0) // 本月收款金额
const lastMonthCollectionAmount = ref<number>(0) // 上月收款金额
const accountsReceivable = ref<number>(0) // 应收账款
const overdueAmount = ref<number>(0) // 逾期金额
// 逾期金额统计的截止日期（例如“在 2026-01-06 前”）
const overdueEndDateText = ref<string>('')

// 公司统计数据
const companyStatisticsModalVisible = ref(false)
const companyStatisticsModalTitle = ref('')
const companyStatisticsData = ref<API.CompanyStatisticsItem[]>([])
const companyStatisticsColumns = [
  { title: '公司名称', dataIndex: 'companyName', key: 'companyName', align: 'center' as const },
  { title: '开票金额（元）', dataIndex: 'totalInvoiceAmount', key: 'totalInvoiceAmount', align: 'center' as const },
]

// 格式化金额显示（添加千分位分隔符）
const formatAmount = (amount: number) => {
  return (amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 饼图实例
let companyStatisticsPieChart: echarts.ECharts | null = null

// 快捷入口配置
const allQuickAccessItems = [
  { key: 'invoice-query', label: '销项发票', icon: FileSearchOutlined, color: '#1890ff', path: '/invoice/info/query' },
  { key: 'bank-transaction', label: '银行收支', icon: DollarOutlined, color: '#52c41a', path: '/finance/bank/transaction' },
  { key: 'input-invoice', label: '进项发票', icon: FileTextOutlined, color: '#fa8c16', path: '/finance/input/invoice' },
  { key: 'client-manage', label: '客户管理', icon: UserOutlined, color: '#1890ff', path: '/invoice/client' },
  { key: 'supplier-manage', label: '供应商管理', icon: ShopOutlined, color: '#722ed1', path: '/supplier/list' },
  { key: 'company-info', label: '公司信息', icon: BankOutlined, color: '#13c2c2', path: '/base/company' },
  { key: 'statistics', label: '报表统计', icon: BarChartOutlined, color: '#faad14', path: '/bi/statistics' },
]

// 根据用户权限过滤快捷入口
const quickAccessItems = computed(() => {
  return allQuickAccessItems.filter((item) => {
    // 获取路由的权限要求
    const route = router.getRoutes().find(r => r.path === item.path)
    const needAccess = route?.meta?.access
    if (!needAccess) return false
    
    // 检查用户是否有权限访问
    return checkAccess(loginUserStore.loginUser, needAccess as string)
  })
})


// 获取包含"九华云"的公司ID列表
const fetchJiuhuayunCompanyIds = async () => {
  try {
    const res = await listCompanyByPageUsingPost({
      current: 1,
      pageSize: 1000,
    }) as any
    if (res.data.code === 0 && res.data.data?.records) {
      const companies = res.data.data.records as API.Company[]
      jiuhuayunCompanyIds.value = companies
        .filter((company) => company.companyName && company.companyName.includes('九华云'))
        .map((company) => company.id!)
        .filter((id): id is number => id !== undefined && id !== null)
    }
  } catch (error) {
    console.error('获取公司列表失败', error)
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    // 确保已获取公司ID列表
    if (jiuhuayunCompanyIds.value.length === 0) {
      await fetchJiuhuayunCompanyIds()
    }

    const now = dayjs()

    // 本月数据
    const monthStart = now.startOf('month')
    const monthEnd = now.endOf('month')
    const lastMonthStart = now.subtract(1, 'month').startOf('month')
    const lastMonthEnd = now.subtract(1, 'month').endOf('month')

    // 本季度数据：根据当前月份判断季度，使用整个季度时间范围（允许结束时间超过当前日期）
    const quarterStart = now.startOf('quarter')
    const quarterEnd = now.endOf('quarter') // 使用整个季度，允许超过当前日期
    // 上季度数据：整个上季度
    const lastQuarterStart = now.subtract(1, 'quarter').startOf('quarter')
    const lastQuarterEnd = now.subtract(1, 'quarter').endOf('quarter')

    // 构建查询参数，包含公司ID过滤
    const baseParams: API.DataStatisticsQueryDTO = {
      companyIds: jiuhuayunCompanyIds.value.length > 0 ? jiuhuayunCompanyIds.value : undefined,
    }

    // 获取本月开票金额
    const monthRes = await companyStatisticsUsingPost({
      ...baseParams,
      startDate: monthStart.format('YYYY-MM-DD'),
      endDate: monthEnd.format('YYYY-MM-DD'),
    }) as any
    if (monthRes.data.code === 0 && monthRes.data.data?.summary) {
      monthlyInvoiceAmount.value = monthRes.data.data.summary.totalInvoiceAmount || 0
      monthlyCollectionAmount.value = monthRes.data.data.summary.totalPaidAmount || 0
    }

    // 获取上月开票金额
    const lastMonthRes = await companyStatisticsUsingPost({
      ...baseParams,
      startDate: lastMonthStart.format('YYYY-MM-DD'),
      endDate: lastMonthEnd.format('YYYY-MM-DD'),
    }) as any
    if (lastMonthRes.data.code === 0 && lastMonthRes.data.data?.summary) {
      lastMonthInvoiceAmount.value = lastMonthRes.data.data.summary.totalInvoiceAmount || 0
      lastMonthCollectionAmount.value = lastMonthRes.data.data.summary.totalPaidAmount || 0
    }

    // 获取本季度开票金额（从季度开始到当前日期）
    const quarterRes = await companyStatisticsUsingPost({
      ...baseParams,
      startDate: quarterStart.format('YYYY-MM-DD'),
      endDate: quarterEnd.format('YYYY-MM-DD'),
    }) as any
    if (quarterRes.data.code === 0 && quarterRes.data.data?.summary) {
      quarterlyInvoiceAmount.value = quarterRes.data.data.summary.totalInvoiceAmount || 0
    }

    // 获取上季度开票金额（整个上季度）
    const lastQuarterRes = await companyStatisticsUsingPost({
      ...baseParams,
      startDate: lastQuarterStart.format('YYYY-MM-DD'),
      endDate: lastQuarterEnd.format('YYYY-MM-DD'),
    }) as any
    if (lastQuarterRes.data.code === 0 && lastQuarterRes.data.data?.summary) {
      lastQuarterInvoiceAmount.value = lastQuarterRes.data.data.summary.totalInvoiceAmount || 0
    }

    // 获取应收账款（所有未到款金额）
    const allRes = await companyStatisticsUsingPost(baseParams) as any
    if (allRes.data.code === 0 && allRes.data.data?.summary) {
      accountsReceivable.value = allRes.data.data.summary.totalUnpaidAmount || 0
    }

    // 计算逾期金额：
    // 计算“开票日期在 14 天及其之前”的欠款发票，使用公司统计接口的 totalUnpaidAmount
    const overdueEndDate = dayjs().subtract(14, 'day')
    overdueEndDateText.value = overdueEndDate.format('YYYY-MM-DD')

    const overdueRes = await companyStatisticsUsingPost({
      ...baseParams,
      // 只传 endDate，统计从最早开票日期到 overdueEndDate（含）的所有欠款金额
      endDate: overdueEndDateText.value,
    }) as any

    if (overdueRes.data.code === 0 && overdueRes.data.data?.summary) {
      overdueAmount.value = overdueRes.data.data.summary.totalUnpaidAmount || 0
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
    message.error('获取统计数据失败')
  }
}

// 显示公司统计模态框
const showCompanyStatisticsModal = async (type: 'month' | 'quarter') => {
  try {
    // 确保已获取公司ID列表
    if (jiuhuayunCompanyIds.value.length === 0) {
      await fetchJiuhuayunCompanyIds()
    }

    const now = dayjs()
    let startDate: string
    let endDate: string
    let title: string

    if (type === 'month') {
      startDate = now.startOf('month').format('YYYY-MM-DD')
      endDate = now.endOf('month').format('YYYY-MM-DD')
      title = '本月各公司开票金额统计'
    } else {
      startDate = now.startOf('quarter').format('YYYY-MM-DD')
      endDate = now.endOf('quarter').format('YYYY-MM-DD')
      title = '本季度各公司开票金额统计'
    }

    const res = await companyStatisticsUsingPost({
      companyIds: jiuhuayunCompanyIds.value.length > 0 ? jiuhuayunCompanyIds.value : undefined,
      startDate,
      endDate,
    }) as any

    if (res.data.code === 0 && res.data.data?.statistics) {
      companyStatisticsData.value = res.data.data.statistics || []
      companyStatisticsModalTitle.value = title
      companyStatisticsModalVisible.value = true
    } else {
      message.error('获取公司统计数据失败')
    }
  } catch (error) {
    console.error('获取公司统计数据失败', error)
    message.error('获取公司统计数据失败')
  }
}

// 窗口大小调整处理函数
let resizeHandler: (() => void) | null = null

// 初始化饼图
const initPieChart = async () => {
  await nextTick()
  const chartDom = document.getElementById('companyStatisticsPieChart')
  if (!chartDom) {
    console.error('饼图容器未找到')
    return
  }

  // 检查数据是否为空
  if (!companyStatisticsData.value || companyStatisticsData.value.length === 0) {
    console.warn('公司统计数据为空，无法绘制饼图')
    return
  }

  // 如果图表已存在，先销毁
  if (companyStatisticsPieChart) {
    companyStatisticsPieChart.dispose()
    companyStatisticsPieChart = null
  }

  // 移除旧的resize监听器
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }

  // 初始化图表
  companyStatisticsPieChart = echarts.init(chartDom)

  // 准备饼图数据
  const pieData = companyStatisticsData.value
    .filter((item) => item.companyName && (item.totalInvoiceAmount || 0) > 0)
    .map((item) => ({
      value: item.totalInvoiceAmount || 0,
      name: item.companyName || '',
    }))

  if (pieData.length === 0) {
    console.warn('没有有效的饼图数据')
    return
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}: ${formatAmount(params.value)} 元 (${params.percent}%)`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '开票金额',
        type: 'pie',
        radius: '50%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  companyStatisticsPieChart.setOption(option)

  // 监听窗口大小变化，调整图表大小
  resizeHandler = () => {
    if (companyStatisticsPieChart) {
      companyStatisticsPieChart.resize()
    }
  }
  window.addEventListener('resize', resizeHandler)
}

// 监听模态框打开/关闭，初始化或清理资源
watch(companyStatisticsModalVisible, async (visible) => {
  if (visible) {
    // 模态框打开时，延迟初始化饼图，确保 DOM 已渲染
    await nextTick()
    setTimeout(() => {
      initPieChart()
    }, 100)
  } else {
    // 模态框关闭时，清理资源
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
      resizeHandler = null
    }
    if (companyStatisticsPieChart) {
      companyStatisticsPieChart.dispose()
      companyStatisticsPieChart = null
    }
  }
})

// 快捷入口点击
const handleQuickAccess = (path: string) => {
  router.push(path)
}


onMounted(async () => {
  await fetchJiuhuayunCompanyIds()
  await fetchStatistics()
})
</script>

<style scoped>
#homePage {
  padding: 0;
}

.statistics-card {
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.statistics-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.statistics-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.statistics-subtitle {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.company-statistics-btn {
  padding: 0;
  height: auto;
  margin-left: auto;
}

.quick-access {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: flex-start;
  padding: 16px 0;
}

.quick-access-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  width: 100px;
}

.quick-access-item:hover {
  transform: translateY(-4px);
}

.quick-access-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.quick-access-label {
  font-size: 12px;
  text-align: center;
  color: #333;
  word-break: break-word;
  line-height: 1.4;
}
</style>
