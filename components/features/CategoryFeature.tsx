'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcCategoryStats } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'

const COLORS = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#0ea5e9']

export default function CategoryFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()

  if (!config?.categoryCol) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-4xl">🏪</div>
        <p className="text-lg font-semibold text-zinc-500">업종/분류 컬럼이 설정되지 않았습니다</p>
        <a href="/dashboard/config" className="text-blue-500 underline text-sm">컬럼 설정으로 이동</a>
      </div>
    )
  }

  const stats = useMemo(() => calcCategoryStats(rows, config.salesCol, config.categoryCol!), [rows, config])
  const top = stats[0]
  const totalSum = stats.reduce((s, c) => s + c.total, 0)

  const insights = [
    `1위 업종 "${top?.category}"의 총매출 ${fmtWon(top?.total ?? 0)} (전체의 ${((top?.total / totalSum) * 100).toFixed(1)}%)`,
    `총 ${stats.length}개 업종 분석됨`,
    `상위 3개 업종이 전체 매출의 ${(stats.slice(0, 3).reduce((s, c) => s + c.total, 0) / totalSum * 100).toFixed(0)}% 차지`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="업종 수" value={`${stats.length}개`} color="zinc" />
        <KpiCard label="1위 업종" value={top?.category ?? '-'} sub={fmtWon(top?.total ?? 0)} color="blue" />
        <KpiCard label="업종 평균 매출" value={fmtWon(totalSum / (stats.length || 1))} color="green" />
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">업종별 총매출 (상위 15개)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(240, Math.min(stats.length, 15) * 32)}>
            <BarChart data={stats.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtWon(v)} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => fmtWon(Number(v))} />
              <Bar dataKey="total" name="총매출" radius={[0, 4, 4, 0]}>
                {stats.slice(0, 15).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">업종별 상세 통계</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-50 border-b">{['순위','업종','건수','총매출','평균 매출','최고 매출','점유율'].map((h) => <th key={h} className="px-4 py-2 text-left text-xs text-zinc-500 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.map((c, i) => (
                  <tr key={c.category} className="hover:bg-zinc-50">
                    <td className="px-4 py-2 text-zinc-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-zinc-800 max-w-[120px]"><span className="block truncate" title={c.category}>{c.category}</span></td>
                    <td className="px-4 py-2 tabular-nums text-zinc-500">{c.count.toLocaleString()}</td>
                    <td className="px-4 py-2 tabular-nums font-semibold text-zinc-800">{fmtWon(c.total)}</td>
                    <td className="px-4 py-2 tabular-nums text-zinc-600">{fmtWon(c.avg)}</td>
                    <td className="px-4 py-2 tabular-nums text-blue-600">{fmtWon(c.max)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-zinc-100 w-16 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.total / totalSum) * 100}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500">{((c.total / totalSum) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
