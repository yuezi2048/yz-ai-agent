import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listSupplierUsingPost } from '@/api/gongyingshangguanlijiekou'

/**
 * 供应商管理表格 Hook
 */
export function useSupplierTable() {
  return useBaseTable<API.Supplier_, {
    companyName?: string
    supplierName?: string
    legalPerson?: string
    taxNo?: string
    registerAddress?: string
    businessScope?: string
  }, API.SupplierQueryDTO>({
    queryApi: listSupplierUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.SupplierQueryDTO> = {}
      if (searchParams.companyName) params.companyName = searchParams.companyName
      if (searchParams.supplierName) params.supplierName = searchParams.supplierName
      if (searchParams.legalPerson) params.legalPerson = searchParams.legalPerson
      if (searchParams.taxNo) params.taxNo = searchParams.taxNo
      if (searchParams.registerAddress) params.registerAddress = searchParams.registerAddress
      if (searchParams.businessScope) params.businessScope = searchParams.businessScope
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'SUPPLIER_MANAGE_PAGE',
  })
}

