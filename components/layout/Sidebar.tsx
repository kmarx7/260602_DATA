'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { menuItems } from '@/config/menuConfig'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const hasData = useDatasetStore((s) => s.fileName !== null)
  const isTreated = useDatasetStore((s) => s.isTreated)
  const hasConfig = useColumnConfigStore((s) => s.config !== null)

  const groups = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <aside className={cn(
      'relative flex flex-col h-full bg-zinc-900 text-zinc-100 transition-all duration-300 shrink-0',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* 로고 */}
      <div className={cn('flex items-center gap-2 px-4 py-4 border-b border-zinc-700/60', collapsed && 'justify-center px-0')}>
        <span className="text-xl">📊</span>
        {!collapsed && <span className="font-bold text-sm text-white tracking-tight">DataAnalyzer</span>}
      </div>

      {/* 상태 뱃지 */}
      {!collapsed && (
        <div className="px-3 pt-3 space-y-1.5">
          <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md ${hasData ? 'bg-green-900/40 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-green-400' : 'bg-zinc-600'}`} />
            {hasData ? '데이터 로드됨' : '데이터 없음'}
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md ${hasConfig ? 'bg-blue-900/40 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasConfig ? 'bg-blue-400' : 'bg-zinc-600'}`} />
            {hasConfig ? '컬럼 설정됨' : '컬럼 미설정'}
          </div>
          {isTreated && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md bg-amber-900/40 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              결측치 처리됨
            </div>
          )}
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {Object.entries(groups).map(([groupName, items], gIdx) => (
          <div key={groupName} className={gIdx > 0 ? 'mt-2 pt-2 border-t border-zinc-800/60' : ''}>
            {!collapsed && (
              <p className="px-4 py-1 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{groupName}</p>
            )}
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isDisabled = (item.requiresData && !hasData) || (item.requiresConfig && !hasConfig)
              const Icon = item.icon

              const inner = (
                <div className={cn(
                  'flex items-center gap-2.5 rounded-lg mx-2 px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
                  isDisabled && 'opacity-30 cursor-not-allowed pointer-events-none',
                  collapsed && 'justify-center mx-1 px-0'
                )}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
              )

              if (collapsed) return (
                <Tooltip key={item.id}>
                  <TooltipTrigger className="w-full block">
                    {isDisabled ? <div>{inner}</div> : <Link href={item.href}>{inner}</Link>}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                    {item.requiresData && !hasData && ' (파일 업로드 필요)'}
                    {item.requiresConfig && !hasConfig && hasData && ' (컬럼 설정 필요)'}
                  </TooltipContent>
                </Tooltip>
              )

              return isDisabled
                ? <div key={item.id}>{inner}</div>
                : <Link key={item.id} href={item.href}>{inner}</Link>
            })}
          </div>
        ))}
      </nav>

      {/* 접기 버튼 */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-700 border border-zinc-600 text-zinc-300 hover:bg-zinc-600 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
