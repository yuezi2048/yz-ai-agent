<template>
  <global-modal
    v-model="visible"
    title="标号"
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
              :checked="selectedKeys.includes(record.value || '')"
              @change="(e: any) => handleSelect(record, e.target.checked)"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'markValue'">
          <div 
            class="table-body-cell-content clickable-cell"
            @click="handleSelect(record, !selectedKeys.includes(record.value || ''))"
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
import { ref, watch, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { queryMarkListEnabledUsingPost } from '@/api/jichuxinxiguanlijiekou.ts'
import { listEmployeeUsingPost } from '@/api/yuangongguanlijiekou.ts'
import '@/styles/multi-select-modal.css'
import GlobalModal from '@/modal/globalModal.vue'

interface Props {
  modelValue: boolean
  selectedMarkValues?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedMarkValues: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [selectedMarkValues: string[]]
}>()

const visible = ref(false)
const selectedKeys = ref<string[]>([])
const markList = ref<any[]>([])

const columns = [
  {
    title: '',
    key: 'select',
    width: 60,
    align: 'center' as const,
  },
  {
    title: '标号',
    dataIndex: 'value',
    key: 'markValue',
    align: 'left' as const,
  },
]

// 获取标记列表
const fetchMarkList = async () => {
  try {
    const res = await queryMarkListEnabledUsingPost() as any
    if (res.data.code === 0 && res.data.data) {
      markList.value = res.data.data || []
    } else {
      message.error('获取标记列表失败 ' + (res.data.message || ''))
    }
  } catch (error) {
    console.error('获取标记列表失败', error)
    message.error('获取标记列表失败')
  }
}

// 获取有效的标号列表（有 value 且 value !== ''）
const validMarkList = computed(() => {
  return markList.value.filter((m: any) => m.value && m.value !== '')
})

// 获取有效的标号值列表
const validMarkValues = computed(() => {
  return validMarkList.value.map((m: any) => m.value || '').filter(val => val !== '')
})

// 计算全选状态（参考 React 示例：checkAll = plainOptions.length === checkedList.length）
const isSelectAll = computed(() => {
  return validMarkValues.value.length > 0 && selectedKeys.value.length === validMarkValues.value.length
})

// 计算半选状态（参考 React 示例：indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length）
const isIndeterminate = computed(() => {
  return selectedKeys.value.length > 0 && selectedKeys.value.length < validMarkValues.value.length
})

// 处理全选/取消全选（参考 React 示例：onCheckAllChange）
const handleSelectAllChange = (e: any) => {
  // e.target.checked ? plainOptions : []
  selectedKeys.value = e.target.checked ? [...validMarkValues.value] : []
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    // 初始化选中项
    const selectedValues = props.selectedMarkValues || []
    selectedKeys.value = markList.value
      .filter((m: any) => {
        const markValue = m.value || ''
        return markValue && selectedValues.includes(markValue)
      })
      .map((m: any) => m.value || '')
      .filter(val => val !== '')
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 处理单个选项的选择（参考 React 示例：onChange）
const handleSelect = (record: any, selected: boolean) => {
  if (!record.value) return
  if (selected) {
    if (!selectedKeys.value.includes(record.value)) {
      selectedKeys.value.push(record.value)
    }
  } else {
    const index = selectedKeys.value.indexOf(record.value)
    if (index > -1) {
      selectedKeys.value.splice(index, 1)
    }
  }
}

const handleOk = async () => {
  const selectedValues = markList.value
    .filter((m: any) => m.value && selectedKeys.value.includes(m.value))
    .map((m: any) => m.value || '')
    .filter(val => val !== '')

  // 调用员工查询接口，携带 markValues
  try {
    const params: any = {
      current: 1,
      pageSize: 1000,
      markValues: selectedValues,
    }
    const res = await listEmployeeUsingPost(params) as any
    if (res.data.code === 0) {
      // 查询成功，可以在这里处理查询结果
      console.log('员工查询结果:', res.data.data)
    } else {
      message.error('查询员工失败 ' + (res.data.message || ''))
    }
  } catch (error) {
    console.error('查询员工失败', error)
    message.error('查询员工失败')
  }

  emit('ok', selectedValues)
  visible.value = false
}

const handleCancel = () => {
  // 恢复之前的选择
  const selectedValues = props.selectedMarkValues || []
  selectedKeys.value = markList.value
    .filter((m: any) => {
      const markValue = m.value || ''
      return markValue && selectedValues.includes(markValue)
    })
    .map((m: any) => m.value || '')
    .filter(val => val !== '')
  visible.value = false
}

onMounted(() => {
  fetchMarkList()
})
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





