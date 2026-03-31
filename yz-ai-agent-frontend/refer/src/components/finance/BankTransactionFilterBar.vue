<template>
  <FilterBar
    storage-key="BANK_TRANSACTION_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
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
        <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
          <a-form-item label="客户名称" class="invoice-filter-form-item">
            <a-auto-complete
              v-model:value="localClientCompanyName"
              :options="clientCompanyOptions"
              placeholder="选择或输入客户名称"
              :style="{ width: clientCompanyWidth + 'px', maxWidth: '100%' }"
              allow-clear
              class="invoice-filter-input"
              @select="handleClientCompanySelect"
              @change="handleClientCompanyChange"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
          <a-form-item label="业务员" class="invoice-filter-form-item">
            <a-input
              v-model:value="localSalespersonName"
              placeholder="输入业务员姓名"
              class="invoice-filter-input"
              allow-clear
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
          <a-form-item label="发票号码" class="invoice-filter-form-item">
            <a-input
              v-model:value="localInvoiceNo"
              placeholder="输入发票号码"
              class="invoice-filter-input"
              allow-clear
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
          <a-form-item label="到账时间" class="invoice-filter-form-item">
            <div class="date-range-wrapper">
              <a-date-picker
                v-model:value="localStartDate"
                placeholder="开始日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
                :suffix-icon="null"
                @change="handleStartDateChange"
              />
              <span class="date-separator">至</span>
              <a-date-picker
                v-model:value="localEndDate"
                placeholder="结束日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
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
import { ref, watch, computed, unref } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import FilterBar from '@/components/common/FilterBar.vue'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  searchParams: {
    issuerCompanyIds?: number[]
    clientCompanyName?: string
    salespersonName?: string
    invoiceNo?: string
    startDate?: Dayjs | null
    endDate?: Dayjs | null
  }
  companyList: API.Company[]
  clientList: API.Client_[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-company-modal': []
  'search': []
  'reset': []
  'client-company-select': [value: string]
  'client-company-change': [value: string]
}>()


const localClientCompanyName = ref(props.searchParams.clientCompanyName || '')
const localSalespersonName = ref(props.searchParams.salespersonName || '')
const localInvoiceNo = ref(props.searchParams.invoiceNo || '')
const localStartDate = ref<Dayjs | null | undefined>(props.searchParams.startDate ?? null)
const localEndDate = ref<Dayjs | null | undefined>(props.searchParams.endDate ?? null)

// 客户单位选项（基础选项，不包含"全部"）
const baseClientCompanyOptions = computed(() => {
  const uniqueCompanyNames = new Set<string>()
  const uniqueClients = props.clientList.filter((client: API.Client_) => {
    const companyName = client.companyName || ''
    if (companyName && !uniqueCompanyNames.has(companyName)) {
      uniqueCompanyNames.add(companyName)
      return true
    }
    return false
  })
  return uniqueClients.map((client: API.Client_) => ({
    value: client.companyName || '',
    label: client.companyName || '',
  }))
})

// 客户单位自动填充框（使用通用 composable）
const clientCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: baseClientCompanyOptions,
  currentValue: computed(() => localClientCompanyName.value || ''),
  enableAutoAdd: true,
})

// 客户单位选项（包含"全部"选项）
const clientCompanyOptions = computed(() => {
  return [{ value: '', label: '全部' }, ...unref(clientCompanyAutoComplete.filteredOptions)]
})

// 根据文本长度计算宽度
const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

// 客户单位下拉框宽度
const clientCompanyWidth = computed(() => {
  let maxWidth = calculateTextWidth('选择或输入客户名称', 120)
  if (clientCompanyOptions.value.length > 0) {
    clientCompanyOptions.value.forEach((option: any) => {
      const text = option.label || option.value || ''
      const width = calculateTextWidth(text, 120)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
  }
  return maxWidth
})

// 获取选中的公司名称文本
const selectedCompanyNamesText = computed(() => {
  if (!props.searchParams.issuerCompanyIds || props.searchParams.issuerCompanyIds.length === 0) {
    return ''
  }
  const selectedCompanies = props.companyList.filter((company: API.Company) =>
    company.id && props.searchParams.issuerCompanyIds?.includes(company.id)
  )
  return selectedCompanies.map((c: API.Company) => c.companyName || '').join(', ')
})

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
  localClientCompanyName.value = newParams.clientCompanyName || ''
  localSalespersonName.value = newParams.salespersonName || ''
  localInvoiceNo.value = newParams.invoiceNo || ''
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

const handleClientCompanySelect = (value: string) => {
  localClientCompanyName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    clientCompanyName: value,
  })
  emit('client-company-select', value)
}

const handleClientCompanyChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  clientCompanyAutoComplete.handleChange(value)
  
  localClientCompanyName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    clientCompanyName: value,
  })
  emit('client-company-change', value)
}

watch([localSalespersonName, localInvoiceNo], () => {
  emit('update:searchParams', {
    ...props.searchParams,
    salespersonName: localSalespersonName.value,
    invoiceNo: localInvoiceNo.value,
  })
}, { deep: true })
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

