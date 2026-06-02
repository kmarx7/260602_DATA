'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcMonthlyTrend, calcSeasonalAvg } from '@/lib/salesAnalysis'
import { KpiCard, SectionHeader, InsightBox, fmtWon } from './shared'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

const SEASON_COLOR: Record<string, string> = { 봄: '#22c55e', 여름: '#f59e0b', 가을: '#f97316', 겨울: '#3b82f6' }

export default function TrendsFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const monthly = useMemo(() => calcMonthlyTrend(rows, config.dateCol, config.salesCol), [rows, config])
  const seasonal = useMemo(() => calcSeasonalAvg(monthly), [monthly])

  const totalSum = monthly.reduce((s, m) => s + m.total, 0)
  const bestMonth = monthly.reduce((a, b) => (a.total > b.total ? a : b), monthly[0])
  const worstMonth = monthly.reduce((a, b) => (a.total < b.total ? a : b), monthly[0])
  const recentGrowth = monthly.length >= 2
    ? ((monthly[monthly.length - 1].total - monthly[monthly.length - 2].total) / monthly[monthly.length - 2].total) * 100
    : 0
  const bestSeason = seasonal.reduce((a, b) => (a.avg > b.avg ? a : b), seasonal[0])

  const insights = [
    `최고 매출 월은 ${bestMonth?.label} (${fmtWon(bestMonth?.total ?? 0)})`,
    `최저 매출 월은 ${worstMonth?.label} (${fmtWon(worstMonth?.total ?? 0)})`,
    `${bestSeason?.season}이 평균 매출이 가장 높습니다 (${fmtWon(bestSeason?.avg ?? 0)})`,
    `최근 전월 대비 ${recentGrowth >= 0 ? '▲' : '▼'} ${Math.abs(recentGrowth).toFixed(1)}% 변화`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="전체 기간 총매출" value={fmtWon(totalSum)} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard label="월 평균 매출" value={fmtWon(totalSum / (monthly.length || 1))} color="green" icon={<Calendar className="w-5 h-5" />} />
        <KpiCard label="최고 매출 월" value={bestMonth?.label ?? '-'} sub={fmtWon(bestMonth?.total ?? 0)} color="purple" />
        <KpiCard label="최근 월 증감" value={`${recentGrowth >= 0 ? '+' : ''}${recentGrowth.toFixed(1)}%`} color={recentGrowth >= 0 ? 'green' : 'red'} icon={recentGrowth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />} />
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">월별 매출 추이</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={Math.floor(monthly.length / 10)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
              <Tooltip formatter={(v) => fmtWon(Number(v))} labelFormatter={(l) => `${l}`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="월 매출" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">계절별 평균 매출</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={seasonal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
                <Bar dataKey="avg" name="평균 매출" radius={[6, 6, 0, 0]}>
                  {seasonal.map((s, i) => (
                    <rect key={i} fill={SEASON_COLOR[s.season] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">계절별 통계 요약</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-50 border-b"><th className="px-4 py-2 text-left text-xs text-zinc-500">계절</th><th className="px-4 py-2 text-right text-xs text-zinc-500">평균 매출</th><th className="px-4 py-2 text-right text-xs text-zinc-500">데이터 수</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {seasonal.map((s) => (
                  <tr key={s.season} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SEASON_COLOR[s.season] }} />
                      {s.season}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-zinc-800">{fmtWon(s.avg)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">{s.count}개월</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
