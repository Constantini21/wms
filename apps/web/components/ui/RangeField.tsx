'use client'

interface RangeFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  hint?: string
}

export function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  hint
}: RangeFieldProps) {
  return (
    <div className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-blue-600"
      />
      {hint && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </div>
  )
}
