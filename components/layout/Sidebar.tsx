'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { menuItems } from '@/config/menuConfig'
import { useDatasetStore } from '@/store/datasetStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const hasData = useDatasetStore((s) => s.fileName !== null)

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-zinc-900 text-zinc-100 transition-all duration-300 shrink-0',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* 로고 */}
      <div className={cn('flex items-center gap-2 px-4 py-5 border-b border-zinc-700', collapsed && 'justify-center px-0')}>
        <span className="text-blue-400 text-xl font-bold">📊</span>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-white">DataAnalyzer</span>
        )}
      </div>

      {/* 메뉴 목록 */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isDisabled = item.requiresData && !hasData
          const Icon = item.icon

          const inner = (
            <div
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive && !isDisabled
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </div>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger className="w-full">
                  {isDisabled ? (
                    <div>{inner}</div>
                  ) : (
                    <Link href={item.href}>{inner}</Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {isDisabled && ' (파일 업로드 필요)'}
                </TooltipContent>
              </Tooltip>
            )
          }

          return isDisabled ? (
            <div key={item.id}>{inner}</div>
          ) : (
            <Link key={item.id} href={item.href}>
              {inner}
            </Link>
          )
        })}
      </nav>

      {/* 접기/펼치기 버튼 */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-6 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-300 hover:bg-zinc-600 transition-colors"
        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
