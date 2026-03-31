<template>
  <div class="upsert-modal-wrapper">
    <slot name="content"></slot>
    <template v-if="showFooter">
      <div class="upsert-modal-footer">
        <a-space>
          <a-button 
            v-if="isEditing && showPrevButton"
            @click="handlePrev" 
            :disabled="prevDisabled"
            :loading="prevLoading"
          >
            <template #icon><LeftOutlined /></template>
            {{ prevButtonText }}
          </a-button>
          <a-button 
            v-if="showNextButton"
            @click="handleNext" 
            :disabled="nextDisabled"
            :loading="nextLoading"
          >
            <template #icon><RightOutlined /></template>
            {{ nextButtonText }}
          </a-button>
          <a-button 
            v-if="showResetButton"
            @click="handleReset"
            :disabled="resetDisabled"
            class="btn-grey"
          >
            <template #icon><DeleteOutlined /></template>
            {{ resetButtonText }}
          </a-button>
          <a-button 
            @click="handleSave" 
            :disabled="saveDisabled" 
            type="primary"
            :loading="saveLoading"
          >
            <template #icon><CheckOutlined /></template>
            {{ saveButtonText }}
          </a-button>
        </a-space>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { LeftOutlined, RightOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons-vue'

interface Props {
  /** 是否为编辑模式 */
  isEditing?: boolean
  /** 是否显示底部操作栏 */
  showFooter?: boolean
  /** 是否显示下一条按钮 */
  showNextButton?: boolean
  /** 是否显示上一条按钮 */
  showPrevButton?: boolean
  /** 是否显示重置按钮 */
  showResetButton?: boolean
  /** 保存按钮文本 */
  saveButtonText?: string
  /** 下一条按钮文本 */
  nextButtonText?: string
  /** 上一条按钮文本 */
  prevButtonText?: string
  /** 重置按钮文本 */
  resetButtonText?: string
  /** 初始保存按钮状态 */
  initialSaveDisabled?: boolean
  /** 初始下一条按钮状态 */
  initialNextDisabled?: boolean
  /** 初始上一条按钮状态 */
  initialPrevDisabled?: boolean
  /** 初始重置按钮状态 */
  initialResetDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  showFooter: true,
  showNextButton: true,
  showPrevButton: true,
  showResetButton: true,
  saveButtonText: '保存',
  nextButtonText: '下一条',
  prevButtonText: '上一条',
  resetButtonText: '重置',
  initialSaveDisabled: false,
  initialNextDisabled: true,
  initialPrevDisabled: false,
  initialResetDisabled: false,
})

const emit = defineEmits<{
  /** 保存事件，返回成功回调 */
  'save': [callback: (success: boolean) => void]
  /** 下一条事件（新增模式） */
  'next': []
  /** 下一条编辑事件（编辑模式），返回成功回调 */
  'next-edit': [callback: (success: boolean) => void]
  /** 上一条编辑事件（编辑模式），返回成功回调 */
  'prev-edit': [callback: (success: boolean) => void]
  /** 重置事件 */
  'reset': []
}>()

// 按钮状态
const saveDisabled = ref(props.initialSaveDisabled)
const nextDisabled = ref(props.initialNextDisabled)
const prevDisabled = ref(props.initialPrevDisabled)
const resetDisabled = ref(props.initialResetDisabled)
const saveLoading = ref(false)
const nextLoading = ref(false)
const prevLoading = ref(false)

// 监听 isEditing 变化，更新按钮状态
watch(() => props.isEditing, (isEditing) => {
  if (isEditing) {
    // 编辑模式：保存、上一条、下一条都可用
    saveDisabled.value = false
    prevDisabled.value = false
    nextDisabled.value = false
  } else {
    // 新增模式：保存可用，上一条和下一条禁用
    saveDisabled.value = false
    prevDisabled.value = true
    nextDisabled.value = true
  }
}, { immediate: true })

// 监听初始状态变化
watch(() => props.initialSaveDisabled, (val) => {
  saveDisabled.value = val
}, { immediate: true })

watch(() => props.initialNextDisabled, (val) => {
  nextDisabled.value = val
}, { immediate: true })

watch(() => props.initialPrevDisabled, (val) => {
  prevDisabled.value = val
}, { immediate: true })

watch(() => props.initialResetDisabled, (val) => {
  resetDisabled.value = val
}, { immediate: true })

/**
 * 处理保存按钮点击
 */
const handleSave = () => {
  // 先禁用保存按钮，防止重复提交
  saveDisabled.value = true
  saveLoading.value = true
  
  // 添加超时保护：如果30秒内没有收到回调，自动停止loading
  const timeoutId = setTimeout(() => {
    if (saveLoading.value) {
      console.warn('保存操作超时，自动停止loading状态')
      saveLoading.value = false
      saveDisabled.value = false
    }
  }, 30000)
  
  emit('save', (success: boolean) => {
    // 清除超时定时器
    clearTimeout(timeoutId)
    // 无论成功失败，都要停止loading
    saveLoading.value = false
    if (success) {
      // 保存成功后，根据模式更新按钮状态
      if (!props.isEditing) {
        // 新增模式：禁用保存，启用下一条
        saveDisabled.value = true
        nextDisabled.value = false
      } else {
        // 编辑模式：保持保存和下一条都可用
        saveDisabled.value = false
        nextDisabled.value = false
      }
    } else {
      // 保存失败：恢复保存按钮可用状态
      saveDisabled.value = false
      nextDisabled.value = props.isEditing ? false : true
    }
  })
}

/**
 * 处理上一条按钮点击（仅编辑模式）
 */
const handlePrev = () => {
  if (!props.isEditing) return
  
  // 禁用上一条按钮，防止重复点击
  prevDisabled.value = true
  prevLoading.value = true
  
  // 添加超时保护：如果30秒内没有收到回调，自动停止loading
  const timeoutId = setTimeout(() => {
    if (prevLoading.value) {
      console.warn('上一条操作超时，自动停止loading状态')
      prevLoading.value = false
      prevDisabled.value = false
    }
  }, 30000)
  
  emit('prev-edit', (success: boolean) => {
    // 清除超时定时器
    clearTimeout(timeoutId)
    // 无论成功失败，都要停止loading
    prevLoading.value = false
    if (success) {
      // 成功获取上一条数据，启用上一条按钮
      prevDisabled.value = false
    } else {
      // 获取失败，恢复按钮状态
      prevDisabled.value = false
    }
  })
}

/**
 * 处理重置按钮点击
 */
const handleReset = () => {
  emit('reset')
}

/**
 * 处理下一条按钮点击
 */
const handleNext = () => {
  if (props.isEditing) {
    // 编辑模式：触发下一条编辑事件
    // 禁用下一条按钮，防止重复点击
    nextDisabled.value = true
    nextLoading.value = true
    
    // 添加超时保护：如果30秒内没有收到回调，自动停止loading
    const timeoutId = setTimeout(() => {
      if (nextLoading.value) {
        console.warn('下一条操作超时，自动停止loading状态')
        nextLoading.value = false
        nextDisabled.value = false
      }
    }, 30000)
    
    emit('next-edit', (success: boolean) => {
      // 清除超时定时器
      clearTimeout(timeoutId)
      // 无论成功失败，都要停止loading
      nextLoading.value = false
      if (success) {
        // 成功获取下一条数据，启用下一条按钮
        nextDisabled.value = false
      } else {
        // 获取失败，恢复按钮状态
        nextDisabled.value = false
      }
    })
  } else {
    // 新增模式：触发下一条事件，重置按钮状态
    emit('next')
    saveDisabled.value = false
    nextDisabled.value = true
    // 重置loading状态
    nextLoading.value = false
  }
}

/**
 * 外部控制按钮状态的方法
 */
const setSaveDisabled = (disabled: boolean) => {
  saveDisabled.value = disabled
}

const setNextDisabled = (disabled: boolean) => {
  nextDisabled.value = disabled
}

const setSaveLoading = (loading: boolean) => {
  saveLoading.value = loading
}

const setNextLoading = (loading: boolean) => {
  nextLoading.value = loading
}

const setPrevDisabled = (disabled: boolean) => {
  prevDisabled.value = disabled
}

const setPrevLoading = (loading: boolean) => {
  prevLoading.value = loading
}

const setResetDisabled = (disabled: boolean) => {
  resetDisabled.value = disabled
}

/**
 * 重置按钮状态
 */
const resetButtonState = () => {
  if (props.isEditing) {
    saveDisabled.value = false
    prevDisabled.value = false
    nextDisabled.value = false
  } else {
    saveDisabled.value = false
    prevDisabled.value = true
    nextDisabled.value = true
  }
  saveLoading.value = false
  prevLoading.value = false
  nextLoading.value = false
}

// 暴露方法供父组件调用
defineExpose({
  setSaveDisabled,
  setNextDisabled,
  setPrevDisabled,
  setSaveLoading,
  setNextLoading,
  setPrevLoading,
  setResetDisabled,
  resetButtonState,
})
</script>

<style scoped>
@import '@/styles/filter.css';
@import '@/styles/form-modal.css';

.upsert-modal-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.upsert-modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}
</style>

