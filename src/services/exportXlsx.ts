/**
 * exportXlsx — client-side XLSX export helper using ExcelJS.
 *
 * Usage:
 *   import { exportToXlsx } from './exportXlsx'
 *   await exportToXlsx(rows, 'my-export')
 *
 * Install ExcelJS:
 *   npm install exceljs
 */

import ExcelJS from 'exceljs'

/**
 * Convert an array of plain objects to an XLSX file and trigger a browser download.
 *
 * @param rows     - Array of objects whose keys become column headers.
 * @param filename - Desired filename WITHOUT the .xlsx extension.
 */
export async function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Export')

  if (rows.length > 0) {
    const headers = Object.keys(rows[0])
    worksheet.columns = headers.map((key) => ({ header: key, key }))
    worksheet.addRows(rows)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Convert an array of plain objects to a base-64 encoded XLSX string.
 * Useful for server-side generation or testing without triggering a download.
 *
 * @param rows - Array of objects whose keys become column headers.
 * @returns Base-64 encoded XLSX binary.
 */
export async function toXlsxBase64<T extends Record<string, unknown>>(
  rows: T[],
): Promise<string> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Export')

  if (rows.length > 0) {
    const headers = Object.keys(rows[0])
    worksheet.columns = headers.map((key) => ({ header: key, key }))
    worksheet.addRows(rows)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const bytes = new Uint8Array(buffer as ArrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
