<template>
  <a-card class="invoice-filter-container" style="margin-bottom: 6px">
    <a-collapse
      v-model:activeKey="filterCollapseKey"
      :bordered="false"
      ghost
      class="invoice-filter-collapse"
      @change="handleFilterCollapseChange"
    >
      <a-collapse-panel key="filter" :showArrow="false" :header="null">
        <div class="invoice-filter-form-container">
          <slot name="filter-fields">
            <!-- 默认插槽：筛选字段 -->
            <slot></slot>
          </slot>
        </div>
      </a-collapse-panel>
    </a-collapse>

    <div class="invoice-filter-actions" :class="{ 'is-collapsed': filterCollapsed }">
      <div class="invoice-filter-collapse-toggle" @click="handleFilterCollapseToggle">
        <span class="filter-collapse-toggle-text">
          {{ filterCollapsed ? '展开筛选条件' : '收起筛选条件' }}
        </span>
        <component :is="filterCollapsed ? CaretDownOutlined : CaretUpOutlined" />
      </div>
      <div class="invoice-filter-actions-buttons" v-if="!filterCollapsed">
        <a-space>
          <a-button type="primary" @click="$emit('search')">
            <template #icon><SearchOutlined /></template>
            查询
          </a-button>
          <a-button class="btn-grey" @click="$emit('reset')">
            <template #icon><DeleteOutlined /></template>
            清空
          </a-button>
        </a-space>
      </div>
    </div>
  </a-card>
</template>

<script lang="ts" setup>
import { CaretUpOutlined, CaretDownOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useFilterCollapse } from '@/composables/useFilterCollapse'

interface Props {
  /** 用于控制筛选栏折叠状态在 sessionStorage 的存储 key */
  storageKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'search': []
  'reset': []
}>()

// 筛选框折叠状态
const { filterCollapsed, filterCollapseKey, handleFilterCollapseChange, handleFilterCollapseToggle } =
  useFilterCollapse(props.storageKey)
</script>

<style scoped>
@import '@/styles/filter.css';
</style>


