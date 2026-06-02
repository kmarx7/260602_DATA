'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { Calendar, TrendingUp, ShoppingBag, MapPin, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react'

const ROLES = [
  { key: 'dateCol',     label: '날짜 컬럼',    icon: Calendar,     required: true,  desc: '연도, 월, 날짜 등 시간 정보가 있는 컬럼' },
  { key: 'salesCol',   label: '매출 컬럼',    icon: TrendingUp,   required: true,  desc: '매출액, 거래금액 등 분석할 주요 수치 컬럼' },
  { key: 'categoryCol',label: '업종/분류',    icon: ShoppingBag,  required: false, desc: '업종, 상품 종류, 카테고리 등 분류 컬럼 (선택)' },
  { key: 'regionCol',  label: '지역 컬럼',    icon: MapPin,       required: false, desc: '지역, 시군구, 주소 등 위치 컬럼 (선택)' },
  { key: 'costCol',    label: '비용 컬럼',    icon: DollarSign,   required: false, desc: '지출, 비용, 원가 등 비용 관련 컬럼 (선택)' },
] as const

export default function ColumnConfig() {
  const { columns, columnInfos } = useDatasetStore()
  const { setConfig } = useColumnConfigStore()
  const router = useRouter()

  const [mapping, setMapping] = useState<Record<string, string>>({
    dateCol: columnInfos.find((c) => c.type === 'datetime')?.name ?? '',
    salesCol: columnInfos.find((c) => c.type === 'numeric')?.name ?? '',
    categoryCol: '',
    regionCol: '',
    costCol: '',
  })

  const canProceed = mapping.dateCol && mapping.salesCol

  function handleApply() {
    if (!canProceed) return
    setConfig({
      dateCol: mapping.dateCol,
      salesCol: mapping.salesCol,
      costCol: mapping.costCol,
      categoryCol: mapping.categoryCol,
      regionCol: mapping.regionCol,
    })
    router.push('/dashboard/overview')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-zinc-800">분석 컬럼 설정</h2>
        <p className="text-sm text-zinc-500">각 역할에 맞는 컬럼을 선택하면 10가지 분석이 자동으로 실행됩니다.</p>
      </div>

      <div className="space-y-3">
        {ROLES.map(({ key, label, icon: Icon, required, desc }) => (
          <div key={key} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 bg-white hover:border-blue-300 transition-colors">
            <div className={`p-2 rounded-lg mt-0.5 ${mapping[key] ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700">{label}</span>
                {required
                  ? <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">필수</span>
                  : <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-400 rounded-full">선택</span>
                }
              </div>
              <p className="text-xs text-zinc-400">{desc}</p>
            </div>
            <select
              value={mapping[key]}
              onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value }))}
              className="text-sm border border-zinc-300 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
            >
              <option value="">선택 안 함</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        onClick={handleApply}
        disabled={!canProceed}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" />
        분석 시작하기
        <ArrowRight className="w-4 h-4" />
      </button>

      {!canProceed && (
        <p className="text-center text-xs text-zinc-400">날짜 컬럼과 매출 컬럼은 필수로 선택해야 합니다.</p>
      )}
    </div>
  )
}
