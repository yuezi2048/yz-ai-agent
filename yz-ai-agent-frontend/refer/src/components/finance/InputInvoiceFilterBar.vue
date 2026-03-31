<template>
  <FilterBar
    storage-key="INPUT_INVOICE_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 1. 公司名称 -->
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
        <!-- 2. 供货单位 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="供货单位" class="invoice-filter-form-item">
            <a-auto-complete
              v-model:value="localSupplierName"
              :options="supplierCompanyOptions"
              placeholder="选择或输入供货单位"
              :style="{ width: supplierCompanyWidth + 'px', maxWidth: '100%' }"
              allow-clear
              class="invoice-filter-input"
              :filter-option="(input: string, option: any) => {
                const value = option.value || option.label || ''
                return value.toLowerCase().includes(input.toLowerCase())
              }"
              @select="handleSupplierCompanySelect"
              @change="handleSupplierCompanyChange"
            />
          </a-form-item>
        </a-col>
        <!-- 3. 供货姓名 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="供货姓名" class="invoice-filter-form-item">
            <a-input
              v-model:value="localSupplierContact"
              placeholder="输入供货姓名"
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
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  searchParams: {
    issuerCompanyIds?: number[]
    supplierName?: string
    supplierContact?: string
  }
  companyList: API.Company[]
  supplierList: API.Supplier_[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'open-company-modal': []
  'search': []
  'reset': []
  'supplier-company-select': [value: string]
  'supplier-company-change': [value: string]
}>()


const localSupplierName = ref(props.searchParams.supplierName || '')
const localSupplierContact = ref(props.searchParams.supplierContact || '')

// 供货单位选项（基础选项，不包含"全部"）
const baseSupplierCompanyOptions = computed(() => {
  const uniqueCompanyNames = new Set<string>()
  const uniqueSuppliers = props.supplierList.filter((supplier: API.Supplier_) => {
    const companyName = supplier.companyName || ''
    if (companyName && !uniqueCompanyNames.has(companyName)) {
      uniqueCompanyNames.add(companyName)
      return true
    }
    return false
  })
  return uniqueSuppliers.map((supplier: API.Supplier_) => ({
    value: supplier.companyName || '',
    label: supplier.companyName || '',
  }))
})

// 供货单位自动填充框（使用通用 composable）
const supplierCompanyAutoComplete = useAutoCompleteWithExtra({
  baseOptions: baseSupplierCompanyOptions,
  currentValue: computed(() => localSupplierName.value || ''),
  enableAutoAdd: true,
})

// 供货单位选项（包含"全部"选项）
const supplierCompanyOptions = computed(() => {
  return [{ value: '', label: '全部' }, ...supplierCompanyAutoComplete.filteredOptions.value]
})

// 根据文本长度计算宽度
const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

// 供货单位下拉框宽度
const supplierCompanyWidth = computed(() => {
  let maxWidth = calculateTextWidth('选择或输入供货单位', 120)
  if (supplierCompanyOptions.value.length > 0) {
    supplierCompanyOptions.value.forEach((option: any) => {
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
    company.id && props.searchParams.issuerCompanyIds.includes(company.id)
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
  localSupplierName.value = newParams.supplierName || ''
  localSupplierContact.value = newParams.supplierContact || ''
}, { deep: true })

const handleSupplierCompanySelect = (value: string) => {
  localSupplierName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    supplierName: value,
  })
  emit('supplier-company-select', value)
}

const handleSupplierCompanyChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  supplierCompanyAutoComplete.handleChange(value)
  
  localSupplierName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    supplierName: value,
  })
  emit('supplier-company-change', value)
}

watch([localSupplierContact], () => {
  emit('update:searchParams', {
    ...props.searchParams,
    supplierContact: localSupplierContact.value,
  })
}, { deep: true })
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

