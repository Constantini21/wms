'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CodeLabel } from '@/components/CodeLabel'
import { aisleSchema, type AisleInput } from '@/lib/schemas/aisle'
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
  const [error, setError] = useState<string | null>(null)
  const [labelAisle, setLabelAisle] = useState<Aisle | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AisleInput>({
    resolver: zodResolver(aisleSchema),
    defaultValues: {
      code: '',
      label: '',
      corridorFront: '',
      corridorBack: '',
      levels: 3,
      positionsPerLevel: 6
    }
  })

  const nextCode = (list: Aisle[]) => {
    const i = list.length
    return `${String.fromCharCode(65 + (i % 26))}${i + 1}`
  }

  const load = useCallback(
    async (areaId: string, levels: number, positions: number) => {
      const data = await apiRequest<Aisle[]>(`/aisles?areaId=${areaId}`)
      setEstantes(data)
      reset({
        code: nextCode(data),
        label: '',
        corridorFront: '',
        corridorBack: '',
        levels,
        positionsPerLevel: positions
      })
    },
    [reset]
  )

  useEffect(() => {
    if (area) {
      setError(null)
      load(area.id, area.levels, area.positionsPerLevel).catch(() => undefined)
    }
  }, [area, load])

  if (!area) {
    return null
  }

  const add = async (values: AisleInput) => {
    setError(null)
    try {
      await apiRequest('/aisles', {
        method: 'POST',
        body: {
          areaId: area.id,
          code: values.code,
          label: values.label || undefined,
          corridorFront: values.corridorFront || undefined,
          corridorBack: values.corridorBack || undefined,
          levels: values.levels,
          positionsPerLevel: values.positionsPerLevel
        }
      })
      await load(area.id, area.levels, area.positionsPerLevel)
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
    await load(area.id, area.levels, area.positionsPerLevel)
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
            onSubmit={handleSubmit(add)}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Nova estante
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Código"
                info="Código da estante (ex.: A1). Gerado automaticamente, mas editável."
                error={errors.code?.message}
                {...register('code')}
              />
              <Input
                label="Label (opcional)"
                info="Rótulo amigável exibido nas etiquetas. Em branco = igual ao código."
                placeholder="Auto = igual ao código"
                error={errors.label?.message}
                {...register('label')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Corredor frente"
                info="Corredor de acesso à frente da estante (ex.: A-01). Em branco = gerado automático."
                placeholder="Ex.: A-01"
                error={errors.corridorFront?.message}
                {...register('corridorFront')}
              />
              <Input
                label="Corredor fundo"
                info="Corredor de acesso aos fundos da estante (ex.: A-02). Em branco = gerado automático."
                placeholder="Ex.: A-02"
                error={errors.corridorBack?.message}
                {...register('corridorBack')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Níveis"
                info="Número de níveis (andares da prateleira) desta estante."
                type="number"
                min="1"
                error={errors.levels?.message}
                {...register('levels')}
              />
              <Input
                label="Pontos"
                info="Número de posições (pontos) por nível desta estante."
                type="number"
                min="1"
                error={errors.positionsPerLevel?.message}
                {...register('positionsPerLevel')}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
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
