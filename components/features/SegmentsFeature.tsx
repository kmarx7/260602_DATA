'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcSegments } from '@/lib/salesAnalysis'
import { KpiCard, InsightBox, fmtWon } from './shared'

export default function SegmentsFeature() {
  const { rows } = useDatasetStore()
  const { config } = useColumnConfigStore()
  if (!config) return null

  const seg = useMemo(() => calcSegments(rows, config.salesCol, config.categoryCol || undefined), [rows, config])

  const percentileData = [
    { label: 'P10', value: seg.q10 },
    { label: 'Q1 (P25)', value: seg.q25 },
    { label: '중앙값 (P50)', value: seg.q50 },
    { label: 'Q3 (P75)', value: seg.q75 },
    { label: 'P90', value: seg.q90 },
  ]

  const insights = [
    `상위 10% 평균은 하위 10% 평균의 ${seg.botAvg > 0 ? (seg.topAvg / seg.botAvg).toFixed(1) : '-'}배`,
    `전체 중앙값 ${fmtWon(seg.q50)} — 평균보다 낮으면 소수 고매출이 평균을 끌어올리는 구조`,
    `상위 10%(${seg.topCount}건)이 하위 10%(${seg.botCount}건)보다 ${fmtWon(seg.topAvg - seg.botAvg)} 더 높음`,
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {seg.segments.map((s) => (
          <KpiCard
            key={s.label}
            label={s.label}
            value={fmtWon(s.avg)}
            sub={`${s.count.toLocaleString()}건`}
            color={s.label.includes('상위') ? 'blue' : s.label.includes('하위') ? 'red' : 'zinc'}
          />
        ))}
      </div>

      <InsightBox items={insights} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">구간별 평균 매출 비교</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={seg.segments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
                <Bar dataKey="avg" name="평균 매출" radius={[6, 6, 0, 0]}>
                  {seg.segments.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-zinc-700">백분위 분포</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={percentileData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(v)} width={72} />
                <Tooltip formatter={(v) => fmtWon(Number(v))} />
                <Bar dataKey="value" name="매출" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
