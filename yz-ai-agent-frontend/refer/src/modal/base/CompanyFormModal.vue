<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="900px"
    :mask-closable="false"
    :keyboard="true"
  >
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="isEditing"
      :show-footer="props.showFooter"
      :show-next-button="props.showNextButton"
      :show-prev-button="props.showPrevButton"
      :show-reset-button="props.showResetButton"
      @save="handleSave"
      @next="handleNext"
      @next-edit="handleNextEdit"
      @reset="handleReset"
    >
      <template #content>
        <div class="form-modal">
          <a-form
            ref="formRef"
            :model="formData"
            :validate-trigger="['submit']"
            layout="horizontal"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 18 }"
          >
          <!-- 第一行：公司名称、公司税务 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-form-item
                label="公司名称"
                name="companyName"
                :rules="[{ required: true, message: '请输入公司名称' }]"
              >
                <a-input v-model:value="formData.companyName" placeholder="请输入公司名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                label="公司税务"
                name="taxNo"
              >
                <a-input v-model:value="formData.taxNo" placeholder="请输入公司税务" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第二行：法人、注册电话 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-form-item
                label="法人"
                name="legalPerson"
              >
                <a-input v-model:value="formData.legalPerson" placeholder="请输入法人" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                label="注册电话"
                name="registerPhone"
              >
                <a-input v-model:value="formData.registerPhone" placeholder="请输入注册电话" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第三行：注册地址（通栏） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="注册地址"
                name="registerAddress"
                :label-col="{ span: 3 }"
                :wrapper-col="{ span: 21 }"
              >
                <a-input v-model:value="formData.registerAddress" placeholder="请输入注册地址" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第四行：银行名称、银行账号 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-form-item
                label="银行名称"
                name="bankName"
              >
                <a-input v-model:value="formData.bankName" placeholder="请输入银行名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                label="银行账号"
                name="bankAccount"
              >
                <a-input v-model:value="formData.bankAccount" placeholder="请输入银行账号" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第五行：联系人、联系电话 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-form-item
                label="联系人"
                name="contactPerson"
              >
                <a-input v-model:value="formData.contactPerson" placeholder="请输入联系人" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                label="联系电话"
                name="contactPhone1"
              >
                <a-input v-model:value="formData.contactPhone1" placeholder="请输入联系电话" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第六行：备注（对应 remark1，通栏） -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注"
                name="remark1"
                :label-col="{ span: 3 }"
                :wrapper-col="{ span: 21 }"
              >
                <a-input v-model:value="formData.remark1" placeholder="请输入备注" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        </div>
      </template>
    </upsert-modal>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'

interface FormData {
  id?: number
  companyName: string
  taxNo: string
  legalPerson: string
  registerAddress: string
  registerPhone: string
  bankName: string
  bankAccount: string
  contactPerson: string
  contactPhone1: string
  remark1: string
  remark2: string
  remark3: string
}

interface Props {
  modelValue: boolean
  title: string
  formData?: Partial<FormData>
  /** 是否显示底部操作栏 */
  showFooter?: boolean
  /** 是否显示下一条按钮 */
  showNextButton?: boolean
  /** 是否显示上一条按钮 */
  showPrevButton?: boolean
  /** 是否显示重置按钮 */
  showResetButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({
    companyName: '',
    taxNo: '',
    legalPerson: '',
    registerAddress: '',
    registerPhone: '',
    bankName: '',
    bankAccount: '',
    contactPerson: '',
    contactPhone1: '',
    remark1: '',
    remark2: '',
    remark3: '',
  }),
  showFooter: true,
  showNextButton: true,
  showPrevButton: true,
  showResetButton: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
  'next-edit': [callback: (success: boolean) => void] // 编辑模式的下一条，传递回调函数
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

const formData = reactive<FormData>({
  id: undefined as any,
  companyName: '',
  taxNo: '',
  legalPerson: '',
  registerAddress: '',
  registerPhone: '',
  bankName: '',
  bankAccount: '',
  contactPerson: '',
  contactPhone1: '',
  remark1: '',
  remark2: '',
  remark3: '',
})

// 监听 props.modelValue
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.formData) {
    // 判断是否为编辑模式（有 companyName 且不为空）
    isEditing.value = !!(props.formData.companyName && props.formData.companyName.trim())

    Object.assign(formData, {
      id: (props.formData as any).id,
      companyName: props.formData.companyName || '',
      taxNo: props.formData.taxNo || '',
      legalPerson: props.formData.legalPerson || '',
      registerAddress: props.formData.registerAddress || '',
      registerPhone: props.formData.registerPhone || '',
      bankName: props.formData.bankName || '',
      bankAccount: props.formData.bankAccount || '',
      contactPerson: props.formData.contactPerson || '',
      contactPhone1: props.formData.contactPhone1 || '',
      remark1: props.formData.remark1 || '',
      remark2: props.formData.remark2 || '',
      remark3: props.formData.remark3 || '',
    })
  } else {
    // 重置表单
    Object.assign(formData, {
      id: undefined,
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone1: '',
      remark1: '',
      remark2: '',
      remark3: '',
    })
    isEditing.value = false
    upsertModalRef.value?.resetButtonState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 保存按钮处理
const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
    emit('ok', { ...formData }, callback)
  } catch (error) {
    console.error('表单验证失败', error)
    // 表单验证失败时，立即调用 callback(false) 通知 upsertModal 停止 loading
    callback(false)
  }
}

// 下一条按钮处理（新增模式）
const handleNext = () => {
  // 新增模式：保留所有已填入的字段，包括唯一字段
  // 这样用户可以在旧数据基础上快速修改录入，提高录入效率
  // 不进行任何字段清空操作，完全保留所有数据
  // 只清除验证状态，不清除字段值
  formRef.value?.clearValidate()
  // 重置状态机：保存可用，下一条禁用
  upsertModalRef.value?.resetButtonState()
  // 触发 next 事件
  emit('next')
}

// 下一条编辑按钮处理（编辑模式）
const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

// 重置按钮处理
const handleReset = () => {
  // 重置校验
  formRef.value?.resetFields()
  // 如果有原始 formData，则恢复为 props.formData 的值；否则清空为初始值
  if (props.formData) {
    Object.assign(formData, {
      id: (props.formData as any).id,
      companyName: props.formData.companyName || '',
      taxNo: props.formData.taxNo || '',
      legalPerson: props.formData.legalPerson || '',
      registerAddress: props.formData.registerAddress || '',
      registerPhone: props.formData.registerPhone || '',
      bankName: props.formData.bankName || '',
      bankAccount: props.formData.bankAccount || '',
      contactPerson: props.formData.contactPerson || '',
      contactPhone1: props.formData.contactPhone1 || '',
      remark1: props.formData.remark1 || '',
      remark2: props.formData.remark2 || '',
      remark3: props.formData.remark3 || '',
    })
  } else {
    Object.assign(formData, {
      id: undefined,
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone1: '',
      remark1: '',
      remark2: '',
      remark3: '',
    })
  }
  // 清除校验提示
  formRef.value?.clearValidate?.()
  // 重置 UpsertModal 内部按钮状态
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
</style>

