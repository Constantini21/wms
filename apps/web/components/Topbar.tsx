'use client'

import { useAuth } from '@/lib/auth'
import { Button } from './ui/Button'

interface TopbarProps {
  onToggleSidebar: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="text-2xl text-slate-600 lg:hidden"
        aria-label="Abrir menu"
      >
        ☰
      </button>
      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.roleName}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  )
}
