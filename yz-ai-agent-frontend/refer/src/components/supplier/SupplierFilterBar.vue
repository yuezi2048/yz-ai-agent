<template>
  <FilterBar
    storage-key="SUPPLIER_MANAGE_PAGE_FILTER_COLLAPSED"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <a-row :gutter="[16, 16]">
        <!-- 第一行：供货单位、供货姓名、法人 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="供货单位" class="invoice-filter-form-item">
            <a-auto-complete
              v-model:value="localCompanyName"
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
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="供货姓名" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localSupplierName" 
              placeholder="输入供货姓名" 
              class="invoice-filter-input" 
              allow-clear 
              @change="handleFilterChange"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="法人" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localLegalPerson" 
              placeholder="输入法人" 
              class="invoice-filter-input" 
              allow-clear 
              @change="handleFilterChange"
            />
          </a-form-item>
        </a-col>
        <!-- 第二行：公司税号、注册地址、经营范围 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="公司税号" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localTaxNo" 
              placeholder="输入公司税号" 
              class="invoice-filter-input" 
              allow-clear 
              @change="handleFilterChange"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="注册地址" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localRegisterAddress" 
              placeholder="输入注册地址" 
              class="invoice-filter-input" 
              allow-clear 
              @change="handleFilterChange"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
          <a-form-item label="经营范围" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localBusinessScope" 
              placeholder="输入经营范围" 
              class="invoice-filter-input" 
              allow-clear 
              @change="handleFilterChange"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </template>
  </FilterBar>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import FilterBar from '@/components/common/FilterBar.vue'
import { useAutoCompleteWithExtra } from '@/hooks/common/useAutoCompleteWithExtra'

interface Props {
  searchParams: {
    companyName?: string
    supplierName?: string
    legalPerson?: string
    taxNo?: string
    registerAddress?: string
    businessScope?: string
  }
  supplierList: API.Supplier_[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'search': []
  'reset': []
  'supplier-company-select': [value: string]
  'supplier-company-change': [value: string]
  'filter-change': []
}>()


const localCompanyName = ref(props.searchParams.companyName || '')
const localSupplierName = ref(props.searchParams.supplierName || '')
const localLegalPerson = ref(props.searchParams.legalPerson || '')
const localTaxNo = ref(props.searchParams.taxNo || '')
const localRegisterAddress = ref(props.searchParams.registerAddress || '')
const localBusinessScope = ref(props.searchParams.businessScope || '')

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
  currentValue: computed(() => localCompanyName.value || ''),
  enableAutoAdd: true,
})

// 供货单位选项（包含"全部"选项）
const supplierCompanyOptions = computed(() => {
  return [{ value: '', label: '全部' }, ...supplierCompanyAutoComplete.filteredOptions.value]
})

const calculateTextWidth = (text: string, minWidth = 80, maxWidth = 400) => {
  const estimatedWidth = text.length * 14 + 40
  return Math.max(minWidth, Math.min(estimatedWidth, maxWidth))
}

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

watch(() => props.searchParams, (newParams) => {
  localCompanyName.value = newParams.companyName || ''
  localSupplierName.value = newParams.supplierName || ''
  localLegalPerson.value = newParams.legalPerson || ''
  localTaxNo.value = newParams.taxNo || ''
  localRegisterAddress.value = newParams.registerAddress || ''
  localBusinessScope.value = newParams.businessScope || ''
}, { deep: true })

watch([localCompanyName, localSupplierName, localLegalPerson, localTaxNo, localRegisterAddress, localBusinessScope], () => {
  emit('update:searchParams', {
    companyName: localCompanyName.value,
    supplierName: localSupplierName.value,
    legalPerson: localLegalPerson.value,
    taxNo: localTaxNo.value,
    registerAddress: localRegisterAddress.value,
    businessScope: localBusinessScope.value,
  })
}, { deep: true })

// 统一的筛选框变化处理函数（防抖）
let filterChangeTimer: any = null
const handleFilterChange = () => {
  clearTimeout(filterChangeTimer)
  filterChangeTimer = setTimeout(() => {
    emit('filter-change')
  }, 500)
}

const handleSupplierCompanySelect = (value: string) => {
  localCompanyName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    companyName: value,
  })
  emit('supplier-company-select', value)
}

const handleSupplierCompanyChange = (value: string) => {
  // 使用 composable 的 handleChange 自动添加输入内容
  supplierCompanyAutoComplete.handleChange(value)
  
  localCompanyName.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    companyName: value,
  })
  emit('supplier-company-change', value)
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

