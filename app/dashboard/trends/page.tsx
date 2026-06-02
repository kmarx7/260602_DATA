'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import TrendsFeature from '@/components/features/TrendsFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">월별·계절별 트렌드</h1><p className="text-sm text-zinc-500 mt-0.5">월별 매출 흐름과 계절별 패턴을 분석합니다.</p></div><TrendsFeature /></div>
}
