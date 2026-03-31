import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listTransactionByPageUsingPost } from '@/api/caiwuguanlijiekou'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * 银行交易管理表格 Hook
 */
export function useBankTransactionTable() {
  return useBaseTable<API.BankTransaction_, {
    issuerCompanyIds?: number[]
    clientCompanyName?: string
    salespersonName?: string
    userName?: string
    invoiceNo?: string
    startDate?: Dayjs | string | null
    endDate?: Dayjs | string | null
    minAmount?: number
    maxAmount?: number
    includePositive?: boolean
    includeNegative?: boolean
  }, API.TransactionPageDTO>({
    queryApi: listTransactionByPageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.TransactionPageDTO> = {}
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        params.issuerCompanyIds = searchParams.issuerCompanyIds
      }
      if (searchParams.clientCompanyName) params.clientCompanyName = searchParams.clientCompanyName
      if (searchParams.salespersonName) params.salespersonName = searchParams.salespersonName
      if (searchParams.userName) params.userName = searchParams.userName
      if (searchParams.invoiceNo) params.invoiceNo = searchParams.invoiceNo
      if (searchParams.startDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.startDate = dayjs(searchParams.startDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        // 统一使用 dayjs 包装，兼容字符串、Dayjs 对象等多种类型
        params.endDate = dayjs(searchParams.endDate as any).format('YYYY-MM-DD')
      }
      if (searchParams.minAmount !== undefined && searchParams.minAmount !== null) {
        params.minAmount = searchParams.minAmount
      }
      if (searchParams.maxAmount !== undefined && searchParams.maxAmount !== null) {
        params.maxAmount = searchParams.maxAmount
      }
      // 处理收付类型筛选：如果两个都不选，则不过滤；如果只选一个，则只显示该类型；如果都选，则显示所有
      if (searchParams.includePositive !== undefined || searchParams.includeNegative !== undefined) {
        // 如果只选了收（正），则只显示正数
        if (searchParams.includePositive && !searchParams.includeNegative) {
          params.minAmount = Math.max(params.minAmount || 0, 0.01)
        }
        // 如果只选了支（负），则只显示负数
        if (searchParams.includeNegative && !searchParams.includePositive) {
          params.maxAmount = Math.min(params.maxAmount || 0, -0.01)
        }
        // 如果都选或都不选，则不过滤（显示所有）
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'BANK_TRANSACTION_PAGE',
  })
}

