/**
 * exportXlsx — client-side XLSX export helper using SheetJS (xlsx).
 *
 * Usage:
 *   import { exportToXlsx } from './exportXlsx'
 *   exportToXlsx(rows, 'my-export')
 *
 * Install SheetJS:
 *   npm install xlsx
 */

import * as XLSX from 'xlsx'

/**
 * Convert an array of plain objects to an XLSX file and trigger a browser download.
 *
 * @param rows     - Array of objects whose keys become column headers.
 * @param filename - Desired filename WITHOUT the .xlsx extension.
 */
export function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Convert an array of plain objects to a base-64 encoded XLSX string.
 * Useful for server-side generation or testing without triggering a download.
 *
 * @param rows - Array of objects whose keys become column headers.
 * @returns Base-64 encoded XLSX binary.
 */
export function toXlsxBase64<T extends Record<string, unknown>>(rows: T[]): string {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string
}
