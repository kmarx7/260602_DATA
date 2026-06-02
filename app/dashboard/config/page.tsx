'use client'
import { useDatasetStore } from '@/store/datasetStore'
import ColumnConfig from '@/components/features/ColumnConfig'
import { NoDataGuard } from '@/components/features/shared'
export default function Page() {
  const hasData = useDatasetStore((s) => s.fileName !== null)
  if (!hasData) return <NoDataGuard />
  return (
    <div className="max-w-2xl mx-auto py-8">
      <ColumnConfig />
    </div>
  )
}
