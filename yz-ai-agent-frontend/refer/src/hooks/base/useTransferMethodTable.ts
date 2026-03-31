import { useBaseTable } from '@/hooks/common/useBaseTable'
import { queryTransferMethodPageUsingPost } from '@/api/jichuxinxiguanlijiekou'

/**
 * 转账方式管理表格 Hook
 */
export function useTransferMethodTable() {
  return useBaseTable<API.TransferMethod_, {
    methodNames?: string[]
    isEnabledList?: number[]
  }, API.TransferMethodPageDTO>({
    queryApi: queryTransferMethodPageUsingPost,
    transformSearchParams: (searchParams) => {
      const params: Partial<API.TransferMethodPageDTO> = {}
      if (searchParams.methodNames && searchParams.methodNames.length > 0) {
        params.methodNames = searchParams.methodNames
      }
      if (searchParams.isEnabledList && searchParams.isEnabledList.length > 0) {
        params.isEnabledList = searchParams.isEnabledList
      }
      return params
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'TRANSFER_METHOD_PAGE',
  })
}

