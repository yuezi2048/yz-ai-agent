import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listEmployeeUsingPost } from '@/api/yuangongguanlijiekou'

/**
 * 用户管理表格 Hook
 */
export function useUserTable() {
  return useBaseTable<API.Employee_, {
    employeeNo?: string
    name?: string
  }, API.EmployeeQueryDTO>({
    queryApi: listEmployeeUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.EmployeeQueryDTO> = {}
      if (searchParams.employeeNo) params.employeeNo = searchParams.employeeNo
      if (searchParams.name) params.name = searchParams.name
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'USER_MANAGE_PAGE',
  })
}

