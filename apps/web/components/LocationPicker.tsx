'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/ui/Modal'
import type { SceneArea } from '@/components/WarehouseScene'
import type { Aisle, Area } from '@/lib/types'

const WarehouseScene = dynamic(() => import('@/components/WarehouseScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Carregando cena 3D...
    </div>
  )
})

interface LocationPickerProps {
  open: boolean
  area: Area | null
  aisles: Aisle[]
  onClose: () => void
  onPick: (aisleCode: string, level: number, position: number) => void
}

export function LocationPicker({
  open,
  area,
  aisles,
  onClose,
  onPick
}: LocationPickerProps) {
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null)

  const sceneAreas: SceneArea[] = useMemo(() => {
    if (!area) {
      return []
    }
    const corridors =
      aisles.length > 0
        ? aisles.map((a) => ({
            id: a.id,
            code: a.code,
            label: a.label,
            corridorFront: a.corridorFront,
            corridorBack: a.corridorBack,
            levels: a.levels,
            positionsPerLevel: a.positionsPerLevel
          }))
        : Array.from({ length: area.aisles }).map((_, i) => ({
            id: `${area.id}-${i}`,
            code: `${String.fromCharCode(65 + (i % 26))}${i + 1}`,
            label: `${String.fromCharCode(65 + (i % 26))}${i + 1}`,
            corridorFront: `C${i + 1}`,
            corridorBack: `C${i + 2}`,
            levels: area.levels,
            positionsPerLevel: area.positionsPerLevel
          }))
    return [
      {
        id: area.id,
        code: area.code,
        name: area.name,
        count: 0,
        floor: area.floor,
        mapX: 0,
        mapZ: 0,
        corridors
      }
    ]
  }, [area, aisles])

  return (
    <Modal open={open} title="Selecionar posição no mapa 3D" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Clique em uma estante para destacá-la e depois clique no ponto (caixa)
          exato onde o item ficará. A estante, o nível e a posição serão
          preenchidos automaticamente.
        </p>
        <div className="h-[60vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-slate-700">
          {sceneAreas.length > 0 ? (
            <WarehouseScene
              areas={sceneAreas}
              selectedId={area?.id ?? null}
              selectedCorridor={selectedCorridor}
              onSelect={(_id, corridorCode) =>
                setSelectedCorridor(corridorCode ?? null)
              }
              onSelectLocation={(_areaId, aisleCode, level, position) => {
                onPick(aisleCode, level, position)
                onClose()
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Selecione uma área primeiro.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
