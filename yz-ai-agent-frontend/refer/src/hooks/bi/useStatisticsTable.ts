import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { companyStatisticsUsingPost, queryCompanyInvoiceAmountRatioUsingPost } from '@/api/zhinengjiekou'
import { getAllCompanyIdNameUsingGet } from '@/api/gongsixinxijiekou'
import * as echarts from 'echarts'
import { nextTick } from 'vue'

/**
 * 统计页面 Hook
 */
export function useStatisticsTable() {
  const loading = ref(false)
  const statisticsData = ref<API.CompanyStatisticsItem[]>([])
  const summaryData = ref<API.CompanyStatisticsSummary>({
    totalInvoiceAmount: 0,
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalInvoiceCount: 0,
    totalPaidInvoiceCount: 0,
    totalUnpaidInvoiceCount: 0,
  })

  const searchParams = reactive<{
    issuerCompanyIds: number[]
    salespersonName?: string
    startDate?: Dayjs | null
    endDate?: Dayjs | null
  }>({
    issuerCompanyIds: [],
    salespersonName: '',
    startDate: null,
    endDate: null,
  })

  const companyList = ref<API.Company[]>([])
  const pieChartStartDate = ref<Dayjs | null>(null)
  const pieChartEndDate = ref<Dayjs | null>(null)
  let pieChart: echarts.ECharts | null = null

  // 带序号的数据列表
  const dataListWithSerial = computed(() => {
    return statisticsData.value.map((item, index) => ({
      ...item,
      serialNo: index + 1,
    }))
  })

  // 获取公司列表
  const fetchCompanyList = async () => {
    try {
      const res = await getAllCompanyIdNameUsingGet() as any
      if (res.data.code === 0 && Array.isArray(res.data.data)) {
        companyList.value = res.data.data.map((item: any) => ({
          id: item.id,
          companyName: item.companyName,
        } as API.Company))
      } else {
        companyList.value = []
      }
    } catch (error) {
      console.error('获取公司列表失败', error)
      companyList.value = []
    }
  }

  // 获取统计数据
  const fetchData = async () => {
    loading.value = true
    try {
      // 使用 DataStatisticsQueryDTO，并额外传入业务经理姓名
      const params: API.DataStatisticsQueryDTO & { salespersonName?: string } = {}

      // 开票日期区间
      if (searchParams.startDate) {
        params.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        params.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }

      // 公司名称：传 companyIds 列表
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        params.companyIds = [...searchParams.issuerCompanyIds]
      }

      // 业务经理
      if (searchParams.salespersonName) {
        params.salespersonName = searchParams.salespersonName
      }

      const res = await companyStatisticsUsingPost(params) as any
      if (res.data.code === 0 && res.data.data) {
        statisticsData.value = (res.data.data.statistics || []).map((item: API.CompanyStatisticsItem, index: number) => ({
          ...item,
          serialNo: index + 1,
        }))
        summaryData.value = res.data.data.summary || summaryData.value

        await updatePieChart()
      } else {
        message.error('获取统计数据失败 ' + (res.data.message || ''))
      }
    } catch (error) {
      message.error('获取统计数据失败')
    } finally {
      loading.value = false
    }
  }

  // 更新饼图
  const updatePieChart = async () => {
    try {
      // 饼图也使用同一套查询参数：公司 + 业务经理 + 开票日期
      const params: API.DataStatisticsQueryDTO & { salespersonName?: string } = {}

      // 开票日期：与筛选框保持一致
      if (searchParams.startDate) {
        params.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        params.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }

      // 公司 ID 列表
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        params.companyIds = [...searchParams.issuerCompanyIds]
      }

      // 业务经理
      if (searchParams.salespersonName) {
        params.salespersonName = searchParams.salespersonName
      }

      const res = await queryCompanyInvoiceAmountRatioUsingPost(params) as any
      if (res.data.code === 0 && res.data.data) {
        const pieData = res.data.data.items || []

        await nextTick()
        const chartDom = document.getElementById('pieChart')
        if (!chartDom) {
          return
        }

        if (!pieChart) {
          pieChart = echarts.init(chartDom)
        }

        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
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
              data: pieData.map((item: any) => ({
                value: item.amount || 0,
                name: item.companyName || '',
              })),
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

        pieChart.setOption(option)
      }
    } catch (error) {
      console.error('获取饼图数据失败', error)
    }
  }

  // 查询
  const doSearch = () => {
    fetchData()
  }

  // 重置
  const doReset = () => {
    searchParams.issuerCompanyIds = []
    searchParams.salespersonName = ''
    searchParams.startDate = null
    searchParams.endDate = null
    pieChartStartDate.value = null
    pieChartEndDate.value = null
    fetchData()
  }

  // 监听窗口大小变化，调整饼图大小
  const handleResize = () => {
    if (pieChart) {
      pieChart.resize()
    }
  }

  return {
    loading,
    statisticsData,
    summaryData,
    dataListWithSerial,
    searchParams,
    companyList,
    pieChartStartDate,
    pieChartEndDate,
    fetchCompanyList,
    fetchData,
    updatePieChart,
    doSearch,
    doReset,
    handleResize,
  }
}

