export interface ContactSelectOptions {
  fetchContactList: (companyName: string) => Promise<void>
  getContactList: () => string[]
  getCurrentContact: () => string
  setContact: (value: string) => void
  clearContactList?: () => void
  clearAssociation?: () => void
  checkAssociation?: (companyName: string, contactName: string) => Promise<void>
}

/**
 * 创建通用的联系人选择处理函数，避免在多处组件重复编写逻辑。
 * 规则：
 * - 不自动填充唯一联系人。
 * - 仅当当前联系人仍在可选列表中时保留，否则清空并重置关联状态。
 * - 可选地在保留联系人时触发关联校验。
 */
export const createContactSelectHandler = (options: ContactSelectOptions) => {
  const {
    fetchContactList,
    getContactList,
    getCurrentContact,
    setContact,
    clearContactList,
    clearAssociation,
    checkAssociation,
  } = options

  return async (companyName: string) => {
    if (companyName) {
      const currentContact = getCurrentContact()
      await fetchContactList(companyName)
      const contactList = getContactList()

      if (currentContact && contactList.includes(currentContact)) {
        setContact(currentContact)
        if (checkAssociation) {
          await checkAssociation(companyName, currentContact)
        }
      } else {
        setContact('')
        clearAssociation?.()
      }
    } else {
      clearContactList?.()
      setContact('')
      clearAssociation?.()
    }
  }
}

