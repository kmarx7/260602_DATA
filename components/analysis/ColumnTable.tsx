'use client'

import { useDatasetStore } from '@/store/datasetStore'
import { Badge } from '@/components/ui/badge'
import type { ColumnInfo, ColumnType } from '@/types/dataset'

const TYPE_CONFIG: Record<ColumnType, { label: string; className: string }> = {
  numeric: { label: '연속형', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  categorical: { label: '범주형', className: 'bg-green-100 text-green-700 border-green-200' },
  datetime: { label: '날짜형', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  unknown: { label: '알 수 없음', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}

function NullRateBar({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1)
  const color =
    rate === 0 ? 'bg-zinc-200' : rate <= 0.1 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(rate * 100, rate > 0 ? 3 : 0)}%` }} />
      </div>
      <span className={`text-xs tabular-nums w-10 text-right ${rate > 0.1 ? 'text-red-600 font-medium' : rate > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
        {pct}%
      </span>
    </div>
  )
}

function RangeSummary({ col }: { col: ColumnInfo }) {
  if (col.type === 'numeric' && col.min !== undefined && col.max !== undefined) {
    return (
      <div className="text-xs text-zinc-600 font-mono">
        {Number(col.min).toLocaleString()} ~ {Number(col.max).toLocaleString()}
        {col.mean !== undefined && (
          <span className="text-zinc-400 ml-1">(평균 {Number(col.mean).toLocaleString(undefined, { maximumFractionDigits: 2 })})</span>
        )}
      </div>
    )
  }
  if (col.type === 'datetime') {
    return (
      <div className="text-xs text-zinc-600">
        {col.dateMin} ~ {col.dateMax}
      </div>
    )
  }
  if (col.type === 'categorical' && col.topValues) {
    return (
      <div className="text-xs text-zinc-600 truncate max-w-[200px]">
        {col.topValues.join(', ')}
        {col.uniqueCount > col.topValues.length && ' ...'}
      </div>
    )
  }
  return <span className="text-xs text-zinc-400">—</span>
}

export default function ColumnTable() {
  const columnInfos = useDatasetStore((s) => s.columnInfos)

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            {['#', '컬럼명', '데이터 타입', '고유값 수', '결측치 수', '결측치 비율', '데이터 범위 / 예시'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {columnInfos.map((col, i) => {
            const typeConf = TYPE_CONFIG[col.type]
            return (
              <tr key={col.name} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-800 max-w-[160px]">
                  <span className="truncate block" title={col.name}>{col.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeConf.className}`}>
                    {typeConf.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                  {col.uniqueCount.toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${col.nullCount > 0 ? 'text-amber-700' : 'text-zinc-400'}`}>
                  {col.nullCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 min-w-[120px]">
                  <NullRateBar rate={col.nullRate} />
                </td>
                <td className="px-4 py-3">
                  <RangeSummary col={col} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
