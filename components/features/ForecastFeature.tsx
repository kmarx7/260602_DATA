'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcMonthlyTrend, calcMovingAvg, calcForecast } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function ForecastFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const monthly = useMemo(() => calcMonthlyTrend(rows, config.dateCol, config.salesCol), [rows, config])
  const withMA = useMemo(() => calcMovingAvg(monthly, 3), [monthly])
  const forecast = useMemo(() => calcForecast(withMA, 3), [withMA])

  const chartData = [
    ...withMA.map((m) => ({ label: m.label, actual: m.total, ma3: m.ma, forecast: null as number | null })),
    ...forecast.map((f) => ({ label: f.label, actual: null as number | null, ma3: null as number | null, forecast: f.forecast })),
  ]

  const lastActual = withMA[withMA.length - 1]
  const nextForecast = forecast[0]
  const growthRate = lastActual && nextForecast
    ? ((nextForecast.forecast! - lastActual.total) / lastActual.total) * 100
    : 0

  const insights = [
    `3개월 이동평균 기준 다음 달 예상 매출: ${fmtWon(nextForecast?.forecast ?? 0)}`,
    `현재 대비 ${growthRate >= 0 ? '▲' : '▼'} ${Math.abs(growthRate).toFixed(1)}% 예상`,
    `이동평균은 단기 추세를 반영하며, 계절성·이벤트는 반영되지 않습니다.`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {forecast.map((f, i) => (
          <KpiCard
            key={f.label}
            label={`${i + 1}개월 후 예측 (${f.label})`}
            value={fmtWon(f.forecast ?? 0)}
            color={i === 0 ? 'blue' : i === 1 ? 'purple' : 'zinc'}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        ))}
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">매출 추이 + 3개월 이동평균 + 예측</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" /> 실제 매출</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 inline-block" /> 3개월 이동평균</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 border-t-2 border-dashed border-orange-500 inline-block" /> 예측</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={Math.floor(chartData.length / 10)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
              <Tooltip formatter={(v, name) => [fmtWon(Number(v)), name === 'actual' ? '실제 매출' : name === 'ma3' ? '이동평균' : '예측']} />
              <ReferenceLine x={lastActual?.label} stroke="#d1d5db" strokeDasharray="4 4" label={{ value: '현재', fontSize: 10 }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls={false} name="actual" />
              <Line type="monotone" dataKey="ma3" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls={false} name="ma3" />
              <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: '#f97316', r: 4 }} connectNulls={false} name="forecast" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">예측 상세</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b">{['월','예측 매출','직전 실적 대비'].map((h) => <th key={h} className="px-4 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {forecast.map((f, i) => {
                const prev = i === 0 ? lastActual?.total : forecast[i - 1].forecast ?? 0
                const diff = f.forecast! - (prev ?? 0)
                const rate = prev ? (diff / prev) * 100 : 0
                return (
                  <tr key={f.label} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-800">{f.label}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-orange-600">{fmtWon(f.forecast ?? 0)}</td>
                    <td className={`px-4 py-3 tabular-nums text-sm font-medium ${rate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {rate >= 0 ? '▲' : '▼'} {Math.abs(rate).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
