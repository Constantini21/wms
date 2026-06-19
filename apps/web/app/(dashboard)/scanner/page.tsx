'use client'

import { useState } from 'react'
import { FiCheckCircle, FiSearch } from 'react-icons/fi'
import { apiRequest, ApiError } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import type { Area, Location } from '@/lib/types'

interface ScanResult {
  kind: 'area' | 'location'
  title: string
  details: { label: string; value: string }[]
}

export default function ScannerPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const lookup = async (value: string) => {
    setMessage(null)
    setResult(null)
    if (!value) {
      return
    }
    const query = encodeURIComponent(value)
    try {
      const area = await apiRequest<Area>(`/areas/lookup?code=${query}`)
      setResult({
        kind: 'area',
        title: area.name,
        details: [
          { label: 'Tipo', value: 'Área' },
          { label: 'Código', value: area.code },
          { label: 'Galpão', value: area.warehouse?.name ?? '-' }
        ]
      })
      return
    } catch {
      // try location next
    }
    try {
      const loc = await apiRequest<Location>(`/locations/lookup?code=${query}`)
      setResult({
        kind: 'location',
        title: loc.name || loc.code,
        details: [
          { label: 'Tipo', value: 'Localização' },
          { label: 'Código', value: loc.code },
          { label: 'Área', value: loc.area?.name ?? '-' },
          { label: 'Corredor', value: loc.aisle ?? '-' },
          { label: 'Nível', value: loc.floor ?? '-' },
          { label: 'Posição', value: loc.position ?? '-' }
        ]
      })
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? 'Nenhuma área ou localização encontrada para este código'
          : 'Erro ao consultar o código'
      )
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
        description="Aponte a câmera ou digite o código para localizar áreas e posições"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <BarcodeScanner onResult={handleScan} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
            <Button type="submit">
              <FiSearch /> Buscar
            </Button>
          </form>

          {message && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {message}
            </p>
          )}

          {result && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
              <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                <FiCheckCircle /> Encontrado
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                {result.title}
              </p>
              <dl className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {result.details.map((detail) => (
                  <div key={detail.label} className="flex gap-2">
                    <dt className="font-medium">{detail.label}:</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
