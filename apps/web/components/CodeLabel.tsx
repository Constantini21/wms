'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { FiPrinter } from 'react-icons/fi'
import { TbBarcode, TbQrcode, TbScan } from 'react-icons/tb'

interface CodeLabelProps {
  value: string
  title: string
  subtitle?: string
}

type Display = 'both' | 'qr' | 'barcode'

const options: { id: Display; label: string; icon: typeof TbScan }[] = [
  { id: 'both', label: 'Ambos', icon: TbScan },
  { id: 'qr', label: 'QR Code', icon: TbQrcode },
  { id: 'barcode', label: 'Cód. barras', icon: TbBarcode }
]

export function CodeLabel({ value, title, subtitle }: CodeLabelProps) {
  const barcodeRef = useRef<HTMLCanvasElement>(null)
  const qrWrapperRef = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState<Display>('both')

  const showQr = display === 'both' || display === 'qr'
  const showBarcode = display === 'both' || display === 'barcode'

  useEffect(() => {
    if (showBarcode && barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          displayValue: true,
          fontSize: 14,
          height: 60,
          margin: 4
        })
      } catch {
        // ignore invalid barcode values
      }
    }
  }, [value, showBarcode])

  const handlePrint = () => {
    const qrCanvas = qrWrapperRef.current?.querySelector('canvas')
    const qrData = showQr ? (qrCanvas?.toDataURL('image/png') ?? '') : ''
    const barcodeData = showBarcode
      ? (barcodeRef.current?.toDataURL('image/png') ?? '')
      : ''

    const printWindow = window.open('', '_blank', 'width=480,height=640')
    if (!printWindow) {
      return
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            p { color: #475569; margin: 0 0 16px; font-size: 13px; }
            img { display: block; margin: 12px auto; }
            .code { font-family: monospace; font-size: 14px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
          ${qrData ? `<img src="${qrData}" width="180" height="180" alt="QR" />` : ''}
          ${barcodeData ? `<img src="${barcodeData}" alt="Barcode" />` : ''}
          <div class="code">${value}</div>
          <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close() }, 300); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="no-print inline-flex w-full max-w-xs rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {options.map((option) => {
          const Icon = option.icon
          const selected = display === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setDisplay(option.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                selected
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="text-base" />
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="print-area flex h-[380px] w-72 flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-100">
        <p className="text-center text-sm font-semibold text-slate-800">
          {title}
        </p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        <div
          ref={qrWrapperRef}
          className={`flex h-[160px] w-[160px] items-center justify-center ${
            showQr ? '' : 'hidden'
          }`}
        >
          <QRCodeCanvas value={value} size={160} level="M" />
        </div>
        <div
          className={`flex h-[80px] w-full items-center justify-center ${
            showBarcode ? '' : 'hidden'
          }`}
        >
          <canvas ref={barcodeRef} className="max-h-full max-w-full" />
        </div>
        <p className="font-mono text-xs text-slate-600">{value}</p>
      </div>

      <button
        onClick={handlePrint}
        className="no-print inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
      >
        <FiPrinter /> Imprimir etiqueta
      </button>
    </div>
  )
}
