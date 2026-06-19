'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CodeLabel } from '@/components/CodeLabel'
import type { Aisle, Area } from '@/lib/types'

interface CorridorsModalProps {
  area: Area | null
  canWrite: boolean
  onClose: () => void
  onChanged: () => void
}

export function CorridorsModal({
  area,
  canWrite,
  onClose,
  onChanged
}: CorridorsModalProps) {
  const [estantes, setEstantes] = useState<Aisle[]>([])
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [levels, setLevels] = useState('3')
  const [positions, setPositions] = useState('6')
  const [error, setError] = useState<string | null>(null)
  const [labelAisle, setLabelAisle] = useState<Aisle | null>(null)

  const nextCode = (list: Aisle[]) => {
    const i = list.length
    return `${String.fromCharCode(65 + (i % 26))}${i + 1}`
  }

  const load = useCallback(async (areaId: string) => {
    const data = await apiRequest<Aisle[]>(`/aisles?areaId=${areaId}`)
    setEstantes(data)
    setCode(nextCode(data))
    setLabel('')
  }, [])

  useEffect(() => {
    if (area) {
      setError(null)
      setLevels(String(area.levels))
      setPositions(String(area.positionsPerLevel))
      load(area.id).catch(() => undefined)
    }
  }, [area, load])

  if (!area) {
    return null
  }

  const add = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await apiRequest('/aisles', {
        method: 'POST',
        body: {
          areaId: area.id,
          code,
          label: label || undefined,
          levels: Number(levels) || 1,
          positionsPerLevel: Number(positions) || 1
        }
      })
      await load(area.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remover esta estante e suas posições?')) {
      return
    }
    await apiRequest(`/aisles/${id}`, { method: 'DELETE' })
    await load(area.id)
    onChanged()
  }

  return (
    <Modal
      open={area !== null}
      title={`Estantes • ${area.name}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {estantes.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhuma estante. Adicione abaixo ou use “gerar localizações”.
            </p>
          )}
          {estantes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <div>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  🗄 {c.label || c.code}
                </span>
                <span className="ml-2 text-slate-500 dark:text-slate-400">
                  {c.levels} níveis × {c.positionsPerLevel} pts •{' '}
                  {c._count?.locations ?? 0} locais
                </span>
                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Corredores: {c.corridorFront ?? '-'} / {c.corridorBack ?? '-'}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={() => setLabelAisle(c)}
                  title="Etiqueta da estante"
                >
                  <FiPrinter />
                </Button>
                {canWrite && (
                  <Button variant="danger" onClick={() => remove(c.id)}>
                    <FiTrash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canWrite && (
          <form
            onSubmit={add}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Nova estante
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Código"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
              <Input
                label="Label (opcional)"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Auto = igual ao código"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Níveis"
                type="number"
                min="1"
                value={levels}
                onChange={(event) => setLevels(event.target.value)}
              />
              <Input
                label="Pontos"
                type="number"
                min="1"
                value={positions}
                onChange={(event) => setPositions(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit">
                <FiPlus /> Adicionar estante
              </Button>
            </div>
          </form>
        )}
      </div>

      <Modal
        open={labelAisle !== null}
        title="Etiqueta da estante"
        onClose={() => setLabelAisle(null)}
      >
        {labelAisle && (
          <CodeLabel
            value={labelAisle.barcode || labelAisle.code}
            title={`Estante ${labelAisle.label || labelAisle.code}`}
            subtitle={`${area.name} • ${area.code}`}
          />
        )}
      </Modal>
    </Modal>
  )
}
