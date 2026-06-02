'use client'

import { usePathname } from 'next/navigation'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { Check } from 'lucide-react'

const STEPS = [
  { label: '파일 업로드',   paths: ['/dashboard/upload'] },
  { label: '컬럼 설정',     paths: ['/dashboard/config'] },
  { label: '데이터 클리닝', paths: ['/dashboard/treatment', '/dashboard/missing'] },
  { label: '분석',          paths: ['/dashboard/overview', '/dashboard/trends', '/dashboard/weekday', '/dashboard/segments', '/dashboard/forecast', '/dashboard/anomaly', '/dashboard/category', '/dashboard/region', '/dashboard/cost-relation', '/dashboard/cohort', '/dashboard/report', '/dashboard/analysis', '/dashboard/distribution', '/dashboard/correlation'] },
]

export default function FlowStepper() {
  const pathname = usePathname()
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const hasConfig = useColumnConfigStore((s) => s.config !== null)

  // 현재 활성 스텝 인덱스
  const activeIdx = STEPS.findIndex((s) => s.paths.some((p) => pathname.startsWith(p)))
  if (activeIdx === -1) return null

  // 각 스텝 완료 여부
  const done = [
    hasData,
    hasConfig,
    true, // 클리닝은 선택 사항
    false,
  ]

  return (
    <div className="flex items-center gap-0 px-6 py-3 bg-white border-b border-zinc-100">
      {STEPS.map((step, i) => {
        const isActive = i === activeIdx
        const isDone = done[i] && i < activeIdx
        const isFuture = i > activeIdx

        return (
          <div key={step.label} className="flex items-center">
            {/* 연결선 */}
            {i > 0 && (
              <div className={`h-px w-8 mx-1 ${isDone || i <= activeIdx ? 'bg-blue-300' : 'bg-zinc-200'}`} />
            )}

            {/* 스텝 */}
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                isDone
                  ? 'bg-blue-500 text-white'
                  : isActive
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : 'bg-zinc-100 text-zinc-400'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isActive ? 'text-blue-700' : isDone ? 'text-blue-400' : 'text-zinc-400'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
