import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface AutoCompleteOption {
  value: string
  label: string
  [key: string]: any
}

export interface UseAutoCompleteWithExtraOptions {
  /** 基础选项列表（从接口获取的选项） */
  baseOptions: Ref<AutoCompleteOption[]> | ComputedRef<AutoCompleteOption[]>
  /** 当前输入值 */
  currentValue: Ref<string> | ComputedRef<string>
  /** 值提取函数：从可能包含额外信息的 value 中提取纯文本（可选） */
  extractValue?: (value: string) => string
  /** 是否启用自动加入输入内容功能（默认 true） */
  enableAutoAdd?: boolean
}

/**
 * 通用的自动填充框 composable，支持输入内容自动加入下拉列表
 * 
 * 功能：
 * 1. 自动将用户输入的内容添加到下拉列表中
 * 2. 在过滤选项中包含用户输入的内容
 * 3. 支持自定义值提取逻辑（处理 name|employeeNo 等格式）
 */
export function useAutoCompleteWithExtra(options: UseAutoCompleteWithExtraOptions) {
  const {
    baseOptions,
    currentValue,
    extractValue = (v: string) => v.trim(),
    enableAutoAdd = true,
  } = options

  // 存储用户手动输入的额外项
  const extraItems = ref<string[]>([])

  /**
   * 处理 change 事件：将用户输入的内容添加到 extraItems
   */
  const handleChange = (value: string) => {
    if (!enableAutoAdd || !value) return

    const extracted = extractValue(value)
    const trimmed = extracted.trim()
    
    if (trimmed && !extraItems.value.includes(trimmed)) {
      extraItems.value = [...extraItems.value, trimmed]
    }
  }

  /**
   * 合并基础选项和额外项
   */
  const mergedOptions = computed(() => {
    const options: AutoCompleteOption[] = []
    const seen = new Set<string>()

    // 添加基础选项
    for (const opt of baseOptions.value) {
      const value = (opt.value || '').trim()
      if (value && !seen.has(value.toLowerCase())) {
        seen.add(value.toLowerCase())
        options.push(opt)
      }
    }

    // 添加额外项（用户手动输入的）
    if (enableAutoAdd) {
      for (const item of extraItems.value) {
        const trimmed = item.trim()
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase())
          options.push({ value: trimmed, label: trimmed })
        }
      }
    }

    return options
  })

  /**
   * 过滤后的选项（包含用户输入的内容）
   */
  const filteredOptions = computed(() => {
    const input = currentValue.value || ''
    if (!input) {
      return mergedOptions.value
    }

    const lowerInput = input.toLowerCase()
    const baseOpts = mergedOptions.value

    // 检查输入的内容是否已在选项中
    const existsInOptions = baseOpts.some(opt => {
      const optValue = (opt.value || '').toLowerCase()
      const optLabel = (opt.label || '').toLowerCase()
      return optValue === lowerInput || optLabel === lowerInput
    })

    // 如果输入的内容不在选项中，将其添加到过滤结果的开头
    if (!existsInOptions && input.trim()) {
      return [
        { value: input, label: input },
        ...baseOpts.filter(opt => {
          const optValue = (opt.value || '').toLowerCase()
          const optLabel = (opt.label || '').toLowerCase()
          return optValue.includes(lowerInput) || optLabel.includes(lowerInput)
        })
      ]
    }

    // 如果输入的内容已在选项中，返回过滤后的选项
    return baseOpts.filter(opt => {
      const optValue = (opt.value || '').toLowerCase()
      const optLabel = (opt.label || '').toLowerCase()
      return optValue.includes(lowerInput) || optLabel.includes(lowerInput)
    })
  })

  /**
   * 手动添加项到 extraItems（用于程序化添加，如保存成功后）
   */
  const addExtraItem = (item: string) => {
    const trimmed = item.trim()
    if (trimmed && !extraItems.value.includes(trimmed)) {
      extraItems.value = [...extraItems.value, trimmed]
    }
  }

  /**
   * 清空额外项
   */
  const clearExtraItems = () => {
    extraItems.value = []
  }

  return {
    extraItems,
    handleChange,
    mergedOptions,
    filteredOptions,
    addExtraItem,
    clearExtraItems,
  }
}


