'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { FiBox } from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import type { SceneArea } from '@/components/WarehouseScene'
import type { Area, Location, Warehouse } from '@/lib/types'

const WarehouseScene = dynamic(() => import('@/components/WarehouseScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Carregando cena 3D...
    </div>
  )
})

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

  const countByArea = useCallback(
    (areaId: string) => locations.filter((l) => l.areaId === areaId).length,
    [locations]
  )

  const sceneAreas: SceneArea[] = useMemo(
    () =>
      areas
        .filter((area) => area.warehouseId === warehouseId)
        .map((area) => ({
          id: area.id,
          code: area.code,
          name: area.name,
          count: countByArea(area.id)
        })),
    [areas, warehouseId, countByArea]
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

  const selectedName = sceneAreas.find((a) => a.id === selectedArea)?.name

  return (
    <div>
      <PageHeader
        title="Mapa 3D do galpão"
        description="Arraste para girar, role para dar zoom. A altura do bloco = nº de posições"
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
          <div className="relative h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 sm:h-[440px] dark:border-slate-800">
            {sceneAreas.length > 0 ? (
              <WarehouseScene
                areas={sceneAreas}
                selectedId={selectedArea}
                onSelect={setSelectedArea}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Nenhuma área neste galpão
              </div>
            )}
            <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur dark:bg-slate-800/80 dark:text-slate-300">
              {sceneAreas.length} áreas •{' '}
              {sceneAreas.reduce((sum, a) => sum + a.count, 0)} posições
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Clique em um bloco para ver os andares e localizações
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <FiBox /> {selectedArea ? selectedName : 'Andares e posições'}
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
          <div className="flex max-h-[380px] flex-col gap-3 overflow-y-auto">
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
