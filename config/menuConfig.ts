import { UploadCloud, BarChart2, GitBranch, TrendingUp, AlertTriangle, Wand2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  requiresData: boolean
  href: string
  group?: string
}

export const menuItems: MenuItem[] = [
  {
    id: 'upload',
    label: '파일 업로드',
    icon: UploadCloud,
    requiresData: false,
    href: '/dashboard/upload',
    group: '데이터',
  },
  {
    id: 'basic-analysis',
    label: '기본 데이터 분석',
    icon: BarChart2,
    requiresData: true,
    href: '/dashboard/analysis',
    group: '탐색',
  },
  {
    id: 'missing',
    label: '결측치 분석',
    icon: AlertTriangle,
    requiresData: true,
    href: '/dashboard/missing',
    group: '탐색',
  },
  {
    id: 'treatment',
    label: '결측치 처리',
    icon: Wand2,
    requiresData: true,
    href: '/dashboard/treatment',
    group: '처리',
  },
  {
    id: 'distribution',
    label: '분포 분석',
    icon: TrendingUp,
    requiresData: true,
    href: '/dashboard/distribution',
    group: '분석',
  },
  {
    id: 'correlation',
    label: '상관관계 분석',
    icon: GitBranch,
    requiresData: true,
    href: '/dashboard/correlation',
    group: '분석',
  },
]
