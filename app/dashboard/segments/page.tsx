'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import SegmentsFeature from '@/components/features/SegmentsFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">매출 구간별 비교</h1><p className="text-sm text-zinc-500 mt-0.5">상위·중위·하위 구간을 비교합니다.</p></div><SegmentsFeature /></div>
}
