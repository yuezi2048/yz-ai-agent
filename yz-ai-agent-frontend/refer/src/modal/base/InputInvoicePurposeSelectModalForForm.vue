<template>
  <global-modal
    v-model="visible"
    title="选择进票用途"
    width="500px"
    modal-class="multi-select-modal"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-table
      :columns="columns"
      :data-source="purposeList"
      :pagination="false"
      :row-key="(record: API.InvoicePurposeItemVO) => record.id || 0"
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
              :checked="selectedKey === record.id"
              @change="() => handleSelect(record)"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'purposeName'">
          <div
            class="table-body-cell-content clickable-cell"
            @click="handleSelect(record)"
          >
            {{ record.purposeName }}
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
import { ref, watch, computed } from 'vue'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import '@/styles/multi-select-modal.css'
import GlobalModal from '@/modal/globalModal.vue'

interface Props {
  modelValue: boolean
  purposeList: API.InvoicePurposeItemVO[]
  selectedPurposeName?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedPurposeName: '',
  purposeList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedPurposeName: string]
}>()

const visible = ref(false)
const selectedKey = ref<number | null>(null)

const columns = [
  {
    title: '',
    key: 'select',
    width: 60,
    align: 'center' as const,
  },
  {
    title: '进票用途',
    dataIndex: 'purposeName',
    key: 'purposeName',
    align: 'left' as const,
  },
]

// 获取有效的用途列表（有 id 且 id > 0）
const validPurposeList = computed(() => {
  return props.purposeList.filter((p: API.InvoicePurposeItemVO) => p.id && p.id > 0)
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 根据选中的用途名称找到对应的 id
    if (props.selectedPurposeName) {
      const selectedPurpose = validPurposeList.value.find((p: API.InvoicePurposeItemVO) => p.purposeName === props.selectedPurposeName)
      selectedKey.value = selectedPurpose?.id || null
    } else {
      selectedKey.value = null
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理单个选项的选择（单选）
const handleSelect = (record: API.InvoicePurposeItemVO) => {
  if (record.id) {
    selectedKey.value = record.id
  }
}

const handleOk = () => {
  // 根据选中的 id 找到对应的用途名称
  const selectedPurpose = validPurposeList.value.find((p: API.InvoicePurposeItemVO) => p.id === selectedKey.value)
  if (selectedPurpose) {
    emit('ok', selectedPurpose.purposeName || '')
  } else {
    emit('ok', '')
  }
  visible.value = false
}

const handleCancel = () => {
  // 恢复之前的选择
  if (props.selectedPurposeName) {
    const selectedPurpose = validPurposeList.value.find((p: API.InvoicePurposeItemVO) => p.purposeName === props.selectedPurposeName)
    selectedKey.value = selectedPurpose?.id || null
  } else {
    selectedKey.value = null
  }
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


