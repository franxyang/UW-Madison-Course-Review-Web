import fs from 'fs'
import { parse } from 'csv-parse/sync'

export function readCSV<T = any>(filePath: string): T[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}