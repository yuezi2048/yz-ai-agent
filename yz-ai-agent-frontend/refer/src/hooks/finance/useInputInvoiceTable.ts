import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listInputInvoiceByPageUsingPost } from '@/api/caiwuguanlijiekou'

/**
 * 进项发票管理表格 Hook
 */
export function useInputInvoiceTable() {
  return useBaseTable<API.InputInvoice_, {
    companyIds?: number[]
    supplierName?: string
    salespersonName?: string
    invoiceTypeIds?: number[]
    invoicePurposeIds?: number[]
    isAccounted?: boolean
    isPaid?: boolean
    startDate?: string | null
    endDate?: string | null
  }, API.InputVoicePageDTO>({
    queryApi: listInputInvoiceByPageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.InputVoicePageDTO> = {}
      if (searchParams.companyIds && searchParams.companyIds.length > 0) {
        params.companyIds = searchParams.companyIds
      }
      if (searchParams.supplierName) params.supplierName = searchParams.supplierName
      if (searchParams.salespersonName) params.salespersonName = searchParams.salespersonName
      // 注意：进项发票查询接口使用 invoiceTypes / invoicePurposes（名称列表）
      // 这里不直接透传 invoiceTypeIds / invoicePurposeIds，具体映射由页面层（useInputInvoiceManage）负责。
      if (searchParams.isAccounted !== undefined) {
        params.isAccounted = searchParams.isAccounted ? 1 : 0
      }
      if (searchParams.isPaid !== undefined) {
        ;(params as any).isPaid = searchParams.isPaid ? 1 : 0
      }
      if (searchParams.startDate) {
        params.startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : searchParams.startDate
      }
      if (searchParams.endDate) {
        params.endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : searchParams.endDate
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'INPUT_INVOICE_PAGE',
  })
}

