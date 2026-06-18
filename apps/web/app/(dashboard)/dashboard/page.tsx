'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Area, Warehouse } from '@/lib/types'

interface StatCard {
  label: string
  value: number | string
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const [stats, setStats] = useState<StatCard[]>([])

  useEffect(() => {
    const load = async () => {
      const cards: StatCard[] = []
      if (hasPermission(PERMISSIONS.WAREHOUSES_READ)) {
        const warehouses = await apiRequest<Warehouse[]>('/warehouses')
        cards.push({ label: 'Galpões', value: warehouses.length })
      }
      if (hasPermission(PERMISSIONS.AREAS_READ)) {
        const areas = await apiRequest<Area[]>('/areas')
        cards.push({ label: 'Áreas', value: areas.length })
      }
      cards.push({ label: 'Perfil', value: user?.roleName ?? '-' })
      setStats(cards)
    }
    load().catch(() => undefined)
  }, [hasPermission, user])

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${user?.name ?? ''}`}
        description="Visão geral do sistema de gestão de armazém"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
