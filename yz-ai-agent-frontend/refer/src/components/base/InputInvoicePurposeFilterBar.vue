<template>
  <FilterBar
    storage-key="INPUT_INVOICE_PURPOSE_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 进票用途（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <a-form-item label="进票用途" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-purpose-modal')"
              class="invoice-filter-select-button"
              :style="{ width: purposeSelectButtonWidth + 'px' }"
            >
              <span v-if="selectedPurposeNamesText" class="invoice-filter-selected-text">
                {{ selectedPurposeNamesText }}
              </span>
              <span v-else>请选择进票用途</span>
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
    purposeNames?: string[]
    isEnabledList?: number[]
  }
  purposeList: API.InvoicePurposeItemVO[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-purpose-modal': []
  'open-status-modal': []
  'search': []
  'reset': []
}>()


const selectedPurposeNamesText = computed(() => {
  if (!props.searchParams.purposeNames || props.searchParams.purposeNames.length === 0) {
    return ''
  }
  // 后端筛选使用名称数组，这里直接展示名称
  return props.searchParams.purposeNames.join(', ')
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const purposeSelectButtonWidth = computed(() => {
  const placeholder = '请选择进票用途'
  if (selectedPurposeNamesText.value) {
    const contentWidth = calculateTextWidth(selectedPurposeNamesText.value, 120, 180)
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
