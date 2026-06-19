'use client'

import { useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { FiPrinter } from 'react-icons/fi'

interface CodeLabelProps {
  value: string
  title: string
  subtitle?: string
}

export function CodeLabel({ value, title, subtitle }: CodeLabelProps) {
  const barcodeRef = useRef<HTMLCanvasElement>(null)
  const qrWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barcodeRef.current && value) {
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
  }, [value])

  const handlePrint = () => {
    const qrCanvas = qrWrapperRef.current?.querySelector('canvas')
    const qrData = qrCanvas?.toDataURL('image/png') ?? ''
    const barcodeData = barcodeRef.current?.toDataURL('image/png') ?? ''

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
          <img src="${qrData}" width="180" height="180" alt="QR" />
          <img src="${barcodeData}" alt="Barcode" />
          <div class="code">${value}</div>
          <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close() }, 300); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="print-area flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-100">
        <p className="text-center text-sm font-semibold text-slate-800">
          {title}
        </p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        <div ref={qrWrapperRef}>
          <QRCodeCanvas value={value} size={160} level="M" />
        </div>
        <canvas ref={barcodeRef} />
        <p className="font-mono text-xs text-slate-600">{value}</p>
      </div>
      <button
        onClick={handlePrint}
        className="no-print inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
      >
        <FiPrinter /> Imprimir etiqueta
      </button>
    </div>
  )
}
