import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listEmployeeUsingPost } from '@/api/yuangongguanlijiekou'

/**
 * 员工管理表格 Hook
 */
export function useEmployeeTable() {
  return useBaseTable<API.EmployeeVO, {
    employeeNo?: string
    name?: string
    companyIds?: number[]
    department?: string
    hireDateStart?: string
    hireDateEnd?: string
    regularDateStart?: string
    regularDateEnd?: string
  }, any>({
    queryApi: listEmployeeUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.EmployeeQueryDTO> = {}
      if (searchParams.name) params.name = searchParams.name
      if (searchParams.employeeNo) params.employeeNo = searchParams.employeeNo
      if (searchParams.companyIds && searchParams.companyIds.length > 0) params.companyIds = searchParams.companyIds
      if (searchParams.department) params.department = searchParams.department
      if (searchParams.hireDateStart) params.hireDateStart = searchParams.hireDateStart
      if (searchParams.hireDateEnd) params.hireDateEnd = searchParams.hireDateEnd
      if (searchParams.regularDateStart) params.regularDateStart = searchParams.regularDateStart
      if (searchParams.regularDateEnd) params.regularDateEnd = searchParams.regularDateEnd
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'EMPLOYEE_MANAGE_PAGE',
  })
}

