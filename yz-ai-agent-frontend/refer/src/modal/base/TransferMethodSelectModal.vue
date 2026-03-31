<template>
  <global-modal
    v-model="visible"
    title="选择票据种类（多选）"
    width="500px"
    modal-class="multi-select-modal"
  >
    <a-table
      :columns="columns"
      :data-source="methodList"
      :pagination="false"
      :row-key="(record: API.TransferMethod_) => record.id || 0"
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
        <template v-else-if="column.key === 'methodName'">
          <div class="table-body-cell-content">
            {{ record.methodName }}
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
  methodList: API.TransferMethod_[]
  selectedMethodIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedMethodIds: () => [],
  methodList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedMethodIds: number[]]
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
    title: '票据种类',
    dataIndex: 'methodName',
    key: 'methodName',
    align: 'left' as const,
  },
]

const validMethodList = computed(() => {
  return props.methodList.filter((m: API.TransferMethod_) => m.id && m.id > 0)
})

const validMethodIds = computed(() => {
  return validMethodList.value.map((m: API.TransferMethod_) => m.id || 0).filter(id => id > 0)
})

const isSelectAll = computed(() => {
  return validMethodIds.value.length > 0 && selectedKeys.value.length === validMethodIds.value.length
})

const isIndeterminate = computed(() => {
  return selectedKeys.value.length > 0 && selectedKeys.value.length < validMethodIds.value.length
})

const handleSelectAllChange = (e: any) => {
  selectedKeys.value = e.target.checked ? [...validMethodIds.value] : []
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    selectedKeys.value = (props.selectedMethodIds || []).filter(id => id > 0)
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSelect = (record: API.TransferMethod_, selected: boolean) => {
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
  selectedKeys.value = (props.selectedMethodIds || []).filter(id => id > 0)
  visible.value = false
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

