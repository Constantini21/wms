'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  locationSchema,
  locationDefaults,
  type LocationInput
} from '@/lib/schemas/location'
import type { Area, Location, Paginated } from '@/lib/types'

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
  const [error, setError] = useState<string | null>(null)
  const [labelLocation, setLabelLocation] = useState<Location | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: locationDefaults
  })

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
    reset({ ...locationDefaults, areaId: areas[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (location: Location) => {
    setEditingId(location.id)
    reset({
      code: location.code,
      name: location.name ?? '',
      areaId: location.areaId,
      aisle: location.aisle ?? '',
      floor: location.floor ?? '',
      position: location.position ?? '',
      barcode: location.barcode ?? '',
      accessibility: location.accessibility ?? 5,
      capacity: location.capacity ?? undefined
    })
    setError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: LocationInput) => {
    setError(null)
    try {
      const body = {
        code: values.code,
        name: values.name || undefined,
        areaId: values.areaId,
        aisle: values.aisle || undefined,
        floor: values.floor || undefined,
        position: values.position || undefined,
        barcode: values.barcode || undefined,
        accessibility: values.accessibility,
        capacity: values.capacity
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
    { header: 'Estante', cell: (l) => l.aisle ?? '-' },
    { header: 'Nível', cell: (l) => l.floor ?? '-' },
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
        description="Posições de estoque: estante, nível e posição dentro de cada área"
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="Área"
            info="Área (com estantes) onde esta localização fica."
            error={errors.areaId?.message}
            {...register('areaId')}
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
            info="Código único do endereço/localização (ex.: A-07-02)."
            error={errors.code?.message}
            {...register('code')}
          />
          <Input
            label="Nome (opcional)"
            info="Nome descritivo opcional para a localização."
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Estante"
              info="Código da estante a que pertence (ex.: A1)."
              error={errors.aisle?.message}
              {...register('aisle')}
            />
            <Input
              label="Nível"
              info="Nível (andar da prateleira) da localização."
              error={errors.floor?.message}
              {...register('floor')}
            />
            <Input
              label="Posição"
              info="Posição (ponto) dentro do nível."
              error={errors.position?.message}
              {...register('position')}
            />
          </div>
          <Controller
            control={control}
            name="accessibility"
            render={({ field }) => (
              <RangeField
                label="Facilidade de acesso"
                value={field.value}
                onChange={field.onChange}
                hint="0 = difícil acesso (alto/fundo), 10 = fácil acesso (frente/altura ideal)"
              />
            )}
          />
          <Input
            label="Capacidade (unidades, opcional)"
            info="Quantidade máxima de unidades. Em branco = ilimitado."
            type="number"
            error={errors.capacity?.message}
            placeholder="Vazio = ilimitado"
            {...register('capacity')}
          />
          <Input
            label="Código de barras / QR (opcional)"
            info="Código próprio da etiqueta. Em branco = usa o código da localização."
            error={errors.barcode?.message}
            placeholder="Deixe em branco para usar o código"
            {...register('barcode')}
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
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
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
            subtitle={`Área: ${labelLocation.area?.name ?? '-'} • Estante ${labelLocation.aisle ?? '-'} / Nível ${labelLocation.floor ?? '-'} / Pos ${labelLocation.position ?? '-'}`}
          />
        )}
      </Modal>
    </div>
  )
}
