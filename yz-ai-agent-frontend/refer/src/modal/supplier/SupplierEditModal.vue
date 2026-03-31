<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="1200px"
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
      @prev-edit="handlePrevEdit"
      @reset="handleReset"
    >
      <template #content>
        <div class="form-modal">
          <a-form
            ref="formRef"
            :model="formData"
            :label-col="{ span: 6 }"
            :validate-trigger="['submit']"
            :wrapper-col="{ span: 18 }"
          >
          <!-- 第一行：公司名称、供货姓名、供货电话 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item
                label="公司名称"
                name="companyName"
                :rules="[{ required: true, message: '请输入公司名称' }]"
              >
                <a-input v-model:value="formData.companyName" placeholder="请输入公司名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="供货姓名"
                name="supplierName"
                :rules="[{ required: true, message: '请输入供货姓名' }]"
              >
                <a-input v-model:value="formData.supplierName" placeholder="请输入供货姓名" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="供货电话"
                name="supplierPhone"
              >
                <a-input v-model:value="formData.supplierPhone" placeholder="请输入供货电话" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第二行：公司税号、法人、注册电话 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item
                label="公司税号"
                name="taxNo"
              >
                <a-input v-model:value="formData.taxNo" placeholder="请输入公司税号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="法人"
                name="legalPerson"
              >
                <a-input v-model:value="formData.legalPerson" placeholder="请输入法人" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="注册电话"
                name="registerPhone"
              >
                <a-input v-model:value="formData.registerPhone" placeholder="请输入注册电话" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第三行：注册地址、邮箱、微信 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item
                label="注册地址"
                name="registerAddress"
              >
                <a-input v-model:value="formData.registerAddress" placeholder="请输入注册地址" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="邮箱"
                name="email"
              >
                <a-input v-model:value="formData.email" placeholder="请输入邮箱" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                label="微信"
                name="wechat"
              >
                <a-input v-model:value="formData.wechat" placeholder="请输入微信" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第四行：银行名称、银行账号 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="8">
              <a-form-item
                label="银行名称"
                name="bankName"
              >
                <a-input v-model:value="formData.bankName" placeholder="请输入银行名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :span="16">
              <a-form-item
                label="银行账号"
                name="bankAccount"
                :label-col="{ span: 3 }"
                :wrapper-col="{ span: 21 }"
              >
                <a-input v-model:value="formData.bankAccount" placeholder="请输入银行账号" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第五行：经营范围 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="经营范围"
                name="businessScope"
                :label-col="{ span: 2 }"
                :wrapper-col="{ span: 22 }"
              >
                <a-input v-model:value="formData.businessScope" placeholder="请输入经营范围" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第六行：备注 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注"
                name="remark1"
                :label-col="{ span: 2 }"
                :wrapper-col="{ span: 22 }"
              >
                <a-textarea v-model:value="formData.remark1" placeholder="请输入备注" :rows="3" />
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
import { ref, watch, reactive, computed, nextTick } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'

interface FormData {
  id?: number
  companyName: string
  supplierName?: string
  supplierPhone?: string
  taxNo?: string
  legalPerson?: string
  registerPhone?: string
  registerAddress?: string
  email?: string
  wechat?: string // 微信字段，存储到remark2
  bankName?: string
  bankAccount?: string
  businessScope?: string
  remark1?: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
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
    supplierName: '',
    supplierPhone: '',
    taxNo: '',
    legalPerson: '',
    registerPhone: '',
    registerAddress: '',
    email: '',
    wechat: '',
    bankName: '',
    bankAccount: '',
    businessScope: '',
    remark1: '',
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
  'prev-edit': [callback: (success: boolean) => void] // 编辑模式的上一条，传递回调函数
  'reset': [] // 重置事件
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

// 保存原始记录数据，用于重置
const originalFormData = ref<Partial<FormData> | null>(null)

// 计算显示的标题（包含序号）
const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

const formData = reactive<FormData>({
  id: undefined,
  companyName: '',
  supplierName: '',
  supplierPhone: '',
  taxNo: '',
  legalPerson: '',
  registerPhone: '',
  registerAddress: '',
  email: '',
  wechat: '',
  bankName: '',
  bankAccount: '',
  businessScope: '',
  remark1: '',
})

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val && props.formData) {
    isEditing.value = !!(props.formData.companyName && props.formData.companyName.trim())
    // 保存原始数据用于重置
    originalFormData.value = {
      id: (props.formData as any).id,
      companyName: props.formData.companyName || '',
      supplierName: props.formData.supplierName || '',
      supplierPhone: props.formData.supplierPhone || '',
      taxNo: props.formData.taxNo || '',
      legalPerson: props.formData.legalPerson || '',
      registerPhone: props.formData.registerPhone || '',
      registerAddress: props.formData.registerAddress || '',
      email: props.formData.email || '',
      wechat: (props.formData as any).wechat || (props.formData as any).remark2 || '', // 微信从wechat或remark2读取
      bankName: props.formData.bankName || '',
      bankAccount: props.formData.bankAccount || '',
      businessScope: props.formData.businessScope || '',
      remark1: props.formData.remark1 || '',
    }
    Object.assign(formData, originalFormData.value)
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  } else {
    Object.assign(formData, {
      id: undefined,
      companyName: '',
      supplierName: '',
      supplierPhone: '',
      taxNo: '',
      legalPerson: '',
      registerPhone: '',
      registerAddress: '',
      email: '',
      wechat: '',
      bankName: '',
      bankAccount: '',
      businessScope: '',
      remark1: '',
    })
    isEditing.value = false
    originalFormData.value = null
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

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

// 监听 formData 变化（用于编辑模式下更新数据，如下一条功能）
watch(() => props.formData, (newFormData) => {
  if (visible.value && newFormData) {
    if (newFormData.companyName && newFormData.companyName.trim()) {
      // 保存原始数据用于重置
      originalFormData.value = {
        id: (newFormData as any).id,
        companyName: newFormData.companyName || '',
        supplierName: newFormData.supplierName || '',
        supplierPhone: newFormData.supplierPhone || '',
        taxNo: newFormData.taxNo || '',
        legalPerson: newFormData.legalPerson || '',
        registerPhone: newFormData.registerPhone || '',
        registerAddress: newFormData.registerAddress || '',
        email: newFormData.email || '',
        wechat: (newFormData as any).remark2 || '', // 微信从remark2读取
        bankName: newFormData.bankName || '',
        bankAccount: newFormData.bankAccount || '',
        businessScope: newFormData.businessScope || '',
        remark1: newFormData.remark1 || '',
      }
      Object.assign(formData, originalFormData.value)
      nextTick().then(() => {
        upsertModalRef.value?.resetButtonState()
      })
    }
  }
}, { deep: true })

const handleNextEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  // 将 callback 逐级向上传递，确保 API 响应状态能正确返回到 upsertModal
  emit('prev-edit', callback)
}

const handleReset = () => {
  // 重置表单到初始状态
  formRef.value?.resetFields()
  // 重置表单数据
  if (isEditing.value) {
    // 编辑模式：重置为原始记录的数据
    if (originalFormData.value) {
      Object.assign(formData, { ...originalFormData.value })
    } else if (props.formData) {
      // 如果没有保存的原始数据，使用 props.formData
      Object.assign(formData, {
        id: (props.formData as any).id,
        companyName: props.formData.companyName || '',
        supplierName: props.formData.supplierName || '',
        supplierPhone: props.formData.supplierPhone || '',
        taxNo: props.formData.taxNo || '',
        legalPerson: props.formData.legalPerson || '',
        registerPhone: props.formData.registerPhone || '',
        registerAddress: props.formData.registerAddress || '',
        email: props.formData.email || '',
        wechat: (props.formData as any).remark2 || '',
        bankName: props.formData.bankName || '',
        bankAccount: props.formData.bankAccount || '',
        businessScope: props.formData.businessScope || '',
        remark1: props.formData.remark1 || '',
      })
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
      id: undefined,
      companyName: '',
      supplierName: '',
      supplierPhone: '',
      taxNo: '',
      legalPerson: '',
      registerPhone: '',
      registerAddress: '',
      email: '',
      wechat: '',
      bankName: '',
      bankAccount: '',
      businessScope: '',
      remark1: '',
    })
  }
  // 清除验证状态
  formRef.value?.clearValidate()
  // 重置按钮状态
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
@import '@/styles/form-modal.css';
</style>

