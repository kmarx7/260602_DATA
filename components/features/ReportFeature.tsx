'use client'

import { useMemo, useRef } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { useColumnConfigStore } from '@/store/columnConfigStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcMonthlyTrend, calcYearlyCohort, calcCategoryStats } from '@/lib/salesAnalysis'
import { fmtWon } from './shared'
import { Download, Printer, FileSpreadsheet } from 'lucide-react'

function downloadCSV(data: object[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((h) => JSON.stringify((row as Record<string, unknown>)[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportFeature() {
  const { rows, fileName, totalRows, totalCols, totalNulls, columnInfos } = useDatasetStore()
  const { config } = useColumnConfigStore()
  const reportRef = useRef<HTMLDivElement>(null)

  const monthly = useMemo(() => config ? calcMonthlyTrend(rows, config.dateCol, config.salesCol) : [], [rows, config])
  const yearly = useMemo(() => config ? calcYearlyCohort(rows, config.dateCol, config.salesCol) : [], [rows, config])
  const categories = useMemo(() => config?.categoryCol ? calcCategoryStats(rows, config.salesCol, config.categoryCol) : [], [rows, config])

  if (!config) return null

  const totalSales = monthly.reduce((s, m) => s + m.total, 0)
  const avgMonthly = totalSales / (monthly.length || 1)
  const bestMonth = monthly.reduce((a, b) => (a.total > b.total ? a : b), monthly[0])
  const lastYear = yearly[yearly.length - 1]
  const prevYear = yearly[yearly.length - 2]
  const yoyGrowth = lastYear && prevYear ? ((lastYear.total - prevYear.total) / prevYear.total) * 100 : null

  function handlePrint() {
    window.print()
  }

  function handleDownloadMonthly() {
    downloadCSV(
      monthly.map((m) => ({
        '연월': m.label, '연도': m.year, '월': m.month, '계절': m.season,
        '총매출': m.total, '평균매출': m.avg.toFixed(0), '건수': m.count,
      })),
      `월별매출분석_${fileName?.replace(/\.[^.]+$/, '') ?? 'report'}.csv`
    )
  }

  function handleDownloadYearly() {
    downloadCSV(
      yearly.map((y) => ({
        '연도': y.year, '총매출': y.total, '평균매출': y.avg.toFixed(0),
        '건수': y.count, '전년대비성장률': y.growth !== null ? `${y.growth.toFixed(2)}%` : '-',
      })),
      `연도별성장률_${fileName?.replace(/\.[^.]+$/, '') ?? 'report'}.csv`
    )
  }

  function handleDownloadCategory() {
    if (categories.length === 0) return
    downloadCSV(
      categories.map((c) => ({
        '업종': c.category, '건수': c.count, '총매출': c.total,
        '평균매출': c.avg.toFixed(0), '최대매출': c.max, '최소매출': c.min,
      })),
      `업종별분석_${fileName?.replace(/\.[^.]+$/, '') ?? 'report'}.csv`
    )
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* 다운로드 버튼 */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <button onClick={handleDownloadMonthly} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors">
          <Download className="w-4 h-4" /> 월별 매출 CSV
        </button>
        {yearly.length > 0 && (
          <button onClick={handleDownloadYearly} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" /> 연도별 성장률 CSV
          </button>
        )}
        {categories.length > 0 && (
          <button onClick={handleDownloadCategory} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors">
            <Download className="w-4 h-4" /> 업종별 분석 CSV
          </button>
        )}
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-zinc-300 text-zinc-700 text-sm rounded-xl hover:bg-zinc-50 transition-colors">
          <Printer className="w-4 h-4" /> 리포트 인쇄
        </button>
      </div>

      {/* 리포트 본문 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-zinc-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            소상공인 매출 분석 리포트
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-1">파일: {fileName} · 생성일: {new Date().toLocaleDateString('ko-KR')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 현황 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 pb-1 border-b">1. 데이터 기본 현황</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '총 데이터 행', value: `${totalRows.toLocaleString()}건` },
                { label: '총 컬럼 수', value: `${totalCols}개` },
                { label: '결측치', value: `${totalNulls.toLocaleString()}개` },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-lg font-bold text-zinc-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 매출 요약 */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-3 pb-1 border-b">2. 매출 핵심 요약</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '전체 기간 총매출', value: fmtWon(totalSales), color: 'text-blue-700' },
                { label: '월 평균 매출', value: fmtWon(avgMonthly), color: 'text-green-700' },
                { label: '최고 매출 월', value: `${bestMonth?.label ?? '-'}\n${fmtWon(bestMonth?.total ?? 0)}`, color: 'text-purple-700' },
                { label: '전년 대비 성장률', value: yoyGrowth !== null ? `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth.toFixed(1)}%` : '-', color: yoyGrowth !== null && yoyGrowth >= 0 ? 'text-green-700' : 'text-red-600' },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className={`text-base font-bold mt-0.5 whitespace-pre-line ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 연도별 추이 */}
          {yearly.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-3 pb-1 border-b">3. 연도별 매출 추이</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-zinc-50">{['연도','총매출','전년 대비'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {yearly.map((y) => (
                    <tr key={y.year}>
                      <td className="px-3 py-2 font-medium">{y.year}년</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">{fmtWon(y.total)}</td>
                      <td className={`px-3 py-2 tabular-nums font-medium ${(y.growth ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {y.growth !== null ? `${y.growth >= 0 ? '+' : ''}${y.growth.toFixed(1)}%` : '기준'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 업종별 */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-3 pb-1 border-b">4. 업종별 매출 상위 10개</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-zinc-50">{['순위','업종','총매출','점유율'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs text-zinc-500">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.slice(0, 10).map((c, i) => (
                    <tr key={c.category}>
                      <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{c.category}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">{fmtWon(c.total)}</td>
                      <td className="px-3 py-2 tabular-nums text-zinc-500">{((c.total / totalSales) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
