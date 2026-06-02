'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcSalesCostScatter } from '@/lib/salesAnalysis'
import { pearsonCorr } from '@/lib/analysis'
import { KpiCard, InsightBox, fmtWon } from './shared'

export default function CostRelationFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()

  if (!config?.costCol) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-4xl">💰</div>
        <p className="text-lg font-semibold text-zinc-500">비용 컬럼이 설정되지 않았습니다</p>
        <a href="/dashboard/config" className="text-blue-500 underline text-sm">컬럼 설정으로 이동</a>
      </div>
    )
  }

  const scatter = useMemo(() => calcSalesCostScatter(rows, config.salesCol, config.costCol!), [rows, config])
  const corr = useMemo(() => {
    const sales = scatter.map((d) => d.sales)
    const cost = scatter.map((d) => d.cost)
    return pearsonCorr(sales, cost)
  }, [scatter])

  const avgSales = scatter.reduce((s, d) => s + d.sales, 0) / scatter.length
  const avgCost = scatter.reduce((s, d) => s + d.cost, 0) / scatter.length
  const avgMargin = scatter.reduce((s, d) => s + (d.sales - d.cost), 0) / scatter.length

  const corrStrength = Math.abs(corr) > 0.8 ? '매우 강한' : Math.abs(corr) > 0.6 ? '강한' : Math.abs(corr) > 0.4 ? '중간' : '약한'
  const corrDir = corr > 0 ? '양의' : '음의'

  const insights = [
    `피어슨 상관계수 ${corr.toFixed(3)} — ${corrStrength} ${corrDir} 상관관계`,
    corr > 0.6 ? '비용이 증가할수록 매출도 증가하는 경향 (투자 효과 있음)' : corr < -0.3 ? '비용 증가 시 매출 하락 패턴 — 비용 구조 점검 필요' : '비용과 매출 간 뚜렷한 관계 없음',
    `평균 수익 마진: ${fmtWon(avgMargin)} (매출 - 비용)`,
  ]

  // 추세선용 데이터
  const minCost = Math.min(...scatter.map((d) => d.cost))
  const maxCost = Math.max(...scatter.map((d) => d.cost))
  const b1 = corr * (scatter.reduce((s, d) => s + (d.sales - avgSales) ** 2, 0) / scatter.length) / (scatter.reduce((s, d) => s + (d.cost - avgCost) ** 2, 0) / scatter.length)
  const b0 = avgSales - b1 * avgCost
  const trendLine = [
    { cost: minCost, trend: b0 + b1 * minCost },
    { cost: maxCost, trend: b0 + b1 * maxCost },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="상관계수" value={corr.toFixed(3)} sub={`${corrStrength} ${corrDir} 상관`} color={Math.abs(corr) > 0.6 ? 'blue' : 'zinc'} />
        <KpiCard label="평균 매출" value={fmtWon(avgSales)} color="green" />
        <KpiCard label="평균 비용" value={fmtWon(avgCost)} color="amber" />
        <KpiCard label="평균 마진" value={fmtWon(avgMargin)} color={avgMargin > 0 ? 'green' : 'red'} />
      </div>

      <InsightBox items={insights} />

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">매출 vs 비용 산점도</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="cost" name="비용" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} label={{ value: '비용', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis type="number" dataKey="sales" name="매출" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
              <Tooltip formatter={(v, name) => [fmtWon(Number(v)), name === 'cost' ? '비용' : '매출']} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatter} fill="#3b82f6" opacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
