'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  FiColumns,
  FiEdit2,
  FiGrid,
  FiMapPin,
  FiPlus,
  FiPrinter,
  FiTrash2
} from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable, Column } from '@/components/ui/DataTable'
import { CodeLabel } from '@/components/CodeLabel'
import { CorridorsModal } from './CorridorsModal'
import { areaSchema, areaDefaults, type AreaInput } from '@/lib/schemas/area'
import type { Area, Paginated, Warehouse } from '@/lib/types'

const PAGE_SIZE = 20

export default function AreasPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  const canWrite = hasPermission(PERMISSIONS.AREAS_WRITE)
  const [areas, setAreas] = useState<Area[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [labelArea, setLabelArea] = useState<Area | null>(null)
  const [corridorsArea, setCorridorsArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AreaInput>({
    resolver: zodResolver(areaSchema),
    defaultValues: areaDefaults
  })

  const selectedWarehouseId = watch('warehouseId')
  const floorCount =
    warehouses.find((w) => w.id === selectedWarehouseId)?.floors ?? 1

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<Area>>(
      `/areas?page=${target}&pageSize=${PAGE_SIZE}`
    )
    setAreas(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  const loadWarehouses = useCallback(async () => {
    const result = await apiRequest<Paginated<Warehouse>>(
      '/warehouses?all=true'
    )
    setWarehouses(result.data)
  }, [])

  useEffect(() => {
    load(1).catch(() => undefined)
    loadWarehouses().catch(() => undefined)
  }, [load, loadWarehouses])

  const openCreate = () => {
    setEditingId(null)
    reset({ ...areaDefaults, warehouseId: warehouses[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (area: Area) => {
    setEditingId(area.id)
    reset({
      code: area.code,
      name: area.name,
      warehouseId: area.warehouseId,
      barcode: area.barcode ?? '',
      aisles: area.aisles,
      levels: area.levels,
      positionsPerLevel: area.positionsPerLevel,
      floor: area.floor
    })
    setError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: AreaInput) => {
    setError(null)
    try {
      const body = {
        code: values.code,
        name: values.name,
        warehouseId: values.warehouseId,
        barcode: values.barcode || undefined,
        aisles: values.aisles,
        levels: values.levels,
        positionsPerLevel: values.positionsPerLevel,
        floor: values.floor
      }
      if (editingId) {
        await apiRequest(`/areas/${editingId}`, { method: 'PATCH', body })
        setModalOpen(false)
        await load(page)
      } else {
        const created = await apiRequest<Area>('/areas', {
          method: 'POST',
          body
        })
        setModalOpen(false)
        await load(1)
        const warehouse = warehouses.find((w) => w.id === created.warehouseId)
        setLabelArea({ ...created, warehouse })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const generate = async (area: Area) => {
    const slots = area.aisles * area.levels * area.positionsPerLevel
    if (
      !window.confirm(
        `Gerar ${slots} localizações para "${area.name}" (${area.aisles} estantes × ${area.levels} níveis × ${area.positionsPerLevel} posições)? As localizações atuais desta área serão substituídas.`
      )
    ) {
      return
    }
    setBusy(area.id)
    try {
      await apiRequest(`/areas/${area.id}/generate-locations`, {
        method: 'POST'
      })
      await load(page)
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover esta área?')) {
      return
    }
    await apiRequest(`/areas/${id}`, { method: 'DELETE' })
    const nextPage = areas.length === 1 && page > 1 ? page - 1 : page
    await load(nextPage)
  }

  const columns: Column<Area>[] = [
    {
      header: 'Código',
      cell: (a) => <span className="font-medium">{a.code}</span>
    },
    { header: 'Nome', cell: (a) => a.name },
    {
      header: 'Galpão',
      cell: (a) => (
        <span className="text-slate-500 dark:text-slate-400">
          {a.warehouse?.name ?? '-'}
        </span>
      )
    },
    {
      header: 'Estrutura',
      cell: (a) => (
        <span className="text-slate-500 dark:text-slate-400">
          {a.aisles} est × {a.levels} nív × {a.positionsPerLevel} pts
        </span>
      )
    },
    {
      header: 'Locais',
      cell: (a) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {a._count?.locations ?? 0}
        </span>
      )
    },
    {
      header: '',
      align: 'right',
      cell: (a) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                `/warehouse-map?warehouse=${a.warehouseId}&area=${a.id}`
              )
            }
            title="Ver no mapa 3D"
          >
            <FiMapPin />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLabelArea(a)}
            title="Ver / imprimir etiqueta"
          >
            <FiPrinter />
          </Button>
          {canWrite && (
            <>
              <Button
                variant="ghost"
                onClick={() => setCorridorsArea(a)}
                title="Estantes"
              >
                <FiColumns />
              </Button>
              <Button
                variant="ghost"
                onClick={() => generate(a)}
                disabled={busy === a.id}
                title="Gerar localizações (estantes, níveis e pontos)"
              >
                <FiGrid />
              </Button>
              <Button variant="ghost" onClick={() => openEdit(a)}>
                <FiEdit2 />
              </Button>
              <Button variant="danger" onClick={() => remove(a.id)}>
                <FiTrash2 />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        title="Áreas"
        description="Áreas com estantes de vários níveis e pontos por corredor"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Nova área
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={areas}
        rowKey={(a) => a.id}
        emptyMessage="Nenhuma área cadastrada"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => load(p)}
      />

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar área' : 'Nova área'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="Galpão"
            info="Galpão (prédio) ao qual esta área pertence."
            error={errors.warehouseId?.message}
            {...register('warehouseId')}
          >
            <option value="" disabled>
              Selecione um galpão
            </option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
          <Input
            label="Código"
            info="Código curto e único da área dentro do galpão (ex.: A-01). Aparece nas etiquetas e endereços."
            error={errors.code?.message}
            {...register('code')}
          />
          <Input
            label="Nome"
            info="Nome descritivo da área (ex.: Recebimento, Picking). Apenas para identificação."
            error={errors.name?.message}
            {...register('name')}
          />
          <Select
            label="Andar do galpão"
            info="Em qual andar (piso) do prédio esta área fica. Definido pelo nº de andares do galpão."
            error={errors.floor?.message}
            {...register('floor')}
          >
            {Array.from({ length: floorCount }).map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Andar {i + 1}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Estantes"
              info="Quantas estantes (prateleiras) esta área tem. Cada estante recebe um código (A1, B2...)."
              error={errors.aisles?.message}
              {...register('aisles')}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </Select>
            <Select
              label="Níveis"
              info="Quantos níveis (andares da prateleira) cada estante tem. Níveis baixos = acesso mais fácil."
              error={errors.levels?.message}
              {...register('levels')}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </Select>
            <Select
              label="Pontos/nível"
              info="Quantas posições (pontos) cada nível tem. Cada ponto é um endereço único de armazenagem."
              error={errors.positionsPerLevel?.message}
              {...register('positionsPerLevel')}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-slate-400">
            Após salvar, use o botão de grade na lista para gerar as
            localizações (cada nível recebe acessibilidade automática: níveis
            baixos = acesso mais fácil).
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={labelArea !== null}
        title="Etiqueta da área"
        onClose={() => setLabelArea(null)}
      >
        {labelArea && (
          <CodeLabel
            value={labelArea.barcode || labelArea.code}
            title={labelArea.name}
            subtitle={`Galpão: ${labelArea.warehouse?.name ?? '-'} • Código: ${labelArea.code}`}
          />
        )}
      </Modal>

      <CorridorsModal
        area={corridorsArea}
        canWrite={canWrite}
        onClose={() => setCorridorsArea(null)}
        onChanged={() => load(page)}
      />
    </div>
  )
}
