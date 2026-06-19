'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiBox, FiLayers } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import type { Area, Location, Warehouse } from '@/lib/types'

const palette = [
  'from-blue-500 to-blue-700',
  'from-indigo-500 to-indigo-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700'
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
      setWarehouseId(wh[0].id)
    }
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  const warehouseAreas = useMemo(
    () => areas.filter((area) => area.warehouseId === warehouseId),
    [areas, warehouseId]
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
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [areaLocations])

  return (
    <div>
      <PageHeader
        title="Mapa 3D do galpão"
        description="Visualização isométrica das áreas e localizações"
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
            className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 p-8 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950"
            style={{ perspective: '1100px' }}
          >
            <div
              className="grid gap-6"
              style={{
                transform: 'rotateX(55deg) rotateZ(-45deg)',
                transformStyle: 'preserve-3d',
                gridTemplateColumns: `repeat(${Math.ceil(
                  Math.sqrt(Math.max(warehouseAreas.length, 1))
                )}, minmax(0, 1fr))`
              }}
            >
              {warehouseAreas.map((area, index) => {
                const active = area.id === selectedArea
                const count = locations.filter(
                  (l) => l.areaId === area.id
                ).length
                return (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className={`group relative h-24 w-24 rounded-md bg-gradient-to-br ${
                      palette[index % palette.length]
                    } shadow-xl transition-transform duration-300`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: active ? 'translateZ(40px)' : 'translateZ(0px)'
                    }}
                  >
                    <span
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-md text-xs font-semibold text-white"
                      style={{ transform: 'translateZ(1px)' }}
                    >
                      <FiLayers className="mb-1 text-lg" />
                      {area.code}
                      <span className="text-[10px] opacity-80">
                        {count} pos.
                      </span>
                    </span>
                  </button>
                )
              })}
              {warehouseAreas.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhuma área neste galpão
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Clique em uma área para ver os andares e localizações
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <FiBox /> Andares e posições
          </h3>
          {!selectedArea && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione uma área no mapa.
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
                  Andar {floor}
                </p>
                <div className="flex flex-wrap gap-2">
                  {locs.map((loc) => (
                    <span
                      key={loc.id}
                      title={`${loc.code} • Corredor ${loc.aisle ?? '-'} / Pos ${loc.position ?? '-'}`}
                      className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-semibold text-white shadow"
                    >
                      {loc.position ?? loc.code.slice(-3)}
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
