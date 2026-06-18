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
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <select
        className={`rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
