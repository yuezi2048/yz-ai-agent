<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="width"
    :mask-closable="maskClosable"
    :keyboard="keyboard"
    :destroy-on-close="destroyOnClose"
    :footer="hasFooter ? undefined : null"
    :class="modalClass"
    :body-style="bodyStyle"
    :wrap-class-name="wrapClassName"
    @cancel="handleCancel"
  >
    <template #title>
      <slot name="title">
        {{ title }}
      </slot>
    </template>
    <slot></slot>
    <template #footer v-if="hasFooter">
      <slot name="footer"></slot>
    </template>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, watch, computed, useSlots } from 'vue'
import { useDraggableModal } from '@/composables/useDraggableModal'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  maskClosable?: boolean
  keyboard?: boolean
  destroyOnClose?: boolean
  modalClass?: string
  bodyStyle?: Record<string, any>
  wrapClassName?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '1000px',
  maskClosable: true,
  keyboard: true,
  destroyOnClose: false,
  modalClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'cancel': []
}>()

const slots = useSlots()
const visible = ref(false)

// 检查是否有 footer slot 内容
const hasFooter = computed(() => {
  return !!slots.footer
})

// 启用拖拽功能
useDraggableModal(visible)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    emit('cancel')
  }
})

const handleCancel = () => {
  visible.value = false
}
</script>

<style scoped>
/* 全局模态框样式由 useDraggableModal 提供 */
</style>

