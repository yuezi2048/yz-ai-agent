<template>
  <global-modal v-model="visible" title="创建员工" width="600px" :mask-closable="false" :keyboard="true">
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="false"
      :show-footer="true"
      @save="handleSave"
      @next="handleNext"
    >
      <template #content>
        <a-form
          ref="formRef"
          layout="vertical"
          :model="formData"
          :validate-trigger="['submit']"
        >
      <a-form-item label="工号" name="account">
        <a-input v-model:value="formData.account" placeholder="请输入工号" allowClear />
      </a-form-item>

      <a-form-item label="姓名" name="name">
        <a-input v-model:value="formData.name" placeholder="请输入姓名" allowClear />
      </a-form-item>

      <a-form-item label="用户角色" name="role">
        <a-select
            v-model:value="formData.role"
            :options="ADMIN_ROLE_OPTIONS"
            placeholder="请选择用户角色"
            allowClear
        />
      </a-form-item>

      <a-form-item label="单位编号" name="orgId" :rules="[{ required: true, message: '请输入单位编号' }]">
        <a-input v-model:value="formData.orgId" placeholder="请输入单位编号" allowClear />
      </a-form-item>
        </a-form>
      </template>
    </upsert-modal>
  </global-modal>
</template>

<script setup lang="ts">
import { ref, defineExpose, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ADMIN_ROLE_OPTIONS } from "@/constants/role.ts"
import { addEmployeeUsingPost, type EmployeeAddDTO } from "@/api/yuangongguanlijiekou.ts"
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'

// 定义组件属性类型
interface Props {
  modelValue: boolean
  onSuccess?: () => void
}

// 给组件指定初始值
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 控制弹窗可见性
const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 重置表单
    Object.assign(formData, {
      account: '',
      name: '',
      role: '',
      orgId: '',
    })
    formRef.value?.resetFields()
    upsertModalRef.value?.resetButtonState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 打开弹窗
const openModal = () => {
  visible.value = true
}

// 关闭弹窗
const closeModal = () => {
  visible.value = false
}

// 暴露函数给父组件
defineExpose({
  openModal,
})

const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()

// 初始化表单数据
const formData = reactive({
  account: '', // 工号
  name: '', // 姓名
  role: '', // 角色（权限）
  orgId: '', // 公司ID
})

// 处理保存
const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    
    if (!formData.account || !formData.name || !formData.orgId) {
      message.warning('请完整填写工号、姓名和单位编号')
      callback(false)
      return
    }

    // 映射前端角色到后端权限文案
    let permission: string | undefined
    if (formData.role === 'superAdmin') {
      permission = '管理员'
    } else if (formData.role === 'districtAdmin') {
      permission = '财务岗位'
    } else if (formData.role === 'provinceAdmin') {
      permission = '业务岗位'
    }

    const submitData: EmployeeAddDTO = {
      employeeNo: formData.account,
      companyId: Number(formData.orgId),
      name: formData.name,
      permission,
    }

    const res = await addEmployeeUsingPost(submitData as any)
    if (res.data.code === 0) {
      message.success('员工添加成功')
      closeModal()
      props.onSuccess?.()
      callback(true)
    } else {
      message.error('员工添加失败，' + (res.data.message || ''))
      callback(false)
    }
  } catch (error) {
    console.error('表单验证失败', error)
    callback(false)
  }
}

// 处理下一条
const handleNext = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    account: '',
    name: '',
    role: '',
    orgId: '',
  })
  upsertModalRef.value?.resetButtonState()
}

</script>
