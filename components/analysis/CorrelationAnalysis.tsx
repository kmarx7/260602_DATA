'use client'

import { useMemo, useState } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pearsonCorr, isNullValue, isNumeric } from '@/lib/analysis'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

type MissingStrategy = 'listwise' | 'pairwise'

// ── 상관계수 → 셀 색상 ──────────────────────────────────
function corrBg(r: number, isDiag: boolean): string {
  if (isDiag) return 'bg-zinc-800 text-white'
  const abs = Math.abs(r)
  if (r >= 0) {
    if (abs > 0.8) return 'bg-blue-700 text-white'
    if (abs > 0.6) return 'bg-blue-500 text-white'
    if (abs > 0.4) return 'bg-blue-300 text-blue-900'
    if (abs > 0.2) return 'bg-blue-100 text-blue-800'
    return 'bg-zinc-50 text-zinc-400'
  } else {
    if (abs > 0.8) return 'bg-red-700 text-white'
    if (abs > 0.6) return 'bg-red-500 text-white'
    if (abs > 0.4) return 'bg-red-300 text-red-900'
    if (abs > 0.2) return 'bg-red-100 text-red-800'
    return 'bg-zinc-50 text-zinc-400'
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

// t-검정으로 p-value 근사
function pValue(r: number, n: number): number {
  if (n <= 2) return 1
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r)
  // 자유도 n-2인 t분포 누적확률 근사 (양측)
  const x = (n - 2) / (n - 2 + t * t)
  // 불완전 베타함수 근사 (간단 버전)
  const a = (n - 2) / 2
  const b = 0.5
  const betaInc = x < 0.5
    ? Math.pow(x, a) * Math.pow(1 - x, b) / (a * (a + b))
    : 1 - Math.pow(1 - x, b) * Math.pow(x, a) / (b * (a + b))
  return Math.min(1, Math.max(0, betaInc))
}

export default function CorrelationAnalysis() {
  const { columnInfos, columns, rows, isTreated } = useDatasetStore()
  const [strategy, setStrategy] = useState<MissingStrategy>('pairwise')

  // 수치형 컬럼만
  const numericCols = useMemo(
    () => columnInfos.filter((c) => c.type === 'numeric').map((c) => c.name).filter((n) => columns.includes(n)),
    [columnInfos, columns]
  )

  // listwise: 어느 컬럼이든 null인 행 전체 제거
  const listwiseRows = useMemo(() => {
    if (strategy !== 'listwise') return rows
    return rows.filter((r) => numericCols.every((c) => !isNullValue(r[c]) && isNumeric(r[c])))
  }, [rows, numericCols, strategy])

  const effectiveRows = strategy === 'listwise' ? listwiseRows : rows
  const removedCount = rows.length - listwiseRows.length

  // 상관행렬 + p-value 계산
  const { matrix, sampleSizes } = useMemo(() => {
    const vecs: Record<string, number[]> = {}
    for (const col of numericCols) {
      vecs[col] = effectiveRows.map((r) => r[col]).filter((v) => !isNullValue(v) && isNumeric(v)).map(Number)
    }

    const n = numericCols.length
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
    const sizes: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) { matrix[i][j] = 1; sizes[i][j] = vecs[numericCols[i]].length; continue }

        if (strategy === 'pairwise') {
          // pairwise: 두 컬럼 모두 유효한 행만 사용
          const pairs = effectiveRows
            .map((r) => [Number(r[numericCols[i]]), Number(r[numericCols[j]])])
            .filter((p) => !isNaN(p[0]) && !isNaN(p[1]) && isFinite(p[0]) && isFinite(p[1]))
          const a = pairs.map((p) => p[0])
          const b = pairs.map((p) => p[1])
          matrix[i][j] = pearsonCorr(a, b)
          sizes[i][j] = pairs.length
        } else {
          const a = vecs[numericCols[i]]
          const b = vecs[numericCols[j]]
          const len = Math.min(a.length, b.length)
          matrix[i][j] = pearsonCorr(a.slice(0, len), b.slice(0, len))
          sizes[i][j] = len
        }
      }
    }
    return { matrix, sampleSizes: sizes }
  }, [numericCols, effectiveRows, strategy])

  // 상위 상관 쌍
  const topPairs = useMemo(() => {
    const pairs: { colA: string; colB: string; r: number; n: number; p: number }[] = []
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const r = matrix[i][j]
        const n = sampleSizes[i][j]
        pairs.push({ colA: numericCols[i], colB: numericCols[j], r, n, p: pValue(r, n) })
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 10)
  }, [numericCols, matrix, sampleSizes])

  if (numericCols.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Minus className="w-12 h-12 text-zinc-300" />
          <p className="text-lg font-semibold text-zinc-500">수치형 컬럼이 2개 이상 필요합니다</p>
          <p className="text-sm text-zinc-400">현재 수치형 컬럼: {numericCols.length}개</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 옵션 + 상태 */}
      <Card>
        <CardContent className="pt-5 pb-4 space-y-4">
          {/* 데이터 기준 */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-zinc-700">데이터 기준:</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isTreated ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-zinc-100 text-zinc-500'}`}>
              {isTreated ? '✓ 처리된 데이터 사용 중' : '원본 데이터 사용 중 (처리 권장)'}
            </div>
            {!isTreated && (
              <a href="/dashboard/treatment" className="text-xs text-blue-500 underline">결측치 처리하러 가기 →</a>
            )}
          </div>

          {/* 결측치 처리 전략 */}
          <div>
            <p className="text-sm font-semibold text-zinc-700 mb-2">결측치 처리 방식</p>
            <div className="flex gap-3">
              {([
                ['pairwise', '쌍별 완전 관측 (권장)', '두 컬럼 모두 값이 있는 행만 사용. 더 많은 데이터 활용 가능'],
                ['listwise', '목록별 완전 관측', '모든 컬럼에서 값이 있는 행만 사용. 결측치 많으면 데이터 손실 큼'],
              ] as const).map(([val, label, desc]) => (
                <button
                  key={val}
                  onClick={() => setStrategy(val)}
                  className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-xl border-2 text-left transition-colors ${strategy === val ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-400'}`}
                >
                  <span className={`text-sm font-semibold ${strategy === val ? 'text-blue-700' : 'text-zinc-700'}`}>{label}</span>
                  <span className="text-xs text-zinc-400">{desc}</span>
                </button>
              ))}
            </div>
            {strategy === 'listwise' && removedCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {removedCount.toLocaleString()}행이 제외됩니다 (전체 {rows.length.toLocaleString()}행 중 {((removedCount / rows.length) * 100).toFixed(1)}%).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 범례 */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-zinc-500">
        <span className="font-semibold text-zinc-600">색상 범례:</span>
        {[
          { label: '강한 양의 상관 (>0.6)', cls: 'bg-blue-500 text-white' },
          { label: '중간 양의 상관 (0.2~0.6)', cls: 'bg-blue-200 text-blue-900' },
          { label: '없음', cls: 'bg-zinc-100 text-zinc-400' },
          { label: '중간 음의 상관', cls: 'bg-red-200 text-red-900' },
          { label: '강한 음의 상관 (<-0.6)', cls: 'bg-red-500 text-white' },
        ].map((item) => (
          <span key={item.label} className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.cls}`}>{item.label}</span>
        ))}
      </div>

      {/* 히트맵 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">
            상관관계 히트맵 — 수치형 {numericCols.length}개 컬럼 ({strategy === 'pairwise' ? '쌍별' : '목록별'} 완전 관측)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-28" />
                  {numericCols.map((col) => (
                    <th
                      key={col}
                      className="p-1 font-medium text-zinc-500"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 120 }}
                      title={col}
                    >
                      <span className="block max-h-28 overflow-hidden text-ellipsis text-[10px]">{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numericCols.map((rowCol, i) => (
                  <tr key={rowCol}>
                    <td className="pr-2 py-0.5 font-medium text-zinc-600 text-[10px] whitespace-nowrap max-w-[100px]">
                      <span className="block truncate" title={rowCol}>{rowCol}</span>
                    </td>
                    {numericCols.map((_, j) => {
                      const r = matrix[i][j]
                      const isDiag = i === j
                      const n = sampleSizes[i][j]
                      const p = isDiag ? 0 : pValue(r, n)
                      const sig = p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : ''
                      return (
                        <td
                          key={j}
                          className={`w-12 h-10 text-center align-middle font-mono transition-all cursor-default rounded-sm m-0.5 ${corrBg(r, isDiag)}`}
                          title={isDiag ? rowCol : `${numericCols[i]} × ${numericCols[j]}\nr = ${r.toFixed(3)}\nn = ${n}\np ${p < 0.001 ? '< 0.001' : '= ' + p.toFixed(3)}\n${corrLabel(r)}`}
                        >
                          <div className="leading-tight">
                            <div>{isDiag ? '1.00' : r.toFixed(2)}</div>
                            {!isDiag && sig && <div className="text-[8px] opacity-80">{sig}</div>}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-zinc-400 mt-2">* p&lt;0.05 &nbsp; ** p&lt;0.01 &nbsp; *** p&lt;0.001 &nbsp;(통계적 유의성)</p>
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
                {['순위', '컬럼 A', '컬럼 B', '상관계수', '유의성 (p값)', '강도', '방향'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topPairs.map(({ colA, colB, r, n, p }, idx) => (
                <tr key={`${colA}-${colB}`} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-800 max-w-[120px]"><span className="block truncate" title={colA}>{colA}</span></td>
                  <td className="px-4 py-2.5 font-medium text-zinc-800 max-w-[120px]"><span className="block truncate" title={colB}>{colB}</span></td>
                  <td className="px-4 py-2.5 tabular-nums font-mono font-bold">
                    <span className={r > 0 ? 'text-blue-600' : r < 0 ? 'text-red-600' : 'text-zinc-400'}>{r.toFixed(3)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${p < 0.05 ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                      {p < 0.001 ? 'p < 0.001 ***' : p < 0.01 ? `p = ${p.toFixed(3)} **` : p < 0.05 ? `p = ${p.toFixed(3)} *` : `p = ${p.toFixed(3)} (비유의)`}
                    </span>
                    <span className="text-[10px] text-zinc-300 ml-1">n={n}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-zinc-100 w-16 overflow-hidden">
                        <div className={`h-full rounded-full ${r >= 0 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.abs(r) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{(Math.abs(r) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 text-xs">
                      {r > 0.1 ? <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> : r < -0.1 ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5 text-zinc-400" />}
                      <span className={r > 0.1 ? 'text-blue-600' : r < -0.1 ? 'text-red-600' : 'text-zinc-400'}>{corrLabel(r)}</span>
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
