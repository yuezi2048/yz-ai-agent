<template>
  <div class="invoice-pagination">
    <a-space>
      <span>共 {{ total }} 条</span>
      <a-select
        v-model:value="localPageSize"
        style="width: 100px;"
        @change="handlePageSizeChange"
      >
        <a-select-option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }} 条/页
        </a-select-option>
      </a-select>
      <a-pagination
        :current="current"
        :total="total"
        :page-size="localPageSize"
        :show-size-changer="false"
        :show-quick-jumper="showQuickJumper"
        :show-less-items="true"
        @change="handlePageChange"
      />
    </a-space>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0,
  },
  current: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  pageSizeOptions: {
    type: Array as () => number[],
    default: () => [10, 20, 50, 100],
  },
  showQuickJumper: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'update:current', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', page: number, pageSize: number): void
}>()

const localPageSize = ref<number>(props.pageSize)

watch(
  () => props.pageSize,
  (val) => {
    if (val !== localPageSize.value) {
      localPageSize.value = val
    }
  }
)

const handlePageChange = (page: number) => {
  emit('update:current', page)
  emit('change', page, localPageSize.value)
}

const handlePageSizeChange = (size: number) => {
  localPageSize.value = size
  emit('update:pageSize', size)
  emit('update:current', 1)
  emit('change', 1, size)
}
</script>

<style scoped>
@import '@/styles/pagination.css';
</style>

