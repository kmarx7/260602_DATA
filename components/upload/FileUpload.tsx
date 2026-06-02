'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseFile } from '@/lib/parser'
import { analyzeDataset } from '@/lib/analysis'
import { useDatasetStore } from '@/store/datasetStore'

type Status = 'idle' | 'parsing' | 'success' | 'error'

export default function FileUpload() {
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const setDataset = useDatasetStore((s) => s.setDataset)
  const clearDataset = useDatasetStore((s) => s.clearDataset)
  const router = useRouter()

  const handleFile = useCallback(
    async (file: File) => {
      setStatus('parsing')
      setMessage(`${file.name} 파싱 중...`)
      try {
        const { columns, rows } = await parseFile(file)
        const columnInfos = analyzeDataset(columns, rows)
        setDataset({ fileName: file.name, fileSize: file.size, columns, rows, columnInfos })
        setStatus('success')
        setMessage(`${file.name} 로드 완료 — ${rows.length}행 × ${columns.length}열`)
        setTimeout(() => router.push('/dashboard/analysis'), 800)
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : '파싱 중 오류가 발생했습니다.')
      }
    },
    [setDataset, router]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const reset = () => {
    setStatus('idle')
    setMessage('')
    clearDataset()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-10 gap-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-zinc-800">데이터 파일 업로드</h1>
        <p className="text-sm text-zinc-500">CSV 또는 Excel(.xlsx) 파일을 업로드하면 자동으로 분석합니다</p>
      </div>

      {/* 드롭존 */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center w-full max-w-lg h-56 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50',
          status === 'parsing' && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={onInputChange}
          disabled={status === 'parsing'}
        />
        <UploadCloud className={cn('w-12 h-12 mb-3', dragOver ? 'text-blue-500' : 'text-zinc-400')} />
        <p className="text-sm font-medium text-zinc-700">
          파일을 드래그하거나 <span className="text-blue-600 underline">클릭해서 선택</span>
        </p>
        <p className="text-xs text-zinc-400 mt-1">.csv, .xlsx, .xls 지원</p>
      </label>

      {/* 상태 메시지 */}
      {status !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-3 w-full max-w-lg px-4 py-3 rounded-xl text-sm',
            status === 'parsing' && 'bg-blue-50 text-blue-700',
            status === 'success' && 'bg-green-50 text-green-700',
            status === 'error' && 'bg-red-50 text-red-700'
          )}
        >
          {status === 'parsing' && (
            <span className="animate-spin text-blue-500">⏳</span>
          )}
          {status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {status === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{message}</span>
          {status === 'error' && (
            <button onClick={reset} className="shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 지원 포맷 안내 */}
      <div className="flex gap-3">
        {['.csv', '.xlsx', '.xls'].map((ext) => (
          <div
            key={ext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs text-zinc-600"
          >
            <File className="w-3 h-3" />
            {ext}
          </div>
        ))}
      </div>
    </div>
  )
}
