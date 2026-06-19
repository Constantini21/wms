'use client'

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) {
    return null
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
      <p className="text-slate-500 dark:text-slate-400">
        Mostrando <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> de{' '}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Página anterior"
        >
          <FiChevronLeft />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-8 rounded-md px-2 text-sm transition-colors ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Próxima página"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}
