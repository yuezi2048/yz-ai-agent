<template>
  <a-modal
    :visible="modelValue"
    title="选择启用状态"
    width="400px"
    @ok="handleOk"
    @cancel="handleCancel"
    destroy-on-close
  >
    <a-space direction="vertical" style="width: 100%">
      <a-checkbox
        :indeterminate="isIndeterminate"
        :checked="isAllChecked"
        @change="handleCheckAllChange"
      >
        全选
      </a-checkbox>
      <a-divider style="margin: 8px 0" />
      <a-checkbox-group v-model:value="localSelectedStatusList">
        <a-space direction="vertical">
          <a-checkbox :value="1">启用</a-checkbox>
          <a-checkbox :value="0">禁用</a-checkbox>
        </a-space>
      </a-checkbox-group>
    </a-space>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  selectedStatusList: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  ok: [selectedStatus: number[]]
}>()

const localSelectedStatusList = ref<number[]>([...props.selectedStatusList])

watch(
  () => props.selectedStatusList,
  (val) => {
    localSelectedStatusList.value = [...val]
  },
  { deep: true },
)

const isAllChecked = computed(() => {
  return localSelectedStatusList.value.length === 2
})

const isIndeterminate = computed(() => {
  const len = localSelectedStatusList.value.length
  return len > 0 && len < 2
})

const handleCheckAllChange = (e: any) => {
  const checked = e.target.checked
  localSelectedStatusList.value = checked ? [1, 0] : []
}

const handleOk = () => {
  emit('ok', localSelectedStatusList.value)
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
</style>


