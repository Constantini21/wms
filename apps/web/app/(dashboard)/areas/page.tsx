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
import { DataTable, Column } from '@/components/ui/DataTable'
import { CodeLabel } from '@/components/CodeLabel'
import type { Area, Paginated, Warehouse } from '@/lib/types'

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
const PAGE_SIZE = 20

export default function AreasPage() {
  const { hasPermission } = useAuth()
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
      header: 'Cód. barras',
      cell: (a) => (
        <span className="text-slate-500 dark:text-slate-400">
          {a.barcode ?? '-'}
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
            onClick={() => setLabelArea(a)}
            title="Ver / imprimir etiqueta"
          >
            <FiPrinter />
          </Button>
          {canWrite && (
            <>
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
        description="Cadastro de áreas vinculadas aos galpões"
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
    </div>
  )
}
