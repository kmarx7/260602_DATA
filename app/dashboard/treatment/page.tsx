'use client'

import { useDatasetStore } from '@/store/datasetStore'
import DataCleaning from '@/components/analysis/DataCleaning'
import { NoDataGuard } from '@/components/features/shared'

export default function TreatmentPage() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  if (!hasData) return <NoDataGuard />
  return (
    <div className="space-y-4 max-w-full">
      <div>
        <h1 className="text-lg font-bold text-zinc-800">데이터 클리닝</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          결측치와 이상치를 처리한 뒤 분석하면 더 정확한 결과를 얻을 수 있습니다.
          처리 후 모든 분석이 깨끗한 데이터를 기준으로 동작합니다.
        </p>
      </div>
      <DataCleaning />
    </div>
  )
}
