<template>
  <FilterBar
    storage-key="MARK_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 标注（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <a-form-item label="标注" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-mark-modal')"
              class="invoice-filter-select-button"
              :style="{ width: markSelectButtonWidth + 'px' }"
            >
              <span v-if="selectedMarkNamesText" class="invoice-filter-selected-text">
                {{ selectedMarkNamesText }}
              </span>
              <span v-else>请选择标注</span>
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
    markIds?: number[]
    isEnabledList?: number[]
  }
  markList: API.MarkConfig_[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-mark-modal': []
  'open-status-modal': []
  'search': []
  'reset': []
}>()


const selectedMarkNamesText = computed(() => {
  if (!props.searchParams.markIds || props.searchParams.markIds.length === 0) {
    return ''
  }
  const selectedMarks = props.markList.filter((m: API.MarkConfig_) =>
    m.id && props.searchParams.markIds!.includes(m.id)
  )
  return selectedMarks.map((m: API.MarkConfig_) => m.markLabel || m.markValue || '').join(', ')
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const markSelectButtonWidth = computed(() => {
  const placeholder = '请选择标注'
  if (selectedMarkNamesText.value) {
    const contentWidth = calculateTextWidth(selectedMarkNamesText.value, 120, 180)
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
