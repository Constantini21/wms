'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiCheck, FiRefreshCw, FiX } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import type { Paginated, PlacementSuggestion } from '@/lib/types'

const PAGE_SIZE = 20

export default function SuggestionsPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.PRODUCTS_WRITE)
  const [suggestions, setSuggestions] = useState<PlacementSuggestion[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [recalculating, setRecalculating] = useState(false)

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<PlacementSuggestion>>(
      `/suggestions?status=pending&page=${target}&pageSize=${PAGE_SIZE}`
    )
    setSuggestions(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  useEffect(() => {
    load(1).catch(() => undefined)
  }, [load])

  const recalculate = async () => {
    setRecalculating(true)
    try {
      await apiRequest('/products/recalculate', { method: 'POST' })
      await load(1)
    } finally {
      setRecalculating(false)
    }
  }

  const apply = async (id: string) => {
    await apiRequest(`/suggestions/${id}/apply`, { method: 'POST' })
    await load(page)
  }

  const dismiss = async (id: string) => {
    await apiRequest(`/suggestions/${id}/dismiss`, { method: 'POST' })
    await load(page)
  }

  return (
    <div>
      <PageHeader
        title="Sugestões de realocação"
        description="Calculadas diariamente: produtos em locais que não combinam com sua frequência de saída"
        action={
          canWrite && (
            <Button onClick={recalculate} disabled={recalculating}>
              <FiRefreshCw className={recalculating ? 'animate-spin' : ''} />
              {recalculating ? 'Calculando...' : 'Recalcular agora'}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {s.product?.name}{' '}
                <span className="text-sm text-slate-400">
                  ({s.product?.sku})
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {s.reason}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  {s.fromLocation?.code ?? '—'}
                </span>
                →
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {s.toLocation?.code ?? '—'}
                </span>
                <span>• {s.quantity} un.</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  encaixe {Math.round(s.score)}/10
                </span>
              </div>
            </div>
            {canWrite && (
              <div className="flex gap-2">
                <Button onClick={() => apply(s.id)}>
                  <FiCheck /> Aplicar
                </Button>
                <Button variant="secondary" onClick={() => dismiss(s.id)}>
                  <FiX /> Ignorar
                </Button>
              </div>
            )}
          </div>
        ))}
        {suggestions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhuma sugestão pendente. Tudo bem alocado! 🎉
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(p) => load(p)}
          />
        </div>
      )}
    </div>
  )
}
