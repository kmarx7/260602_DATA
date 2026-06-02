'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import CostRelationFeature from '@/components/features/CostRelationFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">매출-비용 상관관계</h1><p className="text-sm text-zinc-500 mt-0.5">매출과 비용의 상관관계를 분석합니다.</p></div><CostRelationFeature /></div>
}
