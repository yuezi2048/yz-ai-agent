import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import 'ant-design-vue/dist/reset.css'
import '@/styles/table.css'
import '@/styles/card.css'

// 注册路由权限守卫
import '@/access'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 应用启动时，从 sessionStorage 中恢复登录用户信息
const loginUserStore = useLoginUserStore()
loginUserStore.initLoginUser()

app.use(router)
app.use(Antd)
app.use(VueCropper)
app.mount('#app')
