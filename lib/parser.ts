import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParseResult {
  columns: string[]
  rows: Record<string, unknown>[]
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // 문자열 원본 유지 (타입 판별은 analysis.ts에서)
      complete: (result) => {
        const columns = result.meta.fields ?? []
        const rows = result.data as Record<string, unknown>[]
        resolve({ columns, rows })
      },
      error: (err) => reject(new Error(`CSV 파싱 오류: ${err.message}`)),
    })
  })
}

export async function parseXLSX(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('XLSX 파일에 시트가 없습니다.')

  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false, // 문자열로 통일 (타입 판별은 analysis.ts에서)
  })

  if (rawData.length === 0) throw new Error('시트에 데이터가 없습니다.')

  const columns = Object.keys(rawData[0])
  return { columns, rows: rawData }
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file)
  throw new Error(`지원하지 않는 파일 형식입니다: .${ext}`)
}
