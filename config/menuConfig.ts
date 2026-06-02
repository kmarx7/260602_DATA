import { UploadCloud, BarChart2, GitBranch, TrendingUp, AlertTriangle, Wand2, Settings2, LayoutDashboard, Calendar, Layers, LineChart, ShoppingBag, MapPin, DollarSign, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  requiresData: boolean
  requiresConfig: boolean
  href: string
  group: string
}

export const menuItems: MenuItem[] = [
  // ── 데이터 ──────────────────────────────
  { id: 'upload',        label: '파일 업로드',      icon: UploadCloud,      requiresData: false, requiresConfig: false, href: '/dashboard/upload',        group: '데이터' },
  { id: 'config',        label: '컬럼 설정',         icon: Settings2,        requiresData: true,  requiresConfig: false, href: '/dashboard/config',        group: '데이터' },
  // ── 탐색 ──────────────────────────────
  { id: 'overview',      label: '대시보드 개요',     icon: LayoutDashboard,  requiresData: true,  requiresConfig: true,  href: '/dashboard/overview',      group: '탐색' },
  { id: 'analysis',      label: '기본 데이터 분석',  icon: BarChart2,        requiresData: true,  requiresConfig: false, href: '/dashboard/analysis',      group: '탐색' },
  { id: 'missing',       label: '결측치 분석',       icon: AlertTriangle,    requiresData: true,  requiresConfig: false, href: '/dashboard/missing',       group: '탐색' },
  // ── 처리 ──────────────────────────────
  { id: 'treatment',     label: '데이터 클리닝',      icon: Wand2,            requiresData: true,  requiresConfig: false, href: '/dashboard/treatment',     group: '처리' },
  // ── 10가지 분석 ──────────────────────
  { id: 'trends',        label: '월별·계절 트렌드',  icon: TrendingUp,       requiresData: true,  requiresConfig: true,  href: '/dashboard/trends',        group: '분석' },
  { id: 'weekday',       label: '요일별 패턴',       icon: Calendar,         requiresData: true,  requiresConfig: true,  href: '/dashboard/weekday',       group: '분석' },
  { id: 'segments',      label: '구간별 비교',       icon: Layers,           requiresData: true,  requiresConfig: true,  href: '/dashboard/segments',      group: '분석' },
  { id: 'forecast',      label: '매출 예측',         icon: LineChart,        requiresData: true,  requiresConfig: true,  href: '/dashboard/forecast',      group: '분석' },
  { id: 'anomaly',       label: '이상치 탐지',       icon: AlertTriangle,    requiresData: true,  requiresConfig: true,  href: '/dashboard/anomaly',       group: '분석' },
  { id: 'category',      label: '업종별 비교',       icon: ShoppingBag,      requiresData: true,  requiresConfig: true,  href: '/dashboard/category',      group: '분석' },
  { id: 'region',        label: '지역별 분포',       icon: MapPin,           requiresData: true,  requiresConfig: true,  href: '/dashboard/region',        group: '분석' },
  { id: 'cost-relation', label: '매출-비용 관계',    icon: DollarSign,       requiresData: true,  requiresConfig: true,  href: '/dashboard/cost-relation', group: '분석' },
  { id: 'cohort',        label: '연도별 성장률',     icon: GitBranch,        requiresData: true,  requiresConfig: true,  href: '/dashboard/cohort',        group: '분석' },
  // ── 출력 ──────────────────────────────
  { id: 'report',        label: '리포트 다운로드',   icon: FileText,         requiresData: true,  requiresConfig: true,  href: '/dashboard/report',        group: '출력' },
]
