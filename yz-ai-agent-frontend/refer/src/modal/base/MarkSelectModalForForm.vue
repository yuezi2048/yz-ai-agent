<template>
  <global-modal
    v-model="visible"
    title="选择销项标识"
    width="500px"
    modal-class="multi-select-modal"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-table
      :columns="columns"
      :data-source="markList"
      :pagination="false"
      :row-key="(record: any) => record.value || ''"
      size="small"
      :bordered="false"
      class="select-table"
    >
      <template #headerCell="{ column }">
        <template v-if="column.key === 'select'">
          <div class="table-header-cell table-header-cell-center">
            <span>选择</span>
          </div>
        </template>
        <template v-else>
          <div class="table-header-cell table-header-cell-left">{{ column.title }}</div>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'select'">
          <div class="table-body-cell-checkbox">
            <a-radio
              :checked="selectedValue === (record.value || '')"
              @change="() => handleSelect(record)"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'markValue'">
          <div
            class="table-body-cell-content clickable-cell"
            @click="handleSelect(record)"
          >
            {{ record.label || record.value || '' }}
          </div>
        </template>
      </template>
    </a-table>
    <template #footer>
      <div class="modal-footer">
        <div class="footer-right">
          <a-space>
            <a-button class="btn-grey" @click="handleCancel">
              <template #icon><CloseOutlined /></template>
              关闭
            </a-button>
            <a-button type="primary" @click="handleOk">
              <template #icon><CheckOutlined /></template>
              保存
            </a-button>
          </a-space>
        </div>
      </div>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import '@/styles/multi-select-modal.css'
import GlobalModal from '@/modal/globalModal.vue'

interface Props {
  modelValue: boolean
  markList: Array<{ value: string; label: string }>
  selectedMarkValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedMarkValue: '',
  markList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedMarkValue: string]
}>()

const visible = ref(false)
const selectedValue = ref<string>('')

const columns = [
  {
    title: '',
    key: 'select',
    width: 60,
    align: 'center' as const,
  },
  {
    title: '销项标识',
    dataIndex: 'value',
    key: 'markValue',
    align: 'left' as const,
  },
]

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    selectedValue.value = props.selectedMarkValue || ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理单个选项的选择（单选）
const handleSelect = (record: any) => {
  selectedValue.value = record.value || ''
}

const handleOk = () => {
  emit('ok', selectedValue.value || '')
  visible.value = false
}

const handleCancel = () => {
  // 恢复之前的选择
  selectedValue.value = props.selectedMarkValue || ''
  visible.value = false
}
</script>

<style scoped>
@import '@/styles/filter.css';

.clickable-cell {
  cursor: pointer;
  user-select: none;
}

.clickable-cell:hover {
  color: #1890ff;
}
</style>

