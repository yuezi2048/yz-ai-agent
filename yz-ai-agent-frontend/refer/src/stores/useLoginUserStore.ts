import { ref } from 'vue'
import { defineStore } from 'pinia'
import ACCESS_ENUM from '@/access/accessEnum'
import { getLoginUserUsingGet } from '@/api/yuangongguanlijiekou'

type LoginUserState = (API.LoginUserVO & { role?: string }) | { name?: string; role?: string }

/**
 * 存储用户信息的状态
 */
export const useLoginUserStore = defineStore('loginUser', () => {
  // 初始状态：未登录
  const loginUser = ref<LoginUserState>({
    name: '未登录',
    role: ACCESS_ENUM.NOT_LOGIN,
  })

  /**
   * 根据后端返回的 LoginUserVO 设置前端登录用户信息
   * 会额外映射 permission -> role，兼容原有权限体系
   * 权限映射：'所有功能' -> SUPER_ADMIN
   */
  function setLoginUserFromApi(user?: API.LoginUserVO | null) {
    if (!user || !user.id) {
      loginUser.value = {
        name: '未登录',
        role: ACCESS_ENUM.NOT_LOGIN,
      }
      // 清除 sessionStorage 中的用户信息
      sessionStorage.removeItem('loginUser')
      return
    }

    // 优先使用 permissionCode（后端返回的编码：'FINANCE', 'BUSINESS', 'ADMIN'）
    // 如果没有 permissionCode，则使用 permission 字段进行映射（兼容旧代码）
    let role = ACCESS_ENUM.USER
    if (user.permissionCode) {
      // 直接使用 permissionCode，应该与 ACCESS_ENUM 的值一致
      if (user.permissionCode === ACCESS_ENUM.SUPER_ADMIN || user.permissionCode === 'ADMIN') {
        role = ACCESS_ENUM.SUPER_ADMIN
      } else if (user.permissionCode === ACCESS_ENUM.FINANCE_USER || user.permissionCode === 'FINANCE') {
        role = ACCESS_ENUM.FINANCE_USER
      } else if (user.permissionCode === ACCESS_ENUM.BUSINESS_USER || user.permissionCode === 'BUSINESS') {
        role = ACCESS_ENUM.BUSINESS_USER
      }
    } else if (user.permission) {
      // 兼容旧代码：使用 permission 字段进行映射
      if (user.permission === '所有功能' || user.permission === '管理员') {
        role = ACCESS_ENUM.SUPER_ADMIN
      } else if (user.permission === '财务岗位') {
        role = ACCESS_ENUM.FINANCE_USER
      } else if (user.permission === '业务岗位') {
        role = ACCESS_ENUM.BUSINESS_USER
      }
    }

    loginUser.value = {
      ...user,
      role,
    }

    // 保存到 sessionStorage
    sessionStorage.setItem('loginUser', JSON.stringify(loginUser.value))

  }

  /**
   * 兼容旧代码的通用设置方法
   */
  function setLoginUser(newLoginUser: any) {
    // 如果显式传入 null / undefined，则视为退出登录
    if (!newLoginUser) {
      setLoginUserFromApi(null)
      return
    }
    loginUser.value = newLoginUser
    sessionStorage.setItem('loginUser', JSON.stringify(loginUser.value))
  }

  /**
   * 从后端获取当前登录用户信息
   */
  async function fetchLoginUser() {
    try {
      const res = await getLoginUserUsingGet()
      if (res.data.code === 0 && res.data.data) {
        setLoginUserFromApi(res.data.data)
        return res.data.data
      } else if (res.data.code === 40100) {
        // 如果是 40100（未登录），说明 cookie 无效或过期
        // 清除本地存储的用户信息
        setLoginUserFromApi(null)
        return null
      } else {
        // 其他错误，不清除用户信息，可能是网络问题等
        // 尝试从 sessionStorage 恢复
        const savedUser = sessionStorage.getItem('loginUser')
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser)
            loginUser.value = user
            return user
          } catch (e) {
            // 解析失败，清除
            setLoginUserFromApi(null)
          }
        }
        return null
      }
    } catch (error: any) {
      // 如果请求失败（网络错误等），尝试从 sessionStorage 恢复
      // 但如果是 401 错误，说明未登录，应该清除
      if (error?.response?.status === 401 || error?.response?.data?.code === 40100) {
        setLoginUserFromApi(null)
        return null
      }

      const savedUser = sessionStorage.getItem('loginUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          loginUser.value = user
          return user
        } catch (e) {
          setLoginUserFromApi(null)
        }
      } else {
        // 如果没有保存的用户信息，也不清除（可能是首次访问）
        // 保持当前状态
      }
      return null
    }
  }

  /**
   * 初始化：从 sessionStorage 恢复用户信息
   */
  function initLoginUser() {
    const savedUser = sessionStorage.getItem('loginUser')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        loginUser.value = user
      } catch (e) {
        setLoginUserFromApi(null)
      }
    }
  }

  return { loginUser, setLoginUserFromApi, setLoginUser, fetchLoginUser, initLoginUser }
})
