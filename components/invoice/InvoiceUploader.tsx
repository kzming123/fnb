'use client'

import { useRef, useState } from 'react'
import { CloudUpload, FileImage, FileText, X, ScanSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_MB = 10

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type === 'application/pdf') return <FileText size={22} className="text-red-500" />
  return <FileImage size={22} className="text-indigo-500" />
}

interface InvoiceUploaderProps {
  onScan: (file: File) => void
}

export function InvoiceUploader({ onScan }: InvoiceUploaderProps) {
  const { t } = useLanguage()
  const fileRef  = useRef<HTMLInputElement>(null)
  const [file,     setFile]     = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error,    setError]    = useState('')

  function handleFile(f: File) {
    setError('')
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large (max ${MAX_MB} MB)`)
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  // ── Idle / drag state ─────────────────────────────────────────────────────
  if (!file) {
    return (
      <div
        className={cn(
          'group relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-12 text-center',
          'cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        {/* Hidden input */}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Icon */}
        <div className={cn(
          'flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-200',
          dragOver ? 'bg-indigo-200 scale-110' : 'bg-indigo-50 group-hover:bg-indigo-100'
        )}>
          {dragOver
            ? <CloudUpload size={36} className="text-indigo-600 animate-bounce" />
            : <CloudUpload size={36} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          }
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          {dragOver ? (
            <p className="text-base font-bold text-indigo-600">{t('invoice_drag_active')}</p>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-700">
                {t('invoice_drag_drop')}
              </p>
              <p className="text-sm text-gray-400">{t('invoice_supported_formats')}</p>
            </>
          )}
        </div>

        {/* Browse button */}
        {!dragOver && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="gap-2 pointer-events-none"
          >
            <CloudUpload size={14} />
            {t('invoice_browse')}
          </Button>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    )
  }

  // ── File selected — pre-scan state ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
      {/* File info strip */}
      <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-card">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
          {fileIcon(file.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatSize(file.size)} · {file.type.includes('pdf') ? 'PDF' : 'Image'}
          </p>
        </div>
        <button
          onClick={() => setFile(null)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label={t('invoice_change_file')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Scan button */}
      <Button
        onClick={() => onScan(file)}
        size="lg"
        className="w-full gap-2 text-base h-12 shadow-lg shadow-indigo-200/60"
      >
        <ScanSearch size={19} />
        {t('invoice_scan_btn')}
      </Button>

      <p className="text-center text-xs text-gray-400">{t('invoice_edit_warning')}</p>
    </div>
  )
}
