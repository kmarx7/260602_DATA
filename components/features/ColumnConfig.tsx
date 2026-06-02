'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore, type ColumnConfig } from '@/store/columnConfigStore'
import { CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react'

// 역할 정의
const ROLES = [
  { key: 'dateCol',     label: '📅 날짜',  color: 'bg-blue-500',   light: 'bg-blue-50 border-blue-300 text-blue-700',   desc: '연도·월·날짜 정보' },
  { key: 'salesCol',   label: '💰 매출',  color: 'bg-green-500',  light: 'bg-green-50 border-green-300 text-green-700', desc: '매출액·거래금액', required: true },
  { key: 'categoryCol',label: '🏪 업종',  color: 'bg-purple-500', light: 'bg-purple-50 border-purple-300 text-purple-700',desc: '업종·카테고리' },
  { key: 'regionCol',  label: '📍 지역',  color: 'bg-orange-500', light: 'bg-orange-50 border-orange-300 text-orange-700',desc: '지역·시군구' },
  { key: 'costCol',    label: '🧾 비용',  color: 'bg-red-500',    light: 'bg-red-50 border-red-300 text-red-700',       desc: '지출·비용' },
] as const

type RoleKey = typeof ROLES[number]['key']

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.key, r])) as Record<RoleKey, typeof ROLES[number]>

function isEmptyVal(v: unknown) {
  return v === null || v === undefined || v === ''
}

export default function ColumnConfig() {
  const { columns, rows, columnInfos } = useDatasetStore()
  const { setConfig } = useColumnConfigStore()
  const router = useRouter()

  // 자동 추천: 타입 기반
  const autoSuggest = useMemo(() => {
    const dateCol = columnInfos.find((c) => c.type === 'datetime')?.name ?? ''
    const numericCols = columnInfos.filter((c) => c.type === 'numeric').map((c) => c.name)
    const catCols = columnInfos.filter((c) => c.type === 'categorical').map((c) => c.name)
    return {
      dateCol,
      salesCol: numericCols[0] ?? '',
      costCol: numericCols[1] ?? '',
      categoryCol: catCols[0] ?? '',
      regionCol: catCols[1] ?? '',
    }
  }, [columnInfos])

  const [mapping, setMapping] = useState<Record<RoleKey, string>>(autoSuggest as Record<RoleKey, string>)
  const [activeRole, setActiveRole] = useState<RoleKey | null>(null)

  const previewRows = rows.slice(0, 5)
  const canProceed = !!mapping.dateCol && !!mapping.salesCol

  // 컬럼에 할당된 역할 반환
  function getRoleForCol(col: string): (typeof ROLES)[number] | null {
    const entry = (Object.entries(mapping) as [RoleKey, string][]).find(([, v]) => v === col)
    return entry ? ROLE_MAP[entry[0]] : null
  }

  function assignRole(col: string) {
    if (!activeRole) return
    // 이미 다른 컬럼에 같은 역할이 있으면 해제
    setMapping((prev) => {
      const next = { ...prev }
      // 기존에 이 역할 갖고 있던 컬럼 해제
      if (next[activeRole] === col) {
        next[activeRole] = '' // 토글: 같은 컬럼 클릭하면 해제
      } else {
        next[activeRole] = col
      }
      return next
    })
    setActiveRole(null)
  }

  function clearRole(role: RoleKey) {
    setMapping((prev) => ({ ...prev, [role]: '' }))
  }

  function handleApply() {
    if (!canProceed) return
    setConfig(mapping as ColumnConfig)
    router.push('/dashboard/overview')
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* 헤더 안내 */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
        <h2 className="text-base font-bold text-blue-800 mb-1">분석할 컬럼을 지정해주세요</h2>
        <p className="text-sm text-blue-600">
          아래 표에서 실제 데이터를 보면서 각 컬럼이 무엇인지 알려주세요.
          <br />
          <span className="font-semibold">① 역할 버튼 클릭 → ② 해당 컬럼 헤더 클릭</span> 순서로 선택합니다.
        </p>
      </div>

      {/* 역할 선택 버튼 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">① 먼저 역할을 선택하세요</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const assigned = mapping[role.key]
            const isActive = activeRole === role.key
            return (
              <button
                key={role.key}
                onClick={() => setActiveRole(isActive ? null : role.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  isActive
                    ? `${role.color} text-white border-transparent scale-105 shadow-md`
                    : assigned
                    ? `${role.light} border-current`
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <span>{role.label}</span>
                {assigned ? (
                  <span className="flex items-center gap-1 text-xs opacity-80">
                    → {assigned}
                    <span
                      onClick={(e) => { e.stopPropagation(); clearRole(role.key) }}
                      className="ml-1 hover:opacity-60 cursor-pointer font-bold"
                    >×</span>
                  </span>
                ) : (
                  <span className="text-xs opacity-60">{role.desc}</span>
                )}
              </button>
            )
          })}
        </div>

        {activeRole && (
          <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium animate-pulse ${ROLE_MAP[activeRole].light} border`}>
            ② 이제 아래 표에서 <strong>{ROLE_MAP[activeRole].label}</strong> 에 해당하는 컬럼 헤더를 클릭하세요
          </div>
        )}
      </div>

      {/* 데이터 미리보기 테이블 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">② 실제 데이터를 보고 컬럼 헤더를 클릭하세요</p>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
          <table className="text-sm w-max min-w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-3 py-2 text-xs text-zinc-400 font-medium w-10">#</th>
                {columns.map((col) => {
                  const role = getRoleForCol(col)
                  const isActive = activeRole !== null
                  return (
                    <th
                      key={col}
                      onClick={() => isActive && assignRole(col)}
                      className={`px-4 py-0 text-left align-top transition-all ${
                        isActive ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'
                      }`}
                    >
                      <div className="py-2">
                        {/* 역할 뱃지 */}
                        <div className="mb-1 min-h-[22px]">
                          {role ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${role.light} border`}>
                              {role.label}
                            </span>
                          ) : isActive ? (
                            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border-2 border-dashed ${ROLE_MAP[activeRole!].light} opacity-50`}>
                              여기 클릭
                            </span>
                          ) : null}
                        </div>
                        {/* 컬럼명 */}
                        <div className={`font-semibold text-xs whitespace-nowrap ${role ? 'text-zinc-800' : 'text-zinc-600'}`}>
                          {col}
                        </div>
                        {/* 타입 */}
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {columnInfos.find((c) => c.name === col)?.type ?? ''}
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {previewRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-zinc-50">
                  <td className="px-3 py-2 text-xs text-zinc-300 tabular-nums">{ri + 1}</td>
                  {columns.map((col) => {
                    const val = row[col]
                    const role = getRoleForCol(col)
                    return (
                      <td
                        key={col}
                        onClick={() => activeRole && assignRole(col)}
                        className={`px-4 py-2 text-xs whitespace-nowrap max-w-[160px] ${
                          isEmptyVal(val) ? 'text-zinc-300 italic' : 'text-zinc-700'
                        } ${activeRole ? 'cursor-pointer' : ''} ${role ? `bg-opacity-30` : ''}`}
                        style={role ? { backgroundColor: `${role.color.replace('bg-', '')}10` } : undefined}
                      >
                        <span className="block truncate" title={String(val ?? '')}>
                          {isEmptyVal(val) ? 'null' : String(val)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">위 5행은 샘플 데이터입니다. 전체 {rows.length.toLocaleString()}행 중 일부입니다.</p>
      </div>

      {/* 설정 요약 + 시작 버튼 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">현재 설정 요약</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ROLES.map((role) => (
            <div key={role.key} className={`rounded-xl p-3 border text-center ${mapping[role.key] ? role.light : 'bg-zinc-50 border-zinc-200'}`}>
              <p className="text-[11px] font-semibold mb-1">{role.label}</p>
              {mapping[role.key] ? (
                <p className="text-xs font-bold truncate">{mapping[role.key]}</p>
              ) : (
                <p className="text-xs text-zinc-400">{(role as { required?: boolean }).required ? '⚠ 필수' : '미설정'}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleApply}
          disabled={!canProceed}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          분석 시작하기
          <ArrowRight className="w-4 h-4" />
        </button>
        {!canProceed && (
          <p className="text-center text-xs text-red-500">📅 날짜와 💰 매출 컬럼은 반드시 설정해야 합니다.</p>
        )}
      </div>
    </div>
  )
}
