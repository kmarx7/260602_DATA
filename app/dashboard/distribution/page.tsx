'use client'

import { useDatasetStore } from '@/store/datasetStore'
import DistributionAnalysis from '@/components/analysis/DistributionAnalysis'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'

export default function DistributionPage() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <BarChart2 className="w-16 h-16 text-zinc-300" />
        <h2 className="text-xl font-semibold text-zinc-600">데이터가 없습니다</h2>
        <Link href="/dashboard/upload" className="text-blue-500 underline text-sm">파일 업로드하기</Link>
      </div>
    )
  }
  return (
    <div className="space-y-4 max-w-full">
      <h1 className="text-base font-semibold text-zinc-700">분포 분석</h1>
      <DistributionAnalysis />
    </div>
  )
}
