<template>
  <FilterBar
    storage-key="INVOICE_TYPE_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 发票种类（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <a-form-item label="发票种类" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-type-modal')"
              class="invoice-filter-select-button"
              :style="{ width: typeSelectButtonWidth + 'px' }"
            >
              <span v-if="selectedTypeNamesText" class="invoice-filter-selected-text">
                {{ selectedTypeNamesText }}
              </span>
              <span v-else>请选择发票种类</span>
              <RightOutlined class="invoice-filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
        <!-- 启用状态（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <a-form-item label="启用状态" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-status-modal')"
              class="invoice-filter-select-button"
              :style="{ width: statusSelectButtonWidth + 'px' }"
            >
              <span v-if="selectedStatusText" class="invoice-filter-selected-text">
                {{ selectedStatusText }}
              </span>
              <span v-else>请选择启用状态</span>
              <RightOutlined class="invoice-filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
      </a-row>
    </template>
  </FilterBar>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'

interface Props {
  searchParams: {
    typeNames?: string[]
    isEnabledList?: number[]
  }
  typeList: API.InvoiceType_[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-type-modal': []
  'open-status-modal': []
  'search': []
  'reset': []
}>()


// 计算选中的发票种类文本
const selectedTypeNamesText = computed(() => {
  if (!props.searchParams.typeNames || props.searchParams.typeNames.length === 0) {
    return ''
  }
  return props.searchParams.typeNames.join(', ')
})

// 计算按钮宽度
const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const typeSelectButtonWidth = computed(() => {
  const placeholder = '请选择发票种类'
  if (selectedTypeNamesText.value) {
    const contentWidth = calculateTextWidth(selectedTypeNamesText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

const selectedStatusText = computed(() => {
  const list = props.searchParams.isEnabledList || []
  if (!list.length) return ''
  const labels: string[] = []
  if (list.includes(1)) labels.push('启用')
  if (list.includes(0)) labels.push('禁用')
  return labels.join(', ')
})

const statusSelectButtonWidth = computed(() => {
  const placeholder = '请选择启用状态'
  if (selectedStatusText.value) {
    const contentWidth = calculateTextWidth(selectedStatusText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})
</script>

<style scoped>
@import '@/styles/filter.css';
</style>
