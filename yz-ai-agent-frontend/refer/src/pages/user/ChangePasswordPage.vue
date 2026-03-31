<template>
  <div id="changePasswordPage">
    <a-card>
      <template #title>
        <span>修改密码</span>
      </template>
      <a-form
        ref="formRef"
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        :rules="rules"
        @finish="handleSubmit"
      >
        <a-form-item label="原密码" name="oldPassword">
          <a-input-password
            v-model:value="formData.oldPassword"
            placeholder="请输入原密码"
            style="width: 300px"
          />
        </a-form-item>
        <a-form-item label="新密码" name="newPassword">
          <a-input-password
            v-model:value="formData.newPassword"
            placeholder="请输入新密码"
            style="width: 300px"
          />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password
            v-model:value="formData.confirmPassword"
            placeholder="请再次输入新密码"
            style="width: 300px"
          />
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 6, span: 16 }">
          <a-space>
            <a-button type="primary" html-type="submit">确认修改</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { updatePasswordUsingPost } from '@/api/yuangongguanlijiekou'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const router = useRouter()
const formRef = ref()
const loginUserStore = useLoginUserStore()

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 验证确认密码
const validateConfirmPassword = (_rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请再次输入新密码')
  }
  if (value !== formData.newPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // 确保获取到当前登录用户的 id
    let userId = (loginUserStore.loginUser as any)?.id as string | number | undefined
    if (!userId) {
      const user = await loginUserStore.fetchLoginUser()
      userId = (user as any)?.id
    }

    if (!userId) {
      message.error('无法获取当前用户信息，暂时无法修改密码')
      return
    }

    const res = await updatePasswordUsingPost({
      id: String(userId),
      newPassword: formData.newPassword,
      oldPassword: formData.oldPassword,
    }) as any
    
    if (res.data.code === 0) {
      message.success('密码修改成功')
      router.back()
    } else {
      message.error('密码修改失败：' + (res.data.message || ''))
    }
  } catch (error: any) {
    if (error?.errorFields) {
      // 表单验证失败
      return
    }
    message.error('密码修改失败：' + (error?.message || '未知错误'))
  }
}

const handleReset = () => {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  formRef.value?.resetFields()
}
</script>

<style scoped>
#changePasswordPage {
  padding: 20px;
}
</style>





