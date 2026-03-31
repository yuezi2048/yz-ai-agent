<template>
  <FilterBar
    storage-key="PERMISSION_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 权限（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
          <a-form-item label="权限" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-permission-modal')"
              class="invoice-filter-select-button"
              :style="{ width: permissionSelectButtonWidth + 'px' }"
            >
              <span v-if="selectedPermissionNamesText" class="invoice-filter-selected-text">
                {{ selectedPermissionNamesText }}
              </span>
              <span v-else>请选择权限</span>
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
    permissionNames?: string[]
    isEnabledList?: number[]
  }
  permissionList: API.PermissionItemVO[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-permission-modal': []
  'open-status-modal': []
  'search': []
  'reset': []
}>()


const selectedPermissionNamesText = computed(() => {
  if (!props.searchParams.permissionNames || props.searchParams.permissionNames.length === 0) {
    return ''
  }
  // 后端筛选使用名称数组，这里直接展示名称
  return props.searchParams.permissionNames.join(', ')
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const permissionSelectButtonWidth = computed(() => {
  const placeholder = '请选择权限'
  if (selectedPermissionNamesText.value) {
    const contentWidth = calculateTextWidth(selectedPermissionNamesText.value, 120, 220)
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
    const contentWidth = calculateTextWidth(selectedStatusText.value, 120, 220)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})
</script>

<style scoped>
@import '@/styles/filter.css';
</style>


