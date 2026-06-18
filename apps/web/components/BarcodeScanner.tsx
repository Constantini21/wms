'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onResult: (text: string) => void
}

const REGION_ID = 'wms-scanner-region'

export function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner) {
        scanner.stop().catch(() => undefined)
      }
    }
  }, [])

  const start = async () => {
    setError(null)
    try {
      const scanner = new Html5Qrcode(REGION_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onResult(decodedText)
        },
        () => undefined
      )
      setActive(true)
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  const stop = async () => {
    const scanner = scannerRef.current
    if (scanner) {
      await scanner.stop().catch(() => undefined)
      scannerRef.current = null
    }
    setActive(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={REGION_ID}
        className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-black"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!active ? (
        <button
          onClick={start}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Iniciar leitura
        </button>
      ) : (
        <button
          onClick={stop}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Parar leitura
        </button>
      )}
    </div>
  )
}
