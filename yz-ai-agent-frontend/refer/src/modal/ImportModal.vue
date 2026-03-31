<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="300px"
  >
    <div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 16px;">
      <a-upload
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
        :max-count="1"
      >
        <a-button>
          <template #icon v-if="showUploadIcon">
            <UploadOutlined />
          </template>
          选择Excel文件
        </a-button>
      </a-upload>
    </div>
    <div style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a-checkbox v-model:checked="overwrite">
          覆盖所有数据
        </a-checkbox>
        <a-button v-if="showDownloadTemplate" type="link" @click="handleDownloadTemplate" style="padding: 0;">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载模板
        </a-button>
      </div>
      <div style="margin-top: 8px; color: #999; font-size: 12px;">
        {{ description || '支持格式：.xlsx, .xls。导入将异步执行，成功后会自动刷新列表。' }}
      </div>
    </div>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">
          <template #icon>
            <CloseOutlined />
          </template>
          关闭
        </a-button>
        <a-button type="primary" @click="handleSubmit">
          <template #icon>
            <CheckOutlined />
          </template>
          确定
        </a-button>
      </a-space>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { CheckOutlined, CloseOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'
import GlobalModal from '@/modal/globalModal.vue'

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  showDownloadTemplate?: boolean
  showUploadIcon?: boolean
  onDownloadTemplate?: () => void | Promise<void>
  onImport: (file: File, overwrite: boolean) => Promise<any>
}

const props = withDefaults(defineProps<Props>(), {
  title: '批量导入',
  description: '',
  showDownloadTemplate: false,
  showUploadIcon: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(false)
const fileList = ref<UploadFile[]>([])
const overwrite = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (!val) {
    fileList.value = []
    overwrite.value = false
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const beforeUpload = (file: File) => {
  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  if (!isExcel) {
    message.error('只能上传Excel文件!')
    return false
  }
  return false
}

const handleDownloadTemplate = async () => {
  if (props.onDownloadTemplate) {
    try {
      await props.onDownloadTemplate()
    } catch (error: any) {
      console.error('下载模板失败', error)
      message.error('下载模板失败 ' + (error.message || '未知错误'))
    }
  }
}

const handleSubmit = async () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要导入的Excel文件')
    return
  }
  const rawFile = fileList.value[0].originFileObj as File | undefined
  if (!rawFile) {
    message.error('文件无效，请重新选择')
    return
  }
  try {
    await props.onImport(rawFile, overwrite.value)
    // 导入成功后关闭模态框并重置状态
    visible.value = false
    fileList.value = []
    overwrite.value = false
  } catch (error: any) {
    console.error('导入失败', error)
    message.error('导入失败 ' + (error.message || '未知错误'))
  }
}

const handleCancel = () => {
  visible.value = false
  fileList.value = []
  overwrite.value = false
}
</script>

