<template>
  <FilterBar
    storage-key="INVOICE_QUERY_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
            <!-- 公司名称 -->
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
            
            <!-- 开票日期 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="开票日期" class="invoice-filter-form-item">
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
            
            <!-- 客户单位 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="客户单位" class="invoice-filter-form-item">
                <a-auto-complete
                  v-model:value="localCustomerCompany"
                  :options="customerCompanyOptions"
                  placeholder="选择或输入客户单位"
                  :style="{ width: customerCompanyWidth + 'px', maxWidth: '100%' }"
                  allow-clear
                  class="invoice-filter-input"
                  @select="handleCustomerCompanySelect"
                  @change="handleCustomerCompanyChange"
                />
              </a-form-item>
            </a-col>
            
            <!-- 客户姓名 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="客户姓名" class="invoice-filter-form-item">
                <a-input 
                  v-model:value="localCustomerContact" 
                  placeholder="输入客户姓名" 
                  allow-clear 
                  class="invoice-filter-input" 
                />
              </a-form-item>
            </a-col>
            
            <!-- 业务员 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="业务员" class="invoice-filter-form-item">
                <a-input 
                  v-model:value="localSalespersonName" 
                  placeholder="输入业务员姓名" 
                  allow-clear 
                  class="invoice-filter-input" 
                />
              </a-form-item>
            </a-col>
            
            <!-- 开票人 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="开票人" class="invoice-filter-form-item">
                <a-input 
                  v-model:value="localIssuerName" 
                  placeholder="输入开票人姓名" 
                  allow-clear 
                  class="invoice-filter-input" 
                />
              </a-form-item>
            </a-col>
            
            <!-- 票类型 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="票类型" class="invoice-filter-form-item">
                <a-select
                  v-model:value="localInvoiceType"
                  placeholder="选择票类型"
                  :style="{ width: invoiceTypeWidth + 'px' }"
                  allow-clear
                  class="invoice-filter-select"
                  @change="$emit('invoice-type-change')"
                >
                  <a-select-option value="">全部</a-select-option>
                  <a-select-option 
                    v-for="invoiceType in invoiceTypeList" 
                    :key="invoiceType.id" 
                    :value="invoiceType.typeName"
                  >
                    {{ invoiceType.typeName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            
            <!-- 标号 -->
            <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
              <a-form-item label="标号" class="invoice-filter-form-item">
                <a-button 
                  @click="$emit('open-mark-modal')" 
                  class="invoice-filter-select-button"
                  :style="{ width: markSelectButtonWidth + 'px' }"
                >
                  <span v-if="selectedMarkValuesText" class="invoice-filter-selected-text">
                    {{ selectedMarkValuesText }}
                  </span>
                  <span v-else>请选择标号</span>
                  <RightOutlined class="invoice-filter-select-icon" />
                </a-button>
              </a-form-item>
            </a-col>
          </a-row>
    </template>
  </FilterBar>
</template>

<script lang="ts" setup>
import { ref, computed, watch, unref } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import FilterBar from '@/components/common/FilterBar.vue'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  searchParams: {
    startDate?: Dayjs
    endDate?: Dayjs
    issuerCompanyIds?: number[]
    markValues?: string[]
    customerCompany?: string
    customerContact?: string
    salespersonName?: string
    issuerName?: string
    invoiceType?: string
  }
  companyList: API.Company[]
  clientList: API.Client_[]
  invoiceTypeList: API.InvoiceType_[]
  markList: Array<{ value: string; label: string }>
  selectedCompanyNamesText: string
  selectedMarkValuesText: string
  companySelectButtonWidth: number
  markSelectButtonWidth: number
  customerCompanyWidth: number
  invoiceTypeWidth: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-company-modal': []
  'open-mark-modal': []
  'search': []
  'reset': []
  'invoice-type-change': []
  'customer-company-select': [value: string]
  'customer-company-change': [value: string]
  'start-date-change': [value: Dayjs | null]
  'end-date-change': [value: Dayjs | null]
}>()


// 本地状态（用于双向绑定）
const localStartDate = ref<Dayjs | null | undefined>(props.searchParams.startDate ?? null)
const localEndDate = ref<Dayjs | null | undefined>(props.searchParams.endDate ?? null)
const localCustomerCompany = ref(props.searchParams.customerCompany || '')
const localCustomerContact = ref(props.searchParams.customerContact || '')
const localSalespersonName = ref(props.searchParams.salespersonName || '')
const localIssuerName = ref(props.searchParams.issuerName || '')
const localInvoiceType = ref(props.searchParams.invoiceType || '')

// 监听 props 变化
watch(() => props.searchParams, (newParams) => {
  localStartDate.value = newParams.startDate ?? null
  localEndDate.value = newParams.endDate ?? null
  localCustomerCompany.value = newParams.customerCompany || ''
  localCustomerContact.value = newParams.customerContact || ''
  localSalespersonName.value = newParams.salespersonName || ''
  localIssuerName.value = newParams.issuerName || ''
  localInvoiceType.value = newParams.invoiceType || ''
}, { deep: true })

// 客户单位选项（基础选项，不包含"全部"）
const baseCustomerCompanyOptions = computed(() => {
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
const customerCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: baseCustomerCompanyOptions,
  currentValue: computed(() => localCustomerCompany.value || ''),
  enableAutoAdd: true,
})

// 客户单位选项（包含"全部"选项）
const customerCompanyOptions = computed(() => {
  return [{ value: '', label: '全部' }, ...unref(customerCompanyAutoComplete.filteredOptions)]
})

// 事件处理
const handleStartDateChange = (value: Dayjs | null) => {
  localStartDate.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    startDate: value || undefined,
  })
  emit('start-date-change', value)
}

const handleEndDateChange = (value: Dayjs | null) => {
  localEndDate.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    endDate: value || undefined,
  })
  emit('end-date-change', value)
}

const handleCustomerCompanySelect = (value: string) => {
  localCustomerCompany.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    customerCompany: value,
  })
  emit('customer-company-select', value)
}

const handleCustomerCompanyChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  customerCompanyAutoComplete.handleChange(value)
  
  localCustomerCompany.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    customerCompany: value,
  })
  emit('customer-company-change', value)
}

// 监听其他字段变化
watch([localCustomerContact, localSalespersonName, localIssuerName, localInvoiceType], () => {
  emit('update:searchParams', {
    ...props.searchParams,
    customerContact: localCustomerContact.value,
    salespersonName: localSalespersonName.value,
    issuerName: localIssuerName.value,
    invoiceType: localInvoiceType.value,
  })
}, { deep: true })
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

