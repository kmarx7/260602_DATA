import { isNullValue, isNumeric, calcQuantiles } from './analysis'

export type OutlierMethod = 'iqr' | 'zscore'
export type OutlierAction = 'none' | 'remove' | 'cap' | 'median'

export interface OutlierStat {
  column: string
  method: OutlierMethod
  outlierCount: number
  outlierRate: number
  lowerBound: number
  upperBound: number
  outlierIndices: number[]  // 전체 rows 기준 인덱스
  action: OutlierAction
}

function toNum(v: unknown): number | null {
  if (isNullValue(v) || !isNumeric(v)) return null
  return Number(v)
}

// IQR 경계 계산
function calcIQRBounds(nums: number[]): { lower: number; upper: number; q1: number; q3: number } {
  const q = calcQuantiles(nums)
  const iqr = q.q3 - q.q1
  return { lower: q.q1 - 1.5 * iqr, upper: q.q3 + 1.5 * iqr, q1: q.q1, q3: q.q3 }
}

// Z-score 경계 계산 (|z| > threshold)
function calcZScoreBounds(nums: number[], threshold = 3): { lower: number; upper: number; mean: number; std: number } {
  const q = calcQuantiles(nums)
  return {
    lower: q.mean - threshold * q.std,
    upper: q.mean + threshold * q.std,
    mean: q.mean,
    std: q.std,
  }
}

// 단일 컬럼 이상치 탐지
export function detectOutliers(
  rows: Record<string, unknown>[],
  column: string,
  method: OutlierMethod = 'iqr'
): Omit<OutlierStat, 'action'> {
  const values = rows.map((r, i) => ({ val: toNum(r[column]), idx: i }))
  const valid = values.filter((v) => v.val !== null) as { val: number; idx: number }[]

  if (valid.length < 4) {
    return { column, method, outlierCount: 0, outlierRate: 0, lowerBound: -Infinity, upperBound: Infinity, outlierIndices: [] }
  }

  const nums = valid.map((v) => v.val)
  const { lower, upper } =
    method === 'iqr' ? calcIQRBounds(nums) : calcZScoreBounds(nums)

  const outlierIndices = valid
    .filter((v) => v.val < lower || v.val > upper)
    .map((v) => v.idx)

  return {
    column, method,
    outlierCount: outlierIndices.length,
    outlierRate: outlierIndices.length / rows.length,
    lowerBound: lower,
    upperBound: upper,
    outlierIndices,
  }
}

// 전체 수치형 컬럼 이상치 탐지
export function detectAllOutliers(
  rows: Record<string, unknown>[],
  numericColumns: string[],
  method: OutlierMethod = 'iqr'
): OutlierStat[] {
  return numericColumns
    .map((col) => ({ ...detectOutliers(rows, col, method), action: 'none' as OutlierAction }))
    .filter((s) => s.outlierCount > 0)
    .sort((a, b) => b.outlierCount - a.outlierCount)
}

// 이상치 처리 적용
export function applyOutlierTreatment(
  rows: Record<string, unknown>[],
  stats: OutlierStat[]
): Record<string, unknown>[] {
  // remove: 이상치 행 인덱스 수집
  const removeIndices = new Set<number>()
  // cap / median: 컬럼별 처리 정보
  const capInfo = new Map<string, { lower: number; upper: number }>()
  const medianInfo = new Map<string, number>()

  for (const stat of stats) {
    if (stat.action === 'remove') {
      stat.outlierIndices.forEach((i) => removeIndices.add(i))
    } else if (stat.action === 'cap') {
      capInfo.set(stat.column, { lower: stat.lowerBound, upper: stat.upperBound })
    } else if (stat.action === 'median') {
      const vals = rows
        .map((r) => toNum(r[stat.column]))
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)
      medianInfo.set(stat.column, vals[Math.floor(vals.length / 2)] ?? 0)
    }
  }

  return rows
    .filter((_, i) => !removeIndices.has(i))
    .map((row) => {
      const newRow = { ...row }
      for (const [col, { lower, upper }] of capInfo.entries()) {
        const v = toNum(newRow[col])
        if (v !== null) {
          if (v < lower) newRow[col] = String(lower.toFixed(4))
          else if (v > upper) newRow[col] = String(upper.toFixed(4))
        }
      }
      for (const [col, med] of medianInfo.entries()) {
        const v = toNum(newRow[col])
        if (v !== null) {
          const stat = stats.find((s) => s.column === col)!
          if (v < stat.lowerBound || v > stat.upperBound) newRow[col] = String(med)
        }
      }
      return newRow
    })
}
