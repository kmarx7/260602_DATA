'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcMonthlyTrend, detectAnomalies } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'
import { AlertTriangle } from 'lucide-react'

export default function AnomalyFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const monthly = useMemo(() => calcMonthlyTrend(rows, config.dateCol, config.salesCol), [rows, config])
  const withAnomaly = useMemo(() => detectAnomalies(monthly), [monthly])

  const anomalies = withAnomaly.filter((m) => m.isAnomaly)
  const highAnomalies = anomalies.filter((m) => m.anomalyType === 'high')
  const lowAnomalies = anomalies.filter((m) => m.anomalyType === 'low')
  const upper = withAnomaly[0]?.upper ?? 0
  const lower = withAnomaly[0]?.lower ?? 0
  const mean = withAnomaly[0]?.mean ?? 0

  const insights = [
    `총 ${anomalies.length}건의 이상치 감지 (급등 ${highAnomalies.length}건, 급락 ${lowAnomalies.length}건)`,
    highAnomalies.length > 0 ? `급등 이상치: ${highAnomalies.map((m) => m.label).join(', ')}` : '급등 이상치 없음',
    lowAnomalies.length > 0 ? `급락 이상치: ${lowAnomalies.map((m) => m.label).join(', ')} — 원인 확인 필요` : '급락 이상치 없음',
    `정상 범위: ${fmtWon(Math.max(0, lower))} ~ ${fmtWon(upper)} (IQR ×1.5 기준)`,
  ]

  const chartData = withAnomaly.map((m) => ({
    label: m.label,
    value: m.total,
    anomalyHigh: m.anomalyType === 'high' ? m.total : null,
    anomalyLow: m.anomalyType === 'low' ? m.total : null,
    upper: m.upper,
    lower: Math.max(0, m.lower),
    mean: m.mean,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="총 이상치" value={`${anomalies.length}건`} sub={`전체 ${withAnomaly.length}개월 중`} color={anomalies.length > 0 ? 'amber' : 'green'} icon={<AlertTriangle className="w-5 h-5" />} />
        <KpiCard label="급등 이상치" value={`${highAnomalies.length}건`} color="blue" />
        <KpiCard label="급락 이상치" value={`${lowAnomalies.length}건`} color={lowAnomalies.length > 0 ? 'red' : 'green'} />
        <KpiCard label="정상 범위 상한" value={fmtWon(upper)} sub="IQR 기준" color="zinc" />
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">이상치 탐지 차트 (빨강=급락, 파랑=급등)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={Math.floor(chartData.length / 10)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
              <Tooltip formatter={(v, name) => [fmtWon(Number(v)), name === 'value' ? '월 매출' : name === 'upper' ? '상한' : name === 'lower' ? '하한' : name === 'mean' ? '평균' : '이상치']} />
              <ReferenceLine y={upper} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '상한', fontSize: 9, fill: '#94a3b8' }} />
              <ReferenceLine y={Math.max(0, lower)} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '하한', fontSize: 9, fill: '#94a3b8' }} />
              <ReferenceLine y={mean} stroke="#e2e8f0" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="월 매출" />
              <Scatter dataKey="anomalyHigh" fill="#3b82f6" name="급등" />
              <Scatter dataKey="anomalyLow" fill="#ef4444" name="급락" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {anomalies.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">이상치 목록</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-50 border-b">{['월','매출','유형','정상 범위 대비'].map((h) => <th key={h} className="px-4 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {anomalies.map((m) => (
                  <tr key={m.label} className={m.anomalyType === 'low' ? 'bg-red-50' : 'bg-blue-50'}>
                    <td className="px-4 py-2.5 font-medium">{m.label}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold">{fmtWon(m.total)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.anomalyType === 'low' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {m.anomalyType === 'low' ? '🔻 급락' : '🔺 급등'}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 tabular-nums text-sm font-medium ${m.anomalyType === 'low' ? 'text-red-600' : 'text-blue-600'}`}>
                      {m.anomalyType === 'low'
                        ? `하한(${fmtWon(Math.max(0, m.lower))}) 미달`
                        : `상한(${fmtWon(m.upper)}) 초과`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
