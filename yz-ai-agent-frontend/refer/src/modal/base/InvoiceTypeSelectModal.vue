<template>
  <global-modal
    v-model="visible"
    title="选择发票种类（多选）"
    width="500px"
    modal-class="multi-select-modal"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-table
      :columns="columns"
      :data-source="typeList"
      :pagination="false"
      :row-key="(record: API.InvoiceType_) => record.id || 0"
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
        <template v-else-if="column.key === 'typeName'">
          <div 
            class="table-body-cell-content clickable-cell"
            @click="handleSelect(record, !selectedKeys.includes(record.id))"
          >
            {{ record.typeName }}
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
  typeList: API.InvoiceType_[]
  selectedTypeIds?: number[]
  selectedTypeNames?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedTypeIds: () => [],
  selectedTypeNames: () => [],
  typeList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedTypeIds: number[], selectedTypeNames: string[]]
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
    title: '发票种类',
    dataIndex: 'typeName',
    key: 'typeName',
    align: 'left' as const,
  },
]

// 获取有效的类型列表（有 id 且 id > 0）
const validTypeList = computed(() => {
  return props.typeList.filter((t: API.InvoiceType_) => t.id && t.id > 0)
})

// 获取有效的类型 ID 列表
const validTypeIds = computed(() => {
  return validTypeList.value.map((t: API.InvoiceType_) => t.id || 0).filter(id => id > 0)
})

// 计算全选状态
const isSelectAll = computed(() => {
  return validTypeIds.value.length > 0 && selectedKeys.value.length === validTypeIds.value.length
})

// 计算半选状态
const isIndeterminate = computed(() => {
  return selectedKeys.value.length > 0 && selectedKeys.value.length < validTypeIds.value.length
})

// 处理全选/取消全选
const handleSelectAllChange = (e: any) => {
  selectedKeys.value = e.target.checked ? [...validTypeIds.value] : []
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 初始化选中项：优先使用 selectedTypeIds，如果没有则根据 selectedTypeNames 查找对应的 id
    if (props.selectedTypeIds && props.selectedTypeIds.length > 0) {
      selectedKeys.value = props.selectedTypeIds.filter(id => id > 0)
    } else if (props.selectedTypeNames && props.selectedTypeNames.length > 0) {
      const ids = validTypeList.value
        .filter((t: API.InvoiceType_) => props.selectedTypeNames?.includes(t.typeName || ''))
        .map((t: API.InvoiceType_) => t.id || 0)
        .filter(id => id > 0)
      selectedKeys.value = ids
    } else {
      selectedKeys.value = []
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理单个选项的选择
const handleSelect = (record: API.InvoiceType_, selected: boolean) => {
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
  // 传递选中的 id 数组和名称数组
  const selectedIds = [...selectedKeys.value]
  const selectedNames = validTypeList.value
    .filter((t: API.InvoiceType_) => selectedIds.includes(t.id || 0))
    .map((t: API.InvoiceType_) => t.typeName || '')
    .filter(Boolean)
  emit('ok', selectedIds, selectedNames)
  visible.value = false
}

const handleCancel = () => {
  // 恢复之前的选择：优先使用 selectedTypeIds，如果没有则根据 selectedTypeNames 查找对应的 id
  if (props.selectedTypeIds && props.selectedTypeIds.length > 0) {
    selectedKeys.value = props.selectedTypeIds.filter(id => id > 0)
  } else if (props.selectedTypeNames && props.selectedTypeNames.length > 0) {
    const ids = validTypeList.value
      .filter((t: API.InvoiceType_) => props.selectedTypeNames?.includes(t.typeName || ''))
      .map((t: API.InvoiceType_) => t.id || 0)
      .filter(id => id > 0)
    selectedKeys.value = ids
  } else {
    selectedKeys.value = []
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

