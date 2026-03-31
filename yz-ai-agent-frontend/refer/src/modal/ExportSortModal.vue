<template>
  <global-modal
    v-model="visible"
    title="导出设置"
    width="420px"
  >
    <!-- 设置阶段 -->
    <div v-if="exportStage === 'setting'" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
      <div style="color: #666; font-size: 12px;">
        请选择导出排序条件
      </div>

      <div style="display: flex; gap: 12px;">
        <div style="flex: 1;">
          <div style="margin-bottom: 6px; color: #333;">排序字段</div>
          <a-select
            v-model:value="sortField"
            placeholder="请选择排序字段"
            :options="fieldOptions"
            allow-clear
            style="width: 100%;"
            show-search
            :filter-option="filterOption"
          />
        </div>
        <div style="width: 140px;">
          <div style="margin-bottom: 6px; color: #333;">排序方式</div>
          <a-select
            v-model:value="sortOrder"
            placeholder="请选择"
            :options="orderOptions"
            style="width: 100%;"
          />
        </div>
      </div>

      <div style="color: #999; font-size: 12px; line-height: 18px;">
        <div style="color: #333; font-size: 12px; font-weight: 500; margin-bottom: 4px;">提示: </div>
        <div style="margin-bottom: 4px;">1. 导出内容为筛选后的所有记录，请确认筛选内容是否正确</div>
        <div>2. 如果当前列表数据量较大，将会逐页生成 Excel，请耐心等待。</div>
      </div>
    </div>

    <!-- 导出进度阶段 -->
    <div v-if="exportStage === 'exporting'" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
      <div style="color: #333; font-size: 14px; font-weight: 500;">正在导出数据...</div>
      <div>
        <a-progress :percent="exportProgress" :status="exportProgress === 100 ? 'success' : 'active'" />
        <div style="color: #666; font-size: 12px; margin-top: 8px; text-align: center;">
          {{ exportStatusText }}
        </div>
      </div>
    </div>

    <!-- 导出完成阶段 -->
    <div v-if="exportStage === 'completed'" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <CheckCircleOutlined style="color: #52c41a; font-size: 20px;" />
        <div style="color: #333; font-size: 14px; font-weight: 500;">导出成功</div>
      </div>
      <div style="color: #666; font-size: 13px; line-height: 1.6;">
        共导出 <span style="color: #1890ff; font-weight: 500;">{{ exportRecordCount }}</span> 条记录
      </div>
      <div style="color: #999; font-size: 12px;">
        文件已保存到您的下载文件夹
      </div>
    </div>

    <template #footer>
      <a-space>
        <a-button v-if="exportStage === 'setting'" @click="handleCancel">取消</a-button>
        <a-button v-if="exportStage === 'setting'" type="primary" @click="handleOk" :disabled="!sortField || isGlobalExporting">开始导出</a-button>
        <a-button v-if="exportStage === 'exporting'" @click="handleCancelExport">取消导出</a-button>
        <a-button v-if="exportStage === 'completed'" type="primary" @click="handleClose">关闭</a-button>
      </a-space>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onUnmounted, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'
import { useExportStore } from '@/stores/useExportStore'

type ColumnLike = {
  key?: string
  title?: any
  dataIndex?: any
}

interface Props {
  modelValue: boolean
  /** 自定义列（通常传 customizableColumns / allColumns） */
  columns: ColumnLike[]
  /** 默认排序字段 */
  defaultSortField?: string
  /** 默认排序方式 */
  defaultSortOrder?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  defaultSortField: undefined,
  defaultSortOrder: 'asc',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  ok: [payload: { 
    sortField: string
    sortOrder: 'asc' | 'desc'
    abortSignal: AbortSignal
    onProgress: (progress: number, statusText: string) => void
    onComplete: (recordCount: number) => void
    onCancel: () => void
  }]
}>()

const visible = ref(false)
const sortField = ref<string | undefined>(props.defaultSortField)
const sortOrder = ref<'asc' | 'desc'>(props.defaultSortOrder || 'asc')

// 导出状态
const exportStage = ref<'setting' | 'exporting' | 'completed'>('setting')
const exportProgress = ref(0)
const exportStatusText = ref('准备中...')
const exportRecordCount = ref(0)

// 全局导出状态管理
const exportStore = useExportStore()
const isGlobalExporting = computed(() => exportStore.isExporting)

// 取消控制器
let abortController: AbortController | null = null

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    // 只有在非导出状态下才重置状态，避免在导出过程中关闭后恢复窗口时重置状态
    if (val && exportStage.value !== 'exporting') {
      sortField.value = props.defaultSortField
      sortOrder.value = props.defaultSortOrder || 'asc'
      // 重置状态
      exportStage.value = 'setting'
      exportProgress.value = 0
      exportStatusText.value = '准备中...'
      exportRecordCount.value = 0
      // 清理之前的取消控制器
      if (abortController) {
        abortController.abort()
        abortController = null
      }
    }
  },
)

watch(visible, (val) => {
  emit('update:modelValue', val)
  // 如果正在导出且关闭窗口，显示确认对话框
  if (!val && exportStage.value === 'exporting') {
    // 延迟执行，避免与 Modal.confirm 冲突
    nextTick(() => {
      if (exportStage.value === 'exporting') {
        handleCloseDuringExport()
      }
    })
  }
})

const fieldOptions = computed(() => {
  const cols = Array.isArray(props.columns) ? props.columns : []
  return cols
    .filter((c) => {
      const key = String(c?.key ?? '')
      const dataIndex = c?.dataIndex
      // 排除序号、操作列、以及没有 dataIndex 的列
      if (key === 'serialNo' || key === 'action') return false
      if (typeof dataIndex !== 'string' || !dataIndex.trim()) return false
      if (dataIndex === 'serialNo') return false
      return true
    })
    .map((c) => ({
      label: String(c?.title ?? c?.dataIndex ?? c?.key ?? ''),
      value: String(c?.dataIndex),
    }))
})

const orderOptions = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' },
]

const filterOption = (input: string, option: any) => {
  const label = String(option?.label ?? '')
  return label.toLowerCase().includes(String(input ?? '').toLowerCase())
}

const handleCancel = () => {
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}

// 导出过程中关闭窗口的处理
const handleCloseDuringExport = () => {
  Modal.confirm({
    title: '确认取消导出',
    content: '导出正在进行中，确定要取消导出吗？',
    okText: '确定',
    cancelText: '继续导出',
    onOk: () => {
      // 取消导出
      exportStore.cancelExport()
      exportStage.value = 'setting'
      exportProgress.value = 0
      exportStatusText.value = '准备中...'
      abortController = null
    },
    onCancel: () => {
      // 继续导出，恢复窗口
      // 使用 nextTick 确保状态更新后再设置 visible
      nextTick(() => {
        visible.value = true
      })
    },
  })
}

// 取消导出按钮的处理
const handleCancelExport = () => {
  Modal.confirm({
    title: '确认取消导出',
    content: '导出正在进行中，确定要取消导出吗？',
    okText: '确定',
    cancelText: '继续导出',
    onOk: () => {
      // 取消导出
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      exportStore.cancelExport()
      exportStage.value = 'setting'
      exportProgress.value = 0
      exportStatusText.value = '准备中...'
    },
  })
}

const handleOk = () => {
  if (!sortField.value) {
    message.warning('请选择排序字段')
    return
  }
  
  // 检查是否有正在进行的导出任务
  const abortSignal = exportStore.startExport()
  if (!abortSignal) {
    message.warning('已有导出任务正在进行中，请等待完成后再试')
    return
  }
  
  // 保存取消信号引用（用于后续检查）
  abortController = { signal: abortSignal, abort: () => exportStore.cancelExport() } as AbortController
  
  // 切换到导出中状态
  exportStage.value = 'exporting'
  exportProgress.value = 0
  exportStatusText.value = '准备中...'
  
  // 提供进度回调和完成回调
  const onProgress = (progress: number, statusText: string) => {
    // 检查是否已取消
    if (abortSignal.aborted) {
      return
    }
    exportProgress.value = progress
    exportStatusText.value = statusText
  }
  
  const onComplete = (recordCount: number) => {
    // 检查是否已取消
    if (abortSignal.aborted) {
      return
    }
    exportProgress.value = 100
    exportStatusText.value = '导出完成'
    exportRecordCount.value = recordCount
    exportStage.value = 'completed'
    
    // 完成导出任务
    exportStore.finishExport()
  }
  
  const onCancel = () => {
    exportStore.finishExport()
    exportStage.value = 'setting'
    exportProgress.value = 0
    exportStatusText.value = '准备中...'
    exportRecordCount.value = 0
    // 导出失败或取消时，关闭模态框
    visible.value = false
  }
  
  emit('ok', { 
    sortField: sortField.value, 
    sortOrder: sortOrder.value,
    abortSignal: abortSignal,
    onProgress,
    onComplete,
    onCancel
  })
}

// 组件卸载时清理
onUnmounted(() => {
  if (abortController) {
    exportStore.cancelExport()
    abortController = null
  }
})
</script>


