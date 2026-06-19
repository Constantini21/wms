'use client'

import { useAuth } from '@/lib/auth'
import { FiLogOut } from 'react-icons/fi'
import { Button } from './ui/Button'

interface TopbarProps {
  onToggleSidebar: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="text-2xl text-slate-600 dark:text-slate-300 lg:hidden"
        aria-label="Abrir menu"
      >
        ☰
      </button>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {user?.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user?.roleName}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <Button variant="secondary" onClick={logout} className="px-3">
          <FiLogOut />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}
