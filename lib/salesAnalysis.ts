import { isNullValue, isNumeric } from './analysis'

export type Row = Record<string, unknown>

// 값을 숫자로 안전하게 변환 (콤마, 원 기호 등 제거)
export function toNum(val: unknown): number | null {
  if (isNullValue(val)) return null
  const s = String(val).replace(/[,₩\s원]/g, '')
  const n = Number(s)
  return isNaN(n) ? null : n
}

// 날짜 파싱 (다양한 한국 날짜 형식 처리)
export function toDate(val: unknown): Date | null {
  if (isNullValue(val)) return null
  const s = String(val).trim()
  // YYYY-MM, YYYY/MM, YYYY년MM월, YYYYMM 등 처리
  const normalized = s
    .replace(/년\s*/g, '-').replace(/월\s*/g, '').replace(/일/g, '')
    .replace(/\//g, '-')
  const d = new Date(normalized)
  if (!isNaN(d.getTime())) return d
  // YYYYMM 숫자 형식
  if (/^\d{6}$/.test(s)) {
    return new Date(parseInt(s.slice(0, 4)), parseInt(s.slice(4, 6)) - 1, 1)
  }
  return null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const SEASONS: Record<number, string> = { 1:'겨울', 2:'겨울', 3:'봄', 4:'봄', 5:'봄', 6:'여름', 7:'여름', 8:'여름', 9:'가을', 10:'가을', 11:'가을', 12:'겨울' }

// ── Feature 1: 월별·계절별 트렌드 ─────────────────────────
export function calcMonthlyTrend(rows: Row[], dateCol: string, salesCol: string) {
  const map = new Map<string, { sum: number; count: number; month: number; year: number }>()
  for (const row of rows) {
    const d = toDate(row[dateCol])
    const v = toNum(row[salesCol])
    if (!d || v === null) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = map.get(key) ?? { sum: 0, count: 0, month: d.getMonth() + 1, year: d.getFullYear() }
    map.set(key, { sum: cur.sum + v, count: cur.count + 1, month: cur.month, year: cur.year })
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { sum, count, month, year }]) => ({
      key, label: `${year}.${String(month).padStart(2, '0')}`,
      year, month, season: SEASONS[month],
      total: sum, avg: sum / count, count,
    }))
}

export function calcSeasonalAvg(monthly: ReturnType<typeof calcMonthlyTrend>) {
  const map = new Map<string, { sum: number; count: number }>()
  for (const r of monthly) {
    const cur = map.get(r.season) ?? { sum: 0, count: 0 }
    map.set(r.season, { sum: cur.sum + r.total, count: cur.count + 1 })
  }
  const order = ['봄', '여름', '가을', '겨울']
  return order.map((s) => ({ season: s, avg: (map.get(s)?.sum ?? 0) / (map.get(s)?.count ?? 1), count: map.get(s)?.count ?? 0 }))
}

// ── Feature 2: 요일별 패턴 ───────────────────────────────
export function calcWeekdayPattern(rows: Row[], dateCol: string, salesCol: string) {
  const map = new Map<number, { sum: number; count: number }>()
  for (let i = 0; i < 7; i++) map.set(i, { sum: 0, count: 0 })
  for (const row of rows) {
    const d = toDate(row[dateCol])
    const v = toNum(row[salesCol])
    if (!d || v === null) continue
    const wd = d.getDay()
    const cur = map.get(wd)!
    map.set(wd, { sum: cur.sum + v, count: cur.count + 1 })
  }
  return [...map.entries()].map(([wd, { sum, count }]) => ({
    weekday: WEEKDAYS[wd], wd, avg: count > 0 ? sum / count : 0, total: sum, count,
  }))
}

// ── Feature 3: 상위/하위 구간 비교 ───────────────────────
export function calcSegments(rows: Row[], salesCol: string, categoryCol?: string) {
  const valid = rows
    .map((r) => ({ val: toNum(r[salesCol]), category: categoryCol ? String(r[categoryCol] ?? '') : '전체' }))
    .filter((r) => r.val !== null) as { val: number; category: string }[]

  const sorted = [...valid].sort((a, b) => a.val - b.val)
  const n = sorted.length
  const q = (p: number) => sorted[Math.floor(p * n)]?.val ?? 0

  const top10 = sorted.slice(-Math.ceil(n * 0.1))
  const bot10 = sorted.slice(0, Math.ceil(n * 0.1))
  const mid80 = sorted.slice(Math.ceil(n * 0.1), -Math.ceil(n * 0.1))

  const avg = (arr: typeof sorted) => arr.reduce((s, r) => s + r.val, 0) / (arr.length || 1)

  return {
    q10: q(0.1), q25: q(0.25), q50: q(0.5), q75: q(0.75), q90: q(0.9),
    topAvg: avg(top10), botAvg: avg(bot10), midAvg: avg(mid80),
    topCount: top10.length, botCount: bot10.length, midCount: mid80.length,
    segments: [
      { label: '상위 10%', avg: avg(top10), count: top10.length, color: '#3b82f6' },
      { label: '중위 80%', avg: avg(mid80), count: mid80.length, color: '#94a3b8' },
      { label: '하위 10%', avg: avg(bot10), count: bot10.length, color: '#f87171' },
    ],
  }
}

// ── Feature 4: 이동평균 예측 ─────────────────────────────
export function calcMovingAvg(monthly: ReturnType<typeof calcMonthlyTrend>, window = 3) {
  return monthly.map((m, i) => {
    const slice = monthly.slice(Math.max(0, i - window + 1), i + 1)
    const ma = slice.reduce((s, r) => s + r.total, 0) / slice.length
    return { ...m, ma }
  })
}

export function calcForecast(withMA: ReturnType<typeof calcMovingAvg>, months = 3) {
  const last = withMA[withMA.length - 1]
  const recent = withMA.slice(-6)
  const growth = recent.length > 1
    ? (recent[recent.length - 1].total - recent[0].total) / (recent[0].total * (recent.length - 1))
    : 0

  const forecast = []
  let prevTotal = last.total
  for (let i = 1; i <= months; i++) {
    const d = new Date(last.year, last.month - 1 + i, 1)
    prevTotal = prevTotal * (1 + growth)
    forecast.push({
      key: `forecast-${i}`,
      label: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      total: null as number | null,
      ma: null as number | null,
      forecast: Math.max(0, prevTotal),
      year: d.getFullYear(), month: d.getMonth() + 1,
    })
  }
  return forecast
}

// ── Feature 5: 이상치 탐지 ──────────────────────────────
export function detectAnomalies(monthly: ReturnType<typeof calcMonthlyTrend>) {
  const vals = monthly.map((m) => m.total)
  const sorted = [...vals].sort((a, b) => a - b)
  const n = sorted.length
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.floor(n * 0.75)]
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr
  const mean = vals.reduce((s, v) => s + v, 0) / n

  return monthly.map((m) => ({
    ...m,
    isAnomaly: m.total < lower || m.total > upper,
    anomalyType: m.total > upper ? 'high' : m.total < lower ? 'low' : 'normal',
    lower, upper, mean,
  }))
}

// ── Feature 6: 업종별 비교 ──────────────────────────────
export function calcCategoryStats(rows: Row[], salesCol: string, categoryCol: string) {
  const map = new Map<string, { sum: number; count: number; vals: number[] }>()
  for (const row of rows) {
    const cat = String(row[categoryCol] ?? '미분류').trim()
    const v = toNum(row[salesCol])
    if (v === null || cat === '') continue
    const cur = map.get(cat) ?? { sum: 0, count: 0, vals: [] }
    cur.vals.push(v)
    map.set(cat, { sum: cur.sum + v, count: cur.count + 1, vals: cur.vals })
  }
  return [...map.entries()]
    .map(([cat, { sum, count, vals }]) => {
      const sorted = [...vals].sort((a, b) => a - b)
      return {
        category: cat, total: sum, count,
        avg: sum / count,
        median: sorted[Math.floor(sorted.length / 2)],
        max: sorted[sorted.length - 1],
        min: sorted[0],
      }
    })
    .sort((a, b) => b.total - a.total)
}

// ── Feature 7: 지역별 분포 ──────────────────────────────
export function calcRegionStats(rows: Row[], salesCol: string, regionCol: string) {
  return calcCategoryStats(rows, salesCol, regionCol)
}

// ── Feature 8: 매출-비용 상관관계 ───────────────────────
export function calcSalesCostScatter(rows: Row[], salesCol: string, costCol: string) {
  return rows
    .map((r) => ({ sales: toNum(r[salesCol]), cost: toNum(r[costCol]) }))
    .filter((r) => r.sales !== null && r.cost !== null) as { sales: number; cost: number }[]
}

// ── Feature 9: 연도별 성장률 코호트 ─────────────────────
export function calcYearlyCohort(rows: Row[], dateCol: string, salesCol: string) {
  const map = new Map<number, { sum: number; count: number }>()
  for (const row of rows) {
    const d = toDate(row[dateCol])
    const v = toNum(row[salesCol])
    if (!d || v === null) continue
    const yr = d.getFullYear()
    const cur = map.get(yr) ?? { sum: 0, count: 0 }
    map.set(yr, { sum: cur.sum + v, count: cur.count + 1 })
  }
  const years = [...map.entries()].sort(([a], [b]) => a - b)
  return years.map(([year, { sum, count }], i) => {
    const prev = i > 0 ? years[i - 1][1].sum : null
    const growth = prev !== null && prev > 0 ? ((sum - prev) / prev) * 100 : null
    return { year, total: sum, avg: sum / count, count, growth }
  })
}
