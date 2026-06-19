'use client'

import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({
  label,
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
      {label && <span className="font-medium">{label}</span>}
      <select
        className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
