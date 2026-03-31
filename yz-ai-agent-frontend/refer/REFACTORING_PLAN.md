# 模块标准化重构计划

## 📋 重构进度总览

### ✅ 已完成的基础设施
1. ✅ 全局样式文件 (`src/styles/filter.css`, `src/styles/table.css`)
2. ✅ 全局模态框组件 (`src/modal/globalModal.vue`)
3. ✅ 连增/连改抽象组件 (`src/modal/upsertModal.vue`)
4. ✅ 通用表格 Hook 模板 (`src/hooks/common/useBaseTable.ts`)

### 🔄 进行中的模块重构

#### 1. Base 模块（基础信息管理）
- ✅ `useCompanyTable.ts` - 公司管理 Hook
- ✅ `CompanyFilterBar.vue` - 公司筛选组件
- ✅ `CompanyEditModal.vue` - 公司编辑模态框（使用 globalModal + upsertModal）
- ⏳ `CompanyManagePage.vue` - 瘦页面重构（待完成）
- ⏳ `InvoiceTypePage.vue` - 发票类型管理
- ⏳ `TransferMethodPage.vue` - 转账方式管理
- ⏳ `MarkPage.vue` - 标号管理

#### 2. Employee 模块（员工管理）
- ⏳ `useEmployeeTable.ts`
- ⏳ `EmployeeFilterBar.vue`
- ⏳ `EmployeeEditModal.vue`
- ⏳ `EmployeeManagePage.vue`

#### 3. Finance 模块（财务管理）
- ⏳ `AccountsReceivablePage.vue` - 应收账款
- ⏳ `InputInvoicePage.vue` - 输入发票
- ⏳ `BankTransactionPage.vue` - 银行交易

#### 4. Supplier 模块（供应商管理）
- ⏳ `SupplierManagePage.vue`

#### 5. User 模块（用户管理）
- ⏳ `UserLoginPage.vue`
- ⏳ `ProfilePage.vue`
- ⏳ `ChangePasswordPage.vue`

#### 6. BI 模块（统计分析）
- ⏳ `StatisticsPage.vue`

## 🎯 重构标准模板

### Hook 模板
```typescript
// src/hooks/[模块名]/use[实体名]Table.ts
import { useBaseTable } from '@/hooks/common/useBaseTable'
import { [查询API] } from '@/api/[API文件]'

export function use[实体名]Table() {
  return useBaseTable<[数据类型], [筛选参数类型], [API参数类型]>({
    queryApi: [查询API],
    transformSearchParams: (searchParams) => {
      // 转换筛选参数
    },
    defaultPageSize: 10,
    storageKeyPrefix: '[存储键前缀]',
  })
}
```

### 筛选组件模板
```vue
<!-- src/components/[模块名]/[实体名]FilterBar.vue -->
<template>
  <a-card class="invoice-filter-container" style="margin-bottom: 6px">
    <!-- 使用全局样式类 -->
    <div class="invoice-filter-form-container">
      <!-- 筛选表单项，使用 invoice-filter-input, invoice-filter-select 等类 -->
    </div>
  </a-card>
</template>

<style scoped>
@import '@/styles/filter.css';
</style>
```

### 编辑模态框模板
```vue
<!-- src/modal/[模块名]/[实体名]EditModal.vue -->
<template>
  <global-modal v-model="visible" :title="title" width="900px">
    <upsert-modal
      :is-editing="isEditing"
      @save="handleSave"
      @next="handleNext"
    >
      <template #content>
        <!-- 表单内容 -->
      </template>
    </upsert-modal>
  </global-modal>
</template>
```

### 页面模板（瘦页面）
```vue
<!-- src/pages/[模块名]/[实体名]ManagePage.vue -->
<template>
  <div id="[页面ID]">
    <!-- 筛选栏 -->
    <[实体名]FilterBar
      :search-params="searchParams"
      @search="doSearch"
      @reset="doReset"
    />
    
    <!-- 表格 -->
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
    
    <!-- 编辑模态框 -->
    <[实体名]EditModal
      v-model="modalVisible"
      :title="modalTitle"
      :form-data="formData"
      @ok="handleSubmit"
      @next="handleNext"
    />
  </div>
</template>

<script setup>
import { use[实体名]Table } from '@/hooks/[模块名]/use[实体名]Table'
import [实体名]FilterBar from '@/components/[模块名]/[实体名]FilterBar.vue'
import [实体名]EditModal from '@/modal/[模块名]/[实体名]EditModal.vue'

// 使用 Hook
const {
  loading,
  dataListWithSerial,
  total,
  pagination,
  searchParams,
  fetchData,
  handlePageChange,
  handleTableChange,
  doSearch,
  doReset,
} = use[实体名]Table()

// 业务逻辑（新增、编辑、删除、导出等）
</script>

<style scoped>
@import '@/styles/table.css';
</style>
```

## 📝 重构检查清单

### 每个模块重构时需检查：

1. **Hook 创建**
   - [ ] 创建 `use[实体名]Table.ts`
   - [ ] 正确配置 `queryApi`、`transformSearchParams`
   - [ ] 测试数据获取、分页、排序功能

2. **筛选组件**
   - [ ] 创建 `[实体名]FilterBar.vue`
   - [ ] 使用全局样式类（`invoice-filter-*`）
   - [ ] 实现双向绑定和事件传递

3. **编辑模态框**
   - [ ] 创建 `[实体名]EditModal.vue`
   - [ ] 嵌套 `globalModal` 和 `upsertModal`
   - [ ] 实现连增逻辑（保存并继续）
   - [ ] 测试拖拽功能

4. **页面重构**
   - [ ] 移除所有业务逻辑到 Hook
   - [ ] 移除内联样式，使用全局样式类
   - [ ] 使用新组件替换原有 HTML
   - [ ] 代码行数减少到 500 行以内

5. **样式对齐**
   - [ ] 表格使用 `invoice-standard-table` 类
   - [ ] 筛选器使用 `invoice-filter-*` 类
   - [ ] 移除所有重复的 CSS 定义

6. **功能验证**
   - [ ] 查询、重置功能正常
   - [ ] 新增、编辑功能正常
   - [ ] 删除功能正常
   - [ ] 导出功能正常
   - [ ] 分页、排序功能正常
   - [ ] 连增功能正常（如适用）
   - [ ] 模态框拖拽功能正常

## 🚀 批量重构策略

由于模块较多，建议按以下顺序进行：

1. **第一阶段**：完成 Base 模块（4个页面）
   - 公司管理（示例已完成）
   - 发票类型管理
   - 转账方式管理
   - 标号管理

2. **第二阶段**：完成 Employee 模块（1个页面）
   - 员工管理

3. **第三阶段**：完成 Finance 模块（3个页面）
   - 应收账款
   - 输入发票
   - 银行交易

4. **第四阶段**：完成其他模块
   - 供应商管理
   - 用户管理
   - 统计分析

## 📌 注意事项

1. **向后兼容**：确保重构后功能完全正常
2. **样式一致性**：所有模块必须使用相同的全局样式类
3. **代码复用**：相似功能尽量复用 Hook 和组件
4. **类型安全**：所有 TypeScript 类型定义完整
5. **测试验证**：每个模块重构后都要进行完整测试

