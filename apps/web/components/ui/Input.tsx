'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        id={id}
        className={`rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${className}`}
        {...props}
      />
    </label>
  )
}
