'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { CodeLabel } from '@/components/CodeLabel'
import type { Area, Location } from '@/lib/types'

interface FormState {
  code: string
  name: string
  areaId: string
  aisle: string
  floor: string
  position: string
  barcode: string
}

const emptyForm: FormState = {
  code: '',
  name: '',
  areaId: '',
  aisle: '',
  floor: '',
  position: '',
  barcode: ''
}

export default function LocationsPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.LOCATIONS_WRITE)
  const [locations, setLocations] = useState<Location[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [labelLocation, setLabelLocation] = useState<Location | null>(null)

  const load = useCallback(async () => {
    const [locationData, areaData] = await Promise.all([
      apiRequest<Location[]>('/locations'),
      apiRequest<Area[]>('/areas')
    ])
    setLocations(locationData)
    setAreas(areaData)
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

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
      barcode: location.barcode ?? ''
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
        barcode: form.barcode || undefined
      }
      if (editingId) {
        await apiRequest(`/locations/${editingId}`, { method: 'PATCH', body })
        setModalOpen(false)
        await load()
      } else {
        const created = await apiRequest<Location>('/locations', {
          method: 'POST',
          body
        })
        setModalOpen(false)
        await load()
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
    await load()
  }

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Área</th>
              <th className="px-4 py-3 font-medium">Corredor</th>
              <th className="px-4 py-3 font-medium">Andar</th>
              <th className="px-4 py-3 font-medium">Posição</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {locations.map((location) => (
              <tr
                key={location.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 font-medium">{location.code}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {location.area?.name ?? '-'}
                </td>
                <td className="px-4 py-3">{location.aisle ?? '-'}</td>
                <td className="px-4 py-3">{location.floor ?? '-'}</td>
                <td className="px-4 py-3">{location.position ?? '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setLabelLocation(location)}
                      title="Ver / imprimir etiqueta"
                    >
                      <FiPrinter />
                    </Button>
                    {canWrite && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(location)}
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => remove(location.id)}
                        >
                          <FiTrash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhuma localização cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
