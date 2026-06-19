'use client'

import { useState } from 'react'
import { FiInfo } from 'react-icons/fi'

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Ajuda"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(event) => {
          event.preventDefault()
          setOpen((value) => !value)
        }}
        className="cursor-help text-slate-400 transition-colors hover:text-blue-500"
      >
        <FiInfo className="text-sm" />
      </button>
      {open && (
        <span className="absolute left-1/2 top-6 z-[120] w-56 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-slate-100 shadow-lg ring-1 ring-white/10">
          {text}
        </span>
      )}
    </span>
  )
}
