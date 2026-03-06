/**
 * CSV utilities with UTF-8 BOM support for iPhone compatibility.
 * The BOM (\uFEFF) ensures Numbers/Excel on iOS correctly detects UTF-8 encoding.
 */

type Row = Record<string, string | number | null | undefined>

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Wrap in quotes if the value contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function toCSVString(rows: Row[]): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const headerLine = headers.map(escapeCell).join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(','),
  )

  return [headerLine, ...dataLines].join('\r\n')
}

export function toCSVBlob(rows: Row[]): Blob {
  const csv = toCSVString(rows)
  // Prepend UTF-8 BOM so iPhone Numbers/Excel auto-detects encoding
  const bom = '\uFEFF'
  return new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
}
