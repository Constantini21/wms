'use client'

import { useState } from 'react'
import { apiRequest, ApiError } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import type { Area } from '@/lib/types'

export default function ScannerPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<Area | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const lookup = async (value: string) => {
    setMessage(null)
    setResult(null)
    if (!value) {
      return
    }
    try {
      const area = await apiRequest<Area>(
        `/areas/lookup?code=${encodeURIComponent(value)}`
      )
      setResult(area)
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(err.message)
      } else {
        setMessage('Erro ao consultar o código')
      }
    }
  }

  const handleScan = (text: string) => {
    setCode(text)
    lookup(text)
  }

  return (
    <div>
      <PageHeader
        title="Leitor de código de barras / QR"
        description="Aponte a câmera ou digite o código para localizar uma área"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <BarcodeScanner onResult={handleScan} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              lookup(code)
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <Input
                label="Código manual"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Digite ou escaneie"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>

          {message && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              {message}
            </p>
          )}

          {result && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Área encontrada</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">
                {result.name}
              </p>
              <dl className="mt-2 space-y-1 text-sm text-slate-600">
                <div className="flex gap-2">
                  <dt className="font-medium">Código:</dt>
                  <dd>{result.code}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">Galpão:</dt>
                  <dd>{result.warehouse?.name ?? '-'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
