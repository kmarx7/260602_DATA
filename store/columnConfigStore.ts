import { create } from 'zustand'

export interface ColumnConfig {
  dateCol: string       // 날짜 컬럼
  salesCol: string      // 매출/수치 컬럼
  costCol: string       // 비용 컬럼 (선택)
  categoryCol: string   // 업종/분류 컬럼 (선택)
  regionCol: string     // 지역 컬럼 (선택)
}

interface ColumnConfigStore {
  config: ColumnConfig | null
  setConfig: (config: ColumnConfig) => void
  clearConfig: () => void
}

export const useColumnConfigStore = create<ColumnConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  clearConfig: () => set({ config: null }),
}))
