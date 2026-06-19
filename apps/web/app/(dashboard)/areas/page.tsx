'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
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
import type { Area, Paginated, Warehouse } from '@/lib/types'

interface FormState {
  code: string
  name: string
  warehouseId: string
  barcode: string
  aisles: string
  levels: string
  positionsPerLevel: string
  floor: string
}

const emptyForm: FormState = {
  code: '',
  name: '',
  warehouseId: '',
  barcode: '',
  aisles: '1',
  levels: '3',
  positionsPerLevel: '6',
  floor: '1'
}
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
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [labelArea, setLabelArea] = useState<Area | null>(null)
  const [corridorsArea, setCorridorsArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

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
    setForm({ ...emptyForm, warehouseId: warehouses[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (area: Area) => {
    setEditingId(area.id)
    setForm({
      code: area.code,
      name: area.name,
      warehouseId: area.warehouseId,
      barcode: area.barcode ?? '',
      aisles: area.aisles.toString(),
      levels: area.levels.toString(),
      positionsPerLevel: area.positionsPerLevel.toString(),
      floor: area.floor.toString()
    })
    setError(null)
    setModalOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const body = {
        code: form.code,
        name: form.name,
        warehouseId: form.warehouseId,
        barcode: form.barcode || undefined,
        aisles: Number(form.aisles) || 1,
        levels: Number(form.levels) || 1,
        positionsPerLevel: Number(form.positionsPerLevel) || 1,
        floor: Number(form.floor) || 1
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
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Select
            label="Galpão"
            value={form.warehouseId}
            onChange={(event) =>
              setForm({ ...form, warehouseId: event.target.value })
            }
            required
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
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            required
          />
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Select
            label="Andar do galpão"
            value={form.floor}
            onChange={(event) =>
              setForm({ ...form, floor: event.target.value })
            }
          >
            {Array.from({
              length:
                warehouses.find((w) => w.id === form.warehouseId)?.floors ?? 1
            }).map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Andar {i + 1}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Estantes"
              type="number"
              min="1"
              value={form.aisles}
              onChange={(event) =>
                setForm({ ...form, aisles: event.target.value })
              }
            />
            <Input
              label="Níveis"
              type="number"
              min="1"
              value={form.levels}
              onChange={(event) =>
                setForm({ ...form, levels: event.target.value })
              }
            />
            <Input
              label="Pontos/nível"
              type="number"
              min="1"
              value={form.positionsPerLevel}
              onChange={(event) =>
                setForm({ ...form, positionsPerLevel: event.target.value })
              }
            />
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
            <Button type="submit">Salvar</Button>
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
