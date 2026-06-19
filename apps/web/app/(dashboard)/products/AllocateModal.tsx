'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiArrowRight, FiZap } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type {
  Allocation,
  LocationScore,
  Product,
  SuggestResult
} from '@/lib/types'

interface AllocateModalProps {
  product: Product | null
  canWrite: boolean
  onClose: () => void
  onChanged: () => void
}

export function AllocateModal({
  product,
  canWrite,
  onClose,
  onChanged
}: AllocateModalProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [detail, setDetail] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [suggestions, setSuggestions] = useState<LocationScore[]>([])
  const [movingFrom, setMovingFrom] = useState<Allocation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (productId: string) => {
    const [allocs, fresh] = await Promise.all([
      apiRequest<Allocation[]>(`/products/${productId}/allocations`),
      apiRequest<Product>(`/products/${productId}`)
    ])
    setAllocations(allocs)
    setDetail(fresh)
  }, [])

  useEffect(() => {
    if (product) {
      setError(null)
      setSuggestions([])
      setMovingFrom(null)
      setQuantity(String(Math.max(1, product.unallocatedQuantity ?? 1)))
      reload(product.id).catch(() => undefined)
    }
  }, [product, reload])

  if (!product) {
    return null
  }

  const suggest = async (qty: number) => {
    setError(null)
    const result = await apiRequest<SuggestResult>(
      `/products/${product.id}/suggest?quantity=${qty}`
    )
    setSuggestions(result.suggestions)
  }

  const allocate = async (locationId: string) => {
    setError(null)
    try {
      await apiRequest(`/products/${product.id}/allocate`, {
        method: 'POST',
        body: { locationId, quantity: Number(quantity) || 1 }
      })
      setSuggestions([])
      await reload(product.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alocar')
    }
  }

  const reallocate = async (toLocationId: string) => {
    if (!movingFrom) {
      return
    }
    setError(null)
    try {
      await apiRequest('/products/reallocate', {
        method: 'POST',
        body: {
          productId: product.id,
          fromLocationId: movingFrom.locationId,
          toLocationId,
          quantity: movingFrom.quantity
        }
      })
      setMovingFrom(null)
      setSuggestions([])
      await reload(product.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realocar')
    }
  }

  const startMove = async (allocation: Allocation) => {
    setMovingFrom(allocation)
    await suggest(allocation.quantity)
  }

  return (
    <Modal
      open={product !== null}
      title={`Estoque • ${product.name}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estoque
            </p>
            <p className="text-lg font-semibold">{detail?.quantity ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alocado
            </p>
            <p className="text-lg font-semibold">
              {detail?.allocatedQuantity ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sem local
            </p>
            <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
              {detail?.unallocatedQuantity ?? 0}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Alocações atuais
          </p>
          {allocations.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma alocação ainda.</p>
          )}
          <div className="flex flex-col gap-2">
            {allocations.map((alloc) => (
              <div
                key={alloc.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                <div>
                  <span className="font-medium">{alloc.location?.code}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    • {alloc.location?.area?.name ?? '-'} • acesso{' '}
                    {alloc.location?.accessibility}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{alloc.quantity}</span>
                  {canWrite && (
                    <Button variant="ghost" onClick={() => startMove(alloc)}>
                      Realocar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canWrite && (
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <FiZap className="text-amber-500" />
              {movingFrom
                ? `Realocando ${movingFrom.quantity} un. de ${movingFrom.location?.code}`
                : 'Sugerir local (heurística de slotting)'}
            </p>
            {!movingFrom && (
              <div className="mb-3 flex items-end gap-2">
                <div className="w-32">
                  <Input
                    label="Quantidade"
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => suggest(Number(quantity) || 1)}
                >
                  Sugerir
                </Button>
              </div>
            )}

            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <div
                  key={s.locationId}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                >
                  <div>
                    <span className="font-medium">{s.code}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {' '}
                      • {s.areaName ?? '-'} • acesso {s.accessibility}
                      {s.available != null ? ` • livre ${s.available}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {Math.round(s.score)}/10
                    </span>
                    <Button
                      type="button"
                      onClick={() =>
                        movingFrom
                          ? reallocate(s.locationId)
                          : allocate(s.locationId)
                      }
                    >
                      <FiArrowRight />
                    </Button>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-xs text-slate-400">
                  Clique em “Sugerir” para ver os melhores locais disponíveis.
                </p>
              )}
            </div>

            {movingFrom && (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setMovingFrom(null)
                  setSuggestions([])
                }}
              >
                Cancelar realocação
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
