<template>
  <global-modal
    v-model="visible"
    :title="displayTitle"
    width="600px"
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
            :validate-trigger="['submit']"
          >
          <!-- 第一行：标注 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="标注"
                name="markValue"
                :rules="[{ required: true, message: '请输入标注' }]"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-input v-model:value="formData.markValue" placeholder="请输入标注（如：000、DK3等）" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第二行：排列顺序 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="排列顺序"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-input-number 
                  v-model:value="formData.sortOrder" 
                  placeholder="数字越小越靠前" 
                  :min="0" 
                  style="width: 100%" 
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第三行：启用状态 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="启用状态"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-select v-model:value="formData.isEnabled" placeholder="请选择" style="width: 100%">
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="0">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第四行：备注 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="备注"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-textarea v-model:value="formData.remark" placeholder="请输入备注" :rows="3" />
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
  markValue: string
  markLabel: string
  sortOrder: number
  isEnabled: number
  remark: string
}

interface Props {
  modelValue: boolean
  title: string
  serialNo?: number | null
  formData?: Partial<FormData>
}

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({
    markValue: '',
    markLabel: '',
    sortOrder: 0,
    isEnabled: 1,
    remark: '',
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
  markValue: '',
  markLabel: '',
  sortOrder: 0,
  isEnabled: 1,
  remark: '',
})

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val && props.formData) {
    isEditing.value = !!(props.formData.markValue && props.formData.markValue.trim())
    // 保存原始数据用于重置
    originalFormData.value = {
      markValue: props.formData.markValue || '',
      markLabel: props.formData.markLabel || '',
      sortOrder: props.formData.sortOrder ?? 0,
      isEnabled: props.formData.isEnabled ?? 1,
      remark: props.formData.remark || '',
    }
    Object.assign(formData, originalFormData.value)
    await nextTick()
    upsertModalRef.value?.resetButtonState()
  } else {
    Object.assign(formData, {
      markValue: '',
      markLabel: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
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
    if (newFormData.markValue && newFormData.markValue.trim()) {
      // 保存原始数据用于重置
      originalFormData.value = {
        markValue: newFormData.markValue || '',
        markLabel: newFormData.markLabel || '',
        sortOrder: newFormData.sortOrder ?? 0,
        isEnabled: newFormData.isEnabled ?? 1,
        remark: newFormData.remark || '',
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
        markValue: props.formData.markValue || '',
        markLabel: props.formData.markLabel || '',
        sortOrder: props.formData.sortOrder ?? 0,
        isEnabled: props.formData.isEnabled ?? 1,
        remark: props.formData.remark || '',
      })
    }
  } else {
    // 新增模式：重置为初始值
    Object.assign(formData, {
      markValue: '',
      markLabel: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
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
