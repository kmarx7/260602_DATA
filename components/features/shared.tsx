'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── KPI 카드 ────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: number        // % 증감
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'zinc'
  icon?: React.ReactNode
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100 text-blue-600' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-100 text-green-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'bg-red-100 text-red-600' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'bg-amber-100 text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
  zinc:   { bg: 'bg-zinc-50',   text: 'text-zinc-700',   icon: 'bg-zinc-100 text-zinc-500' },
}

export function KpiCard({ label, value, sub, trend, color = 'blue', icon }: KpiCardProps) {
  const c = COLOR_MAP[color]
  return (
    <div className={`rounded-2xl p-5 ${c.bg} border border-white shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 mb-1.5">{label}</p>
          <p className={`text-2xl font-bold ${c.text} truncate`}>{value}</p>
          {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% 전년 대비
            </div>
          )}
        </div>
        {icon && <div className={`p-2.5 rounded-xl shrink-0 ${c.icon}`}>{icon}</div>}
      </div>
    </div>
  )
}

// ── 섹션 헤더 ────────────────────────────────────────────
export function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-zinc-800">{title}</h2>
      {desc && <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>}
    </div>
  )
}

// ── 인사이트 박스 ─────────────────────────────────────────
export function InsightBox({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">💡 핵심 인사이트</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-blue-800 flex gap-2">
            <span className="text-blue-400 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── 데이터/설정 없을 때 가드 ──────────────────────────────
export function NoDataGuard() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
      <div className="text-5xl">📂</div>
      <h2 className="text-xl font-bold text-zinc-600">데이터가 없습니다</h2>
      <Link href="/dashboard/upload" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">파일 업로드하기</Link>
    </div>
  )
}

export function NoConfigGuard() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
      <div className="text-5xl">⚙️</div>
      <h2 className="text-xl font-bold text-zinc-600">컬럼 설정이 필요합니다</h2>
      <p className="text-sm text-zinc-400">어떤 컬럼이 날짜이고, 매출인지 먼저 알려주세요.</p>
      <Link href="/dashboard/config" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">컬럼 설정하기</Link>
    </div>
  )
}

// ── 숫자 포맷 헬퍼 ───────────────────────────────────────
export function fmtNum(n: number, digits = 0): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(digits === 0 ? 1 : digits)}백만`
  if (Math.abs(n) >= 10_000) return `${(n / 10_000).toFixed(digits === 0 ? 1 : digits)}만`
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

export function fmtWon(n: number): string {
  if (Math.abs(n) >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`
  if (Math.abs(n) >= 10_000) return `${(n / 10_000).toFixed(1)}만원`
  return `${n.toLocaleString('ko-KR')}원`
}
