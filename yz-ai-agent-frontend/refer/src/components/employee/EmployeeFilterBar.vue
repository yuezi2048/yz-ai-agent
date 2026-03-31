<template>
  <FilterBar
    :storage-key="filterCollapsedStorageKey || 'EMPLOYEE_MANAGE_PAGE_FILTER_COLLAPSED'"
    @search="$emit('search')"
    @reset="$emit('reset')"
  >
    <template #filter-fields>
      <!-- 第一行：姓名、工号、公司名称、所属部门（4个输入框，24列布局） -->
      <a-row :gutter="[16, 16]">
        <a-col :span="6">
          <a-form-item label="姓名" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localName" 
              placeholder="输入姓名" 
              class="invoice-filter-input" 
              allow-clear 
            />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="工号" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localEmployeeNo" 
              placeholder="输入工号" 
              class="invoice-filter-input" 
              allow-clear 
            />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="公司名称" class="invoice-filter-form-item">
            <a-button
              @click="showCompanyModal = true"
              class="invoice-filter-select-button"
            >
              <span v-if="selectedCompanyNamesText" class="invoice-filter-selected-text">
                {{ selectedCompanyNamesText }}
              </span>
              <span v-else>请选择公司名称</span>
              <RightOutlined class="invoice-filter-select-icon" />
            </a-button>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="所属部门" class="invoice-filter-form-item">
            <a-input 
              v-model:value="localDepartment" 
              placeholder="输入所属部门" 
              class="invoice-filter-input" 
              allow-clear 
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- 第二行：入职日期、转正日期（2个日期范围选择器，每个占6列） -->
      <a-row :gutter="[16, 16]">
        <a-col :span="6">
          <a-form-item label="入职日期" class="invoice-filter-form-item">
            <div class="date-range-wrapper">
              <a-date-picker
                v-model:value="localHireDateStart"
                placeholder="开始日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
                :suffix-icon="null"
                allow-clear
                @change="handleHireDateStartChange"
              />
              <span class="date-separator">至</span>
              <a-date-picker
                v-model:value="localHireDateEnd"
                placeholder="结束日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
                allow-clear
                @change="handleHireDateEndChange"
              />
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="转正日期" class="invoice-filter-form-item">
            <div class="date-range-wrapper">
              <a-date-picker
                v-model:value="localRegularDateStart"
                placeholder="开始日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
                :suffix-icon="null"
                allow-clear
                @change="handleRegularDateStartChange"
              />
              <span class="date-separator">至</span>
              <a-date-picker
                v-model:value="localRegularDateEnd"
                placeholder="结束日期"
                format="YYYYMMDD"
                value-format="YYYY-MM-DD"
                allow-clear
                @change="handleRegularDateEndChange"
              />
            </div>
          </a-form-item>
        </a-col>
      </a-row>
    </template>
  </FilterBar>

  <!-- 公司名称选择模态框（多选） -->
  <IssuerCompanySelectModal
    v-model="showCompanyModal"
    :company-list="companyList"
    :selected-company-ids="localCompanyIds"
    @ok="handleCompanyModalOk"
  />
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { RightOutlined } from '@ant-design/icons-vue'
import FilterBar from '@/components/common/FilterBar.vue'
import IssuerCompanySelectModal from '@/modal/IssuerCompanySelectModal.vue'

interface Props {
  companyList: API.Company[]
  /** 用于控制“筛选栏折叠状态”在 sessionStorage 的存储 key；不传则使用员工管理页默认 key */
  filterCollapsedStorageKey?: string
  searchParams: {
    employeeNo?: string
    name?: string
    companyIds?: number[]
    department?: string
    hireDateStart?: string
    hireDateEnd?: string
    regularDateStart?: string
    regularDateEnd?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'search': []
  'reset': []
}>()


const localName = ref(props.searchParams.name || '')
const localEmployeeNo = ref(props.searchParams.employeeNo || '')
const localDepartment = ref(props.searchParams.department || '')
const localCompanyIds = ref<number[]>(props.searchParams.companyIds ? [...props.searchParams.companyIds] : [])
const showCompanyModal = ref(false)

const companyList = computed(() => props.companyList || [])
const selectedCompanyNamesText = computed(() => {
  if (!localCompanyIds.value || localCompanyIds.value.length === 0) return ''
  const selected = companyList.value.filter((c: API.Company) => c.id && localCompanyIds.value.includes(c.id))
  return selected.map((c: API.Company) => c.companyName || '').filter(Boolean).join(', ')
})

// 使用字符串类型，因为 value-format="YYYY-MM-DD" 会返回字符串
const localHireDateStart = ref<string | null | undefined>(props.searchParams.hireDateStart || null)
const localHireDateEnd = ref<string | null | undefined>(props.searchParams.hireDateEnd || null)
const localRegularDateStart = ref<string | null | undefined>(props.searchParams.regularDateStart || null)
const localRegularDateEnd = ref<string | null | undefined>(props.searchParams.regularDateEnd || null)

watch(() => props.searchParams, (newParams) => {
  localName.value = newParams.name || ''
  localEmployeeNo.value = newParams.employeeNo || ''
  localDepartment.value = newParams.department || ''
  localCompanyIds.value = newParams.companyIds ? [...newParams.companyIds] : []
  localHireDateStart.value = newParams.hireDateStart || null
  localHireDateEnd.value = newParams.hireDateEnd || null
  localRegularDateStart.value = newParams.regularDateStart || null
  localRegularDateEnd.value = newParams.regularDateEnd || null
}, { deep: true, immediate: true })

const handleCompanyModalOk = (selectedIds: number[]) => {
  localCompanyIds.value = selectedIds
  emit('update:searchParams', {
    ...props.searchParams,
    companyIds: selectedIds,
  })
}

const handleHireDateStartChange = (value: string | null) => {
  localHireDateStart.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    hireDateStart: value || undefined,
  })
}

const handleHireDateEndChange = (value: string | null) => {
  localHireDateEnd.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    hireDateEnd: value || undefined,
  })
}

const handleRegularDateStartChange = (value: string | null) => {
  localRegularDateStart.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    regularDateStart: value || undefined,
  })
}

const handleRegularDateEndChange = (value: string | null) => {
  localRegularDateEnd.value = value
  emit('update:searchParams', {
    ...props.searchParams,
    regularDateEnd: value || undefined,
  })
}

watch([localName, localEmployeeNo, localDepartment], () => {
  emit('update:searchParams', {
    ...props.searchParams,
    name: localName.value,
    employeeNo: localEmployeeNo.value,
    department: localDepartment.value,
    companyIds: localCompanyIds.value,
  })
}, { deep: true })
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

