'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { NoDataGuard, NoConfigGuard, KpiCard, fmtWon } from '@/components/features/shared'
import { calcMonthlyTrend, calcYearlyCohort, detectAnomalies } from '@/lib/salesAnalysis'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, AlertTriangle, BarChart2, GitBranch, MapPin, ShoppingBag, DollarSign, FileText, Wand2 } from 'lucide-react'

const QUICK_LINKS = [
  { href: '/dashboard/trends',       label: '월별·계절별 트렌드', icon: TrendingUp,    color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { href: '/dashboard/weekday',      label: '요일별 패턴',        icon: Calendar,      color: 'bg-green-50 text-green-600 border-green-100' },
  { href: '/dashboard/segments',     label: '구간별 비교',        icon: BarChart2,     color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { href: '/dashboard/forecast',     label: '매출 예측',          icon: TrendingUp,    color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { href: '/dashboard/anomaly',      label: '이상치 탐지',        icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-100' },
  { href: '/dashboard/category',     label: '업종별 비교',        icon: ShoppingBag,   color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { href: '/dashboard/region',       label: '지역별 분포',        icon: MapPin,        color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { href: '/dashboard/cost-relation',label: '매출-비용 관계',     icon: DollarSign,    color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { href: '/dashboard/cohort',       label: '연도별 성장률',      icon: GitBranch,     color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { href: '/dashboard/report',       label: '리포트 다운로드',    icon: FileText,      color: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
]

export default function OverviewPage() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()

  if (!hasData) return <NoDataGuard />
  if (!config) return <NoConfigGuard />

  const monthly = useMemo(() => calcMonthlyTrend(rows, config.dateCol, config.salesCol), [rows, config])
  const yearly = useMemo(() => calcYearlyCohort(rows, config.dateCol, config.salesCol), [rows, config])
  const withAnomaly = useMemo(() => detectAnomalies(monthly), [monthly])

  const totalSales = monthly.reduce((s, m) => s + m.total, 0)
  const avgMonthly = totalSales / (monthly.length || 1)
  const anomalyCount = withAnomaly.filter((m) => m.isAnomaly).length
  const lastYear = yearly[yearly.length - 1]
  const prevYear = yearly[yearly.length - 2]
  const yoyGrowth = lastYear && prevYear ? ((lastYear.total - prevYear.total) / prevYear.total) * 100 : null
  const recentMonths = monthly.slice(-12)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-800">대시보드 개요</h1>
        <p className="text-sm text-zinc-500 mt-0.5">전체 매출 현황을 한눈에 확인하세요</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="전체 기간 총매출" value={fmtWon(totalSales)} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard label="월 평균 매출" value={fmtWon(avgMonthly)} color="green" icon={<Calendar className="w-5 h-5" />} />
        <KpiCard label="전년 대비 성장률" value={yoyGrowth !== null ? `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth.toFixed(1)}%` : '-'} trend={yoyGrowth ?? undefined} color={yoyGrowth !== null && yoyGrowth >= 0 ? 'green' : 'red'} />
        <KpiCard label="이상치 탐지" value={`${anomalyCount}건`} color={anomalyCount > 0 ? 'amber' : 'green'} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* 미니 트렌드 차트 */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-zinc-700">최근 12개월 매출 추이</p>
          <Link href="/dashboard/trends" className="text-xs text-blue-500 hover:underline">자세히 보기 →</Link>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={recentMonths}>
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={1} />
            <YAxis hide />
            <Tooltip formatter={(v) => fmtWon(Number(v))} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 10개 분석 바로가기 */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-3">10가지 분석 바로가기</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center hover:shadow-md transition-all ${color}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
