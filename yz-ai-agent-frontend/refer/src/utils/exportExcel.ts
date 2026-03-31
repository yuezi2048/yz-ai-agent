import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { message } from 'ant-design-vue'

export interface ExcelColumnConfig {
  /** 列标题（对应 data 中的键） */
  key: string
  /** 列宽（像素，Excel 中会转换为字符宽度） */
  width?: number
  /** 对齐方式：'left' | 'center' | 'right' */
  align?: 'left' | 'center' | 'right'
}

export interface ExcelSheetConfig {
  /** 工作表名称 */
  sheetName: string
  /** 已经按需要转换好的导出数据（键为列标题，值为单元格内容） */
  data: any[]
  /** 列配置（可选，用于设置列宽和对齐方式） */
  columns?: ExcelColumnConfig[]
}

/**
 * 将 JSON 数据导出为 Excel
 * @param sheets 工作表配置列表
 * @param fileName 导出的文件名（包含后缀，如 xxx.xlsx）
 * @param onProgress 进度回调函数 (progress: number, statusText: string) => void
 * @param abortSignal 取消信号，用于取消导出
 * @param backgroundDownload 是否后台下载（不显示进度，完成后自动下载）
 */
export const exportJsonToExcel = (
  sheets: ExcelSheetConfig[], 
  fileName: string,
  onProgress?: (progress: number, statusText: string) => void,
  abortSignal?: AbortSignal,
  backgroundDownload: boolean = false
) => {
  try {
    if (!sheets.length) {
      message.warning('没有可导出的数据')
      return 0
    }

    // 检查是否已取消
    if (abortSignal?.aborted) {
      return 0
    }

    if (!backgroundDownload) {
      onProgress?.(99, '正在生成 Excel 文件...')
    }

    const workbook = XLSX.utils.book_new()

    sheets.forEach((sheet, index) => {
      // 检查是否已取消
      if (abortSignal?.aborted) {
        throw new Error('导出已取消')
      }

      const worksheet = XLSX.utils.json_to_sheet(sheet.data)
      
      // 设置列宽和对齐方式
      const firstRow = sheet.data[0]
      if (firstRow) {
        const columnKeys = Object.keys(firstRow)
        
        // 设置列宽
        const colWidths: { wch: number }[] = columnKeys.map((key) => {
          if (sheet.columns && sheet.columns.length > 0) {
            const colConfig = sheet.columns.find((col) => col.key === key)
            if (colConfig?.width) {
              // 将像素宽度转换为 Excel 字符宽度（大约 1 像素 = 0.135 字符宽度）
              return { wch: Math.max(colConfig.width / 7.5, 10) }
            }
          }
          // 默认宽度：根据列标题和内容计算合适的宽度
          const headerLength = key.length
          const maxContentLength = Math.max(
            ...sheet.data.map((row: any) => {
              const value = row[key]
              return value ? String(value).length : 0
            })
          )
          return { wch: Math.max(headerLength, maxContentLength, 10) + 2 }
        })
        worksheet['!cols'] = colWidths
        
        // 设置对齐方式
        if (sheet.columns && sheet.columns.length > 0) {
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
          for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
              if (!worksheet[cellAddress]) continue
              
              const columnKey = columnKeys[col]
              const colConfig = sheet.columns.find((c) => c.key === columnKey)
              
              if (colConfig?.align) {
                if (!worksheet[cellAddress].s) {
                  worksheet[cellAddress].s = {}
                }
                if (!worksheet[cellAddress].s.alignment) {
                  worksheet[cellAddress].s.alignment = {}
                }
                
                // 设置水平对齐
                if (colConfig.align === 'left') {
                  worksheet[cellAddress].s.alignment.horizontal = 'left'
                } else if (colConfig.align === 'center') {
                  worksheet[cellAddress].s.alignment.horizontal = 'center'
                } else if (colConfig.align === 'right') {
                  worksheet[cellAddress].s.alignment.horizontal = 'right'
                }
              }
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName || 'Sheet1')
    })

    // 检查是否已取消
    if (abortSignal?.aborted) {
      throw new Error('导出已取消')
    }

    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true // 确保样式被正确应用
    })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // 检查是否已取消
    if (abortSignal?.aborted) {
      throw new Error('导出已取消')
    }

    // 自动下载文件
    saveAs(blob, fileName)
    
    if (!backgroundDownload) {
      onProgress?.(100, '导出完成')
    } else {
      // 后台下载模式，显示成功提示
      message.success(`导出成功，文件已保存到下载文件夹`)
    }
    
    // 计算总记录数
    const totalRecords = sheets.reduce((sum, sheet) => sum + (sheet.data?.length || 0), 0)
    
    return totalRecords
  } catch (error: any) {
    // 如果是取消操作，不显示错误提示
    if (error?.message === '导出已取消' || abortSignal?.aborted) {
      if (!backgroundDownload) {
        onProgress?.(0, '导出已取消')
      }
      return 0
    }
    
    console.error('导出失败', error)
    message.error('导出失败')
    if (!backgroundDownload) {
      onProgress?.(0, '导出失败')
    }
    throw error
  }
}


