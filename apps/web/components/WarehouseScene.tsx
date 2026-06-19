'use client'

import { useEffect, useMemo, useState } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { BackSide } from 'three'

export interface SceneCorridor {
  id: string
  code: string
  levels: number
  positionsPerLevel: number
}

export interface SceneArea {
  id: string
  code: string
  name: string
  count: number
  floor: number
  mapX?: number | null
  mapZ?: number | null
  corridors: SceneCorridor[]
}

interface WarehouseSceneProps {
  areas: SceneArea[]
  selectedId: string | null
  onSelect: (id: string) => void
  onSelectLocation?: (
    areaId: string,
    aisleCode: string,
    level: number,
    position: number
  ) => void
  editable?: boolean
  onMove?: (id: string, x: number, z: number) => void
  focusToken?: string
}

const palette = [
  { base: '#3b82f6', shelf: '#1e3a8a' },
  { base: '#6366f1', shelf: '#312e81' },
  { base: '#10b981', shelf: '#064e3b' },
  { base: '#f59e0b', shelf: '#78350f' },
  { base: '#ec4899', shelf: '#831843' },
  { base: '#06b6d4', shelf: '#164e63' },
  { base: '#8b5cf6', shelf: '#4c1d95' },
  { base: '#ef4444', shelf: '#7f1d1d' }
]

const BIN = 0.42
const CELLX = 0.52
const CELLY = 0.52
const CORR_D = 0.6
const AISLE_GAP = 0.85
const FLOOR_GAP = 2.8

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

function corridorsOf(area: SceneArea): SceneCorridor[] {
  if (area.corridors && area.corridors.length > 0) {
    return area.corridors
  }
  return [{ id: area.id, code: 'A1', levels: 1, positionsPerLevel: 1 }]
}

function areaFootprint(area: SceneArea) {
  const corr = corridorsOf(area)
  const maxPos = Math.max(
    1,
    ...corr.map((c) => clamp(c.positionsPerLevel, 1, 14))
  )
  const maxLevels = Math.max(1, ...corr.map((c) => clamp(c.levels, 1, 8)))
  const width = maxPos * CELLX
  const depth = corr.length * (CORR_D + AISLE_GAP)
  const height = maxLevels * CELLY
  return { corr, width, depth, height }
}

interface BinProps {
  pos: [number, number, number]
  color: string
  selected: boolean
  editable: boolean
  onClick: () => void
  onAreaSelect: () => void
  onStartDrag: () => void
}

function Bin({
  pos,
  color,
  selected,
  editable,
  onClick,
  onAreaSelect,
  onStartDrag
}: BinProps) {
  const [hover, setHover] = useState(false)
  const z = pos[2] + (hover && !editable ? 0.3 : 0)
  return (
    <mesh
      position={[pos[0], pos[1], z]}
      castShadow
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = editable ? 'grab' : 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = 'default'
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (editable) {
          e.stopPropagation()
          onAreaSelect()
          onStartDrag()
        }
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (!editable) {
          onClick()
        }
      }}
    >
      <boxGeometry args={[BIN, BIN, BIN]} />
      <meshStandardMaterial
        color={color}
        emissive={hover ? '#ffffff' : color}
        emissiveIntensity={hover ? 0.6 : selected ? 0.3 : 0.05}
        roughness={0.5}
        metalness={0.1}
      />
    </mesh>
  )
}

interface CorridorProps {
  areaId: string
  corridor: SceneCorridor
  z: number
  color: { base: string; shelf: string }
  selected: boolean
  editable: boolean
  onSelectArea: () => void
  onSelectLocation?: (
    areaId: string,
    aisleCode: string,
    level: number,
    position: number
  ) => void
  onStartDrag: () => void
}

function Corridor({
  areaId,
  corridor,
  z,
  color,
  selected,
  editable,
  onSelectArea,
  onSelectLocation,
  onStartDrag
}: CorridorProps) {
  const levels = clamp(corridor.levels, 1, 8)
  const positions = clamp(corridor.positionsPerLevel, 1, 14)
  const width = positions * CELLX
  const height = levels * CELLY

  const shelfHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      document.body.style.cursor = editable ? 'grab' : 'pointer'
    },
    onPointerOut: () => {
      document.body.style.cursor = 'default'
    },
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (editable) {
        e.stopPropagation()
        onSelectArea()
        onStartDrag()
      }
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (!editable) {
        onSelectArea()
      }
    }
  }

  const posts: [number, number, number][] = [
    [-width / 2, height / 2, z - CORR_D / 2],
    [width / 2, height / 2, z - CORR_D / 2],
    [-width / 2, height / 2, z + CORR_D / 2],
    [width / 2, height / 2, z + CORR_D / 2]
  ]

  const shelves = []
  for (let l = 0; l < levels; l += 1) {
    shelves.push(l * CELLY)
  }

  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={`post-${i}`} position={p} castShadow {...shelfHandlers}>
          <boxGeometry args={[0.06, height, 0.06]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {shelves.map((y, i) => (
        <mesh
          key={`shelf-${i}`}
          position={[0, y, z]}
          receiveShadow
          {...shelfHandlers}
        >
          <boxGeometry args={[width + 0.1, 0.04, CORR_D]} />
          <meshStandardMaterial color={color.shelf} roughness={0.7} />
        </mesh>
      ))}

      {shelves.map((_, l) =>
        Array.from({ length: positions }).map((__, p) => {
          const x = -width / 2 + (p + 0.5) * CELLX
          return (
            <Bin
              key={`bin-${l}-${p}`}
              pos={[x, (l + 0.5) * CELLY, z]}
              color={color.base}
              selected={selected}
              editable={editable}
              onClick={() =>
                onSelectLocation?.(areaId, corridor.code, l + 1, p + 1)
              }
              onAreaSelect={onSelectArea}
              onStartDrag={onStartDrag}
            />
          )
        })
      )}

      <Html
        position={[-width / 2 - 0.3, 0.25, z]}
        center
        distanceFactor={12}
        zIndexRange={[28, 0]}
      >
        <div
          onClick={onSelectArea}
          style={{
            padding: '1px 6px',
            borderRadius: 5,
            background: 'rgba(2,6,23,0.85)',
            color: '#93c5fd',
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
        >
          {corridor.code}
        </div>
      </Html>
    </group>
  )
}

interface AreaGroupProps {
  area: SceneArea
  position: [number, number, number]
  color: { base: string; shelf: string }
  selected: boolean
  editable: boolean
  onSelect: (id: string) => void
  onSelectLocation?: (
    areaId: string,
    aisleCode: string,
    level: number,
    position: number
  ) => void
  onStartDrag: (id: string) => void
}

function AreaGroup({
  area,
  position,
  color,
  selected,
  editable,
  onSelect,
  onSelectLocation,
  onStartDrag
}: AreaGroupProps) {
  const { corr, width, depth, height } = areaFootprint(area)
  const selectArea = () => onSelect(area.id)
  const startDrag = () => onStartDrag(area.id)

  return (
    <group position={position}>
      <mesh
        position={[0, 0.05, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = editable ? 'grab' : 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (editable) {
            e.stopPropagation()
            selectArea()
            startDrag()
          }
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (!editable) {
            selectArea()
          }
        }}
      >
        <boxGeometry args={[width + 0.6, 0.1, depth + 0.4]} />
        <meshStandardMaterial
          color={selected ? color.base : '#1e293b'}
          transparent
          opacity={selected ? 0.25 : 0.12}
        />
      </mesh>

      {corr.map((c, ci) => (
        <Corridor
          key={c.id}
          areaId={area.id}
          corridor={c}
          z={-depth / 2 + (ci + 0.5) * (CORR_D + AISLE_GAP)}
          color={color}
          selected={selected}
          editable={editable}
          onSelectArea={selectArea}
          onSelectLocation={onSelectLocation}
          onStartDrag={startDrag}
        />
      ))}

      <Html
        position={[0, height + 0.6, 0]}
        center
        distanceFactor={14}
        zIndexRange={[30, 0]}
      >
        <div
          onClick={selectArea}
          style={{
            padding: '3px 10px',
            borderRadius: 8,
            background: selected ? '#0f172a' : 'rgba(15,23,42,0.8)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            cursor: 'pointer',
            border: selected ? '1px solid #fff' : 'none'
          }}
        >
          {area.code}
          <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
            {corr.length} corredores • {area.count} pts
          </div>
        </div>
      </Html>
    </group>
  )
}

function FocusRig({
  target,
  token
}: {
  target: [number, number, number] | null
  token: string
}) {
  const controls = useThree((s) => s.controls) as {
    target: { set: (x: number, y: number, z: number) => void }
    update: () => void
  } | null
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    if (target && controls) {
      const [x, y, z] = target
      camera.position.set(x + 5, y + 4, z + 6)
      controls.target.set(x, y, z)
      controls.update()
    }
  }, [token, controls, target, camera])

  return null
}

export default function WarehouseScene({
  areas,
  selectedId,
  onSelect,
  onSelectLocation,
  editable = false,
  onMove,
  focusToken
}: WarehouseSceneProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [live, setLive] = useState<Record<string, [number, number]>>({})

  const { items, floorsList, room, floorH } = useMemo(() => {
    const maxHeight = Math.max(1, ...areas.map((a) => areaFootprint(a).height))
    const fh = maxHeight + FLOOR_GAP
    const floors = Array.from(new Set(areas.map((a) => a.floor))).sort(
      (a, b) => a - b
    )

    const itemsList = areas.map((area, index) => {
      const sameFloor = areas.filter((a) => a.floor === area.floor)
      const idxInFloor = sameFloor.indexOf(area)
      const sizes = sameFloor.map(areaFootprint)
      const cellX = Math.max(3, ...sizes.map((s) => s.width)) + 2.5
      const cellZ = Math.max(3, ...sizes.map((s) => s.depth)) + 2.5
      const cols = Math.max(1, Math.ceil(Math.sqrt(sameFloor.length)))
      const rows = Math.ceil(sameFloor.length / cols)
      const col = idxInFloor % cols
      const row = Math.floor(idxInFloor / cols)
      const autoX = (col - (cols - 1) / 2) * cellX
      const autoZ = (row - (rows - 1) / 2) * cellZ
      const x = area.mapX != null ? area.mapX : autoX
      const z = area.mapZ != null ? area.mapZ : autoZ
      return {
        area,
        color: palette[index % palette.length],
        x,
        z,
        platformY: (area.floor - 1) * fh
      }
    })

    const bound = Math.max(
      16,
      ...itemsList.map((i) => Math.max(Math.abs(i.x), Math.abs(i.z)) + 6)
    )
    return {
      items: itemsList,
      floorsList: floors,
      floorH: fh,
      room: {
        width: bound * 2 + 4,
        depth: bound * 2 + 4,
        height: floors.length * fh + 2
      }
    }
  }, [areas])

  const draggedItem = items.find((i) => i.area.id === dragId)

  const focusTarget = useMemo<[number, number, number] | null>(() => {
    if (!focusToken) {
      return null
    }
    const id = focusToken.split('::')[0]
    const item = items.find((i) => i.area.id === id)
    if (!item) {
      return null
    }
    const { height } = areaFootprint(item.area)
    return [item.x, item.platformY + height / 2, item.z]
  }, [focusToken, items])

  const handleDragMove = (event: ThreeEvent<PointerEvent>) => {
    if (dragId) {
      setLive((prev) => ({ ...prev, [dragId]: [event.point.x, event.point.z] }))
    }
  }

  const handleDragEnd = () => {
    if (dragId && live[dragId] && onMove) {
      onMove(dragId, live[dragId][0], live[dragId][1])
    }
    setDragId(null)
  }

  return (
    <Canvas
      shadows
      camera={{ position: [room.width * 0.45, 9, room.depth * 0.55], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1120']} />
      <fog attach="fog" args={['#0b1120', 32, 95]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#dbeafe', '#1e293b', 0.5]} />
      <directionalLight
        position={[10, room.height + 4, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <mesh position={[0, room.height / 2, 0]}>
        <boxGeometry args={[room.width, room.height, room.depth]} />
        <meshStandardMaterial color="#cbd5e1" side={BackSide} roughness={1} />
      </mesh>

      {floorsList.map((floor) => {
        const y = (floor - 1) * floorH
        return (
          <group key={`floor-${floor}`}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, y + 0.01, 0]}
              receiveShadow
            >
              <planeGeometry args={[room.width - 1, room.depth - 1]} />
              <meshStandardMaterial
                color={floor % 2 === 0 ? '#8794a8' : '#94a3b8'}
                roughness={1}
              />
            </mesh>
            <gridHelper
              args={[
                Math.max(room.width, room.depth) - 1,
                34,
                '#64748b',
                '#7c899c'
              ]}
              position={[0, y + 0.02, 0]}
            />
            <pointLight
              position={[0, y + floorH - 0.6, 0]}
              intensity={0.5}
              distance={room.width}
            />
            <Html
              position={[-room.width / 2 + 1.5, y + 0.4, -room.depth / 2 + 1.5]}
              center
              distanceFactor={16}
              zIndexRange={[25, 0]}
            >
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(37,99,235,0.85)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                Andar {floor}
              </div>
            </Html>
          </group>
        )
      })}

      {dragId && draggedItem && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, draggedItem.platformY + 0.05, 0]}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <planeGeometry args={[room.width * 2, room.depth * 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {items.map(({ area, color, x, z, platformY }) => (
        <AreaGroup
          key={area.id}
          area={area}
          position={[
            live[area.id] ? live[area.id][0] : x,
            platformY,
            live[area.id] ? live[area.id][1] : z
          ]}
          color={color}
          selected={selectedId === area.id}
          editable={editable}
          onSelect={onSelect}
          onSelectLocation={onSelectLocation}
          onStartDrag={setDragId}
        />
      ))}

      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.35}
        scale={Math.max(room.width, room.depth)}
        blur={2.2}
        far={8}
      />
      <OrbitControls
        makeDefault
        enabled={dragId === null}
        enablePan
        minDistance={4}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.02}
        target={[0, 1.5, 0]}
      />
      <FocusRig target={focusTarget} token={focusToken ?? ''} />
    </Canvas>
  )
}
