'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { InfoTip } from './InfoTip'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  info?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, info, error, className = '', id, ...props },
  ref
) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
      {label && (
        <span className="flex items-center gap-1.5 font-medium">
          {label}
          {info && <InfoTip text={info} />}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        className={`rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:ring-1 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600 dark:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
})
