'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiInfo } from 'react-icons/fi'

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLButtonElement>(null)

  const show = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const half = 120
      const center = rect.left + rect.width / 2
      const clamped = Math.min(
        Math.max(center, half + 8),
        window.innerWidth - half - 8
      )
      setPos({ top: rect.bottom + 6, left: clamped })
    }
    setOpen(true)
  }

  return (
    <span className="inline-flex items-center">
      <button
        ref={ref}
        type="button"
        aria-label="Ajuda"
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onClick={(event) => {
          event.preventDefault()
          if (open) {
            setOpen(false)
          } else {
            show()
          }
        }}
        className="cursor-help text-slate-400 transition-colors hover:text-blue-500"
      >
        <FiInfo className="text-sm" />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: 'translateX(-50%)'
            }}
            className="z-[200] w-56 rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-slate-100 shadow-xl ring-1 ring-white/10"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}
