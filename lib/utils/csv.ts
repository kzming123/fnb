/**
 * CSV Download Utility
 * Pure browser API — no npm package required.
 * Adds a UTF-8 BOM so Excel opens the file with correct character encoding
 * (important for Simplified Chinese labels).
 */

type Cell = string | number | null | undefined

function escapeCell(v: Cell): string {
  const s = v == null ? '' : String(v)
  // Wrap in double-quotes when the cell contains a comma, double-quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Trigger a CSV file download in the user's browser.
 *
 * @param filename  Suggested filename (without extension — .csv is appended)
 * @param headers   Column header row
 * @param rows      Data rows — each cell is coerced to string
 */
export function downloadCSV(filename: string, headers: string[], rows: Cell[][]): void {
  const UTF8_BOM = '﻿'
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ]
  const content = UTF8_BOM + lines.join('\r\n')
  const blob    = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const anchor  = document.createElement('a')
  anchor.href          = url
  anchor.download      = `${filename}.csv`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Revoke after a short delay to allow the download to start
  setTimeout(() => URL.revokeObjectURL(url), 200)
}

/**
 * Format a date string for CSV cells ("YYYY-MM-DD" → locale-aware short date).
 * Keeps it simple — no timezone conversion needed for date-only values.
 */
export function csvDate(isoDate: string, locale = 'en-MY'): string {
  if (!isoDate) return ''
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(isoDate + 'T00:00:00'))
  } catch {
    return isoDate
  }
}
