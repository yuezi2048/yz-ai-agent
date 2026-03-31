import router from '@/router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import ACCESS_ENUM from './accessEnum'
import checkAccess from './checkAccess'
import { message } from 'ant-design-vue'

router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore()

  // 如果访问登录页面
  if (to.path === '/user/login') {
    // 检查是否已经登录
    let loginUser = loginUserStore.loginUser

    // 如果用户信息不存在或未登录，尝试从 sessionStorage 恢复
    if (!loginUser || !('role' in loginUser) || loginUser.role === ACCESS_ENUM.NOT_LOGIN) {
      loginUserStore.initLoginUser()
      loginUser = loginUserStore.loginUser
    }

    // 如果已经登录，跳转到 redirect 或首页
    if (loginUser && 'role' in loginUser && loginUser.role !== ACCESS_ENUM.NOT_LOGIN) {
      const redirect = (to.query.redirect as string) || '/'
      // 检查 redirect 页面是否需要权限，以及用户是否有权限访问
      // 如果 redirect 是登录页面本身，直接跳转到首页
      if (redirect === '/user/login') {
        next('/')
        return
      }
      // 尝试查找目标路由的权限要求
      const targetRoute = router.getRoutes().find(r => r.path === redirect)
      if (targetRoute && targetRoute.meta?.access) {
        const targetAccess = targetRoute.meta.access as string
        // 如果用户没有权限访问目标页面，跳转到首页
        if (!checkAccess(loginUser as any, targetAccess)) {
          next('/')
          return
        }
      }
      next(redirect)
      return
    }

    // 未登录，允许访问登录页面
    next()
    return
  }

  // 在路由守卫中需要手动读取 ref 的值
  let loginUser = loginUserStore.loginUser

  // 如果用户信息不存在或未登录，尝试从 sessionStorage 恢复或从后端获取
  if (!loginUser || !('role' in loginUser) || loginUser.role === ACCESS_ENUM.NOT_LOGIN) {
    // 先尝试从 sessionStorage 恢复
    loginUserStore.initLoginUser()
    loginUser = loginUserStore.loginUser

    // 如果仍然未登录，尝试从后端获取用户信息
    // 只有在 sessionStorage 中没有用户信息时才从后端获取
    // 这样可以避免每次路由切换都请求后端
    if (!loginUser || !('role' in loginUser) || loginUser.role === ACCESS_ENUM.NOT_LOGIN) {
      // 检查 sessionStorage 中是否有用户信息
      const savedUser = sessionStorage.getItem('loginUser')
      if (!savedUser) {
        // 如果 sessionStorage 中没有，才从后端获取
        try {
          await loginUserStore.fetchLoginUser()
          loginUser = loginUserStore.loginUser
        } catch (error) {
          // 获取用户信息失败，继续检查是否需要登录
        }
      }
    }
  }

  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN

  // 要跳转的页面必须要登陆
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    // 如果没登陆，跳转到登录页面
    if (!loginUser || !('role' in loginUser) || loginUser.role === ACCESS_ENUM.NOT_LOGIN) {
      next(`/user/login?redirect=${to.fullPath}`)
      return
    }
    // 如果已经登陆了，但是权限不足，跳转到首页并提示
    if (!checkAccess(loginUser as any, needAccess)) {
      // 避免循环重定向：如果已经在首页，直接阻止访问
      if (to.path === '/') {
        next(false)
        return
      }
      // 跳转到首页，不携带 redirect 参数，避免循环重定向
      message.warning('您没有权限访问该页面')
      next('/')
      return
    }
  }
  next()
})
