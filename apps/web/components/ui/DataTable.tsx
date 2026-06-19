'use client'

import { ReactNode } from 'react'
import { Pagination } from './Pagination'

export interface Column<T> {
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage: string
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  page,
  pageSize,
  total,
  onPageChange
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 font-medium ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={`px-4 py-3 ${
                      column.align === 'right' ? 'text-right' : ''
                    } ${column.className ?? ''}`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  )
}
