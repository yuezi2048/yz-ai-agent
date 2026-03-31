<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="520px"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-form ref="formRef" :model="localForm" layout="vertical" :validate-trigger="['submit']">
      <a-form-item label="供货单位" name="companyName" :rules="[{ required: true, message: '请输入供货单位' }]">
        <a-input v-model:value="localForm.companyName" placeholder="请输入供货单位" allow-clear />
      </a-form-item>
      <a-form-item label="供货姓名" name="supplierName" :rules="[{ required: true, message: '请输入供货姓名' }]">
        <a-input v-model:value="localForm.supplierName" placeholder="请输入供货姓名" allow-clear />
      </a-form-item>
      <a-form-item label="联系电话" name="phone">
        <a-input v-model:value="localForm.phone" placeholder="请输入联系电话（可选）" allow-clear />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="visible = false">取消</a-button>
        <a-button type="primary" @click="handleOk">保存</a-button>
      </a-space>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'

interface FormModel {
  id?: number
  companyName: string
  supplierName: string
  phone?: string
}

interface Props {
  modelValue: boolean
  title: string
  formData: Partial<FormModel>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  ok: [data: FormModel, done: (success: boolean) => void]
}>()

const visible = ref(false)
const formRef = ref()
const localForm = reactive<FormModel>({
  id: undefined,
  companyName: '',
  supplierName: '',
  phone: '',
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      Object.assign(localForm, {
        id: props.formData.id,
        companyName: props.formData.companyName || '',
        supplierName: props.formData.supplierName || '',
        phone: (props.formData as any)?.phone || '',
      })
      formRef.value?.clearValidate?.()
    }
  },
)

watch(visible, (val) => emit('update:modelValue', val))

const handleOk = async () => {
  try {
    await formRef.value?.validate()
    emit('ok', { ...localForm }, (success: boolean) => {
      if (success) {
        visible.value = false
      }
    })
  } catch (error) {
    // 校验失败无需处理
  }
}
</script>

<style scoped>
</style>

