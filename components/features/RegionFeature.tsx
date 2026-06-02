'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcRegionStats } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899','#6366f1','#0ea5e9']

export default function RegionFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()

  if (!config?.regionCol) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-4xl">📍</div>
        <p className="text-lg font-semibold text-zinc-500">지역 컬럼이 설정되지 않았습니다</p>
        <a href="/dashboard/config" className="text-blue-500 underline text-sm">컬럼 설정으로 이동</a>
      </div>
    )
  }

  const stats = useMemo(() => calcRegionStats(rows, config.salesCol, config.regionCol!), [rows, config])
  const totalSum = stats.reduce((s, r) => s + r.total, 0)
  const top3 = stats.slice(0, 3)
  const pieData = stats.slice(0, 8).map((s, i) => ({ name: s.category, value: s.total, fill: COLORS[i % COLORS.length] }))

  const insights = [
    `1위 지역 "${stats[0]?.category}"의 총매출 ${fmtWon(stats[0]?.total ?? 0)}`,
    `상위 3개 지역이 전체의 ${(top3.reduce((s, r) => s + r.total, 0) / totalSum * 100).toFixed(0)}% 차지`,
    `최하위 지역 대비 최상위 지역 ${stats.length > 1 ? (stats[0].total / stats[stats.length - 1].total).toFixed(1) : '-'}배 차이`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="분석 지역 수" value={`${stats.length}개`} color="zinc" />
        <KpiCard label="최고 지역" value={stats[0]?.category ?? '-'} sub={fmtWon(stats[0]?.total ?? 0)} color="blue" />
        <KpiCard label="지역 평균 매출" value={fmtWon(totalSum / (stats.length || 1))} color="green" />
      </div>

      <InsightBox items={insights} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">지역별 총매출 (상위 10개)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 48 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtWon(v)} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
                <Bar dataKey="total" name="총매출" radius={[0, 4, 4, 0]}>
                  {stats.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">지역별 점유율 (상위 8개)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false} labelLine={false} fontSize={10}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
