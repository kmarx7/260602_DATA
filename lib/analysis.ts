import type { ColumnInfo, ColumnType } from '@/types/dataset'

// 값이 비어 있는지 판별
export function isNullValue(val: unknown): boolean {
  return val === null || val === undefined || val === '' || (typeof val === 'string' && val.trim() === '')
}

// 값이 숫자로 변환 가능한지 판별
export function isNumeric(val: unknown): boolean {
  if (isNullValue(val)) return false
  const n = Number(val)
  return !isNaN(n) && isFinite(n)
}

// ISO 날짜 문자열 또는 날짜처럼 보이는 문자열인지 판별
export function isDateLike(val: unknown): boolean {
  if (isNullValue(val) || typeof val === 'number') return false
  const str = String(val).trim()
  // YYYY-MM-DD, YYYY/MM/DD, DD.MM.YYYY, 한국식 YYYY년MM월DD일 등
  const patterns = [
    /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
    /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/,
    /^\d{4}년\s*\d{1,2}월/,
  ]
  if (!patterns.some((p) => p.test(str))) return false
  const d = new Date(str)
  return !isNaN(d.getTime())
}

// 컬럼 타입 판별 (순수 함수 — 나중에 임곗값 조정 가능)
export function detectColumnType(
  values: unknown[],
  opts = { numericThreshold: 0.8, dateThreshold: 0.8, categoricalMaxRatio: 0.5, categoricalMaxAbs: 30 }
): ColumnType {
  const nonNull = values.filter((v) => !isNullValue(v))
  if (nonNull.length === 0) return 'unknown'

  const numericCount = nonNull.filter(isNumeric).length
  if (numericCount / nonNull.length >= opts.numericThreshold) return 'numeric'

  const dateCount = nonNull.filter(isDateLike).length
  if (dateCount / nonNull.length >= opts.dateThreshold) return 'datetime'

  const uniqueCount = new Set(nonNull.map(String)).size
  if (
    uniqueCount / values.length <= opts.categoricalMaxRatio ||
    uniqueCount <= opts.categoricalMaxAbs
  )
    return 'categorical'

  return 'categorical'
}

// 평균 계산
export function calcMean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// 상위 N개 고유값 반환 (빈도순)
export function topNValues(values: unknown[], n = 5): string[] {
  const freq = new Map<string, number>()
  for (const v of values) {
    if (!isNullValue(v)) {
      const key = String(v)
      freq.set(key, (freq.get(key) ?? 0) + 1)
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}

// 컬럼 하나에 대한 전체 통계 계산 (순수 함수)
export function analyzeColumn(name: string, values: unknown[]): ColumnInfo {
  const nullCount = values.filter(isNullValue).length
  const nullRate = values.length > 0 ? nullCount / values.length : 0
  const nonNull = values.filter((v) => !isNullValue(v))
  const uniqueCount = new Set(nonNull.map(String)).size
  const samples = nonNull.slice(0, 5).map(String)

  const type = detectColumnType(values)

  const base = { name, type, uniqueCount, nullCount, nullRate, samples }

  if (type === 'numeric') {
    const nums = nonNull.map(Number)
    return {
      ...base,
      min: Math.min(...nums),
      max: Math.max(...nums),
      mean: calcMean(nums),
    }
  }

  if (type === 'categorical') {
    return {
      ...base,
      topValues: topNValues(values, 5),
    }
  }

  if (type === 'datetime') {
    const dates = nonNull.map((v) => new Date(String(v))).filter((d) => !isNaN(d.getTime()))
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    return {
      ...base,
      dateMin: sorted[0]?.toLocaleDateString('ko-KR'),
      dateMax: sorted[sorted.length - 1]?.toLocaleDateString('ko-KR'),
    }
  }

  return base
}

// 전체 데이터셋에 대해 모든 컬럼 분석
export function analyzeDataset(
  columns: string[],
  rows: Record<string, unknown>[]
): ColumnInfo[] {
  return columns.map((col) => {
    const values = rows.map((row) => row[col])
    return analyzeColumn(col, values)
  })
}
