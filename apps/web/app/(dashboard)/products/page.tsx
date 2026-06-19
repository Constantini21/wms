'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { DataTable, Column } from '@/components/ui/DataTable'
import { ScanField } from '@/components/ScanField'
import { RangeField } from '@/components/ui/RangeField'
import { AllocateModal } from './AllocateModal'
import type { Paginated, Product } from '@/lib/types'

interface FormState {
  sku: string
  name: string
  description: string
  barcode: string
  weight: string
  turnoverScore: number
  quantity: string
}

const emptyForm: FormState = {
  sku: '',
  name: '',
  description: '',
  barcode: '',
  weight: '',
  turnoverScore: 5,
  quantity: '0'
}
const PAGE_SIZE = 20

export default function ProductsPage() {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(PERMISSIONS.PRODUCTS_WRITE)
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [allocateProduct, setAllocateProduct] = useState<Product | null>(null)

  const load = useCallback(async (target: number) => {
    const result = await apiRequest<Paginated<Product>>(
      `/products?page=${target}&pageSize=${PAGE_SIZE}`
    )
    setProducts(result.data)
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

  const openEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      barcode: product.barcode ?? '',
      weight: product.weight?.toString() ?? '',
      turnoverScore: product.turnoverScore,
      quantity: product.quantity.toString()
    })
    setError(null)
    setModalOpen(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const body = {
        sku: form.sku,
        name: form.name,
        description: form.description || undefined,
        barcode: form.barcode || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        turnoverScore: form.turnoverScore,
        quantity: form.quantity ? Number(form.quantity) : 0
      }
      if (editingId) {
        await apiRequest(`/products/${editingId}`, { method: 'PATCH', body })
        setModalOpen(false)
        await load(page)
      } else {
        const created = await apiRequest<Product>('/products', {
          method: 'POST',
          body
        })
        setModalOpen(false)
        await load(1)
        setAllocateProduct(created)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Deseja remover este produto?')) {
      return
    }
    await apiRequest(`/products/${id}`, { method: 'DELETE' })
    const nextPage = products.length === 1 && page > 1 ? page - 1 : page
    await load(nextPage)
  }

  const columns: Column<Product>[] = [
    {
      header: 'SKU',
      cell: (p) => <span className="font-medium">{p.sku}</span>
    },
    { header: 'Nome', cell: (p) => p.name },
    {
      header: 'Peso',
      cell: (p) => (
        <span className="text-slate-500 dark:text-slate-400">
          {p.weight != null ? `${p.weight} kg` : '-'}
        </span>
      )
    },
    {
      header: 'Freq. saída',
      cell: (p) => (
        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          {p.turnoverScore}/10
        </span>
      )
    },
    {
      header: 'Estoque',
      cell: (p) => (
        <span>
          {p.quantity}
          {p.unallocatedQuantity ? (
            <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
              ({p.unallocatedQuantity} s/ local)
            </span>
          ) : null}
        </span>
      )
    },
    {
      header: 'Prioridade',
      cell: (p) => (
        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          {Math.round(p.priorityScore)}
        </span>
      )
    },
    {
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            onClick={() => setAllocateProduct(p)}
            title="Alocar / realocar"
          >
            <FiMapPin />
          </Button>
          {canWrite && (
            <>
              <Button variant="ghost" onClick={() => openEdit(p)}>
                <FiEdit2 />
              </Button>
              <Button variant="danger" onClick={() => remove(p.id)}>
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
        title="Produtos"
        description="Cadastro de produtos, estoque e frequência de saída"
        action={
          canWrite && (
            <Button onClick={openCreate}>
              <FiPlus /> Novo produto
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        emptyMessage="Nenhum produto cadastrado"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => load(p)}
      />

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar produto' : 'Novo produto'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="SKU"
            value={form.sku}
            onChange={(event) => setForm({ ...form, sku: event.target.value })}
            required
          />
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <ScanField
            label="Código de barras / QR"
            value={form.barcode}
            onChange={(value) => setForm({ ...form, barcode: value })}
            placeholder="Escaneie ou digite"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.001"
              value={form.weight}
              onChange={(event) =>
                setForm({ ...form, weight: event.target.value })
              }
            />
            <Input
              label="Quantidade em estoque"
              type="number"
              value={form.quantity}
              onChange={(event) =>
                setForm({ ...form, quantity: event.target.value })
              }
            />
          </div>
          <RangeField
            label="Frequência de saída"
            value={form.turnoverScore}
            onChange={(value) => setForm({ ...form, turnoverScore: value })}
            hint="0 = sai raramente, 10 = sai com muita frequência (vai para locais de fácil acesso)"
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

      <AllocateModal
        product={allocateProduct}
        canWrite={canWrite}
        onClose={() => setAllocateProduct(null)}
        onChanged={() => load(page)}
      />
    </div>
  )
}
