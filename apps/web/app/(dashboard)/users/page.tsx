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
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { DataTable, Column } from '@/components/ui/DataTable'
import { userSchema, userDefaults, type UserInput } from '@/lib/schemas/user'
import type { Paginated, Role, User } from '@/lib/types'

const PAGE_SIZE = 20

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.USERS_WRITE)
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting }
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: userDefaults
  })

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<User>>(
      `/users?page=${target}&pageSize=${PAGE_SIZE}`
    )
    setUsers(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  const loadRoles = useCallback(async () => {
    const result = await apiRequest<Paginated<Role>>('/roles?all=true')
    setRoles(result.data)
  }, [])

  useEffect(() => {
    load(1).catch(() => undefined)
    loadRoles().catch(() => undefined)
  }, [load, loadRoles])

  const openCreate = () => {
    setEditingId(null)
    reset({ ...userDefaults, roleId: roles[0]?.id ?? '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingId(user.id)
    reset({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId,
      active: user.active
    })
    setError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: UserInput) => {
    setError(null)
    if (!editingId && !values.password) {
      setFieldError('password', { message: 'Informe a senha' })
      return
    }
    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          name: values.name,
          email: values.email,
          roleId: values.roleId,
          active: values.active
        }
        if (values.password) {
          body.password = values.password
        }
        await apiRequest(`/users/${editingId}`, { method: 'PATCH', body })
        setModalOpen(false)
        await load(page)
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: {
            name: values.name,
            email: values.email,
            password: values.password,
            roleId: values.roleId,
            active: values.active
          }
        })
        setModalOpen(false)
        await load(1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover este usuário?')) {
      return
    }
    await apiRequest(`/users/${id}`, { method: 'DELETE' })
    const nextPage = users.length === 1 && page > 1 ? page - 1 : page
    await load(nextPage)
  }

  const columns: Column<User>[] = [
    {
      header: 'Nome',
      cell: (u) => <span className="font-medium">{u.name}</span>
    },
    {
      header: 'E-mail',
      cell: (u) => (
        <span className="text-slate-500 dark:text-slate-400">{u.email}</span>
      )
    },
    { header: 'Perfil', cell: (u) => u.role.name },
    {
      header: 'Status',
      cell: (u) => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            u.active
              ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {u.active ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    {
      header: '',
      align: 'right',
      cell: (u) =>
        canWrite && (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => openEdit(u)}>
              <FiEdit2 />
            </Button>
            <Button variant="danger" onClick={() => remove(u.id)}>
              <FiTrash2 />
            </Button>
          </div>
        )
    }
  ]

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários e seus perfis de acesso"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Novo usuário
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(u) => u.id}
        emptyMessage="Nenhum usuário cadastrado"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => load(p)}
      />

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar usuário' : 'Novo usuário'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nome"
            info="Nome completo do usuário."
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="E-mail"
            info="E-mail usado para login e identificação do usuário."
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={editingId ? 'Senha (deixe em branco para manter)' : 'Senha'}
            info="Mínimo de 6 caracteres. Na edição, deixe em branco para manter a senha atual."
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select
            label="Perfil"
            info="Perfil de acesso que define as permissões do usuário."
            error={errors.roleId?.message}
            {...register('roleId')}
          >
            <option value="" disabled>
              Selecione um perfil
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" {...register('active')} />
            Usuário ativo
          </label>
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
