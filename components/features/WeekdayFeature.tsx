'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcWeekdayPattern } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'

const COLORS = ['#f43f5e','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#3b82f6','#f97316']

export default function WeekdayFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const data = useMemo(() => calcWeekdayPattern(rows, config.dateCol, config.salesCol), [rows, config])
  const sorted = [...data].sort((a, b) => b.avg - a.avg)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const maxAvg = Math.max(...data.map((d) => d.avg))

  const insights = [
    `${best?.weekday}요일 매출이 가장 높습니다 (평균 ${fmtWon(best?.avg ?? 0)})`,
    `${worst?.weekday}요일 매출이 가장 낮습니다 (평균 ${fmtWon(worst?.avg ?? 0)})`,
    `최고-최저 요일 간 ${((( best?.avg - worst?.avg) / worst?.avg) * 100).toFixed(0)}% 차이`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="최고 매출 요일" value={`${best?.weekday}요일`} sub={fmtWon(best?.avg ?? 0)} color="blue" />
        <KpiCard label="최저 매출 요일" value={`${worst?.weekday}요일`} sub={fmtWon(worst?.avg ?? 0)} color="red" />
        <KpiCard label="주말 평균" value={fmtWon((data[0]?.avg + data[6]?.avg) / 2)} color="amber" />
        <KpiCard label="평일 평균" value={fmtWon(data.filter((d) => d.wd >= 1 && d.wd <= 5).reduce((s, d) => s + d.avg, 0) / 5)} color="green" />
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">요일별 평균 매출</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="weekday" tick={{ fontSize: 13 }} tickFormatter={(v) => `${v}요일`} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
              <Tooltip formatter={(v) => fmtWon(Number(v))} labelFormatter={(l) => `${l}요일`} />
              <Bar dataKey="avg" name="평균 매출" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={COLORS[d.wd]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">요일별 상세 통계</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b">{['요일','평균 매출','비율','데이터 수'].map((h) => <th key={h} className="px-4 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((d) => (
                <tr key={d.weekday} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5 font-medium">{d.weekday}요일</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold text-zinc-800">{fmtWon(d.avg)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-zinc-100 w-24 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.avg / maxAvg) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{((d.avg / maxAvg) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-500">{d.count.toLocaleString()}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
