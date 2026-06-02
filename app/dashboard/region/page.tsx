'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import RegionFeature from '@/components/features/RegionFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">지역별 매출 분포</h1><p className="text-sm text-zinc-500 mt-0.5">지역별 매출 현황을 분석합니다.</p></div><RegionFeature /></div>
}
