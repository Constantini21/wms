'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { FiLock, FiUser } from 'react-icons/fi'
import { TbQrcode } from 'react-icons/tb'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { loginSchema, type LoginInput } from '@/lib/schemas/login'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin', password: 'admin123' }
  })

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  const onSubmit = async (values: LoginInput) => {
    setError(null)
    try {
      await login(values.email, values.password)
      router.replace('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Não foi possível entrar. Tente novamente.')
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl text-white shadow-lg shadow-blue-600/30">
            <TbQrcode />
          </div>
          <h1 className="text-2xl font-bold text-white">WMS</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sistema de Gestão de Armazém
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Usuário
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 focus-within:border-blue-500">
              <FiUser className="text-slate-400" />
              <input
                type="text"
                {...register('email')}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Senha
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 focus-within:border-blue-500">
              <FiLock className="text-slate-400" />
              <input
                type="password"
                {...register('password')}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-2.5"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Acesso padrão: admin / admin123
        </p>
      </div>
    </div>
  )
}
