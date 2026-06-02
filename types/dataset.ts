export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'unknown'

export interface ColumnInfo {
  name: string
  type: ColumnType
  uniqueCount: number
  nullCount: number
  nullRate: number
  // numeric
  min?: number
  max?: number
  mean?: number
  // categorical
  topValues?: string[]
  // datetime
  dateMin?: string
  dateMax?: string
  // preview samples
  samples: string[]
}

export interface DatasetState {
  fileName: string | null
  fileSize: number | null
  columns: string[]
  rows: Record<string, unknown>[]
  columnInfos: ColumnInfo[]
  totalRows: number
  totalCols: number
  totalNulls: number
}
