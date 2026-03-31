# 批量模块重构指南

## 🎯 重构目标

将所有模块按照发票管理模块的架构进行标准化重构，实现：
1. **瘦页面、厚组件**：页面只负责组件组合
2. **逻辑解耦**：业务逻辑封装在 Hook 中
3. **样式统一**：使用全局样式类，确保视觉一致性
4. **模态框标准化**：所有模态框使用 globalModal + upsertModal

## 📦 已创建的基础设施

### 1. 通用 Hook 模板
- `src/hooks/common/useBaseTable.ts` - 通用表格管理 Hook

### 2. 全局组件
- `src/modal/globalModal.vue` - 可拖拽全局模态框
- `src/modal/upsertModal.vue` - 连增/连改抽象组件

### 3. 全局样式
- `src/styles/filter.css` - 筛选器样式（使用 `invoice-filter-*` 类）
- `src/styles/table.css` - 表格样式（使用 `invoice-standard-table` 类）

## 🔧 重构步骤（以公司管理为例）

### 步骤 1：创建 Hook
```typescript
// src/hooks/base/useCompanyTable.ts
import { useBaseTable } from '@/hooks/common/useBaseTable'
import { listCompanyByPageUsingPost } from '@/api/gongsixinxijiekou'

export function useCompanyTable() {
  return useBaseTable<API.Company, {
    companyName?: string
    // ... 其他筛选字段
  }, API.CompanyPageDto>({
    queryApi: listCompanyByPageUsingPost,
    transformSearchParams: (searchParams) => {
      // 转换筛选参数
    },
    defaultPageSize: 10,
    storageKeyPrefix: 'COMPANY_MANAGE',
  })
}
```

### 步骤 2：创建筛选组件
```vue
<!-- src/components/base/CompanyFilterBar.vue -->
<template>
  <a-card class="invoice-filter-container">
    <!-- 使用全局样式类 -->
    <a-input class="invoice-filter-input" />
  </a-card>
</template>

<style scoped>
@import '@/styles/filter.css';
</style>
```

### 步骤 3：重构编辑模态框
```vue
<!-- src/modal/base/CompanyEditModal.vue -->
<template>
  <global-modal v-model="visible" :title="title">
    <upsert-modal :is-editing="isEditing" @save="handleSave" @next="handleNext">
      <template #content>
        <!-- 表单内容 -->
      </template>
    </upsert-modal>
  </global-modal>
</template>
```

### 步骤 4：重构页面（瘦页面）
```vue
<!-- src/pages/base/CompanyManagePage.vue -->
<template>
  <div id="companyManagePage">
    <CompanyFilterBar
      :search-params="searchParams"
      @search="doSearch"
      @reset="doReset"
    />
    
    <a-card>
      <a-table
        :columns="columns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        class="invoice-standard-table"
      />
    </a-card>
    
    <CompanyEditModal
      v-model="modalVisible"
      :title="modalTitle"
      :form-data="formData"
      @ok="handleSubmit"
      @next="handleNext"
    />
  </div>
</template>

<script setup>
import { useCompanyTable } from '@/hooks/base/useCompanyTable'
import CompanyFilterBar from '@/components/base/CompanyFilterBar.vue'
import CompanyEditModal from '@/modal/base/CompanyEditModal.vue'

const {
  loading,
  dataListWithSerial,
  pagination,
  searchParams,
  fetchData,
  handleTableChange,
  doSearch,
  doReset,
} = useCompanyTable()

// 只保留业务逻辑（新增、编辑、删除、导出等）
</script>

<style scoped>
@import '@/styles/table.css';
</style>
```

## 📋 模块重构清单

### Base 模块
- [x] useCompanyTable.ts
- [x] CompanyFilterBar.vue
- [x] CompanyEditModal.vue
- [ ] CompanyManagePage.vue（瘦页面）
- [ ] InvoiceTypePage.vue
- [ ] TransferMethodPage.vue
- [ ] MarkPage.vue

### Employee 模块
- [ ] EmployeeManagePage.vue

### Finance 模块
- [ ] AccountsReceivablePage.vue
- [ ] InputInvoicePage.vue
- [ ] BankTransactionPage.vue

### Supplier 模块
- [ ] SupplierManagePage.vue

### User 模块
- [ ] UserLoginPage.vue
- [ ] ProfilePage.vue
- [ ] ChangePasswordPage.vue

### BI 模块
- [ ] StatisticsPage.vue

## ✅ 质量检查清单

每个模块重构完成后，检查：

1. **代码行数**：页面文件是否减少到 500 行以内？
2. **样式类**：是否使用全局样式类（`invoice-filter-*`, `invoice-standard-table`）？
3. **模态框**：是否使用 `globalModal` + `upsertModal`？
4. **Hook**：业务逻辑是否封装在 Hook 中？
5. **功能测试**：所有功能是否正常工作？
6. **类型安全**：TypeScript 类型是否完整？

## 🚀 快速开始

1. 复制 `useCompanyTable.ts` 作为模板
2. 修改 API 调用和类型定义
3. 创建筛选组件，使用全局样式类
4. 重构模态框，使用 globalModal + upsertModal
5. 重构页面，使用新组件和 Hook
6. 测试所有功能

## 📝 注意事项

1. **样式类名**：必须使用 `invoice-filter-*` 和 `invoice-standard-table`，确保视觉一致性
2. **连增逻辑**：在 `upsertModal` 的 `@next` 事件中实现"保存并继续"逻辑
3. **拖拽功能**：`globalModal` 已集成拖拽，无需额外配置
4. **类型定义**：所有类型从 `@/api/typings.d.ts` 导入

