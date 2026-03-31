<template>
  <FilterBar
    storage-key="COMPANY_MANAGE_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 1. 公司名称（复选模态框） -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="公司名称" class="invoice-filter-form-item">
            <a-button
              @click="$emit('open-company-modal')"
              class="invoice-filter-select-button"
              :style="{ width: companySelectButtonWidth + 'px' }"
            >
              <span v-if="selectedCompanyNamesText" class="invoice-filter-selected-text">
                {{ selectedCompanyNamesText }}
              </span>
              <span v-else>请选择公司名称</span>
              <RightOutlined class="invoice-filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
        <!-- 2. 公司税号 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="公司税号" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localTaxNo" 
              placeholder="输入公司税号" 
              class="invoice-filter-input" 
              allow-clear 
            />
          </a-form-item>
        </a-col>
        <!-- 3. 法人 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="法人" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localLegalPerson" 
              placeholder="输入法人" 
              class="invoice-filter-input" 
              allow-clear 
            />
          </a-form-item>
        </a-col>
      </a-row>
    </template>
  </FilterBar>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'

interface Props {
  searchParams: {
    companyName?: string // 父组件维护（多选时以逗号分隔）
    taxNo?: string
    legalPerson?: string
  }
  companyList: API.Company[]
  selectedCompanyIds: number[]
}

const props = withDefaults(defineProps<Props>(), {
  companyList: () => [],
  selectedCompanyIds: () => [],
})

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-company-modal': []
  'search': []
  'reset': []
}>()


// 选中的公司名称文本
const selectedCompanyNamesText = computed(() => {
  if (!props.selectedCompanyIds || props.selectedCompanyIds.length === 0) {
    return ''
  }
  const selectedCompanies = props.companyList.filter((company: API.Company) =>
    company.id && props.selectedCompanyIds.includes(company.id)
  )
  return selectedCompanies.map((c: API.Company) => c.companyName || '').join(', ')
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

const companySelectButtonWidth = computed(() => {
  const placeholder = '请选择公司名称'
  if (selectedCompanyNamesText.value) {
    const contentWidth = calculateTextWidth(selectedCompanyNamesText.value, 120, 260)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

// 本地状态（只维护输入框字段，companyName 由父组件通过模态框维护）
const localTaxNo = ref(props.searchParams.taxNo || '')
const localLegalPerson = ref(props.searchParams.legalPerson || '')

// 监听 props 变化
watch(() => props.searchParams, (newParams) => {
  localTaxNo.value = newParams.taxNo || ''
  localLegalPerson.value = newParams.legalPerson || ''
}, { deep: true })

// 监听本地状态变化，同步到父组件
watch([
  localTaxNo,
  localLegalPerson,
], () => {
  emit('update:searchParams', {
    companyName: props.searchParams.companyName, // 保持父组件的 companyName（来自复选模态框）
    taxNo: localTaxNo.value,
    legalPerson: localLegalPerson.value,
  })
}, { deep: true })
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

