'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { InfoTip } from './InfoTip'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  info?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, info, error, className = '', children, ...props },
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
        <select
          ref={ref}
          className={`rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:ring-1 dark:bg-slate-800 dark:text-slate-100 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600 dark:border-slate-600'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </label>
    )
  }
)
