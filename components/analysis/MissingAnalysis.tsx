'use client'

import { useMemo } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { AlertTriangle, CheckCircle2, Rows3 } from 'lucide-react'

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-zinc-100 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MissingAnalysis() {
  const { columnInfos, totalRows, totalCols } = useDatasetStore()

  const stats = useMemo(() => {
    const colsWithMissing = columnInfos.filter((c) => c.nullCount > 0)
    const totalMissing = columnInfos.reduce((s, c) => s + c.nullCount, 0)
    const totalCells = totalRows * totalCols
    const completeRows = totalRows - (columnInfos.find((c) => c.nullCount > 0) ? Math.max(...columnInfos.map((c) => c.nullCount)) : 0)

    const chartData = columnInfos
      .filter((c) => c.nullCount > 0)
      .sort((a, b) => b.nullCount - a.nullCount)
      .map((c) => ({
        name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
        fullName: c.name,
        count: c.nullCount,
        rate: +(c.nullRate * 100).toFixed(1),
      }))

    return { colsWithMissing, totalMissing, totalCells, completeRows, chartData }
  }, [columnInfos, totalRows, totalCols])

  return (
    <div className="space-y-8">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="결측치 있는 컬럼"
          value={stats.colsWithMissing.length}
          sub={`전체 ${totalCols}개 중`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.colsWithMissing.length > 0 ? 'text-amber-600' : 'text-zinc-500'}
        />
        <StatCard
          label="총 결측치 개수"
          value={stats.totalMissing.toLocaleString()}
          sub={`전체 셀의 ${stats.totalCells > 0 ? ((stats.totalMissing / stats.totalCells) * 100).toFixed(2) : 0}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.totalMissing > 0 ? 'text-red-600' : 'text-zinc-500'}
        />
        <StatCard
          label="결측치 없는 컬럼"
          value={totalCols - stats.colsWithMissing.length}
          sub="완전한 컬럼 수"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-green-600"
        />
        <StatCard
          label="전체 행 수"
          value={totalRows.toLocaleString()}
          icon={<Rows3 className="w-5 h-5" />}
          color="text-zinc-700"
        />
      </div>

      {stats.colsWithMissing.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-lg font-semibold text-green-600">결측치가 없습니다!</p>
            <p className="text-sm text-zinc-400">모든 컬럼의 데이터가 완전합니다.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 막대 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-700">컬럼별 결측치 수</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, stats.chartData.length * 36)}>
                <BarChart data={stats.chartData} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(val, _, props) => [
                      `${Number(val).toLocaleString()}개 (${props.payload?.rate}%)`,
                      props.payload?.fullName ?? '결측치',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.chartData.map((d) => (
                      <Cell key={d.name} fill={d.rate > 10 ? '#ef4444' : d.rate > 1 ? '#f59e0b' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 상세 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-700">결측치 상세 목록</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      {['컬럼명', '데이터 타입', '결측치 수', '결측치 비율', '상태'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {stats.colsWithMissing
                      .sort((a, b) => b.nullCount - a.nullCount)
                      .map((col) => {
                        const rate = (col.nullRate * 100)
                        const level = rate > 10 ? 'high' : rate > 1 ? 'mid' : 'low'
                        return (
                          <tr key={col.name} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 font-medium text-zinc-800">{col.name}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{col.type}</td>
                            <td className="px-4 py-3 tabular-nums font-semibold text-red-600">{col.nullCount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-24">
                                  <div
                                    className={`h-full rounded-full ${level === 'high' ? 'bg-red-500' : level === 'mid' ? 'bg-amber-400' : 'bg-slate-400'}`}
                                    style={{ width: `${Math.min(rate, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-xs tabular-nums font-medium ${level === 'high' ? 'text-red-600' : level === 'mid' ? 'text-amber-600' : 'text-zinc-500'}`}>
                                  {rate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                level === 'mid' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-zinc-100 text-zinc-500 border-zinc-200'
                              }`}>
                                {level === 'high' ? '주의 필요' : level === 'mid' ? '확인 권장' : '미미'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
