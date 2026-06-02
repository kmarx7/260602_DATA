'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { applyTreatments, previewTreatment, type ColumnTreatment, type TreatmentMethod } from '@/lib/treatment'
import { CheckCircle2, RotateCcw, Play, AlertTriangle } from 'lucide-react'

const METHOD_OPTIONS: { value: TreatmentMethod; label: string; forTypes: string[] }[] = [
  { value: 'none',        label: '변경 없음',       forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'drop_row',    label: '행 삭제',          forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'fill_mean',   label: '평균값 대체',      forTypes: ['numeric'] },
  { value: 'fill_median', label: '중앙값 대체',      forTypes: ['numeric'] },
  { value: 'fill_mode',   label: '최빈값 대체',      forTypes: ['categorical','datetime','unknown'] },
  { value: 'fill_custom', label: '직접 입력',        forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'drop_col',    label: '컬럼 삭제',        forTypes: ['numeric','categorical','datetime','unknown'] },
]

export default function MissingTreatment() {
  const { columnInfos, columns, rows, isTreated, applyTreatedData, resetToOriginal } = useDatasetStore()
  const router = useRouter()

  const colsWithNull = useMemo(() => columnInfos.filter((c) => c.nullCount > 0), [columnInfos])

  const [treatments, setTreatments] = useState<Record<string, ColumnTreatment>>(() =>
    Object.fromEntries(
      colsWithNull.map((c) => [c.name, { column: c.name, method: 'none' as TreatmentMethod, customValue: '' }])
    )
  )
  const [applied, setApplied] = useState(false)

  const preview = useMemo(() => {
    const list = Object.values(treatments).filter((t) => t.method !== 'none')
    if (list.length === 0) return null
    return previewTreatment(columns, rows, list)
  }, [treatments, columns, rows])

  function setMethod(col: string, method: TreatmentMethod) {
    setTreatments((prev) => ({ ...prev, [col]: { ...prev[col], method } }))
  }

  function setCustomValue(col: string, val: string) {
    setTreatments((prev) => ({ ...prev, [col]: { ...prev[col], customValue: val } }))
  }

  function handleApply() {
    const list = Object.values(treatments)
    const { columns: newCols, rows: newRows } = applyTreatments(columns, rows, list)
    applyTreatedData(newCols, newRows)
    setApplied(true)
  }

  function handleReset() {
    resetToOriginal()
    setApplied(false)
    setTreatments(
      Object.fromEntries(
        colsWithNull.map((c) => [c.name, { column: c.name, method: 'none' as TreatmentMethod, customValue: '' }])
      )
    )
  }

  if (colsWithNull.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
          <p className="text-lg font-semibold text-green-600">결측치가 없습니다!</p>
          <p className="text-sm text-zinc-400">처리할 결측치가 없어요. 바로 분석을 진행하세요.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 현재 상태 배너 */}
      {isTreated && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>처리가 적용됐습니다. 모든 분석 메뉴가 처리된 데이터 기준으로 동작합니다.</span>
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 text-xs text-green-600 hover:text-green-800 underline"
          >
            <RotateCcw className="w-3 h-3" /> 원본으로 되돌리기
          </button>
        </div>
      )}

      {/* 처리 선택 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-zinc-700">
            컬럼별 처리 방법 선택 — 결측치 있는 컬럼 {colsWithNull.length}개
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  {['컬럼명', '타입', '결측치 수', '결측치 비율', '처리 방법', '입력값'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {colsWithNull.map((col) => {
                  const t = treatments[col.name]
                  const availableMethods = METHOD_OPTIONS.filter((m) => m.forTypes.includes(col.type))
                  const rate = (col.nullRate * 100).toFixed(1)
                  const level = col.nullRate > 0.1 ? 'high' : col.nullRate > 0.01 ? 'mid' : 'low'
                  return (
                    <tr key={col.name} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-800 max-w-[140px]">
                        <span className="block truncate" title={col.name}>{col.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{col.type}</td>
                      <td className={`px-4 py-3 tabular-nums font-semibold ${level === 'high' ? 'text-red-600' : level === 'mid' ? 'text-amber-600' : 'text-zinc-500'}`}>
                        {col.nullCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium tabular-nums ${level === 'high' ? 'text-red-600' : level === 'mid' ? 'text-amber-600' : 'text-zinc-400'}`}>
                          {rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={t?.method ?? 'none'}
                          onChange={(e) => setMethod(col.name, e.target.value as TreatmentMethod)}
                          className="text-xs border border-zinc-300 rounded-md px-2 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {availableMethods.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {t?.method === 'fill_custom' ? (
                          <input
                            type="text"
                            placeholder="대체할 값 입력"
                            value={t.customValue ?? ''}
                            onChange={(e) => setCustomValue(col.name, e.target.value)}
                            className="text-xs border border-zinc-300 rounded-md px-2 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        ) : (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      {preview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">처리 결과 미리보기</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '처리 전 행 수', value: preview.beforeRows.toLocaleString(), sub: '행' },
                { label: '처리 후 행 수', value: preview.afterRows.toLocaleString(), sub: `${preview.beforeRows - preview.afterRows > 0 ? `▼ ${(preview.beforeRows - preview.afterRows).toLocaleString()}행 삭제` : '변화 없음'}` },
                { label: '처리 전 결측치', value: preview.beforeNulls.toLocaleString(), sub: '개' },
                { label: '처리 후 결측치', value: preview.afterNulls.toLocaleString(), sub: `${preview.beforeNulls - preview.afterNulls > 0 ? `▼ ${(preview.beforeNulls - preview.afterNulls).toLocaleString()}개 감소` : '변화 없음'}` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[10px] text-blue-500 mb-0.5">{item.label}</p>
                  <p className="text-xl font-bold text-blue-800">{item.value}</p>
                  <p className="text-[10px] text-blue-500">{item.sub}</p>
                </div>
              ))}
            </div>
            {preview.removedCols > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>컬럼 {preview.removedCols}개가 삭제됩니다.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 적용 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleApply}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          처리 적용하기
        </button>
        {applied && (
          <button
            onClick={() => router.push('/dashboard/analysis')}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            분석 화면으로 이동
          </button>
        )}
        {isTreated && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-zinc-300 text-zinc-600 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            원본으로 되돌리기
          </button>
        )}
      </div>
    </div>
  )
}
