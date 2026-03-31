import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listCompanyByPageUsingPost } from '@/api/gongsixinxijiekou'

/**
 * 公司管理表格 Hook
 */
export function useCompanyTable() {
  return useBaseTable<API.Company, {
    companyIds?: number[]
    companyName?: string
    taxNo?: string
    legalPerson?: string
  }, API.CompanyPageDTO>({
    queryApi: listCompanyByPageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.CompanyPageDTO> = {}
      if (searchParams.companyIds && searchParams.companyIds.length > 0) {
        // 后端定义 companyIds?: string[]，这里用字符串形式的 ID 列表
        params.companyIds = searchParams.companyIds.map(id => String(id))
      }
      if (searchParams.companyName) params.companyName = searchParams.companyName
      if (searchParams.taxNo) params.taxNo = searchParams.taxNo
      if (searchParams.legalPerson) params.legalPerson = searchParams.legalPerson
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'COMPANY_MANAGE',
  })
}

