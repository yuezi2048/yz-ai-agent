import { computed, ref, watch, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'
import { useStatisticsTable } from './useStatisticsTable'

/**
 * 统计页面管理 Hook
 * 封装表格列、列宽拖拽、公司选择模态框等逻辑
 */
export function useStatisticsManage() {
  // 统计数据与筛选、饼图逻辑，沿用原有 useStatisticsTable
  const {
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
  } = useStatisticsTable()

  // 统计表格列
  const tableColumns = ref([
    {
      title: '序号',
      dataIndex: 'serialNo',
      width: 80,
      key: 'serialNo',
      sorter: false,
      align: 'center' as const,
      minWidth: 40,
      maxWidth: 1500,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      width: 200,
      key: 'companyName',
      sorter: true,
      align: 'center' as const,
      minWidth: 90,
      maxWidth: 3000,
    },
    {
      title: '开票金额',
      dataIndex: 'totalInvoiceAmount',
      width: 150,
      key: 'totalInvoiceAmount',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 2500,
    },
    {
      title: '收款金额',
      dataIndex: 'totalPaidAmount',
      width: 150,
      key: 'totalPaidAmount',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 2500,
    },
    {
      title: '欠款金额',
      dataIndex: 'unpaidAmount',
      width: 150,
      key: 'unpaidAmount',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 2500,
    },
    {
      title: '发票张数',
      dataIndex: 'invoiceCount',
      width: 100,
      key: 'invoiceCount',
      sorter: true,
      align: 'center' as const,
      minWidth: 60,
      maxWidth: 1500,
    },
    {
      title: '已到款发票张数',
      dataIndex: 'paidInvoiceCount',
      width: 120,
      key: 'paidInvoiceCount',
      sorter: true,
      align: 'center' as const,
      minWidth: 70,
      maxWidth: 2000,
    },
    {
      title: '未到款发票张数',
      dataIndex: 'unpaidInvoiceCount',
      key: 'unpaidInvoiceCount',
      sorter: true,
      align: 'center' as const,
    },
  ])

  // 每次进入时清除列宽存储
  try {
    localStorage.removeItem('STATISTICS_PAGE_TABLE_COLUMN_WIDTHS')
  } catch (error) {
    console.error('清除列宽设置失败', error)
  }

  const { resizableColumns, tableWidth, updateColumnWidth } = useAntdResizableHeader({
    columns: tableColumns,
    columnsState: {
      persistenceKey: 'STATISTICS_PAGE_TABLE_COLUMN_WIDTHS',
      persistenceType: 'localStorage',
    },
  })

  const resizableTableColumns = computed(() => resizableColumns.value)

  // 表格行数
  const tableRowCount = computed(() => dataListWithSerial.value.length)

  /**
   * 表格滚动高度（动态计算，如果行数大于10行才显示滚动条）
   * 每行高度计算：padding上下各8px + line-height(12px * 1.5 = 18px) + 边框约1px = 约39px
   * scroll.y 设置的是表格 body 部分的最大高度，不包括表头
   */
  const tableScrollHeight = computed(() => {
    const rowHeight = 39 // 每行高度（padding: 8px上下 + line-height: 18px + 边框约1px + 间距约2px）
    const maxRows = 10 // 最大显示行数
    
    if (tableRowCount.value <= maxRows) {
      // 如果行数 <= 10，不显示滚动条（返回undefined，Ant Design Vue会禁用垂直滚动）
      return undefined
    } else {
      // 如果行数 > 10，固定显示10行的高度，超出部分通过滚动条查看
      // scroll.y 只计算 body 部分的高度，不包括表头
      // 直接使用 maxRows * rowHeight 确保显示10行
      return maxRows * rowHeight
    }
  })

  // 公司名称选择模态框
  const showCompanyModal = ref(false)

  const handleCompanyModalOk = (selectedCompanyIds: number[]) => {
    searchParams.issuerCompanyIds = selectedCompanyIds
    fetchData()
  }

  // 监听窗口大小变化，调整饼图大小
  const stopWatch = watch(
    () => window.innerWidth,
    () => {
      handleResize()
    },
  )

  const initPageSettings = () => {
    try {
      sessionStorage.removeItem('STATISTICS_PAGE_FILTER_COLLAPSED')
      localStorage.removeItem('STATISTICS_PAGE_TABLE_COLUMN_WIDTHS')
      // 设置默认日期为当前月份
      if (!searchParams.startDate && !searchParams.endDate) {
        searchParams.startDate = dayjs().startOf('month')
        searchParams.endDate = dayjs()
      }
    } catch (error) {
      console.error('重置页面默认设置失败', error)
    }
  }

  const dispose = () => {
    stopWatch()
    window.removeEventListener('resize', handleResize)
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    // 基础数据
    loading,
    statisticsData,
    summaryData,
    dataListWithSerial,
    searchParams,
    companyList,
    pieChartStartDate,
    pieChartEndDate,

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
  }
}


