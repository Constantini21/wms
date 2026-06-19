'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { TbBarcode, TbQrcode, TbScan } from 'react-icons/tb'
import { FiCamera, FiSquare } from 'react-icons/fi'

interface BarcodeScannerProps {
  onResult: (text: string) => void
}

type ScanMode = 'all' | 'qr' | 'barcode'

const REGION_ID = 'wms-scanner-region'

const barcodeFormats = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR
]

const qrFormats = [Html5QrcodeSupportedFormats.QR_CODE]

const modes: { id: ScanMode; label: string; icon: typeof TbScan }[] = [
  { id: 'all', label: 'Tudo', icon: TbScan },
  { id: 'qr', label: 'QR Code', icon: TbQrcode },
  { id: 'barcode', label: 'Cód. barras', icon: TbBarcode }
]

function formatsForMode(mode: ScanMode) {
  if (mode === 'qr') {
    return qrFormats
  }
  if (mode === 'barcode') {
    return barcodeFormats
  }
  return [...qrFormats, ...barcodeFormats]
}

export function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [mode, setMode] = useState<ScanMode>('all')
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(async () => {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        await scanner.stop()
      } catch {
        // ignore
      }
      try {
        scanner.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setActive(false)
  }, [])

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner) {
        scanner.stop().catch(() => undefined)
      }
    }
  }, [])

  const start = useCallback(
    async (selectedMode: ScanMode) => {
      setError(null)
      await stop()
      try {
        const scanner = new Html5Qrcode(REGION_ID, {
          formatsToSupport: formatsForMode(selectedMode),
          verbose: false
        })
        scannerRef.current = scanner
        const isQrOnly = selectedMode === 'qr'
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewWidth: number, viewHeight: number) => {
              const min = Math.min(viewWidth, viewHeight)
              if (isQrOnly) {
                const size = Math.floor(min * 0.7)
                return { width: size, height: size }
              }
              const width = Math.floor(Math.min(viewWidth * 0.9, 320))
              const height = Math.floor(width * 0.55)
              return { width, height }
            }
          },
          (decodedText: string) => {
            onResult(decodedText)
          },
          () => undefined
        )
        setActive(true)
      } catch {
        setError(
          'Não foi possível acessar a câmera. Verifique as permissões do navegador.'
        )
        setActive(false)
      }
    },
    [onResult, stop]
  )

  const handleModeChange = (next: ScanMode) => {
    setMode(next)
    if (active) {
      start(next)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="inline-flex w-full max-w-sm rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {modes.map((item) => {
          const Icon = item.icon
          const selected = mode === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleModeChange(item.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:text-sm ${
                selected
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="text-base" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div
        id={REGION_ID}
        className="aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700"
      />

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!active ? (
        <button
          onClick={() => start(mode)}
          className="inline-flex w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FiCamera /> Iniciar leitura
        </button>
      ) : (
        <button
          onClick={stop}
          className="inline-flex w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <FiSquare /> Parar leitura
        </button>
      )}
    </div>
  )
}
