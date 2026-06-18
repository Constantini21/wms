'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

interface NavItem {
  href: string
  label: string
  icon: string
  permission?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: '◧' },
  {
    href: '/warehouses',
    label: 'Galpões',
    icon: '▤',
    permission: PERMISSIONS.WAREHOUSES_READ
  },
  {
    href: '/areas',
    label: 'Áreas',
    icon: '▦',
    permission: PERMISSIONS.AREAS_READ
  },
  {
    href: '/scanner',
    label: 'Leitor',
    icon: '▣',
    permission: PERMISSIONS.AREAS_READ
  },
  {
    href: '/users',
    label: 'Usuários',
    icon: '☻',
    permission: PERMISSIONS.USERS_READ
  },
  {
    href: '/roles',
    label: 'Permissões',
    icon: '⚿',
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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-100 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-6 text-xl font-bold">
          <span className="text-blue-400">▣</span>
          <span>WMS</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
