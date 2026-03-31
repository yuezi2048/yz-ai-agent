<template>
  <global-modal
    v-model="visible"
    title="选择公司名称（多选）"
    width="500px"
    modal-class="multi-select-modal"
    :mask-closable="false"
    :keyboard="true"
  >
    <a-table
      :columns="columns"
      :data-source="validCompanyList"
      :pagination="false"
      :row-key="(record: API.Company) => record.id || 0"
      :scroll="tableScroll"
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
        <template v-else-if="column.key === 'companyName'">
          <div 
            class="table-body-cell-content clickable-cell"
            @click="handleSelect(record, !selectedKeys.includes(record.id))"
          >
            {{ record.companyName }}
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
  companyList: API.Company[]
  selectedCompanyIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedCompanyIds: () => [],
  companyList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedCompanyIds: number[]]
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
    title: '公司名称',
    dataIndex: 'companyName',
    key: 'companyName',
    align: 'left' as const,
  },
]

// 获取有效的公司列表（有 id 且 id > 0）
const validCompanyList = computed(() => {
  return props.companyList.filter((c: API.Company) => c.id && c.id > 0)
})

// 超过 10 条时开启内部滚动，防止弹窗被撑高
const tableScroll = computed(() => {
  return validCompanyList.value.length > 10 ? { y: 360 } : undefined
})

// 获取有效的公司 ID 列表
const validCompanyIds = computed(() => {
  return validCompanyList.value.map((c: API.Company) => c.id || 0).filter(id => id > 0)
})

// 计算全选状态（参考 React 示例：checkAll = plainOptions.length === checkedList.length）
const isSelectAll = computed(() => {
  return validCompanyIds.value.length > 0 && selectedKeys.value.length === validCompanyIds.value.length
})

// 计算半选状态（参考 React 示例：indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length）
const isIndeterminate = computed(() => {
  return selectedKeys.value.length > 0 && selectedKeys.value.length < validCompanyIds.value.length
})

// 处理全选/取消全选（参考 React 示例：onCheckAllChange）
const handleSelectAllChange = (e: any) => {
  // e.target.checked ? plainOptions : []
  selectedKeys.value = e.target.checked ? [...validCompanyIds.value] : []
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 初始化选中项：根据传入的 id 数组初始化
    selectedKeys.value = (props.selectedCompanyIds || []).filter(id => id > 0)
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理单个选项的选择（参考 React 示例：onChange）
const handleSelect = (record: API.Company, selected: boolean) => {
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
  // 直接传递选中的 id 数组
  emit('ok', [...selectedKeys.value])
  visible.value = false
}

const handleCancel = () => {
  // 恢复之前的选择：根据传入的 id 数组恢复
  selectedKeys.value = (props.selectedCompanyIds || []).filter(id => id > 0)
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


