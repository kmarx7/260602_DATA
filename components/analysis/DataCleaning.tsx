'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { applyTreatments, previewTreatment, type ColumnTreatment, type TreatmentMethod } from '@/lib/treatment'
import { detectAllOutliers, applyOutlierTreatment, type OutlierStat, type OutlierMethod, type OutlierAction } from '@/lib/outlier'
import { analyzeDataset } from '@/lib/analysis'
import { CheckCircle2, RotateCcw, Play, AlertTriangle, ChevronRight } from 'lucide-react'

// ── 탭 버튼 ────────────────────────────────────────────
function Tab({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ── 결측치 처리 탭 ──────────────────────────────────────
const MISSING_METHODS: { value: TreatmentMethod; label: string; desc: string; forTypes: string[] }[] = [
  { value: 'none',        label: '변경 없음',   desc: '그대로 유지',                    forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'drop_row',    label: '행 삭제',     desc: '해당 행 전체 제거',               forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'fill_mean',   label: '평균 대체',   desc: '컬럼 평균값으로 채움',            forTypes: ['numeric'] },
  { value: 'fill_median', label: '중앙값 대체', desc: '컬럼 중앙값으로 채움',            forTypes: ['numeric'] },
  { value: 'fill_mode',   label: '최빈값 대체', desc: '가장 많이 나오는 값으로 채움',    forTypes: ['categorical','datetime','unknown'] },
  { value: 'fill_custom', label: '직접 입력',   desc: '원하는 값으로 채움',              forTypes: ['numeric','categorical','datetime','unknown'] },
  { value: 'drop_col',    label: '컬럼 삭제',   desc: '결측 많은 컬럼 전체 제거',       forTypes: ['numeric','categorical','datetime','unknown'] },
]

function MissingTab({ onApply }: { onApply: (cols: string[], rows: Record<string, unknown>[]) => void }) {
  const { columnInfos, columns, rows, isTreated, resetToOriginal } = useDatasetStore()
  const colsWithNull = useMemo(() => columnInfos.filter((c) => c.nullCount > 0), [columnInfos])
  const [treatments, setTreatments] = useState<Record<string, ColumnTreatment>>(() =>
    Object.fromEntries(colsWithNull.map((c) => [c.name, { column: c.name, method: 'none' as TreatmentMethod, customValue: '' }]))
  )

  const preview = useMemo(() => {
    const list = Object.values(treatments).filter((t) => t.method !== 'none')
    return list.length > 0 ? previewTreatment(columns, rows, list) : null
  }, [treatments, columns, rows])

  if (colsWithNull.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-400" />
      <p className="text-lg font-semibold text-green-600">결측치가 없습니다</p>
      <p className="text-sm text-zinc-400">모든 컬럼의 데이터가 완전합니다.</p>
    </div>
  )

  function handleApply() {
    const list = Object.values(treatments)
    const { columns: nc, rows: nr } = applyTreatments(columns, rows, list)
    onApply(nc, nr)
  }

  return (
    <div className="space-y-5">
      {isTreated && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>결측치 처리가 적용됐습니다. 분석 메뉴가 처리된 데이터 기준으로 동작합니다.</span>
          <button onClick={resetToOriginal} className="ml-auto text-xs underline flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> 원본 복원
          </button>
        </div>
      )}

      {/* 컬럼별 처리 선택 */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b">
                {['컬럼명', '타입', '결측치', '비율', '처리 방법', '입력값'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {colsWithNull.map((col) => {
                const t = treatments[col.name]
                const rate = col.nullRate * 100
                const level = rate > 10 ? 'high' : rate > 1 ? 'mid' : 'low'
                const available = MISSING_METHODS.filter((m) => m.forTypes.includes(col.type))
                return (
                  <tr key={col.name} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-800 max-w-[140px]">
                      <span className="block truncate" title={col.name}>{col.name}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{col.type}</td>
                    <td className={`px-4 py-3 tabular-nums font-semibold ${level === 'high' ? 'text-red-600' : level === 'mid' ? 'text-amber-600' : 'text-zinc-500'}`}>
                      {col.nullCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${level === 'high' ? 'bg-red-500' : level === 'mid' ? 'bg-amber-400' : 'bg-slate-400'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                        </div>
                        <span className={`text-xs tabular-nums font-medium ${level === 'high' ? 'text-red-600' : level === 'mid' ? 'text-amber-600' : 'text-zinc-400'}`}>{rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={t?.method ?? 'none'}
                        onChange={(e) => setTreatments((p) => ({ ...p, [col.name]: { ...p[col.name], method: e.target.value as TreatmentMethod } }))}
                        className="text-xs border border-zinc-300 rounded-lg px-2 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {available.map((m) => (
                          <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {t?.method === 'fill_custom' ? (
                        <input
                          type="text"
                          placeholder="대체값 입력"
                          value={t.customValue ?? ''}
                          onChange={(e) => setTreatments((p) => ({ ...p, [col.name]: { ...p[col.name], customValue: e.target.value } }))}
                          className="text-xs border border-zinc-300 rounded-lg px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : <span className="text-xs text-zinc-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 미리보기 */}
      {preview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">처리 후 예상 결과</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: '처리 전 행', val: preview.beforeRows.toLocaleString() },
                { label: '처리 후 행', val: preview.afterRows.toLocaleString(), sub: preview.beforeRows - preview.afterRows > 0 ? `▼ ${(preview.beforeRows - preview.afterRows).toLocaleString()}행 삭제` : '' },
                { label: '처리 전 결측치', val: preview.beforeNulls.toLocaleString() },
                { label: '처리 후 결측치', val: preview.afterNulls.toLocaleString(), sub: `▼ ${(preview.beforeNulls - preview.afterNulls).toLocaleString()}개 감소` },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-blue-500">{item.label}</p>
                  <p className="text-xl font-bold text-blue-800">{item.val}</p>
                  {item.sub && <p className="text-[10px] text-blue-600">{item.sub}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <button
        onClick={handleApply}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Play className="w-4 h-4" /> 결측치 처리 적용
      </button>
    </div>
  )
}

// ── 이상치 처리 탭 ──────────────────────────────────────
const OUTLIER_ACTIONS: { value: OutlierAction; label: string; desc: string }[] = [
  { value: 'none',   label: '처리 안 함', desc: '이상치 그대로 유지' },
  { value: 'remove', label: '행 삭제',    desc: '이상치 포함 행 전체 제거' },
  { value: 'cap',    label: '경계값 대체', desc: '상·하한선 값으로 교체 (Winsorizing)' },
  { value: 'median', label: '중앙값 대체', desc: '컬럼 중앙값으로 교체' },
]

function OutlierTab({ onApply }: { onApply: (cols: string[], rows: Record<string, unknown>[]) => void }) {
  const { columnInfos, columns, rows } = useDatasetStore()
  const [method, setMethod] = useState<OutlierMethod>('iqr')
  const numericCols = useMemo(() => columnInfos.filter((c) => c.type === 'numeric').map((c) => c.name), [columnInfos])
  const detected = useMemo(() => detectAllOutliers(rows, numericCols, method), [rows, numericCols, method])
  const [stats, setStats] = useState<OutlierStat[]>([])

  function runDetection() {
    setStats(detected.map((d) => ({ ...d, action: 'none' })))
  }

  function setAction(col: string, action: OutlierAction) {
    setStats((prev) => prev.map((s) => s.column === col ? { ...s, action } : s))
  }

  function handleApply() {
    const toProcess = stats.filter((s) => s.action !== 'none')
    const newRows = applyOutlierTreatment(rows, toProcess)
    const newCols = columns
    onApply(newCols, newRows)
  }

  const totalOutliers = detected.reduce((s, d) => s + d.outlierCount, 0)
  const toRemoveRows = new Set(stats.filter((s) => s.action === 'remove').flatMap((s) => s.outlierIndices)).size

  return (
    <div className="space-y-5">
      {/* 탐지 방법 선택 */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-zinc-700 mb-2">탐지 방법</p>
              <div className="flex gap-3">
                {([['iqr', 'IQR (±1.5배)', 'Q1-1.5×IQR ~ Q3+1.5×IQR 범위 벗어난 값'], ['zscore', 'Z-score (±3σ)', '평균에서 3 표준편차 이상 벗어난 값']] as const).map(([val, label, desc]) => (
                  <button
                    key={val}
                    onClick={() => setMethod(val)}
                    className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-xl border-2 text-left transition-colors ${method === val ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-400'}`}
                  >
                    <span className={`text-sm font-semibold ${method === val ? 'text-blue-700' : 'text-zinc-700'}`}>{label}</span>
                    <span className="text-xs text-zinc-400">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={runDetection}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> 이상치 탐지 실행
            </button>
          </div>

          {numericCols.length === 0 && (
            <p className="mt-3 text-sm text-zinc-400">수치형 컬럼이 없습니다.</p>
          )}
          {numericCols.length > 0 && detected.length === 0 && (
            <p className="mt-3 text-sm text-zinc-500">위 버튼을 눌러 이상치를 탐지하세요.</p>
          )}
          {detected.length > 0 && stats.length === 0 && (
            <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <strong>{detected.length}개 컬럼</strong>에서 총 <strong>{totalOutliers}건</strong>의 이상치가 감지됐습니다. 탐지 결과를 아래에 로드하려면 다시 탐지 실행을 눌러주세요.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탐지 결과 + 처리 선택 */}
      {stats.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-700">
                이상치 탐지 결과 — {stats.length}개 컬럼, 총 {stats.reduce((s, d) => s + d.outlierCount, 0)}건
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b">
                    {['컬럼명', '이상치 수', '비율', '정상 범위', '처리 방법'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stats.map((s) => {
                    const rate = (s.outlierRate * 100).toFixed(1)
                    return (
                      <tr key={s.column} className={s.action !== 'none' ? 'bg-amber-50' : 'hover:bg-zinc-50'}>
                        <td className="px-4 py-3 font-medium text-zinc-800 max-w-[140px]">
                          <span className="block truncate" title={s.column}>{s.column}</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-bold text-amber-600">{s.outlierCount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(s.outlierRate * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs text-amber-600 font-medium tabular-nums">{rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-zinc-500">
                          {s.lowerBound.toLocaleString(undefined, { maximumFractionDigits: 1 })} ~ {s.upperBound.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {OUTLIER_ACTIONS.map((a) => (
                              <button
                                key={a.value}
                                onClick={() => setAction(s.column, a.value)}
                                title={a.desc}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                  s.action === a.value
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-zinc-600 border-zinc-300 hover:border-blue-400'
                                }`}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 미리보기 */}
          {stats.some((s) => s.action !== 'none') && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-bold text-amber-600 mb-3 uppercase tracking-wide">처리 후 예상 결과</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-amber-500">처리 전 행</p>
                    <p className="text-xl font-bold text-amber-800">{rows.length.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-500">삭제될 행</p>
                    <p className="text-xl font-bold text-amber-800">{toRemoveRows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-500">처리 후 행</p>
                    <p className="text-xl font-bold text-amber-800">{(rows.length - toRemoveRows).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <button
            onClick={handleApply}
            disabled={stats.every((s) => s.action === 'none')}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" /> 이상치 처리 적용
          </button>
        </>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────
export default function DataCleaning() {
  const [tab, setTab] = useState<'missing' | 'outlier'>('missing')
  const { columnInfos, applyTreatedData, resetToOriginal, isTreated, totalNulls } = useDatasetStore()
  const router = useRouter()
  const [applied, setApplied] = useState(false)

  const numericCols = columnInfos.filter((c) => c.type === 'numeric')
  const nullCols = columnInfos.filter((c) => c.nullCount > 0).length

  function handleApply(cols: string[], rows: Record<string, unknown>[]) {
    applyTreatedData(cols, rows)
    setApplied(true)
  }

  return (
    <div className="space-y-6">
      {/* 상단 상태 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '결측치 있는 컬럼', value: `${nullCols}개`, color: nullCols > 0 ? 'text-amber-600' : 'text-green-600', bg: nullCols > 0 ? 'bg-amber-50' : 'bg-green-50' },
          { label: '총 결측치', value: totalNulls.toLocaleString(), color: totalNulls > 0 ? 'text-red-600' : 'text-green-600', bg: totalNulls > 0 ? 'bg-red-50' : 'bg-green-50' },
          { label: '수치형 컬럼 (이상치 탐지 가능)', value: `${numericCols.length}개`, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl p-4 ${item.bg}`}>
            <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 처리 완료 → 다음 단계 버튼 */}
      {applied && (
        <button
          onClick={() => router.push('/dashboard/overview')}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
        >
          <div className="text-left">
            <p className="text-xs text-green-200 mb-0.5">✅ 클리닝 완료! 다음 단계</p>
            <p className="text-base font-bold">📊 분석 대시보드로 이동</p>
            <p className="text-xs text-green-200 mt-0.5">깨끗해진 데이터로 10가지 분석을 시작합니다</p>
          </div>
          <ChevronRight className="w-7 h-7 shrink-0" />
        </button>
      )}

      {/* 탭 */}
      <div className="border-b border-zinc-200 flex gap-0">
        <Tab label="결측치 처리" active={tab === 'missing'} onClick={() => setTab('missing')} badge={nullCols} />
        <Tab label="이상치 탐지·처리" active={tab === 'outlier'} onClick={() => setTab('outlier')} badge={numericCols.length} />
      </div>

      {tab === 'missing' && <MissingTab onApply={handleApply} />}
      {tab === 'outlier' && <OutlierTab onApply={handleApply} />}

      {/* 클리닝 없이 건너뛰기 */}
      {!applied && (
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-zinc-100" />
          <button
            onClick={() => router.push('/dashboard/overview')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors whitespace-nowrap"
          >
            클리닝 없이 바로 분석하기 <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>
      )}
    </div>
  )
}
