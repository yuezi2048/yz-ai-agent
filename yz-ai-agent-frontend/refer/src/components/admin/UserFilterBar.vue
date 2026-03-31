<template>
  <a-flex justify="space-between" style="margin-bottom: 16px">
    <a-form layout="inline" :model="searchParams" @finish="$emit('search')">
      <a-form-item label="工号">
        <a-input 
          v-model:value="localEmployeeNo" 
          placeholder="输入工号" 
          class="invoice-filter-input" 
          allow-clear 
        />
      </a-form-item>
      <a-form-item label="姓名">
        <a-input 
          v-model:value="localName" 
          placeholder="输入姓名" 
          class="invoice-filter-input" 
          allow-clear 
        />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button class="btn-grey" @click="handleReset">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-flex>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons-vue'

interface Props {
  searchParams: {
    employeeNo?: string
    name?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'search': []
  'reset': []
}>()

const localEmployeeNo = ref(props.searchParams.employeeNo || '')
const localName = ref(props.searchParams.name || '')

watch(() => props.searchParams, (newParams) => {
  localEmployeeNo.value = newParams.employeeNo || ''
  localName.value = newParams.name || ''
}, { deep: true })

watch([localEmployeeNo, localName], () => {
  emit('update:searchParams', {
    employeeNo: localEmployeeNo.value,
    name: localName.value,
  })
}, { deep: true })

const handleReset = () => {
  localEmployeeNo.value = ''
  localName.value = ''
  emit('update:searchParams', {
    employeeNo: '',
    name: '',
  })
  emit('reset')
}
</script>

<style scoped>
@import '@/styles/filter.css';
</style>

