'use client'

import { useEffect, useState } from 'react'
import { IconType } from 'react-icons'
import { FiGrid, FiLayers, FiMapPin, FiUser } from 'react-icons/fi'
import { useAuth } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Area, Location, Paginated, Warehouse } from '@/lib/types'

interface StatCard {
  label: string
  value: number | string
  icon: IconType
  color: string
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const [stats, setStats] = useState<StatCard[]>([])

  useEffect(() => {
    const load = async () => {
      const cards: StatCard[] = []
      if (hasPermission(PERMISSIONS.WAREHOUSES_READ)) {
        const warehouses = await apiRequest<Paginated<Warehouse>>(
          '/warehouses?pageSize=1'
        )
        cards.push({
          label: 'Galpões',
          value: warehouses.total,
          icon: FiGrid,
          color: 'from-blue-500 to-blue-600'
        })
      }
      if (hasPermission(PERMISSIONS.AREAS_READ)) {
        const areas = await apiRequest<Paginated<Area>>('/areas?pageSize=1')
        cards.push({
          label: 'Áreas',
          value: areas.total,
          icon: FiLayers,
          color: 'from-indigo-500 to-indigo-600'
        })
      }
      if (hasPermission(PERMISSIONS.LOCATIONS_READ)) {
        const locations = await apiRequest<Paginated<Location>>(
          '/locations?pageSize=1'
        )
        cards.push({
          label: 'Localizações',
          value: locations.total,
          icon: FiMapPin,
          color: 'from-emerald-500 to-emerald-600'
        })
      }
      cards.push({
        label: 'Perfil',
        value: user?.roleName ?? '-',
        icon: FiUser,
        color: 'from-slate-500 to-slate-600'
      })
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white ${stat.color}`}
              >
                <Icon className="text-xl" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-slate-100">
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
