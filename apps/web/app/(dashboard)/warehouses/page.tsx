'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { DataTable, Column } from '@/components/ui/DataTable'
import {
  warehouseSchema,
  warehouseDefaults,
  type WarehouseInput
} from '@/lib/schemas/warehouse'
import type { Paginated, Warehouse } from '@/lib/types'

const PAGE_SIZE = 20

export default function WarehousesPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.WAREHOUSES_WRITE)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouseDefaults
  })

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
    reset(warehouseDefaults)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id)
    reset({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address ?? '',
      floors: warehouse.floors
    })
    setError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: WarehouseInput) => {
    setError(null)
    try {
      const body = {
        code: values.code,
        name: values.name,
        address: values.address || undefined,
        floors: values.floors
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
      header: 'Andares',
      cell: (w) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {w.floors}
        </span>
      )
    },
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Código"
            info="Código curto e único do galpão (ex.: GAL-01). Aparece em endereços e relatórios."
            error={errors.code?.message}
            {...register('code')}
          />
          <Input
            label="Nome"
            info="Nome descritivo do galpão (ex.: Centro de Distribuição Sul)."
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Andares do galpão"
            info="Quantidade de pisos (pavimentos) do prédio. Define os andares disponíveis ao cadastrar áreas."
            type="number"
            min="1"
            error={errors.floors?.message}
            {...register('floors')}
          />
          <Input
            label="Endereço"
            info="Endereço físico do galpão (opcional)."
            error={errors.address?.message}
            {...register('address')}
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
    </div>
  )
}
