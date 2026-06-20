'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiInfo } from 'react-icons/fi'

const TOOLTIP_WIDTH = 224
const MARGIN = 8

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLButtonElement>(null)

  const show = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const viewportWidth = window.innerWidth
      const width = Math.min(TOOLTIP_WIDTH, viewportWidth - MARGIN * 2)
      const center = rect.left + rect.width / 2
      const maxLeft = viewportWidth - width - MARGIN
      const left = Math.min(Math.max(center - width / 2, MARGIN), maxLeft)
      setPos({ top: rect.bottom + 6, left })
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
              width: Math.min(TOOLTIP_WIDTH, window.innerWidth - MARGIN * 2)
            }}
            className="z-[200] rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-slate-100 shadow-xl ring-1 ring-white/10"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}
