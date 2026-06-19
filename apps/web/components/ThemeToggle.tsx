'use client'

import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '@/lib/theme'

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const fullToggle = (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Alternar tema"
      className={`w-full items-center justify-between gap-3 rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800 ${
        collapsed ? 'flex lg:hidden' : 'flex'
      }`}
    >
      <span className="flex items-center gap-2">
        {isDark ? (
          <FiMoon className="text-indigo-300" />
        ) : (
          <FiSun className="text-amber-300" />
        )}
        {isDark ? 'Tema escuro' : 'Tema claro'}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
          isDark ? 'bg-indigo-500' : 'bg-slate-500'
        }`}
      >
        <span
          className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[10px] shadow transition-transform duration-300 ${
            isDark ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        >
          {isDark ? '🌙' : '☀'}
        </span>
      </span>
    </button>
  )

  if (!collapsed) {
    return fullToggle
  }

  return (
    <>
      {fullToggle}
      <button
        onClick={toggleTheme}
        aria-label="Alternar tema"
        title={isDark ? 'Tema escuro' : 'Tema claro'}
        className="mx-auto hidden h-10 w-10 items-center justify-center rounded-lg bg-slate-800/60 text-slate-200 transition-colors hover:bg-slate-800 lg:flex"
      >
        {isDark ? (
          <FiMoon className="text-indigo-300" />
        ) : (
          <FiSun className="text-amber-300" />
        )}
      </button>
    </>
  )
}
