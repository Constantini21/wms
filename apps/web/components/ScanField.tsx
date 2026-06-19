'use client'

import { useState } from 'react'
import { FiCamera } from 'react-icons/fi'
import { BarcodeScanner } from './BarcodeScanner'
import { Modal } from './ui/Modal'

interface ScanFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function ScanField({
  label,
  value,
  onChange,
  placeholder,
  required
}: ScanFieldProps) {
  const [open, setOpen] = useState(false)

  const handleResult = (text: string) => {
    onChange(text)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
      {label && <span className="font-medium">{label}</span>}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Escanear código"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
        >
          <FiCamera /> Escanear
        </button>
      </div>

      <Modal open={open} title="Escanear código" onClose={() => setOpen(false)}>
        <BarcodeScanner onResult={handleResult} />
      </Modal>
    </div>
  )
}
