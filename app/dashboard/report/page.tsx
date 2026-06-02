'use client'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import ReportFeature from '@/components/features/ReportFeature'
import { NoDataGuard, NoConfigGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { config } = useColumnConfigStore()
  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />
  return <div className="space-y-4"><div><h1 className="text-lg font-bold text-zinc-800">리포트 다운로드</h1><p className="text-sm text-zinc-500 mt-0.5">분석 결과를 CSV로 다운로드합니다.</p></div><ReportFeature /></div>
}
