import { UploadCloud, BarChart2, GitBranch, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  requiresData: boolean
  href: string
}

export const menuItems: MenuItem[] = [
  {
    id: 'upload',
    label: '파일 업로드',
    icon: UploadCloud,
    requiresData: false,
    href: '/dashboard/upload',
  },
  {
    id: 'basic-analysis',
    label: '기본 데이터 분석',
    icon: BarChart2,
    requiresData: true,
    href: '/dashboard/analysis',
  },
  // 추후 메뉴 추가 예정
  // {
  //   id: 'correlation',
  //   label: '상관관계 분석',
  //   icon: GitBranch,
  //   requiresData: true,
  //   href: '/dashboard/correlation',
  // },
  // {
  //   id: 'distribution',
  //   label: '분포 분석',
  //   icon: TrendingUp,
  //   requiresData: true,
  //   href: '/dashboard/distribution',
  // },
]
