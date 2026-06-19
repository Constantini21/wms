'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiEdit2, FiMapPin, FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { RangeField } from '@/components/ui/RangeField'
import { DataTable, Column } from '@/components/ui/DataTable'
import { CodeLabel } from '@/components/CodeLabel'
import type { Area, Location, Paginated } from '@/lib/types'

interface FormState {
  code: string
  name: string
  areaId: string
  aisle: string
  floor: string
  position: string
  barcode: string
  accessibility: number
  capacity: string
}

const emptyForm: FormState = {
  code: '',
  name: '',
  areaId: '',
  aisle: '',
  floor: '',
  position: '',
  barcode: '',
  accessibility: 5,
  capacity: ''
}
const PAGE_SIZE = 20

export default function LocationsPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  const canWrite = hasPermission(PERMISSIONS.LOCATIONS_WRITE)
  const [locations, setLocations] = useState<Location[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [areas, setAreas] = useState<Area[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [labelLocation, setLabelLocation] = useState<Location | null>(null)

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<Location>>(
      `/locations?page=${target}&pageSize=${PAGE_SIZE}`
    )
    setLocations(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  const loadAreas = useCallback(async () => {
    const result = await apiRequest<Paginated<Area>>('/areas?all=true')
    setAreas(result.data)
  }, [])

  useEffect(() => {
    load(1).catch(() => undefined)
    loadAreas().catch(() => undefined)
  }, [load, loadAreas])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, areaId: areas[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (location: Location) => {
    setEditingId(location.id)
    setForm({
      code: location.code,
      name: location.name ?? '',
      areaId: location.areaId,
      aisle: location.aisle ?? '',
      floor: location.floor ?? '',
      position: location.position ?? '',
      barcode: location.barcode ?? '',
      accessibility: location.accessibility ?? 5,
      capacity: location.capacity?.toString() ?? ''
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
        name: form.name || undefined,
        areaId: form.areaId,
        aisle: form.aisle || undefined,
        floor: form.floor || undefined,
        position: form.position || undefined,
        barcode: form.barcode || undefined,
        accessibility: form.accessibility,
        capacity: form.capacity ? Number(form.capacity) : undefined
      }
      if (editingId) {
        await apiRequest(`/locations/${editingId}`, { method: 'PATCH', body })
        setModalOpen(false)
        await load(page)
      } else {
        const created = await apiRequest<Location>('/locations', {
          method: 'POST',
          body
        })
        setModalOpen(false)
        await load(1)
        const area = areas.find((a) => a.id === created.areaId)
        setLabelLocation({ ...created, area })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover esta localização?')) {
      return
    }
    await apiRequest(`/locations/${id}`, { method: 'DELETE' })
    const nextPage = locations.length === 1 && page > 1 ? page - 1 : page
    await load(nextPage)
  }

  const columns: Column<Location>[] = [
    {
      header: 'Código',
      cell: (l) => <span className="font-medium">{l.code}</span>
    },
    {
      header: 'Área',
      cell: (l) => (
        <span className="text-slate-500 dark:text-slate-400">
          {l.area?.name ?? '-'}
        </span>
      )
    },
    { header: 'Corredor', cell: (l) => l.aisle ?? '-' },
    { header: 'Andar', cell: (l) => l.floor ?? '-' },
    { header: 'Posição', cell: (l) => l.position ?? '-' },
    {
      header: 'Acesso',
      cell: (l) => (
        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          {l.accessibility}/10
        </span>
      )
    },
    {
      header: '',
      align: 'right',
      cell: (l) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                `/warehouse-map?warehouse=${l.area?.warehouse?.id ?? ''}&area=${l.areaId}&location=${l.id}`
              )
            }
            title="Ver no mapa 3D"
          >
            <FiMapPin />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLabelLocation(l)}
            title="Ver / imprimir etiqueta"
          >
            <FiPrinter />
          </Button>
          {canWrite && (
            <>
              <Button variant="ghost" onClick={() => openEdit(l)}>
                <FiEdit2 />
              </Button>
              <Button variant="danger" onClick={() => remove(l.id)}>
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
        title="Localizações"
        description="Posições de estoque: corredor, andar e posição dentro de cada área"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Nova localização
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={locations}
        rowKey={(l) => l.id}
        emptyMessage="Nenhuma localização cadastrada"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => load(p)}
      />

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar localização' : 'Nova localização'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Select
            label="Área"
            value={form.areaId}
            onChange={(event) =>
              setForm({ ...form, areaId: event.target.value })
            }
            required
          >
            <option value="" disabled>
              Selecione uma área
            </option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.warehouse?.name
                  ? `${area.warehouse.name} • ${area.name}`
                  : area.name}
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
            label="Nome (opcional)"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Corredor"
              value={form.aisle}
              onChange={(event) =>
                setForm({ ...form, aisle: event.target.value })
              }
            />
            <Input
              label="Andar"
              value={form.floor}
              onChange={(event) =>
                setForm({ ...form, floor: event.target.value })
              }
            />
            <Input
              label="Posição"
              value={form.position}
              onChange={(event) =>
                setForm({ ...form, position: event.target.value })
              }
            />
          </div>
          <RangeField
            label="Facilidade de acesso"
            value={form.accessibility}
            onChange={(value) => setForm({ ...form, accessibility: value })}
            hint="0 = difícil acesso (alto/fundo), 10 = fácil acesso (frente/altura ideal)"
          />
          <Input
            label="Capacidade (unidades, opcional)"
            type="number"
            value={form.capacity}
            onChange={(event) =>
              setForm({ ...form, capacity: event.target.value })
            }
            placeholder="Vazio = ilimitado"
          />
          <Input
            label="Código de barras / QR (opcional)"
            value={form.barcode}
            onChange={(event) =>
              setForm({ ...form, barcode: event.target.value })
            }
            placeholder="Deixe em branco para usar o código"
          />
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
        open={labelLocation !== null}
        title="Etiqueta da localização"
        onClose={() => setLabelLocation(null)}
      >
        {labelLocation && (
          <CodeLabel
            value={labelLocation.barcode || labelLocation.code}
            title={labelLocation.name || labelLocation.code}
            subtitle={`Área: ${labelLocation.area?.name ?? '-'} • Corredor ${labelLocation.aisle ?? '-'} / Andar ${labelLocation.floor ?? '-'} / Pos ${labelLocation.position ?? '-'}`}
          />
        )}
      </Modal>
    </div>
  )
}
