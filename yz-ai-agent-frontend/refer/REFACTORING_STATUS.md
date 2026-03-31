# 发票查询页面重构状态

## ✅ 已完成的工作

### 第一阶段：样式与全局容器标准化
1. ✅ **全局样式文件**
   - `src/styles/filter.css` - 筛选器样式，包含 CSS 变量和类名封装
   - `src/styles/table.css` - 更新表格样式，添加 `invoice-standard-table` 类

2. ✅ **全局模态框组件**
   - `src/modal/globalModal.vue` - 封装可拖拽模态框，集成 `useDraggableModal`

3. ✅ **连增/连改抽象组件**
   - `src/modal/upsertModal.vue` - 封装"保存并继续"、"下一条"、"保存"的按钮状态流转逻辑

### 第二阶段：业务组件与逻辑解耦
1. ✅ **Hooks 抽象**
   - `src/hooks/invoice/useInvoiceTable.ts` - 管理表格数据、分页、筛选、排序等状态和逻辑

2. ✅ **业务组件拆分**
   - `src/components/invoice/InvoiceFilterBar.vue` - 筛选栏组件
   - `src/components/invoice/InvoiceStatisticsBar.vue` - 统计条组件

3. ✅ **模态框重构**
   - `src/modal/invoice/InvoiceEditModal.vue` - 重构后的编辑模态框，继承 `globalModal` 和 `upsertModal`

## ⏳ 待完成的工作

### 第三阶段：页面聚合
1. ⏳ **重写 InvoiceQueryPage.vue**
   - 当前状态：原文件有 2000+ 行代码
   - 需要：使用新的组件和 hook 重写为瘦页面
   - 建议：分步迁移，先保留现有功能，逐步替换组件

## 📋 迁移计划

### 步骤 1：替换筛选栏
- [ ] 将现有的筛选栏 HTML 替换为 `<InvoiceFilterBar>` 组件
- [ ] 将筛选相关的逻辑迁移到 `useInvoiceTable` hook
- [ ] 测试筛选功能

### 步骤 2：替换统计条
- [ ] 将统计信息显示替换为 `<InvoiceStatisticsBar>` 组件
- [ ] 测试统计信息显示

### 步骤 3：替换编辑模态框
- [ ] 将 `InvoiceFormModal` 替换为 `InvoiceEditModal`
- [ ] 测试新增和编辑功能
- [ ] 测试连续录入功能

### 步骤 4：使用 useInvoiceTable Hook
- [ ] 将表格数据管理逻辑迁移到 `useInvoiceTable` hook
- [ ] 移除页面中的 `fetchData`、`handlePageChange` 等函数
- [ ] 测试分页、排序功能

### 步骤 5：清理代码
- [ ] 移除未使用的导入和变量
- [ ] 移除重复的样式定义
- [ ] 使用全局样式类名替换内联样式

## 🔧 当前问题

1. **InvoiceFilterBar.vue** 
   - 已修复 watch 的 deep 选项
   - 需要确保所有 props 正确传递

2. **useInvoiceTable.ts**
   - Hook 已创建，但需要在实际使用中测试
   - 可能需要根据实际使用情况调整

3. **InvoiceEditModal.vue**
   - 已创建，继承 `globalModal` 和 `upsertModal`
   - 需要测试与现有代码的集成

## 📝 使用说明

### 使用新的组件

```vue
<template>
  <!-- 使用筛选栏组件 -->
  <InvoiceFilterBar
    :search-params="searchParams"
    :company-list="companyList"
    :client-list="clientList"
    :invoice-type-list="invoiceTypeList"
    :mark-list="markList"
    :selected-company-names-text="selectedCompanyNamesText"
    :selected-mark-values-text="selectedMarkValuesText"
    @search="doSearch"
    @reset="doReset"
    @open-company-modal="showIssuerCompanyModal = true"
    @open-mark-modal="showMarkModal = true"
  />
  
  <!-- 使用统计条组件 -->
  <InvoiceStatisticsBar :statistics="statistics" />
  
  <!-- 使用编辑模态框 -->
  <InvoiceEditModal
    v-model="invoiceModalVisible"
    :title="invoiceModalTitle"
    :company-list="companyList"
    :client-list="clientList"
    :invoice-type-list="invoiceTypeList"
    :employee-list="employeeList"
    :mark-list="markList"
    :form-data="invoiceFormData"
    @ok="handleInvoiceSubmit"
    @next="handleInvoiceNext"
    @next-edit="handleInvoiceNextEdit"
  />
</template>

<script setup>
import { useInvoiceTable } from '@/hooks/invoice/useInvoiceTable'
import InvoiceFilterBar from '@/components/invoice/InvoiceFilterBar.vue'
import InvoiceStatisticsBar from '@/components/invoice/InvoiceStatisticsBar.vue'
import InvoiceEditModal from '@/modal/invoice/InvoiceEditModal.vue'

// 使用 hook
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
</script>
```

## ⚠️ 注意事项

1. **向后兼容**：在迁移过程中，确保现有功能不受影响
2. **测试**：每个步骤完成后都要进行功能测试
3. **样式**：确保使用全局样式类名，保持视觉一致性
4. **类型安全**：所有 TypeScript 类型定义应该从 `@/api/typings.d.ts` 导入

## 🎯 最终目标

- `InvoiceQueryPage.vue` 文件大小减少到 500 行以内
- 所有业务逻辑封装在 hook 和组件中
- 页面只负责组件组合和事件传递
- 代码可维护性和可复用性大幅提升

