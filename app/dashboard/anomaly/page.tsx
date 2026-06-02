'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import AnomalyFeature from '@/components/features/AnomalyFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">이상치 탐지</h1><p className="text-sm text-zinc-500 mt-0.5">급등·급락 이상치를 자동으로 탐지합니다.</p></div><AnomalyFeature /></div>
}
