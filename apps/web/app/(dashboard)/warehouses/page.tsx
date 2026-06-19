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
import type { Warehouse } from '@/lib/types'

interface FormState {
  code: string
  name: string
  address: string
}

const emptyForm: FormState = { code: '', name: '', address: '' }

export default function WarehousesPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.WAREHOUSES_WRITE)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await apiRequest<Warehouse[]>('/warehouses')
    setWarehouses(data)
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
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
        await apiRequest(`/warehouses/${editingId}`, {
          method: 'PATCH',
          body
        })
      } else {
        await apiRequest('/warehouses', { method: 'POST', body })
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover este galpão?')) {
      return
    }
    await apiRequest(`/warehouses/${id}`, { method: 'DELETE' })
    await load()
  }

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Endereço</th>
              <th className="px-4 py-3 font-medium">Áreas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {warehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 font-medium">{warehouse.code}</td>
                <td className="px-4 py-3">{warehouse.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {warehouse.address ?? '-'}
                </td>
                <td className="px-4 py-3">{warehouse._count?.areas ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => openEdit(warehouse)}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => remove(warehouse.id)}
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {warehouses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Nenhum galpão cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
