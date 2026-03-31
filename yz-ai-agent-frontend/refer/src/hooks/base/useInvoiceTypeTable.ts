import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryInvoiceTypePageUsingPost } from '@/api/jichuxinxiguanlijiekou'

/**
 * 发票类型管理表格 Hook
 */
export function useInvoiceTypeTable() {
  return useBaseTable<API.InvoiceType_, {
    typeNames?: string[]
    isEnabledList?: number[]
  }, API.InvoiceTypePageDTO>({
    queryApi: queryInvoiceTypePageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.InvoiceTypePageDTO> = {}
      if (searchParams.typeNames && searchParams.typeNames.length > 0) {
        params.typeNames = searchParams.typeNames
      }
      if (searchParams.isEnabledList && searchParams.isEnabledList.length > 0) {
        params.isEnabledList = searchParams.isEnabledList
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'INVOICE_TYPE_PAGE',
  })
}

