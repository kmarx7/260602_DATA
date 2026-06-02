'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, File, AlertCircle, CheckCircle2, X, ArrowRight, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseFile } from '@/lib/parser'
import { analyzeDataset } from '@/lib/analysis'
import { useDatasetStore } from '@/store/datasetStore'

type Status = 'idle' | 'parsing' | 'success' | 'error'

export default function FileUpload() {
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState<{ rows: number; cols: number } | null>(null)
  const setDataset = useDatasetStore((s) => s.setDataset)
  const clearDataset = useDatasetStore((s) => s.clearDataset)
  const router = useRouter()

  const handleFile = useCallback(
    async (file: File) => {
      setStatus('parsing')
      setMessage(`${file.name} 불러오는 중...`)
      setSummary(null)
      try {
        const { columns, rows } = await parseFile(file)
        const columnInfos = analyzeDataset(columns, rows)
        setDataset({ fileName: file.name, fileSize: file.size, columns, rows, columnInfos })
        setStatus('success')
        setMessage(`"${file.name}" 업로드 완료`)
        setSummary({ rows: rows.length, cols: columns.length })
      } catch (e) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : '파싱 중 오류가 발생했습니다.')
      }
    },
    [setDataset]
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
    setSummary(null)
    clearDataset()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-10 gap-6 max-w-lg mx-auto w-full">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-zinc-800">데이터 파일 업로드</h1>
        <p className="text-sm text-zinc-500">CSV 또는 Excel 파일을 올리면 분석을 시작할 수 있습니다</p>
      </div>

      {/* 드롭존 */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          status === 'success'
            ? 'border-green-400 bg-green-50 pointer-events-none'
            : dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50',
          status === 'parsing' && 'pointer-events-none opacity-60'
        )}
      >
        <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={onInputChange} disabled={status !== 'idle'} />

        {status === 'success' && summary ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-base font-bold text-green-700">{message}</p>
            <p className="text-sm text-green-600 mt-1">{summary.rows.toLocaleString()}행 × {summary.cols}열</p>
          </>
        ) : (
          <>
            <UploadCloud className={cn('w-12 h-12 mb-3', dragOver ? 'text-blue-500' : 'text-zinc-400')} />
            <p className="text-sm font-medium text-zinc-700">
              파일을 드래그하거나 <span className="text-blue-600 underline">클릭해서 선택</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">.csv .xlsx .xls 지원</p>
          </>
        )}
      </label>

      {/* 파싱 중 */}
      {status === 'parsing' && (
        <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-700 text-sm">
          <span className="animate-spin">⏳</span>
          <span>{message}</span>
        </div>
      )}

      {/* 에러 */}
      {status === 'error' && (
        <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{message}</span>
          <button onClick={reset}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ✅ 업로드 성공 → 다음 단계 버튼 */}
      {status === 'success' && (
        <div className="w-full space-y-3">
          {/* 다른 파일로 다시 시작 */}
          <button
            onClick={reset}
            className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 underline"
          >
            다른 파일로 다시 시작
          </button>

          {/* 다음 단계 */}
          <button
            onClick={() => router.push('/dashboard/config')}
            className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <div className="text-left">
              <p className="text-xs text-blue-200 mb-0.5">다음 단계</p>
              <p className="text-base font-bold flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                컬럼 설정하기
              </p>
              <p className="text-xs text-blue-200 mt-0.5">어떤 컬럼이 날짜·매출인지 알려주세요</p>
            </div>
            <ArrowRight className="w-6 h-6 shrink-0" />
          </button>
        </div>
      )}

      {/* 지원 포맷 */}
      {status === 'idle' && (
        <div className="flex gap-3">
          {['.csv', '.xlsx', '.xls'].map((ext) => (
            <div key={ext} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs text-zinc-600">
              <File className="w-3 h-3" />{ext}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
