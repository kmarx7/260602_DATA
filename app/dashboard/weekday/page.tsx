'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import WeekdayFeature from '@/components/features/WeekdayFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">요일별 매출 패턴</h1><p className="text-sm text-zinc-500 mt-0.5">요일별 평균 매출을 비교합니다.</p></div><WeekdayFeature /></div>
}
