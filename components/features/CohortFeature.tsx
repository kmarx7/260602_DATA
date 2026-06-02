'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcYearlyCohort } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function CohortFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const cohort = useMemo(() => calcYearlyCohort(rows, config.dateCol, config.salesCol), [rows, config])

  const lastYear = cohort[cohort.length - 1]
  const firstYear = cohort[0]
  const totalGrowth = firstYear ? ((lastYear.total - firstYear.total) / firstYear.total) * 100 : 0
  const avgGrowth = cohort.filter((c) => c.growth !== null).reduce((s, c) => s + (c.growth ?? 0), 0) / (cohort.filter((c) => c.growth !== null).length || 1)
  const bestYear = cohort.reduce((a, b) => (b.growth ?? -Infinity) > (a.growth ?? -Infinity) ? b : a, cohort[0])

  const insights = [
    `${firstYear?.year}년 → ${lastYear?.year}년 누적 성장률: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`,
    `연평균 성장률(CAGR 근사): ${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`,
    bestYear?.growth !== null ? `최고 성장 연도: ${bestYear?.year}년 (${bestYear?.growth?.toFixed(1)}% 증가)` : '',
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="분석 기간" value={`${firstYear?.year}~${lastYear?.year}`} sub={`${cohort.length}개년`} color="zinc" />
        <KpiCard label="최근 연도 매출" value={fmtWon(lastYear?.total ?? 0)} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        <KpiCard label="누적 성장률" value={`${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`} color={totalGrowth >= 0 ? 'green' : 'red'} />
        <KpiCard label="연평균 성장률" value={`${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`} color={avgGrowth >= 0 ? 'green' : 'red'} />
      </div>

      <InsightBox items={insights} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">연도별 총매출</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cohort}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
                <Bar dataKey="total" name="연 매출" radius={[6, 6, 0, 0]}>
                  {cohort.map((c, i) => <Cell key={i} fill={c.growth !== null && c.growth >= 0 ? '#3b82f6' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">연도별 성장률 (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cohort.filter((c) => c.growth !== null)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="growth" name="성장률" radius={[4, 4, 0, 0]}>
                  {cohort.filter((c) => c.growth !== null).map((c, i) => <Cell key={i} fill={(c.growth ?? 0) >= 0 ? '#22c55e' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">연도별 상세</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b">{['연도','총매출','건수','평균 매출','전년 대비 성장률'].map((h) => <th key={h} className="px-4 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {cohort.map((c) => (
                <tr key={c.year} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5 font-semibold text-zinc-800">{c.year}년</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold text-zinc-800">{fmtWon(c.total)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-500">{c.count.toLocaleString()}건</td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-600">{fmtWon(c.avg)}</td>
                  <td className="px-4 py-2.5">
                    {c.growth !== null ? (
                      <span className={`text-sm font-semibold flex items-center gap-1 ${c.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {c.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {c.growth >= 0 ? '+' : ''}{c.growth.toFixed(1)}%
                      </span>
                    ) : <span className="text-zinc-300 text-xs">기준 연도</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
