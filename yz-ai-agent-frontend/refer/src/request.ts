import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '@/router'

// 区分开发和生产环境
const DEV_BASE_URL = "http://127.0.0.1:8123";
const TEST_BASE_URL = "http://192.168.137.1:8123";
const PROD_BASE_URL = "http://47.109.201.134:8123";
// 创建 Axios 实例
const myAxios = axios.create({
    baseURL: DEV_BASE_URL,
    timeout: 10000,
    withCredentials: true,
});


// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    // 未登录
    if (data.code === 40100) {
      const url = response.request.responseURL || response.config.url || ''
      const isGetLoginRequest = url.includes('employee/get/login')
      const isLoginRequest = url.includes('employee/login')
      const isOnLoginPage = window.location.pathname.includes('/user/login')

      // 如果是获取用户信息的请求，不清除 sessionStorage，让路由守卫处理
      // 如果是登录请求，也不处理（登录失败由登录页面处理）
      // 如果已经在登录页面，也不处理
      if (!isGetLoginRequest && !isLoginRequest && !isOnLoginPage) {
        // 清除本地存储的用户信息
        sessionStorage.removeItem('loginUser')
        // 使用 router 跳转而不是 window.location，避免重复刷新
        const redirect = encodeURIComponent(window.location.href)
        router.replace(`/user/login?redirect=${redirect}`)
        message.warning('登录已过期，请重新登录')
      }
      // 如果是获取用户信息的请求返回 40100，让 fetchLoginUser 处理
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export default myAxios
