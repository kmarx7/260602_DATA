'use client'

import { useDatasetStore } from '@/store/datasetStore'
import { FileSpreadsheet } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TopBar() {
  const { fileName, fileSize, totalRows, totalCols, totalNulls } = useDatasetStore()

  return (
    <header className="h-12 px-6 flex items-center gap-6 bg-white border-b border-zinc-200 shrink-0">
      {fileName ? (
        <>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <span>{fileName}</span>
            {fileSize !== null && (
              <span className="text-zinc-400 font-normal">({formatBytes(fileSize)})</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>
              <span className="font-semibold text-zinc-700">{totalRows.toLocaleString()}</span>행
            </span>
            <span>
              <span className="font-semibold text-zinc-700">{totalCols}</span>열
            </span>
            <span>
              결측치{' '}
              <span className={totalNulls > 0 ? 'font-semibold text-amber-600' : 'font-semibold text-zinc-700'}>
                {totalNulls.toLocaleString()}
              </span>
              개
            </span>
          </div>
        </>
      ) : (
        <span className="text-sm text-zinc-400">파일을 업로드하면 데이터 요약이 여기에 표시됩니다.</span>
      )}
    </header>
  )
}
