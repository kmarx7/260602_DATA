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

// ────────────────────────────────────────
// 분포 분석용 함수
// ────────────────────────────────────────

// 숫자 배열을 N개 구간으로 나눠 히스토그램 데이터 반환
export function buildHistogram(
  nums: number[],
  binCount = 20
): { bin: string; count: number; rangeStart: number; rangeEnd: number }[] {
  if (nums.length === 0) return []
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) return [{ bin: String(min), count: nums.length, rangeStart: min, rangeEnd: max }]

  const step = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    rangeStart: min + i * step,
    rangeEnd: min + (i + 1) * step,
    count: 0,
  }))

  for (const n of nums) {
    const idx = Math.min(Math.floor((n - min) / step), binCount - 1)
    bins[idx].count++
  }

  return bins.map((b) => ({
    bin: `${b.rangeStart.toLocaleString(undefined, { maximumFractionDigits: 1 })}~${b.rangeEnd.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
    count: b.count,
    rangeStart: b.rangeStart,
    rangeEnd: b.rangeEnd,
  }))
}

// 범주형 컬럼 빈도 데이터
export function buildFrequency(
  values: unknown[],
  topN = 20
): { value: string; count: number; rate: number }[] {
  const freq = new Map<string, number>()
  const nonNull = values.filter((v) => !isNullValue(v))
  for (const v of nonNull) {
    const key = String(v)
    freq.set(key, (freq.get(key) ?? 0) + 1)
  }
  const total = nonNull.length
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value, count]) => ({ value, count, rate: count / total }))
}

// 사분위수 계산 (박스플롯용)
export function calcQuantiles(nums: number[]): {
  min: number; q1: number; median: number; q3: number; max: number; mean: number; std: number
} {
  if (nums.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0, std: 0 }
  const sorted = [...nums].sort((a, b) => a - b)
  const n = sorted.length
  const q = (p: number) => {
    const idx = p * (n - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
  }
  const mean = calcMean(nums)
  const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  return { min: sorted[0], q1: q(0.25), median: q(0.5), q3: q(0.75), max: sorted[n - 1], mean, std: Math.sqrt(variance) }
}

// ────────────────────────────────────────
// 상관관계 분석용 함수
// ────────────────────────────────────────

// 피어슨 상관계수
export function pearsonCorr(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const meanA = calcMean(a.slice(0, n))
  const meanB = calcMean(b.slice(0, n))
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    const xa = a[i] - meanA
    const xb = b[i] - meanB
    num += xa * xb
    da += xa * xa
    db += xb * xb
  }
  const denom = Math.sqrt(da * db)
  return denom === 0 ? 0 : num / denom
}

// 수치형 컬럼만 필터링해서 상관행렬 계산
export function buildCorrelationMatrix(
  columns: string[],
  rows: Record<string, unknown>[],
  columnInfos: ColumnInfo[]
): { cols: string[]; matrix: number[][] } {
  const numericCols = columnInfos
    .filter((c) => c.type === 'numeric')
    .map((c) => c.name)
    .filter((name) => columns.includes(name))

  const vectors: Record<string, number[]> = {}
  for (const col of numericCols) {
    vectors[col] = rows
      .map((r) => r[col])
      .filter((v) => !isNullValue(v) && isNumeric(v))
      .map(Number)
  }

  const matrix = numericCols.map((colA) =>
    numericCols.map((colB) => {
      if (colA === colB) return 1
      const a = vectors[colA]
      const b = vectors[colB]
      const minLen = Math.min(a.length, b.length)
      return pearsonCorr(a.slice(0, minLen), b.slice(0, minLen))
    })
  )

  return { cols: numericCols, matrix }
}
