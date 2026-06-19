'use client'

import { SelectHTMLAttributes } from 'react'
import { InfoTip } from './InfoTip'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  info?: string
}

export function Select({
  label,
  info,
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
      {label && (
        <span className="flex items-center gap-1.5 font-medium">
          {label}
          {info && <InfoTip text={info} />}
        </span>
      )}
      <select
        className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
