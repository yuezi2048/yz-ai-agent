import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryInvoicePurposePageUsingPost } from '@/api/jichuxinxiguanlijiekou'

/**
 * 进票用途管理表格 Hook
 */
export function useInputInvoicePurposeTable() {
  return useBaseTable<API.InvoicePurposeItemVO, {
    purposeNames?: string[]
    isEnabledList?: number[]
  }, API.InvoicePurposePageDTO>({
    queryApi: queryInvoicePurposePageUsingPost,
    extractData: (res: any) => {
      // 进票用途接口返回的是 invoicePurposeItemVOList，不是 records
      const payload = res?.data ?? res
      if (payload?.code === 0 && payload?.data) {
        return {
          records: payload.data.invoicePurposeItemVOList ?? payload.data.records ?? [],
          total: payload.data.total ?? 0,
        }
      }
      return { records: [], total: 0 }
    },
    transformSearchParams: (searchParams) => {
      const params: Partial<API.InvoicePurposePageDTO> = {}
      if (searchParams.purposeNames && searchParams.purposeNames.length > 0) {
        params.purposeNames = searchParams.purposeNames
      }
      if (searchParams.isEnabledList && searchParams.isEnabledList.length > 0) {
        params.isEnabledList = searchParams.isEnabledList
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'INPUT_INVOICE_PURPOSE_PAGE',
  })
}

