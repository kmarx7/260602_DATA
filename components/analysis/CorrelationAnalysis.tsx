'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildCorrelationMatrix } from '@/lib/analysis'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// 상관계수 → 셀 배경색
function corrColor(r: number): string {
  const abs = Math.abs(r)
  if (r >= 0) {
    if (abs > 0.8) return 'bg-blue-700 text-white'
    if (abs > 0.6) return 'bg-blue-500 text-white'
    if (abs > 0.4) return 'bg-blue-300 text-blue-900'
    if (abs > 0.2) return 'bg-blue-100 text-blue-800'
    return 'bg-zinc-50 text-zinc-500'
  } else {
    if (abs > 0.8) return 'bg-red-700 text-white'
    if (abs > 0.6) return 'bg-red-500 text-white'
    if (abs > 0.4) return 'bg-red-300 text-red-900'
    if (abs > 0.2) return 'bg-red-100 text-red-800'
    return 'bg-zinc-50 text-zinc-500'
  }
}

function corrLabel(r: number): string {
  const abs = Math.abs(r)
  const sign = r >= 0 ? '양의' : '음의'
  if (abs > 0.8) return `매우 강한 ${sign} 상관`
  if (abs > 0.6) return `강한 ${sign} 상관`
  if (abs > 0.4) return `중간 ${sign} 상관`
  if (abs > 0.2) return `약한 ${sign} 상관`
  return '거의 없음'
}

export default function CorrelationAnalysis() {
  const { columnInfos, columns, rows } = useDatasetStore()

  const { cols, matrix } = useMemo(
    () => buildCorrelationMatrix(columns, rows, columnInfos),
    [columns, rows, columnInfos]
  )

  // 상관계수 절댓값 기준 상위 쌍
  const topPairs = useMemo(() => {
    const pairs: { colA: string; colB: string; r: number }[] = []
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        pairs.push({ colA: cols[i], colB: cols[j], r: matrix[i][j] })
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 10)
  }, [cols, matrix])

  if (cols.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Minus className="w-12 h-12 text-zinc-300" />
          <p className="text-lg font-semibold text-zinc-500">수치형 컬럼이 2개 이상 필요합니다</p>
          <p className="text-sm text-zinc-400">현재 수치형(연속형) 컬럼: {cols.length}개</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* 범례 */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-zinc-500">
        <span className="font-medium text-zinc-600">범례:</span>
        {[
          { label: '강한 양의 상관', cls: 'bg-blue-600 text-white' },
          { label: '중간 양의 상관', cls: 'bg-blue-300 text-blue-900' },
          { label: '거의 없음', cls: 'bg-zinc-100 text-zinc-400' },
          { label: '중간 음의 상관', cls: 'bg-red-300 text-red-900' },
          { label: '강한 음의 상관', cls: 'bg-red-600 text-white' },
        ].map((item) => (
          <span key={item.label} className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.cls}`}>
            {item.label}
          </span>
        ))}
      </div>

      {/* 상관행렬 히트맵 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">
            상관관계 히트맵 (피어슨, 수치형 {cols.length}개 컬럼)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-32" />
                  {cols.map((col) => (
                    <th
                      key={col}
                      className="p-1 font-medium text-zinc-500 whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 120 }}
                      title={col}
                    >
                      <span className="block max-h-28 overflow-hidden text-ellipsis">{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cols.map((rowCol, i) => (
                  <tr key={rowCol}>
                    <td className="pr-2 py-0.5 font-medium text-zinc-600 whitespace-nowrap max-w-[120px]">
                      <span className="block truncate text-xs" title={rowCol}>{rowCol}</span>
                    </td>
                    {cols.map((_, j) => {
                      const r = matrix[i][j]
                      const isDiag = i === j
                      return (
                        <td
                          key={j}
                          className={`w-12 h-10 text-center align-middle font-mono transition-all cursor-default rounded-sm m-0.5 ${
                            isDiag ? 'bg-zinc-800 text-white' : corrColor(r)
                          }`}
                          title={isDiag ? rowCol : `${cols[i]} × ${cols[j]}: ${r.toFixed(3)} (${corrLabel(r)})`}
                        >
                          {isDiag ? '1.00' : r.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 상위 상관 쌍 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">상위 상관 컬럼 쌍 (절댓값 기준)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                {['순위', '컬럼 A', '컬럼 B', '상관계수', '강도', '방향'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topPairs.map(({ colA, colB, r }, idx) => (
                <tr key={`${colA}-${colB}`} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-800">{colA}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-800">{colB}</td>
                  <td className="px-4 py-2.5 tabular-nums font-mono font-semibold">
                    <span className={r > 0 ? 'text-blue-600' : r < 0 ? 'text-red-600' : 'text-zinc-400'}>
                      {r.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-zinc-100 w-20 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(r) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{(Math.abs(r) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 text-xs">
                      {r > 0.1 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      ) : r < -0.1 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span className={r > 0.1 ? 'text-blue-600' : r < -0.1 ? 'text-red-600' : 'text-zinc-400'}>
                        {corrLabel(r)}
                      </span>
                    </div>
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
