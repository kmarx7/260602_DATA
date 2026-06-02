import { create } from 'zustand'
import type { DatasetState, ColumnInfo } from '@/types/dataset'

interface DatasetStore extends DatasetState {
  setDataset: (data: {
    fileName: string
    fileSize: number
    columns: string[]
    rows: Record<string, unknown>[]
    columnInfos: ColumnInfo[]
  }) => void
  clearDataset: () => void
}

const initialState: DatasetState = {
  fileName: null,
  fileSize: null,
  columns: [],
  rows: [],
  columnInfos: [],
  totalRows: 0,
  totalCols: 0,
  totalNulls: 0,
}

export const useDatasetStore = create<DatasetStore>((set) => ({
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
    })
  },

  clearDataset: () => set(initialState),
}))
