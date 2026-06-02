import { create } from 'zustand'
import type { DatasetState, ColumnInfo } from '@/types/dataset'
import { analyzeDataset } from '@/lib/analysis'

interface DatasetStore extends DatasetState {
  originalRows: Record<string, unknown>[]   // 원본 데이터 보존
  originalColumns: string[]
  isTreated: boolean                         // 처리 적용 여부
  setDataset: (data: {
    fileName: string
    fileSize: number
    columns: string[]
    rows: Record<string, unknown>[]
    columnInfos: ColumnInfo[]
  }) => void
  applyTreatedData: (columns: string[], rows: Record<string, unknown>[]) => void
  resetToOriginal: () => void
  clearDataset: () => void
}

const initialState: DatasetState & { originalRows: Record<string, unknown>[]; originalColumns: string[]; isTreated: boolean } = {
  fileName: null,
  fileSize: null,
  columns: [],
  rows: [],
  columnInfos: [],
  totalRows: 0,
  totalCols: 0,
  totalNulls: 0,
  originalRows: [],
  originalColumns: [],
  isTreated: false,
}

export const useDatasetStore = create<DatasetStore>((set, get) => ({
  ...initialState,

  setDataset: ({ fileName, fileSize, columns, rows, columnInfos }) => {
    const totalNulls = columnInfos.reduce((sum, c) => sum + c.nullCount, 0)
    set({
      fileName,
      fileSize,
      columns,
      rows,
      columnInfos,
      totalRows: rows.length,
      totalCols: columns.length,
      totalNulls,
      originalRows: rows,
      originalColumns: columns,
      isTreated: false,
    })
  },

  // 처리된 데이터를 전역 상태에 반영 → 이후 모든 분석이 이 데이터 기반
  applyTreatedData: (columns, rows) => {
    const columnInfos = analyzeDataset(columns, rows)
    const totalNulls = columnInfos.reduce((sum, c) => sum + c.nullCount, 0)
    set({
      columns,
      rows,
      columnInfos,
      totalRows: rows.length,
      totalCols: columns.length,
      totalNulls,
      isTreated: true,
    })
  },

  // 원본 데이터로 복원
  resetToOriginal: () => {
    const { originalColumns, originalRows } = get()
    const columnInfos = analyzeDataset(originalColumns, originalRows)
    const totalNulls = columnInfos.reduce((sum, c) => sum + c.nullCount, 0)
    set({
      columns: originalColumns,
      rows: originalRows,
      columnInfos,
      totalRows: originalRows.length,
      totalCols: originalColumns.length,
      totalNulls,
      isTreated: false,
    })
  },

  clearDataset: () => set(initialState),
}))
