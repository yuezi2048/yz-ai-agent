# 发票查询页面全栈重构指南

## 📁 目录结构

```
src/
├── styles/
│   ├── filter.css          # 全局筛选器样式（已创建）
│   └── table.css           # 全局表格样式（已更新）
├── modal/
│   ├── globalModal.vue     # 全局可拖拽模态框（已创建）
│   ├── upsertModal.vue     # 连增/连改抽象组件（已创建）
│   └── invoice/
│       └── InvoiceEditModal.vue  # 发票编辑模态框（需重构）
├── hooks/
│   └── invoice/
│       └── useInvoiceTable.ts    # 表格数据管理 Hook（已创建）
└── components/
    └── invoice/
        ├── InvoiceFilterBar.vue      # 筛选栏组件（已创建）
        └── InvoiceStatisticsBar.vue  # 统计条组件（已创建）
```

## 🎯 重构进度

### ✅ 已完成
1. ✅ 全局样式文件 `filter.css` 和 `table.css`
2. ✅ 全局可拖拽模态框 `globalModal.vue`
3. ✅ 连增/连改抽象组件 `upsertModal.vue`
4. ✅ `useInvoiceTable.ts` Hook
5. ✅ 筛选栏组件 `InvoiceFilterBar.vue`
6. ✅ 统计条组件 `InvoiceStatisticsBar.vue`

### 🔄 待完成
1. ⏳ 重构 `InvoiceEditModal.vue` 继承 `globalModal` 和 `upsertModal`
2. ⏳ 重写 `InvoiceQueryPage.vue` 为瘦页面

## 📝 核心实现说明

### 1. 样式引用示例

在组件中使用全局样式类：

```vue
<template>
  <!-- 筛选容器 -->
  <div class="invoice-filter-container">
    <!-- 筛选输入框 -->
    <a-input class="invoice-filter-input" />
    <!-- 筛选选择器 -->
    <a-select class="invoice-filter-select" />
    <!-- 日期选择器 -->
    <a-date-picker class="invoice-date-picker" />
    <!-- 日期范围包装器 -->
    <div class="invoice-date-range-wrapper">
      <a-date-picker />
      <span class="invoice-date-separator">至</span>
      <a-date-picker />
    </div>
  </div>
  
  <!-- 表格 -->
  <a-table class="invoice-standard-table">
    <!-- 表格内容 -->
  </a-table>
</template>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/table.css';
</style>
```

### 2. useInvoiceTable Hook 使用示例

```typescript
import { useInvoiceTable } from '@/hooks/invoice/useInvoiceTable'

const {
  loading,
  dataListWithSerial,
  total,
  statistics,
  paginationParams,
  searchParams,
  fetchData,
  handlePageChange,
  handlePageSizeChange,
  doSearch,
  doReset,
} = useInvoiceTable()
```

### 3. upsertModal 使用示例

```vue
<template>
  <upsert-modal
    :is-editing="isEditing"
    :show-footer="true"
    @save="handleSave"
    @next="handleNext"
    @next-edit="handleNextEdit"
  >
    <template #content>
      <!-- 表单内容 -->
    </template>
  </upsert-modal>
</template>

<script setup>
const handleSave = (callback: (success: boolean) => void) => {
  // 执行保存逻辑
  apiCall().then(() => {
    callback(true) // 成功
  }).catch(() => {
    callback(false) // 失败
  })
}
</script>
```

### 4. globalModal 使用示例

```vue
<template>
  <global-modal
    v-model="visible"
    title="编辑发票"
    width="1000px"
  >
    <!-- 模态框内容 -->
  </global-modal>
</template>
```

### 5. InvoiceEditModal 重构方案

`InvoiceEditModal.vue` 应该：

1. **继承 globalModal**：使用 `globalModal` 作为外层容器
2. **使用 upsertModal**：在内容区域使用 `upsertModal` 处理保存/下一条逻辑
3. **保留表单逻辑**：保留原有的表单验证和数据绑定逻辑

```vue
<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="1000px"
  >
    <upsert-modal
      :is-editing="isEditing"
      :show-footer="true"
      @save="handleSave"
      @next="handleNext"
      @next-edit="handleNextEdit"
    >
      <template #content>
        <a-form ref="formRef" :model="formData">
          <!-- 表单字段 -->
        </a-form>
      </template>
    </upsert-modal>
  </global-modal>
</template>
```

### 6. InvoiceQueryPage 瘦页面重构

`InvoiceQueryPage.vue` 应该：

1. **使用 useInvoiceTable Hook**：管理所有表格相关状态
2. **使用业务组件**：`InvoiceFilterBar` 和 `InvoiceStatisticsBar`
3. **最小化逻辑**：只负责组件组合和事件传递

```vue
<template>
  <div id="invoiceQueryPage">
    <!-- 筛选栏 -->
    <InvoiceFilterBar
      :search-params="searchParams"
      :company-list="companyList"
      :client-list="clientList"
      :invoice-type-list="invoiceTypeList"
      :mark-list="markList"
      @search="doSearch"
      @reset="doReset"
    />
    
    <!-- 表格 -->
    <a-card>
      <template #extra>
        <InvoiceStatisticsBar :statistics="statistics" />
        <!-- 操作按钮 -->
      </template>
      
      <a-table
        :columns="columns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="paginationConfig"
        @change="handleTableChange"
        class="invoice-standard-table"
      />
    </a-card>
    
    <!-- 编辑模态框 -->
    <InvoiceEditModal
      v-model="invoiceModalVisible"
      :form-data="invoiceFormData"
      @save="handleInvoiceSubmit"
      @next="handleInvoiceNext"
      @next-edit="handleInvoiceNextEdit"
    />
  </div>
</template>

<script setup>
import { useInvoiceTable } from '@/hooks/invoice/useInvoiceTable'
import InvoiceFilterBar from '@/components/invoice/InvoiceFilterBar.vue'
import InvoiceStatisticsBar from '@/components/invoice/InvoiceStatisticsBar.vue'
import InvoiceEditModal from '@/modal/invoice/InvoiceEditModal.vue'

const {
  loading,
  dataListWithSerial,
  total,
  statistics,
  paginationParams,
  searchParams,
  fetchData,
  handlePageChange,
  handlePageSizeChange,
  handleTableChange,
  doSearch,
  doReset,
} = useInvoiceTable()

// 其他业务逻辑...
</script>
```

## 🚀 下一步行动

1. 重构 `InvoiceEditModal.vue`，使其继承 `globalModal` 和 `upsertModal`
2. 重写 `InvoiceQueryPage.vue`，移除所有业务逻辑，只保留组件组合
3. 测试所有功能，确保重构后功能正常
4. 更新其他页面（如应收账款页面）使用相同的样式和组件

## 📌 注意事项

1. **样式类名**：所有组件必须使用全局定义的 CSS 类名，确保视觉一致性
2. **Hook 复用**：`useInvoiceTable` 可以在其他类似页面复用
3. **组件解耦**：业务组件应该只接收 props 和 emit 事件，不直接调用 API
4. **类型安全**：所有 TypeScript 类型定义应该从 `@/api/typings.d.ts` 导入

