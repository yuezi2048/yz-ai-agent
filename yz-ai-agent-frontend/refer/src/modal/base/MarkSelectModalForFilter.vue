<template>
  <global-modal
    v-model="visible"
    title="选择标注（多选）"
    width="500px"
    modal-class="multi-select-modal"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-table
      :columns="columns"
      :data-source="markList"
      :pagination="false"
      :row-key="(record: API.MarkConfig_) => record.id || 0"
      size="small"
      :bordered="false"
      class="select-table"
    >
      <template #headerCell="{ column }">
        <template v-if="column.key === 'select'">
          <div class="table-header-cell table-header-cell-center">
            <a-checkbox
              :checked="isSelectAll"
              :indeterminate="isIndeterminate"
              @change="handleSelectAllChange"
            />
          </div>
        </template>
        <template v-else>
          <div class="table-header-cell table-header-cell-left">{{ column.title }}</div>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'select'">
          <div class="table-body-cell-checkbox">
            <a-checkbox
              :checked="selectedKeys.includes(record.id)"
              @change="(e: any) => handleSelect(record, e.target.checked)"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'markLabel'">
          <div class="table-body-cell-content">
            {{ record.markLabel || record.markValue }}
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
  markList: API.MarkConfig_[]
  selectedMarkIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedMarkIds: () => [],
  markList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedMarkIds: number[]]
}>()

const visible = ref(false)
const selectedKeys = ref<number[]>([])

const columns = [
  {
    title: '',
    key: 'select',
    width: 60,
    align: 'center' as const,
  },
  {
    title: '标注',
    dataIndex: 'markLabel',
    key: 'markLabel',
    align: 'left' as const,
  },
]

const validMarkList = computed(() => {
  return props.markList.filter((m: API.MarkConfig_) => m.id && m.id > 0)
})

const validMarkIds = computed(() => {
  return validMarkList.value.map((m: API.MarkConfig_) => m.id || 0).filter(id => id > 0)
})

const isSelectAll = computed(() => {
  return validMarkIds.value.length > 0 && selectedKeys.value.length === validMarkIds.value.length
})

const isIndeterminate = computed(() => {
  return selectedKeys.value.length > 0 && selectedKeys.value.length < validMarkIds.value.length
})

const handleSelectAllChange = (e: any) => {
  selectedKeys.value = e.target.checked ? [...validMarkIds.value] : []
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    selectedKeys.value = (props.selectedMarkIds || []).filter(id => id > 0)
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSelect = (record: API.MarkConfig_, selected: boolean) => {
  if (!record.id) return
  if (selected) {
    if (!selectedKeys.value.includes(record.id)) {
      selectedKeys.value.push(record.id)
    }
  } else {
    const index = selectedKeys.value.indexOf(record.id)
    if (index > -1) {
      selectedKeys.value.splice(index, 1)
    }
  }
}

const handleOk = () => {
  emit('ok', [...selectedKeys.value])
  visible.value = false
}

const handleCancel = () => {
  selectedKeys.value = (props.selectedMarkIds || []).filter(id => id > 0)
  visible.value = false
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

