import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryPermissionPageUsingPost } from '@/api/jichuxinxiguanlijiekou'

/**
 * 权限管理表格 Hook
 */
export function usePermissionTable() {
  return useBaseTable<API.PermissionItemVO, {
    permissionNames?: string[]
    isEnabledList?: number[]
  }, API.PermissionPageDTO>({
    queryApi: queryPermissionPageUsingPost,
    extractData: (res: any) => {
      // 权限管理接口返回的是 permissionItemVOList，不是 records
      const payload = res?.data ?? res
      if (payload?.code === 0 && payload?.data) {
        return {
          records: payload.data.permissionItemVOList ?? payload.data.records ?? [],
          total: payload.data.total ?? 0,
        }
      }
      return { records: [], total: 0 }
    },
    transformSearchParams: (searchParams) => {
      const params: Partial<API.PermissionPageDTO> = {}
      if (searchParams.permissionNames && searchParams.permissionNames.length > 0) {
        params.permissionNames = searchParams.permissionNames
      }
      if (searchParams.isEnabledList && searchParams.isEnabledList.length > 0) {
        params.isEnabledList = searchParams.isEnabledList
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'PERMISSION_PAGE',
  })
}


