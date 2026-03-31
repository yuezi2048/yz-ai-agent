import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryInvoicePageUsingPost } from '@/api/fapiaoxinxiguanli'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * 应收账款管理表格 Hook
 * 后端通过 isOwed=true 直接返回应收列表
 */
export function useAccountsReceivableTable() {
  return useBaseTable<API.InvoiceItem, {
    startDate?: Dayjs | string | null // 放宽类型定义，兼容 string
    endDate?: Dayjs | string | null
    clientCompanyName?: string
    issuerCompanyIds?: number[]
  }, API.InvoicePageDto>({
    queryApi: queryInvoicePageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: any = {}
      // 使用 dayjs() 包裹后再调用 format，兼容 Dayjs 对象、Date 对象和字符串
      if (searchParams.startDate) {
        params.startDate = dayjs(searchParams.startDate).format('YYYY-MM-DD')
      }
      if (searchParams.endDate) {
        params.endDate = dayjs(searchParams.endDate).format('YYYY-MM-DD')
      }
      if (searchParams.clientCompanyName) params.clientCompanyName = searchParams.clientCompanyName
      if (searchParams.issuerCompanyIds && searchParams.issuerCompanyIds.length > 0) {
        params.issuerCompanyIds = searchParams.issuerCompanyIds
      }
      // 直接通过后端 isOwed=true 获取应收列表
      params.isOwed = true
      return params as Partial<API.InvoicePageDto>
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'ACCOUNTS_RECEIVABLE_PAGE',
  })
}

