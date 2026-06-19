'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconType } from 'react-icons'
import {
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMaximize,
  FiPackage,
  FiShield,
  FiTrendingUp,
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
    href: '/products',
    label: 'Produtos',
    icon: FiPackage,
    permission: PERMISSIONS.PRODUCTS_READ
  },
  {
    href: '/suggestions',
    label: 'Sugestões',
    icon: FiTrendingUp,
    permission: PERMISSIONS.PRODUCTS_READ
  },
  {
    href: '/scanner',
    label: 'Leitor',
    icon: TbQrcode,
    permission: PERMISSIONS.AREAS_READ
  },
  {
    href: '/warehouse-map',
    label: 'Mapa 3D',
    icon: FiMaximize,
    permission: PERMISSIONS.WAREHOUSES_READ
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

const STORAGE_KEY = 'wms_sidebar_collapsed'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { hasPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-slate-900 text-slate-100 shadow-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <TbQrcode />
            </span>
            <span className={collapsed ? 'lg:hidden' : ''}>WMS</span>
          </div>
          <button
            onClick={toggleCollapsed}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex"
            aria-label="Recolher menu"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
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
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  collapsed ? 'lg:justify-center' : ''
                } ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="shrink-0 text-lg" />
                <span className={collapsed ? 'lg:hidden' : ''}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <ThemeToggle collapsed={collapsed} />
        </div>
      </aside>
    </>
  )
}
