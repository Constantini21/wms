'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiBox, FiLayers } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import type { Area, Location, Warehouse } from '@/lib/types'

interface BlockColor {
  light: string
  dark: string
  side: string
}

const palette: BlockColor[] = [
  { light: '#60a5fa', dark: '#2563eb', side: '#1e3a8a' },
  { light: '#818cf8', dark: '#4f46e5', side: '#312e81' },
  { light: '#34d399', dark: '#059669', side: '#064e3b' },
  { light: '#fbbf24', dark: '#d97706', side: '#78350f' },
  { light: '#f472b6', dark: '#db2777', side: '#831843' },
  { light: '#22d3ee', dark: '#0891b2', side: '#164e63' },
  { light: '#a78bfa', dark: '#7c3aed', side: '#4c1d95' },
  { light: '#fb7185', dark: '#e11d48', side: '#881337' }
]

export default function WarehouseMapPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [wh, ar, loc] = await Promise.all([
      apiRequest<Warehouse[]>('/warehouses'),
      apiRequest<Area[]>('/areas'),
      apiRequest<Location[]>('/locations')
    ])
    setWarehouses(wh)
    setAreas(ar)
    setLocations(loc)
    if (wh[0]) {
      setWarehouseId((current) => current || wh[0].id)
    }
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  const warehouseAreas = useMemo(
    () => areas.filter((area) => area.warehouseId === warehouseId),
    [areas, warehouseId]
  )

  const countByArea = useCallback(
    (areaId: string) => locations.filter((l) => l.areaId === areaId).length,
    [locations]
  )

  const areaLocations = useMemo(
    () => locations.filter((loc) => loc.areaId === selectedArea),
    [locations, selectedArea]
  )

  const floors = useMemo(() => {
    const groups = new Map<string, Location[]>()
    for (const loc of areaLocations) {
      const key = loc.floor ?? 'Térreo'
      groups.set(key, [...(groups.get(key) ?? []), loc])
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [areaLocations])

  const columns = Math.max(
    2,
    Math.ceil(Math.sqrt(Math.max(warehouseAreas.length, 1)))
  )

  return (
    <div>
      <PageHeader
        title="Mapa 3D do galpão"
        description="Visualização isométrica das áreas — a altura representa o número de posições"
        action={
          <div className="w-full sm:w-56">
            <Select
              value={warehouseId}
              onChange={(event) => {
                setWarehouseId(event.target.value)
                setSelectedArea(null)
              }}
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-sky-100 to-slate-200 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
            style={{ perspective: '1300px' }}
          >
            <div
              className="scale-[0.78] sm:scale-90 lg:scale-100"
              style={{
                transform: 'rotateX(58deg) rotateZ(-45deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className="rounded-lg p-6"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, rgba(148,163,184,0.35) 0 1px, transparent 1px 56px), repeating-linear-gradient(90deg, rgba(148,163,184,0.35) 0 1px, transparent 1px 56px), linear-gradient(#cbd5e1, #e2e8f0)',
                  boxShadow: 'inset 0 0 0 2px rgba(100,116,139,0.4)'
                }}
              >
                <div
                  className="grid gap-5"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {warehouseAreas.map((area, index) => {
                    const color = palette[index % palette.length]
                    const count = countByArea(area.id)
                    const active = area.id === selectedArea
                    const height = Math.min(14 + count * 1.6, 70)
                    return (
                      <button
                        key={area.id}
                        onClick={() => setSelectedArea(area.id)}
                        title={`${area.name} — ${count} posições`}
                        className="group relative h-20 w-20 rounded-md transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${color.light}, ${color.dark})`,
                          boxShadow: `0 ${height}px 0 ${color.side}, 0 ${
                            height + 8
                          }px 16px rgba(15,23,42,0.45)`,
                          transform: active
                            ? 'translateZ(46px)'
                            : 'translateZ(0)',
                          outline: active ? '3px solid #fff' : 'none'
                        }}
                      >
                        <span className="absolute inset-0 flex flex-col items-center justify-center text-center text-[11px] font-semibold text-white drop-shadow">
                          <FiLayers className="mb-0.5 text-base" />
                          {area.code}
                          <span className="text-[9px] font-normal opacity-90">
                            {count} pos.
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  {warehouseAreas.length === 0 && (
                    <p className="col-span-full text-sm text-slate-600">
                      Nenhuma área neste galpão
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute left-3 top-3 rounded-md bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur dark:bg-slate-800/80 dark:text-slate-300">
              {warehouseAreas.length} áreas •{' '}
              {warehouseAreas.reduce((sum, a) => sum + countByArea(a.id), 0)}{' '}
              posições
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Clique em uma área para ver os andares e localizações
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <FiBox />{' '}
            {selectedArea
              ? warehouseAreas.find((a) => a.id === selectedArea)?.name
              : 'Andares e posições'}
          </h3>
          {!selectedArea && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione uma área no mapa para visualizar os andares.
            </p>
          )}
          {selectedArea && floors.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma localização cadastrada nesta área.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {floors.map(([floor, locs]) => (
              <div
                key={floor}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Andar {floor} • {locs.length} posições
                </p>
                <div className="flex flex-wrap gap-2">
                  {locs
                    .slice()
                    .sort((a, b) =>
                      (a.position ?? '').localeCompare(b.position ?? '')
                    )
                    .map((loc) => (
                      <span
                        key={loc.id}
                        title={`${loc.code} • Corredor ${loc.aisle ?? '-'} / Pos ${loc.position ?? '-'}`}
                        className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-semibold text-white shadow"
                      >
                        {loc.position ?? loc.code.slice(-2)}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
