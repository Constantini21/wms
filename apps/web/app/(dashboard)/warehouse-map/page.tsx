'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  FiBox,
  FiMaximize,
  FiMinimize,
  FiMove,
  FiTag,
  FiX
} from 'react-icons/fi'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { CodeLabel } from '@/components/CodeLabel'
import type { SceneArea } from '@/components/WarehouseScene'
import type { Area, Location, Paginated, Warehouse } from '@/lib/types'

const WarehouseScene = dynamic(() => import('@/components/WarehouseScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Carregando cena 3D...
    </div>
  )
})

export default function WarehouseMapPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission(PERMISSIONS.AREAS_WRITE)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [labelTarget, setLabelTarget] = useState<{
    value: string
    title: string
    subtitle?: string
  } | null>(null)
  const [detailLoc, setDetailLoc] = useState<Location | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [wh, ar, loc] = await Promise.all([
      apiRequest<Paginated<Warehouse>>('/warehouses?all=true'),
      apiRequest<Paginated<Area>>('/areas?all=true'),
      apiRequest<Paginated<Location>>('/locations?all=true')
    ])
    setWarehouses(wh.data)
    setAreas(ar.data)
    setLocations(loc.data)
    if (wh.data[0]) {
      setWarehouseId((current) => current || wh.data[0].id)
    }
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

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
          count: countByArea(area.id),
          aisles: area.aisles,
          levels: area.levels,
          positionsPerLevel: area.positionsPerLevel,
          mapX: area.mapX,
          mapZ: area.mapZ
        })),
    [areas, warehouseId, countByArea]
  )

  const onMove = useCallback(async (id: string, x: number, z: number) => {
    const mapX = Math.round(x * 100) / 100
    const mapZ = Math.round(z * 100) / 100
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, mapX, mapZ } : a))
    )
    try {
      await apiRequest(`/areas/${id}`, {
        method: 'PATCH',
        body: { mapX, mapZ }
      })
    } catch {
      // ignore persistence errors
    }
  }, [])

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

  const selectedAreaObj = useMemo(
    () => areas.find((a) => a.id === selectedArea) ?? null,
    [areas, selectedArea]
  )
  const selectedName = selectedAreaObj?.name

  const openAreaLabel = () => {
    if (!selectedAreaObj) {
      return
    }
    setLabelTarget({
      value: selectedAreaObj.barcode || selectedAreaObj.code,
      title: `Estante ${selectedAreaObj.code}`,
      subtitle: selectedAreaObj.name
    })
  }

  const openLocationDetail = async (loc: Location) => {
    setDetailLoc(loc)
    try {
      const full = await apiRequest<Location>(`/locations/${loc.id}`)
      setDetailLoc(full)
    } catch {
      // keep basic info
    }
  }

  const openLocationLabel = (loc: Location) => {
    setLabelTarget({
      value: loc.barcode || loc.code,
      title: loc.code,
      subtitle: `${selectedName ?? ''} • Andar ${loc.floor ?? '-'} / Pos ${loc.position ?? '-'}`
    })
  }

  return (
    <div>
      <PageHeader
        title="Mapa 3D do galpão"
        description="Gire, dê zoom e organize as estantes no espaço"
      />

      <div
        ref={containerRef}
        className="relative h-[70vh] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 lg:h-[calc(100vh-12rem)] dark:border-slate-800"
      >
        {sceneAreas.length > 0 ? (
          <WarehouseScene
            areas={sceneAreas}
            selectedId={selectedArea}
            onSelect={setSelectedArea}
            editable={editMode}
            onMove={onMove}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Nenhuma área neste galpão
          </div>
        )}

        {/* top-left controls */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          <select
            value={warehouseId}
            onChange={(event) => {
              setWarehouseId(event.target.value)
              setSelectedArea(null)
            }}
            className="pointer-events-auto cursor-pointer rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none backdrop-blur"
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none w-fit rounded-md bg-slate-900/70 px-2 py-1 text-xs text-slate-200 backdrop-blur">
            {sceneAreas.length} estantes •{' '}
            {sceneAreas.reduce((sum, a) => sum + a.count, 0)} pontos
          </span>
        </div>

        {/* top-right controls */}
        <div className="absolute right-3 top-3 flex gap-2">
          {canEdit && (
            <button
              onClick={() => setEditMode((value) => !value)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur transition-colors ${
                editMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800'
              }`}
              title="Arrastar estantes para reposicionar"
            >
              <FiMove /> {editMode ? 'Movendo' : 'Editar'}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-200 backdrop-blur transition-colors hover:bg-slate-800"
            title="Tela cheia"
          >
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>

        {editMode && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-blue-600/90 px-3 py-1.5 text-xs font-medium text-white">
            Arraste as estantes para reposicioná-las — a posição é salva
            automaticamente
          </div>
        )}

        {/* selected area overlay */}
        {selectedArea && (
          <div className="absolute bottom-3 right-3 max-h-[55%] w-72 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/85 p-4 text-slate-100 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FiBox /> {selectedAreaObj?.code}
                <span className="font-normal text-slate-400">
                  {selectedName}
                </span>
              </h3>
              <button
                onClick={() => setSelectedArea(null)}
                className="cursor-pointer text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <FiX />
              </button>
            </div>
            <button
              onClick={openAreaLabel}
              className="mb-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <FiTag /> Etiqueta da estante
            </button>
            {floors.length === 0 && (
              <p className="text-xs text-slate-400">
                Nenhuma localização nesta área.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {floors.map(([floor, locs]) => (
                <div key={floor} className="rounded-lg bg-slate-800/60 p-2">
                  <p className="mb-1 text-xs font-medium text-slate-200">
                    Andar {floor} • {locs.length} pts
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {locs
                      .slice()
                      .sort((a, b) =>
                        (a.position ?? '').localeCompare(b.position ?? '')
                      )
                      .map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => openLocationDetail(loc)}
                          title={`${loc.code} • acesso ${loc.accessibility}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-[9px] font-semibold text-white transition-transform hover:scale-110"
                        >
                          {loc.position ?? loc.code.slice(-2)}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal
          open={detailLoc !== null}
          title={`Endereço ${detailLoc?.code ?? ''}`}
          onClose={() => setDetailLoc(null)}
        >
          {detailLoc && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <span className="text-slate-400">Área:</span>{' '}
                  {detailLoc.area?.name ?? selectedName ?? '-'}
                </p>
                <p>
                  <span className="text-slate-400">Andar:</span>{' '}
                  {detailLoc.floor ?? '-'}
                </p>
                <p>
                  <span className="text-slate-400">Corredor:</span>{' '}
                  {detailLoc.aisle ?? '-'}
                </p>
                <p>
                  <span className="text-slate-400">Posição:</span>{' '}
                  {detailLoc.position ?? '-'}
                </p>
                <p>
                  <span className="text-slate-400">Acesso:</span>{' '}
                  {detailLoc.accessibility}/10
                </p>
                <p>
                  <span className="text-slate-400">Capacidade:</span>{' '}
                  {detailLoc.capacity ?? 'ilimitada'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Produtos neste endereço
                </p>
                {detailLoc.allocations && detailLoc.allocations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {detailLoc.allocations.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                      >
                        <span>
                          <span className="font-medium">{a.product?.name}</span>
                          <span className="text-slate-400">
                            {' '}
                            ({a.product?.sku})
                          </span>
                        </span>
                        <span className="font-semibold">{a.quantity} un.</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Endereço vazio (nenhum produto alocado).
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  openLocationLabel(detailLoc)
                  setDetailLoc(null)
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <FiTag /> Exibir etiqueta
              </button>
            </div>
          )}
        </Modal>

        <Modal
          open={labelTarget !== null}
          title="Etiqueta"
          onClose={() => setLabelTarget(null)}
        >
          {labelTarget && (
            <CodeLabel
              value={labelTarget.value}
              title={labelTarget.title}
              subtitle={labelTarget.subtitle}
            />
          )}
        </Modal>
      </div>
    </div>
  )
}
