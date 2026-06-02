'use client'

import { useDatasetStore } from '@/store/datasetStore'
import SummaryCards from '@/components/analysis/SummaryCards'
import ColumnTable from '@/components/analysis/ColumnTable'
import DataPreview from '@/components/analysis/DataPreview'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'

export default function AnalysisPage() {
  const hasData = useDatasetStore((s) => s.fileName !== null)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <BarChart2 className="w-16 h-16 text-zinc-300" />
        <h2 className="text-xl font-semibold text-zinc-600">데이터가 없습니다</h2>
        <p className="text-sm text-zinc-400">
          먼저{' '}
          <Link href="/dashboard/upload" className="text-blue-500 underline">
            파일을 업로드
          </Link>
          해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-full">
      {/* 섹션 1: 데이터셋 요약 */}
      <section>
        <h2 className="text-base font-semibold text-zinc-700 mb-3">데이터셋 요약</h2>
        <SummaryCards />
      </section>

      {/* 섹션 2: 컬럼 정보 표 */}
      <section>
        <h2 className="text-base font-semibold text-zinc-700 mb-3">컬럼 상세 분석</h2>
        <ColumnTable />
      </section>

      {/* 섹션 3: 데이터 미리보기 */}
      <section>
        <h2 className="text-base font-semibold text-zinc-700 mb-3">데이터 미리보기</h2>
        <DataPreview />
      </section>
    </div>
  )
}
