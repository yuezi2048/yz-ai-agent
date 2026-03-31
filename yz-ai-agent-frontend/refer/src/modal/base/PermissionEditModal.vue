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
          <!-- 第一行：权限名称 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="权限名称"
                name="permissionName"
                :rules="[{ required: true, message: '请输入权限名称' }]"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-input v-model:value="formData.permissionName" placeholder="请输入权限名称" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第二行：权限代码 -->
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-form-item
                label="权限代码"
                name="permissionCode"
                :rules="[{ required: !isEditing, message: '请选择权限代码' }]"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }"
              >
                <a-select
                  v-model:value="formData.permissionCode"
                  placeholder="请选择权限代码"
                  style="width: 100%"
                  :disabled="isEditing"
                  allow-clear
                >
                  <a-select-option value="FINANCE">财务岗位（FINANCE）</a-select-option>
                  <a-select-option value="BUSINESS">业务岗位（BUSINESS）</a-select-option>
                  <a-select-option value="ADMIN">管理员（ADMIN）</a-select-option>
                </a-select>
                <!-- 权限说明 -->
                <div v-if="!isEditing" class="permission-description">
                  <div v-if="formData.permissionCode === 'FINANCE'" class="description-item">
                    <strong>财务岗位：</strong>访问财务管理、员工信息模块、修改自己个人信息及登录密码
                  </div>
                  <div v-else-if="formData.permissionCode === 'BUSINESS'" class="description-item">
                    <strong>业务岗位：</strong>访问客户管理模块、发票管理模块、供应商模块、基础信息模块
                  </div>
                  <div v-else-if="formData.permissionCode === 'ADMIN'" class="description-item">
                    <strong>管理员：</strong>访问所有权限
                  </div>
                  <div v-else class="description-item description-placeholder">
                    请选择权限代码以查看说明
                  </div>
                </div>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第三行：排列顺序 -->
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
          <!-- 第四行：启用状态 -->
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
          <!-- 第五行：备注 -->
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
  permissionName: string
  permissionCode: string
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
    permissionName: '',
    permissionCode: '',
    sortOrder: 0,
    isEnabled: 1,
    remark: '',
  }),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
  'next-edit': [callback: (success: boolean) => void]
  'prev-edit': [callback: (success: boolean) => void]
  'reset': []
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)

const originalFormData = ref<Partial<FormData> | null>(null)

const displayTitle = computed(() => {
  if (props.serialNo !== null && props.serialNo !== undefined) {
    return `${props.title}（第 ${props.serialNo} 条）`
  }
  return props.title
})

const formData = reactive<FormData>({
  permissionName: '',
  permissionCode: '',
  sortOrder: 0,
  isEnabled: 1,
  remark: '',
})

watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val
    if (val && props.formData) {
      isEditing.value = !!(props.formData.permissionName && props.formData.permissionName.trim())
      originalFormData.value = {
        permissionName: props.formData.permissionName || '',
        permissionCode: props.formData.permissionCode || '',
        sortOrder: props.formData.sortOrder ?? 0,
        isEnabled: props.formData.isEnabled ?? 1,
        remark: props.formData.remark || '',
      }
      Object.assign(formData, originalFormData.value)
      await nextTick()
      upsertModalRef.value?.resetButtonState()
    } else {
      Object.assign(formData, {
        permissionName: '',
        permissionCode: '',
        sortOrder: 0,
        isEnabled: 1,
        remark: '',
      })
      isEditing.value = false
      originalFormData.value = null
      await nextTick()
      upsertModalRef.value?.resetButtonState()
    }
  },
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSave = async (callback: (success: boolean) => void) => {
  try {
    await formRef.value?.validate()
    emit('ok', { ...formData }, callback)
  } catch (error) {
    console.error('表单验证失败', error)
    callback(false)
  }
}

const handleNext = () => {
  formRef.value?.clearValidate()
  upsertModalRef.value?.resetButtonState()
  emit('next')
}

watch(
  () => props.formData,
  (newFormData) => {
    if (visible.value && newFormData) {
      if (newFormData.permissionName && newFormData.permissionName.trim()) {
        originalFormData.value = {
          permissionName: newFormData.permissionName || '',
          permissionCode: newFormData.permissionCode || '',
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
  },
  { deep: true },
)

const handleNextEdit = (callback: (success: boolean) => void) => {
  emit('next-edit', callback)
}

const handlePrevEdit = (callback: (success: boolean) => void) => {
  emit('prev-edit', callback)
}

const handleReset = () => {
  formRef.value?.resetFields()
  if (isEditing.value) {
    if (originalFormData.value) {
      Object.assign(formData, { ...originalFormData.value })
    } else if (props.formData) {
      Object.assign(formData, {
        permissionName: props.formData.permissionName || '',
        permissionCode: props.formData.permissionCode || '',
        sortOrder: props.formData.sortOrder ?? 0,
        isEnabled: props.formData.isEnabled ?? 1,
        remark: props.formData.remark || '',
      })
    }
  } else {
    Object.assign(formData, {
      permissionName: '',
      permissionCode: '',
      sortOrder: 0,
      isEnabled: 1,
      remark: '',
    })
  }
  formRef.value?.clearValidate()
  upsertModalRef.value?.resetButtonState()
}
</script>

<style scoped>
.permission-description {
  margin-top: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
}

.description-item {
  color: #666;
}

.description-item strong {
  color: #333;
  font-weight: 600;
}

.description-placeholder {
  color: #999;
  font-style: italic;
}
</style>


