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
import type { Permission, Role } from '@/lib/types'

interface FormState {
  name: string
  description: string
  permissionKeys: string[]
}

const emptyForm: FormState = { name: '', description: '', permissionKeys: [] }

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.ROLES_WRITE)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [roleData, permissionData] = await Promise.all([
      apiRequest<Role[]>('/roles'),
      apiRequest<Permission[]>('/roles/permissions')
    ])
    setRoles(roleData)
    setPermissions(permissionData)
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

  const openEdit = (role: Role) => {
    setEditingId(role.id)
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissionKeys: role.permissionKeys
    })
    setError(null)
    setModalOpen(true)
  }

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissionKeys: prev.permissionKeys.includes(key)
        ? prev.permissionKeys.filter((item) => item !== key)
        : [...prev.permissionKeys, key]
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        permissionKeys: form.permissionKeys
      }
      if (editingId) {
        await apiRequest(`/roles/${editingId}`, { method: 'PATCH', body })
      } else {
        await apiRequest('/roles', { method: 'POST', body })
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover este perfil?')) {
      return
    }
    await apiRequest(`/roles/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <PageHeader
        title="Perfis e permissões"
        description="Defina os perfis de acesso e suas permissões"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Novo perfil
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {role.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {role.description ?? 'Sem descrição'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {role.permissionKeys.map((key) => (
                <span
                  key={key}
                  className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                >
                  {key}
                </span>
              ))}
              {role.permissionKeys.length === 0 && (
                <span className="text-xs text-slate-400">
                  Nenhuma permissão
                </span>
              )}
            </div>
            {canWrite && (
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => openEdit(role)}>
                  <FiEdit2 /> Editar
                </Button>
                <Button variant="danger" onClick={() => remove(role.id)}>
                  <FiTrash2 /> Remover
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar perfil' : 'Novo perfil'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Input
            label="Descrição"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Permissões
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={form.permissionKeys.includes(permission.key)}
                    onChange={() => togglePermission(permission.key)}
                  />
                  {permission.key}
                </label>
              ))}
            </div>
          </div>
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
