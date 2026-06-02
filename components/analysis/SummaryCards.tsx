'use client'

import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent } from '@/components/ui/card'
import { Rows3, Columns3, AlertTriangle, Hash } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

function StatCard({ icon, label, value, sub, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-amber-200 bg-amber-50' : ''}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-zinc-800'}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${highlight ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-500'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SummaryCards() {
  const { totalRows, totalCols, totalNulls } = useDatasetStore()
  const nullRate = totalRows * totalCols > 0
    ? ((totalNulls / (totalRows * totalCols)) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Rows3 className="w-5 h-5" />}
        label="전체 행 (Row)"
        value={totalRows}
      />
      <StatCard
        icon={<Columns3 className="w-5 h-5" />}
        label="전체 열 (Column)"
        value={totalCols}
      />
      <StatCard
        icon={<Hash className="w-5 h-5" />}
        label="전체 셀"
        value={totalRows * totalCols}
      />
      <StatCard
        icon={<AlertTriangle className="w-5 h-5" />}
        label="결측치"
        value={totalNulls}
        sub={`전체의 ${nullRate}%`}
        highlight={totalNulls > 0}
      />
    </div>
  )
}
