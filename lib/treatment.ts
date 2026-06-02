import { isNullValue, calcMean, calcQuantiles } from './analysis'

export type TreatmentMethod =
  | 'none'         // 변경 없음
  | 'drop_row'     // 행 삭제
  | 'fill_mean'    // 평균값 대체 (수치형)
  | 'fill_median'  // 중앙값 대체 (수치형)
  | 'fill_mode'    // 최빈값 대체 (범주형)
  | 'fill_custom'  // 직접 입력값 대체
  | 'drop_col'     // 컬럼 삭제

export interface ColumnTreatment {
  column: string
  method: TreatmentMethod
  customValue?: string
}

function calcMode(values: unknown[]): string {
  const freq = new Map<string, number>()
  for (const v of values) {
    if (!isNullValue(v)) {
      const k = String(v)
      freq.set(k, (freq.get(k) ?? 0) + 1)
    }
  }
  if (freq.size === 0) return ''
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export function applyTreatments(
  columns: string[],
  rows: Record<string, unknown>[],
  treatments: ColumnTreatment[]
): { columns: string[]; rows: Record<string, unknown>[] } {
  const treatmentMap = new Map(treatments.map((t) => [t.column, t]))

  // 1단계: 컬럼 삭제 목록
  const dropCols = new Set(
    treatments.filter((t) => t.method === 'drop_col').map((t) => t.column)
  )
  const remainingCols = columns.filter((c) => !dropCols.has(c))

  // 2단계: 컬럼별 대체값 사전 계산
  const fillValues = new Map<string, string>()
  for (const t of treatments) {
    if (t.method === 'none' || t.method === 'drop_row' || t.method === 'drop_col') continue
    const colValues = rows.map((r) => r[t.column])
    const nonNull = colValues.filter((v) => !isNullValue(v))

    if (t.method === 'fill_mean') {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n))
      fillValues.set(t.column, String(calcMean(nums).toFixed(4)))
    } else if (t.method === 'fill_median') {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b)
      const q = calcQuantiles(nums)
      fillValues.set(t.column, String(q.median.toFixed(4)))
    } else if (t.method === 'fill_mode') {
      fillValues.set(t.column, calcMode(colValues))
    } else if (t.method === 'fill_custom') {
      fillValues.set(t.column, t.customValue ?? '')
    }
  }

  // 3단계: 행 필터링 (drop_row 처리)
  const dropRowCols = treatments.filter((t) => t.method === 'drop_row').map((t) => t.column)
  let processedRows = rows.filter((row) =>
    !dropRowCols.some((col) => isNullValue(row[col]))
  )

  // 4단계: 값 대체
  processedRows = processedRows.map((row) => {
    const newRow = { ...row }
    for (const [col, fillVal] of fillValues.entries()) {
      if (isNullValue(newRow[col])) {
        newRow[col] = fillVal
      }
    }
    return newRow
  })

  // 5단계: 삭제된 컬럼 제거
  const finalRows = processedRows.map((row) => {
    const newRow: Record<string, unknown> = {}
    for (const col of remainingCols) newRow[col] = row[col]
    return newRow
  })

  return { columns: remainingCols, rows: finalRows }
}

// 처리 결과 미리보기 통계
export function previewTreatment(
  columns: string[],
  rows: Record<string, unknown>[],
  treatments: ColumnTreatment[]
): { beforeRows: number; afterRows: number; beforeNulls: number; afterNulls: number; removedCols: number } {
  const beforeRows = rows.length
  const beforeNulls = columns.reduce(
    (s, col) => s + rows.filter((r) => isNullValue(r[col])).length, 0
  )

  const { columns: newCols, rows: newRows } = applyTreatments(columns, rows, treatments)
  const afterRows = newRows.length
  const afterNulls = newCols.reduce(
    (s, col) => s + newRows.filter((r) => isNullValue(r[col])).length, 0
  )
  const removedCols = columns.length - newCols.length

  return { beforeRows, afterRows, beforeNulls, afterNulls, removedCols }
}
