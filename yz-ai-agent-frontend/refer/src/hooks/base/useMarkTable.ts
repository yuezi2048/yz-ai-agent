import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryMarkPageUsingPost } from '@/api/jichuxinxiguanlijiekou'

/**
 * 标号管理表格 Hook
 */
export function useMarkTable() {
  return useBaseTable<API.MarkConfig_, {
    markValues?: string[]
    isEnabledList?: number[]
  }, API.MarkPageDTO>({
    queryApi: queryMarkPageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.MarkPageDTO> = {}
      if (searchParams.markValues && searchParams.markValues.length > 0) {
        params.markValues = searchParams.markValues
      }
      if (searchParams.isEnabledList && searchParams.isEnabledList.length > 0) {
        params.isEnabledList = searchParams.isEnabledList
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'MARK_PAGE',
  })
}

