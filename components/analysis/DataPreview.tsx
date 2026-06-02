'use client'

import { useState } from 'react'
import { useDatasetStore } from '@/store/datasetStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

function isEmptyValue(val: unknown): boolean {
  return val === null || val === undefined || val === ''
}

export default function DataPreview() {
  const { columns, rows } = useDatasetStore()
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const sliced = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="text-xs w-max min-w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-3 py-2 text-left text-zinc-400 font-medium sticky left-0 bg-zinc-50">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-semibold text-zinc-600 whitespace-nowrap max-w-[160px]"
                  title={col}
                >
                  <span className="block truncate max-w-[140px]">{col}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sliced.map((row, ri) => (
              <tr key={ri} className="hover:bg-zinc-50">
                <td className="px-3 py-1.5 text-zinc-400 tabular-nums sticky left-0 bg-white">
                  {page * PAGE_SIZE + ri + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col]
                  const empty = isEmptyValue(val)
                  return (
                    <td
                      key={col}
                      className={`px-3 py-1.5 whitespace-nowrap max-w-[160px] ${empty ? 'bg-red-50 text-red-400 italic' : 'text-zinc-700'}`}
                      title={empty ? '결측치' : String(val)}
                    >
                      <span className="block truncate max-w-[140px]">
                        {empty ? 'null' : String(val)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {page * PAGE_SIZE + 1} ~ {Math.min((page + 1) * PAGE_SIZE, rows.length)} / 전체 {rows.length.toLocaleString()}행
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
