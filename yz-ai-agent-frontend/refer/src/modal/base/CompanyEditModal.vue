<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="900px"
    :mask-closable="false"
    :keyboard="true"
  >
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="isEditing"
      :show-footer="true"
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
            layout="horizontal"
            :validate-trigger="['submit']"
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

          <!-- 第六行：启用状态、排列顺序 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="12">
              <a-form-item
                label="启用状态"
                name="isEnabled"
              >
                <a-select v-model:value="formData.isEnabled" placeholder="请选择启用状态">
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="0">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                label="排列顺序"
                name="sortOrder"
              >
                <a-input-number v-model:value="formData.sortOrder" :min="0" placeholder="请输入排列顺序" style="width: 100%" />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 第七行：备注（单独一行） -->
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
import { ref, watch, reactive, computed, nextTick } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'

interface FormData {
  companyName: string
  taxNo: string
  legalPerson: string
  registerAddress: string
  registerPhone: string
  bankName: string
  bankAccount: string
  contactPerson: string
  contactPhone1: string
  isEnabled: number
  sortOrder: number
  remark1: string
  remark2: string
  remark3: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  formData?: Partial<FormData>
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
    isEnabled: 1,
    sortOrder: 0,
    remark1: '',
    remark2: '',
    remark3: '',
  }),
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
  companyName: '',
  taxNo: '',
  legalPerson: '',
  registerAddress: '',
  registerPhone: '',
  bankName: '',
  bankAccount: '',
  contactPerson: '',
  contactPhone1: '',
  isEnabled: 1,
  sortOrder: 0,
  remark1: '',
  remark2: '',
  remark3: '',
})

// 监听 props.modelValue
watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val && props.formData) {
    // 判断是否为编辑模式（有 companyName 且不为空）
    isEditing.value = !!(props.formData.companyName && props.formData.companyName.trim())

    // 保存原始数据用于重置
    originalFormData.value = {
      companyName: props.formData.companyName || '',
      taxNo: props.formData.taxNo || '',
      legalPerson: props.formData.legalPerson || '',
      registerAddress: props.formData.registerAddress || '',
      registerPhone: props.formData.registerPhone || '',
      bankName: props.formData.bankName || '',
      bankAccount: props.formData.bankAccount || '',
      contactPerson: props.formData.contactPerson || '',
      contactPhone1: props.formData.contactPhone1 || '',
      isEnabled: typeof props.formData.isEnabled === 'number' ? props.formData.isEnabled : 1,
      sortOrder: typeof props.formData.sortOrder === 'number' ? props.formData.sortOrder : 0,
      remark1: props.formData.remark1 || '',
      remark2: props.formData.remark2 || '',
      remark3: props.formData.remark3 || '',
    }
    Object.assign(formData, originalFormData.value)
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  } else {
    // 重置表单
    Object.assign(formData, {
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone1: '',
      isEnabled: 1,
      sortOrder: 0,
      remark1: '',
      remark2: '',
      remark3: '',
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

// 监听 formData 变化（用于编辑模式下更新数据，如下一条功能）
watch(() => props.formData, (newFormData) => {
  if (visible.value && newFormData) {
    if (newFormData.companyName && newFormData.companyName.trim()) {
      // 保存原始数据用于重置
      originalFormData.value = {
        companyName: newFormData.companyName || '',
        taxNo: newFormData.taxNo || '',
        legalPerson: newFormData.legalPerson || '',
        registerAddress: newFormData.registerAddress || '',
        registerPhone: newFormData.registerPhone || '',
        bankName: newFormData.bankName || '',
        bankAccount: newFormData.bankAccount || '',
        contactPerson: newFormData.contactPerson || '',
        contactPhone1: newFormData.contactPhone1 || '',
        isEnabled: typeof newFormData.isEnabled === 'number' ? newFormData.isEnabled : 1,
        sortOrder: typeof newFormData.sortOrder === 'number' ? newFormData.sortOrder : 0,
        remark1: newFormData.remark1 || '',
        remark2: newFormData.remark2 || '',
        remark3: newFormData.remark3 || '',
      }
      Object.assign(formData, originalFormData.value)
      nextTick().then(() => {
        upsertModalRef.value?.resetButtonState()
      })
    }
  }
}, { deep: true })

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
        companyName: props.formData.companyName || '',
        taxNo: props.formData.taxNo || '',
        legalPerson: props.formData.legalPerson || '',
        registerAddress: props.formData.registerAddress || '',
        registerPhone: props.formData.registerPhone || '',
        bankName: props.formData.bankName || '',
        bankAccount: props.formData.bankAccount || '',
        contactPerson: props.formData.contactPerson || '',
        contactPhone1: props.formData.contactPhone1 || '',
        isEnabled: typeof props.formData.isEnabled === 'number' ? props.formData.isEnabled : 1,
        sortOrder: typeof props.formData.sortOrder === 'number' ? props.formData.sortOrder : 0,
        remark1: props.formData.remark1 || '',
        remark2: props.formData.remark2 || '',
        remark3: props.formData.remark3 || '',
      })
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
      companyName: '',
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      registerPhone: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone1: '',
      isEnabled: 1,
      sortOrder: 0,
      remark1: '',
      remark2: '',
      remark3: '',
    })
  }
  // 清除验证状态
  formRef.value?.clearValidate()
  // 重置按钮状态
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
</style>

