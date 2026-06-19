'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { DataTable, Column } from '@/components/ui/DataTable'
import type { Paginated, Warehouse } from '@/lib/types'

interface FormState {
  code: string
  name: string
  address: string
}

const emptyForm: FormState = { code: '', name: '', address: '' }
const PAGE_SIZE = 20

export default function WarehousesPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.WAREHOUSES_WRITE)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<Warehouse>>(
      `/warehouses?page=${target}&pageSize=${PAGE_SIZE}`
    )
    setWarehouses(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  useEffect(() => {
    load(1).catch(() => undefined)
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id)
    setForm({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address ?? ''
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
        address: form.address || undefined
      }
      if (editingId) {
        await apiRequest(`/warehouses/${editingId}`, { method: 'PATCH', body })
      } else {
        await apiRequest('/warehouses', { method: 'POST', body })
      }
      setModalOpen(false)
      await load(editingId ? page : 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover este galpão?')) {
      return
    }
    await apiRequest(`/warehouses/${id}`, { method: 'DELETE' })
    const nextPage = warehouses.length === 1 && page > 1 ? page - 1 : page
    await load(nextPage)
  }

  const columns: Column<Warehouse>[] = [
    {
      header: 'Código',
      cell: (w) => <span className="font-medium">{w.code}</span>
    },
    { header: 'Nome', cell: (w) => w.name },
    {
      header: 'Endereço',
      cell: (w) => (
        <span className="text-slate-500 dark:text-slate-400">
          {w.address ?? '-'}
        </span>
      )
    },
    { header: 'Áreas', cell: (w) => w._count?.areas ?? 0 },
    {
      header: '',
      align: 'right',
      cell: (w) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => openEdit(w)}>
              <FiEdit2 />
            </Button>
            <Button variant="danger" onClick={() => remove(w.id)}>
              <FiTrash2 />
            </Button>
          </div>
        )
    }
  ]

  return (
    <div>
      <PageHeader
        title="Galpões"
        description="Cadastro de galpões do armazém"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Novo galpão
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={warehouses}
        rowKey={(w) => w.id}
        emptyMessage="Nenhum galpão cadastrado"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => load(p)}
      />

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar galpão' : 'Novo galpão'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
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
            label="Endereço"
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
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
