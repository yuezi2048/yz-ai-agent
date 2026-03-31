# 模块标准化重构总结

## ✅ 已完成的基础设施

### 1. 全局样式系统
- ✅ `src/styles/filter.css` - 筛选器全局样式（`invoice-filter-*` 类）
- ✅ `src/styles/table.css` - 表格全局样式（`invoice-standard-table` 类）

### 2. 全局组件
- ✅ `src/modal/globalModal.vue` - 可拖拽全局模态框
- ✅ `src/modal/upsertModal.vue` - 连增/连改抽象组件

### 3. 通用 Hook 模板
- ✅ `src/hooks/common/useBaseTable.ts` - 通用表格管理 Hook

### 4. 公司管理模块（完整示例）
- ✅ `src/hooks/base/useCompanyTable.ts` - 公司管理 Hook
- ✅ `src/components/base/CompanyFilterBar.vue` - 公司筛选组件
- ✅ `src/modal/base/CompanyEditModal.vue` - 公司编辑模态框（使用 globalModal + upsertModal）
- ✅ `src/pages/base/CompanyManagePage.refactored.vue` - 重构后的瘦页面（示例）

## 📋 重构标准模板

### Hook 创建模板
```typescript
// src/hooks/[模块名]/use[实体名]Table.ts
import { useBaseTable } from '@/hooks/common/useBaseTable'
import { [查询API] } from '@/api/[API文件]'

export function use[实体名]Table() {
  return useBaseTable<[数据类型], [筛选参数类型], [API参数类型]>({
    queryApi: [查询API],
    transformSearchParams: (searchParams) => {
      // 转换筛选参数到 API 参数
      const params: Partial<[API参数类型]> = {}
      if (searchParams.field1) params.field1 = searchParams.field1
      // ... 其他字段
      return params
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
  <a-card class="invoice-filter-container" style="margin-bottom: 12px">
    <a-collapse
      v-model:activeKey="filterCollapseKey"
      class="invoice-filter-collapse"
      @change="handleFilterCollapseChange"
    >
      <a-collapse-panel key="filter" :showArrow="false" :header="null">
        <div class="invoice-filter-form-container">
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
              <a-form-item label="字段名" class="invoice-filter-form-item">
                <a-input 
                  v-model:value="localField" 
                  class="invoice-filter-input" 
                  allow-clear 
                />
              </a-form-item>
            </a-col>
            <!-- 更多筛选字段 -->
          </a-row>
        </div>
      </a-collapse-panel>
    </a-collapse>
    
    <div class="invoice-filter-actions" :class="{ 'is-collapsed': filterCollapsed }">
      <div class="invoice-filter-collapse-toggle" @click="handleFilterCollapseToggle">
        <span>{{ filterCollapsed ? '展开筛选条件' : '收起筛选条件' }}</span>
        <component :is="filterCollapsed ? CaretDownOutlined : CaretUpOutlined" />
      </div>
      <div class="invoice-filter-actions-buttons" v-if="!filterCollapsed">
        <a-space>
          <a-button type="primary" @click="$emit('search')">查询</a-button>
          <a-button @click="$emit('reset')">重置</a-button>
        </a-space>
      </div>
    </div>
  </a-card>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import { useFilterCollapse } from '@/composables/useFilterCollapse'

interface Props {
  searchParams: {
    // 筛选参数类型定义
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:searchParams': [params: Props['searchParams']]
  'search': []
  'reset': []
}>()

const { filterCollapsed, filterCollapseKey, handleFilterCollapseChange, handleFilterCollapseToggle } = 
  useFilterCollapse('[存储键]_FILTER_COLLAPSED')

// 本地状态和双向绑定逻辑
</script>

<style scoped>
@import '@/styles/filter.css';
</style>
```

### 编辑模态框模板
```vue
<!-- src/modal/[模块名]/[实体名]EditModal.vue -->
<template>
  <global-modal
    v-model="visible"
    :title="title"
    width="900px"
  >
    <upsert-modal
      ref="upsertModalRef"
      :is-editing="isEditing"
      :show-footer="true"
      @save="handleSave"
      @next="handleNext"
    >
      <template #content>
        <a-form ref="formRef" :model="formData">
          <!-- 表单字段 -->
        </a-form>
      </template>
    </upsert-modal>
  </global-modal>
</template>

<script lang="ts" setup>
import { ref, watch, reactive } from 'vue'
import GlobalModal from '@/modal/globalModal.vue'
import UpsertModal from '@/modal/upsertModal.vue'

interface FormData {
  // 表单数据类型定义
}

interface Props {
  modelValue: boolean
  title: string
  formData?: Partial<FormData>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'ok': [data: FormData, callback: (success: boolean) => void]
  'next': []
}>()

const visible = ref(false)
const formRef = ref()
const upsertModalRef = ref<InstanceType<typeof UpsertModal>>()
const isEditing = ref(false)
const formData = reactive<FormData>({
  // 初始值
})

// 监听 props 变化，更新表单数据和编辑状态
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.formData) {
    isEditing.value = !!(props.formData.id || /* 判断编辑的其他条件 */)
    Object.assign(formData, props.formData)
  } else {
    // 重置表单
    Object.assign(formData, { /* 初始值 */ })
    isEditing.value = false
    upsertModalRef.value?.resetButtonState()
  }
})

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    emit('ok', { ...formData }, (success: boolean) => {
      // upsertModal 会自动处理按钮状态
    })
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

const handleNext = () => {
  // 保留所有字段状态，只清空关键字段（连续录入）
  Object.assign(formData, { /* 保留的字段 */ })
  formRef.value?.resetFields()
  emit('next')
}
</script>
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
      <template #extra>
        <!-- 操作按钮 -->
      </template>
      
      <a-table
        :columns="resizableDisplayColumns"
        :data-source="dataListWithSerial"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        :scroll="{ x: tableWidth }"
        size="small"
        class="invoice-standard-table"
      >
        <!-- 表格模板 -->
      </a-table>
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

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { use[实体名]Table } from '@/hooks/[模块名]/use[实体名]Table'
import [实体名]FilterBar from '@/components/[模块名]/[实体名]FilterBar.vue'
import [实体名]EditModal from '@/modal/[模块名]/[实体名]EditModal.vue'
import ResizableHeaderCell from '@/components/ResizableHeaderCell.vue'
import { useAntdResizableHeader } from '@/composables/useAntdResizableHeader'

// 使用 Hook
const {
  loading,
  dataListWithSerial,
  pagination,
  searchParams,
  fetchData,
  handleTableChange,
  doSearch,
  doReset,
} = use[实体名]Table()

// 列定义和列设置逻辑
// 业务逻辑（新增、编辑、删除、导出等）
</script>

<style scoped>
@import '@/styles/table.css';
</style>
```

## 🎯 待重构模块清单

### Base 模块（基础信息管理）
- [x] ✅ 公司管理（已完成示例）
- [ ] ⏳ 发票类型管理 (`InvoiceTypePage.vue`)
- [ ] ⏳ 转账方式管理 (`TransferMethodPage.vue`)
- [ ] ⏳ 标号管理 (`MarkPage.vue`)

### Employee 模块（员工管理）
- [ ] ⏳ 员工管理 (`EmployeeManagePage.vue`)

### Finance 模块（财务管理）
- [ ] ⏳ 应收账款 (`AccountsReceivablePage.vue`)
- [ ] ⏳ 输入发票 (`InputInvoicePage.vue`)
- [ ] ⏳ 银行交易 (`BankTransactionPage.vue`)

### Supplier 模块（供应商管理）
- [ ] ⏳ 供应商管理 (`SupplierManagePage.vue`)

### User 模块（用户管理）
- [ ] ⏳ 用户登录 (`UserLoginPage.vue`)
- [ ] ⏳ 个人资料 (`ProfilePage.vue`)
- [ ] ⏳ 修改密码 (`ChangePasswordPage.vue`)

### BI 模块（统计分析）
- [ ] ⏳ 统计页面 (`StatisticsPage.vue`)

## 📝 重构检查清单

每个模块重构时，请检查：

### 1. Hook 创建
- [ ] 创建 `use[实体名]Table.ts`
- [ ] 正确配置 `queryApi`、`transformSearchParams`
- [ ] 测试数据获取、分页、排序功能

### 2. 筛选组件
- [ ] 创建 `[实体名]FilterBar.vue`
- [ ] 使用全局样式类（`invoice-filter-*`）
- [ ] 实现双向绑定和事件传递
- [ ] 移除所有内联样式

### 3. 编辑模态框
- [ ] 创建 `[实体名]EditModal.vue`
- [ ] 嵌套 `globalModal` 和 `upsertModal`
- [ ] 实现连增逻辑（保存并继续）
- [ ] 测试拖拽功能
- [ ] 移除所有内联样式

### 4. 页面重构
- [ ] 使用 Hook 管理表格数据
- [ ] 使用筛选组件替换原有 HTML
- [ ] 使用编辑模态框替换原有模态框
- [ ] 移除所有业务逻辑到 Hook
- [ ] 移除内联样式，使用全局样式类
- [ ] 代码行数减少到 500 行以内
- [ ] 表格使用 `invoice-standard-table` 类

### 5. 功能验证
- [ ] 查询、重置功能正常
- [ ] 新增、编辑功能正常
- [ ] 删除功能正常
- [ ] 导出功能正常
- [ ] 分页、排序功能正常
- [ ] 连增功能正常（如适用）
- [ ] 模态框拖拽功能正常
- [ ] 列设置功能正常（如适用）

## 🚀 快速重构步骤

1. **创建 Hook**
   - 复制 `useCompanyTable.ts` 作为模板
   - 修改 API 调用和类型定义
   - 配置 `transformSearchParams`

2. **创建筛选组件**
   - 复制 `CompanyFilterBar.vue` 作为模板
   - 修改筛选字段
   - 确保使用全局样式类

3. **重构编辑模态框**
   - 复制 `CompanyEditModal.vue` 作为模板
   - 修改表单字段
   - 确保嵌套 `globalModal` 和 `upsertModal`

4. **重构页面**
   - 复制 `CompanyManagePage.refactored.vue` 作为模板
   - 修改列定义
   - 修改业务逻辑（新增、编辑、删除、导出）
   - 使用新组件替换原有 HTML

5. **测试验证**
   - 测试所有功能
   - 检查样式一致性
   - 检查代码质量

## ⚠️ 重要注意事项

1. **样式类名**：必须使用 `invoice-filter-*` 和 `invoice-standard-table`，确保视觉一致性
2. **连增逻辑**：在 `upsertModal` 的 `@next` 事件中实现"保存并继续"逻辑
3. **拖拽功能**：`globalModal` 已集成拖拽，无需额外配置
4. **类型安全**：所有类型从 `@/api/typings.d.ts` 导入
5. **代码复用**：相似功能尽量复用 Hook 和组件
6. **向后兼容**：确保重构后功能完全正常

## 📊 重构效果

- **代码行数**：页面文件从 1000+ 行减少到 500 行以内
- **代码复用**：业务逻辑封装在 Hook 中，可在其他模块复用
- **样式统一**：所有模块使用相同的全局样式类，视觉完全一致
- **可维护性**：逻辑、样式、UI 完全解耦，易于维护和扩展

