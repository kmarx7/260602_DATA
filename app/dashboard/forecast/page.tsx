'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import ForecastFeature from '@/components/features/ForecastFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">매출 예측</h1><p className="text-sm text-zinc-500 mt-0.5">이동평균 기반 향후 3개월을 예측합니다.</p></div><ForecastFeature /></div>
}
