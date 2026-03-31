<template>
  <global-modal
    v-model="visible"
    title="表格列配置"
    width="600px"
  >
    <!-- 标题说明 -->
    <div style="margin-bottom: 16px; color: #666;">
      请选择需要在表格中显示的数据列
    </div>
    
    <!-- 全选复选框 -->
    <div style="margin-bottom: 16px;">
      <a-checkbox
        :checked="isAllSelectableColumnsSelected"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        全选
      </a-checkbox>
    </div>
    
    <!-- 选项列表 -->
    <a-checkbox-group v-model:value="tempSelectedColumns" style="width: 100%">
      <a-row>
        <a-col :span="8" v-for="col in availableColumns" :key="col.key">
          <a-checkbox 
            :value="col.key"
            :disabled="isFixedColumn(col.key)"
          >
            {{ col.title }}
          </a-checkbox>
        </a-col>
      </a-row>
    </a-checkbox-group>
    
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <a-button class="btn-grey" @click="handleCancel">
          <template #icon><CloseOutlined /></template>
          关闭
        </a-button>
        <a-button type="primary" @click="handleOk">
          <template #icon><CheckOutlined /></template>
          保存
        </a-button>
      </div>
    </template>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import GlobalModal from '@/modal/globalModal.vue'

interface Column {
  key: string
  title: string
}

interface Props {
  modelValue: boolean
  columns: Column[]
  selectedColumns: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedColumns: string[]]
}>()

const visible = ref(false)
const tempSelectedColumns = ref<string[]>([])

// 固定列（序号列）：始终选中且不可操作
const FIXED_COLUMNS = ['serialNo']

// 判断是否为固定列
const isFixedColumn = (key: string): boolean => {
  return FIXED_COLUMNS.includes(key)
}

// 显示所有列
const availableColumns = computed(() => {
  return props.columns
})

// 可选择的列（排除固定列）
const selectableColumns = computed(() => {
  return availableColumns.value.filter(col => !isFixedColumn(col.key))
})

// 固定列列表（只包含在当前列定义中存在的固定列）
const fixedColumns = computed(() => {
  return availableColumns.value
    .filter(col => isFixedColumn(col.key))
    .map(col => col.key)
})

// 计算是否所有可选择列都已选中
const isAllSelectableColumnsSelected = computed(() => {
  if (selectableColumns.value.length === 0) return false
  return selectableColumns.value.every(col => tempSelectedColumns.value.includes(col.key))
})

// 计算是否处于半选状态
const isIndeterminate = computed(() => {
  const selectedSelectableCount = selectableColumns.value.filter(col => 
    tempSelectedColumns.value.includes(col.key)
  ).length
  return selectedSelectableCount > 0 && selectedSelectableCount < selectableColumns.value.length
})

// 保存初始状态，用于取消时恢复
const initialSelectedColumns = ref<string[]>([])

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 初始化时，确保固定列始终在选中列表中
    const initialColumns = [...props.selectedColumns]
    // 添加固定列（如果不在列表中）
    fixedColumns.value.forEach(fixedKey => {
      if (!initialColumns.includes(fixedKey)) {
        initialColumns.push(fixedKey)
      }
    })
    tempSelectedColumns.value = initialColumns
    // 保存初始状态
    initialSelectedColumns.value = [...initialColumns]
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 全选/取消全选（只影响可选择列，不影响固定列）
const handleSelectAll = (e: any) => {
  if (e.target.checked) {
    // 全选：选中所有可选择列 + 固定列
    tempSelectedColumns.value = [
      ...fixedColumns.value,
      ...selectableColumns.value.map(col => col.key)
    ]
  } else {
    // 取消全选：只保留固定列
    tempSelectedColumns.value = [...fixedColumns.value]
  }
}

const handleOk = () => {
  // 确保固定列始终在选中列表中
  const finalColumns = [...tempSelectedColumns.value]
  fixedColumns.value.forEach(fixedKey => {
    if (!finalColumns.includes(fixedKey)) {
      finalColumns.push(fixedKey)
    }
  })
  
  if (finalColumns.length === 0) {
    message.warning('请至少选择一列')
    return
  }
  emit('ok', finalColumns)
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
  // 重置到打开弹窗时的初始状态
  tempSelectedColumns.value = [...initialSelectedColumns.value]
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

