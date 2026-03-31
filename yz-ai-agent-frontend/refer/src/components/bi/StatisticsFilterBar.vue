<template>
  <FilterBar
    storage-key="STATISTICS_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
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
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="业务经理" class="invoice-filter-form-item">
            <a-input
              v-model:value="localSalespersonName"
              placeholder="输入业务经理姓名"
              class="invoice-filter-input"
              allow-clear
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="开票日期" class="invoice-filter-form-item">
            <div class="date-range-wrapper">
              <a-date-picker
                v-model:value="localStartDate"
                placeholder="开始日期"
                format="YYYYMMDD"
                :suffix-icon="null"
                @change="handleStartDateChange"
              />
              <span class="date-separator">至</span>
              <a-date-picker
                v-model:value="localEndDate"
                placeholder="结束日期"
                format="YYYYMMDD"
                allow-clear
                @change="handleEndDateChange"
              />
            </div>
          </a-form-item>
        </a-col>
      </a-row>
    </template>
  </FilterBar>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import FilterBar from '@/components/common/FilterBar.vue'

interface Props {
  searchParams: {
    issuerCompanyIds: number[]
    salespersonName?: string
    startDate?: Dayjs | null
    endDate?: Dayjs | null
  }
  companyList: API.Company[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-company-modal': []
  'search': []
  'reset': []
}>()


const localSalespersonName = ref(props.searchParams.salespersonName || '')
const localStartDate = ref<Dayjs | null | undefined>(props.searchParams.startDate ?? null)
const localEndDate = ref<Dayjs | null | undefined>(props.searchParams.endDate ?? null)

// 获取选中的公司名称文本
const selectedCompanyNamesText = computed(() => {
  if (!props.searchParams.issuerCompanyIds || props.searchParams.issuerCompanyIds.length === 0) {
    return ''
  }
  const selectedCompanies = props.companyList.filter((company: API.Company) =>
    company.id && props.searchParams.issuerCompanyIds.includes(company.id)
  )
  return selectedCompanies.map((c: API.Company) => c.companyName || '').join(', ')
})

// 根据文本长度计算宽度
const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

// 公司名称选择按钮宽度
const companySelectButtonWidth = computed(() => {
  const placeholder = '请选择公司名称'
  if (selectedCompanyNamesText.value) {
    const contentWidth = calculateTextWidth(selectedCompanyNamesText.value, 120, 180)
    const placeholderWidth = calculateTextWidth(placeholder, 120)
    return Math.max(contentWidth, placeholderWidth)
  }
  return calculateTextWidth(placeholder, 120)
})

watch(() => props.searchParams, (newParams) => {
  localSalespersonName.value = newParams.salespersonName || ''
  localStartDate.value = newParams.startDate ?? null
  localEndDate.value = newParams.endDate ?? null
}, { deep: true, immediate: true })

const handleStartDateChange = (value: Dayjs | null) => {
  localStartDate.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    startDate: value || undefined,
  })
}

const handleEndDateChange = (value: Dayjs | null) => {
  localEndDate.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    endDate: value || undefined,
  })
}

watch(localSalespersonName, () => {
  emit('update:searchParams', {
    ...props.searchParams,
    salespersonName: localSalespersonName.value,
  })
})
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

