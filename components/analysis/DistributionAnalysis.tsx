'use client'

import { useState, useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { buildHistogram, buildFrequency, calcQuantiles, isNullValue, isNumeric } from '@/lib/analysis'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']

function BoxPlotStats({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-700 tabular-nums">
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function DistributionAnalysis() {
  const { columnInfos, columns, rows } = useDatasetStore()
  const [selectedCol, setSelectedCol] = useState<string>(
    columnInfos.find((c) => c.type === 'numeric' || c.type === 'categorical')?.name ?? ''
  )

  const colInfo = useMemo(() => columnInfos.find((c) => c.name === selectedCol), [columnInfos, selectedCol])

  // 차트용 공통 구조: { label, count, rate?, meta }
  type ChartEntry = { label: string; count: number; rate?: number }

  const chartData = useMemo((): ChartEntry[] => {
    if (!selectedCol || !colInfo) return []
    const values = rows.map((r) => r[selectedCol])

    if (colInfo.type === 'numeric') {
      const nums = values.filter((v) => !isNullValue(v) && isNumeric(v)).map(Number)
      return buildHistogram(nums, 20).map((d) => ({ label: d.bin, count: d.count }))
    }
    if (colInfo.type === 'categorical') {
      return buildFrequency(values, 20).map((d) => ({ label: d.value, count: d.count, rate: d.rate }))
    }
    return []
  }, [selectedCol, colInfo, rows])

  const quantiles = useMemo(() => {
    if (!selectedCol || colInfo?.type !== 'numeric') return null
    const nums = rows
      .map((r) => r[selectedCol])
      .filter((v) => !isNullValue(v) && isNumeric(v))
      .map(Number)
    return calcQuantiles(nums)
  }, [selectedCol, colInfo, rows])

  const isNumericCol = colInfo?.type === 'numeric'
  const isCatCol = colInfo?.type === 'categorical'

  return (
    <div className="space-y-6">
      {/* 컬럼 선택 */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-2">분석할 컬럼 선택</label>
          <div className="flex flex-wrap gap-2">
            {columnInfos
              .filter((c) => c.type === 'numeric' || c.type === 'categorical')
              .map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCol(c.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCol === c.name
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 text-[10px] ${selectedCol === c.name ? 'opacity-80' : 'text-zinc-400'}`}>
                    {c.type === 'numeric' ? '연속형' : '범주형'}
                  </span>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {selectedCol && colInfo && (
        <>
          {/* 수치 통계 (연속형) */}
          {isNumericCol && quantiles && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-zinc-700">기술 통계량 — {selectedCol}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-4 py-2">
                  <BoxPlotStats label="최솟값" value={quantiles.min} />
                  <BoxPlotStats label="Q1 (25%)" value={quantiles.q1} />
                  <BoxPlotStats label="중앙값" value={quantiles.median} />
                  <BoxPlotStats label="평균" value={quantiles.mean} />
                  <BoxPlotStats label="Q3 (75%)" value={quantiles.q3} />
                  <BoxPlotStats label="최댓값" value={quantiles.max} />
                  <BoxPlotStats label="표준편차" value={quantiles.std} />
                </div>
                {/* 간단한 박스 시각화 */}
                <div className="mt-4 relative h-10">
                  <div className="absolute inset-y-3 left-0 right-0 bg-zinc-100 rounded" />
                  {(() => {
                    const range = quantiles.max - quantiles.min || 1
                    const pct = (v: number) => `${((v - quantiles.min) / range) * 100}%`
                    return (
                      <>
                        <div
                          className="absolute inset-y-2 bg-blue-200 border border-blue-400 rounded"
                          style={{ left: pct(quantiles.q1), right: `${100 - ((quantiles.q3 - quantiles.min) / range) * 100}%` }}
                        />
                        <div className="absolute inset-y-1 w-0.5 bg-blue-600" style={{ left: pct(quantiles.median) }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" style={{ left: pct(quantiles.mean) }} title="평균" />
                      </>
                    )
                  })()}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>최솟값</span><span>Q1</span><span>중앙값</span><span>평균 (●)</span><span>Q3</span><span>최댓값</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 분포 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-700">
                {isNumericCol ? `히스토그램 — ${selectedCol}` : `빈도 분포 — ${selectedCol}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">차트 데이터가 없습니다.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      interval={isNumericCol ? 1 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) => [
                        `${Number(val).toLocaleString()}건`,
                        isCatCol ? '빈도' : '개수',
                      ]}
                      labelFormatter={(label) => (isCatCol ? `값: ${label}` : `구간: ${label}`)}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={isNumericCol ? '#3b82f6' : COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 범주형 상위 값 테이블 */}
          {isCatCol && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-zinc-700">상위 빈도 값 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      {['순위', '값', '빈도 수', '비율'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {chartData.map((row, i) => (
                      <tr key={row.label} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 text-zinc-400 tabular-nums">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-zinc-800">{row.label}</td>
                        <td className="px-4 py-2 tabular-nums text-zinc-700">{row.count.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-blue-100 w-24 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(row.rate ?? 0) * 100}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-zinc-500">{((row.rate ?? 0) * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
