'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import type { Area, Warehouse } from '@/lib/types'

interface FormState {
  code: string
  name: string
  warehouseId: string
  barcode: string
}

const emptyForm: FormState = {
  code: '',
  name: '',
  warehouseId: '',
  barcode: ''
}

export default function AreasPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.AREAS_WRITE)
  const [areas, setAreas] = useState<Area[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [areaData, warehouseData] = await Promise.all([
      apiRequest<Area[]>('/areas'),
      apiRequest<Warehouse[]>('/warehouses')
    ])
    setAreas(areaData)
    setWarehouses(warehouseData)
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

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
      barcode: area.barcode ?? ''
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
        barcode: form.barcode || undefined
      }
      if (editingId) {
        await apiRequest(`/areas/${editingId}`, { method: 'PATCH', body })
      } else {
        await apiRequest('/areas', { method: 'POST', body })
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover esta área?')) {
      return
    }
    await apiRequest(`/areas/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <PageHeader
        title="Áreas"
        description="Cadastro de áreas vinculadas aos galpões"
        action={canWrite && <Button onClick={openCreate}>Nova área</Button>}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Galpão</th>
              <th className="px-4 py-3 font-medium">Código de barras</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {areas.map((area) => (
              <tr key={area.id}>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {area.code}
                </td>
                <td className="px-4 py-3">{area.name}</td>
                <td className="px-4 py-3 text-slate-500">
                  {area.warehouse?.name ?? '-'}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {area.barcode ?? '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => openEdit(area)}>
                        Editar
                      </Button>
                      <Button variant="danger" onClick={() => remove(area.id)}>
                        Remover
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhuma área cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          <Input
            label="Código de barras / QR"
            value={form.barcode}
            onChange={(event) =>
              setForm({ ...form, barcode: event.target.value })
            }
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
    </div>
  )
}
