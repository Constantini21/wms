'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconType } from 'react-icons'
import {
  FiGrid,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMaximize,
  FiShield,
  FiUsers
} from 'react-icons/fi'
import { TbQrcode } from 'react-icons/tb'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  href: string
  label: string
  icon: IconType
  permission?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: FiHome },
  {
    href: '/warehouses',
    label: 'Galpões',
    icon: FiGrid,
    permission: PERMISSIONS.WAREHOUSES_READ
  },
  {
    href: '/areas',
    label: 'Áreas',
    icon: FiLayers,
    permission: PERMISSIONS.AREAS_READ
  },
  {
    href: '/locations',
    label: 'Localizações',
    icon: FiMapPin,
    permission: PERMISSIONS.LOCATIONS_READ
  },
  {
    href: '/warehouse-map',
    label: 'Mapa 3D',
    icon: FiMaximize,
    permission: PERMISSIONS.WAREHOUSES_READ
  },
  {
    href: '/scanner',
    label: 'Leitor',
    icon: TbQrcode,
    permission: PERMISSIONS.AREAS_READ
  },
  {
    href: '/users',
    label: 'Usuários',
    icon: FiUsers,
    permission: PERMISSIONS.USERS_READ
  },
  {
    href: '/roles',
    label: 'Permissões',
    icon: FiShield,
    permission: PERMISSIONS.ROLES_READ
  }
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { hasPermission } = useAuth()

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-slate-900 text-slate-100 shadow-xl transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-6 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <TbQrcode />
          </span>
          <span>WMS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="text-lg" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
