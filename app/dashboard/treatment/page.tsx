'use client'

import { useDatasetStore } from '@/store/datasetStore'
import MissingTreatment from '@/components/analysis/MissingTreatment'
import { Wand2 } from 'lucide-react'
import Link from 'next/link'

export default function TreatmentPage() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Wand2 className="w-16 h-16 text-zinc-300" />
        <h2 className="text-xl font-semibold text-zinc-600">데이터가 없습니다</h2>
        <Link href="/dashboard/upload" className="text-blue-500 underline text-sm">파일 업로드하기</Link>
      </div>
    )
  }
  return (
    <div className="space-y-4 max-w-full">
      <div>
        <h1 className="text-base font-semibold text-zinc-700">결측치 처리</h1>
        <p className="text-xs text-zinc-400 mt-0.5">처리 방법을 선택하고 적용하면 이후 모든 분석이 처리된 데이터 기준으로 계산됩니다.</p>
      </div>
      <MissingTreatment />
    </div>
  )
}
