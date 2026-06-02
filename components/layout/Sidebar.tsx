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
  const isTreated = useDatasetStore((s) => s.isTreated)

  // 그룹별로 메뉴 묶기
  const groups = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    const g = item.group ?? '기타'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

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

      {/* 처리 상태 뱃지 */}
      {isTreated && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-1.5 bg-green-900/50 border border-green-700 rounded-lg text-[10px] text-green-400 text-center">
          ✓ 결측치 처리 적용됨
        </div>
      )}

      {/* 메뉴 목록 */}
      <nav className="flex-1 py-4 space-y-0 px-2 overflow-y-auto">
        {Object.entries(groups).map(([groupName, items], gIdx) => (
          <div key={groupName} className={gIdx > 0 ? 'mt-3 pt-3 border-t border-zinc-800' : ''}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                {groupName}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
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
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.id === 'treatment' && isTreated && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-700 text-green-200 rounded-full">완료</span>
                    )}
                  </div>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger className="w-full">
                        {isDisabled ? <div>{inner}</div> : <Link href={item.href}>{inner}</Link>}
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
                  <Link key={item.id} href={item.href}>{inner}</Link>
                )
              })}
            </div>
          </div>
        ))}
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
