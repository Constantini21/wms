'use client'

import { useEffect, useMemo, useState } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { BackSide } from 'three'

export interface SceneArea {
  id: string
  code: string
  name: string
  count: number
  aisles: number
  levels: number
  positionsPerLevel: number
  floor: number
  mapX?: number | null
  mapZ?: number | null
}

interface WarehouseSceneProps {
  areas: SceneArea[]
  selectedId: string | null
  onSelect: (id: string) => void
  onSelectLocation?: (
    areaId: string,
    aisle: number,
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

const BIN = 0.5
const GAP = 0.07
const STEP = BIN + GAP
const FLOOR_GAP = 2.6

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

function rackSize(area: SceneArea) {
  const positions = clamp(area.positionsPerLevel, 1, 12)
  const aisles = clamp(area.aisles, 1, 4)
  const levels = clamp(area.levels, 1, 8)
  return {
    positions,
    aisles,
    levels,
    width: positions * STEP,
    depth: aisles * STEP,
    height: levels * STEP
  }
}

interface RackProps {
  area: SceneArea
  position: [number, number, number]
  color: { base: string; shelf: string }
  selected: boolean
  editable: boolean
  onSelect: (id: string) => void
  onSelectLocation?: (
    areaId: string,
    aisle: number,
    level: number,
    position: number
  ) => void
  onStartDrag: (id: string) => void
}

function Rack({
  area,
  position,
  color,
  selected,
  editable,
  onSelect,
  onSelectLocation,
  onStartDrag
}: RackProps) {
  const [hovered, setHovered] = useState(false)
  const { positions, aisles, levels, width, depth, height } = rackSize(area)

  const partHandlers = (onPrimary: () => void) => ({
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      setHovered(true)
      document.body.style.cursor = editable ? 'grab' : 'pointer'
    },
    onPointerOut: () => {
      setHovered(false)
      document.body.style.cursor = 'default'
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      if (editable) {
        event.stopPropagation()
        onSelect(area.id)
        onStartDrag(area.id)
      }
    },
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      if (!editable) {
        onPrimary()
      }
    }
  })

  const bins: {
    key: string
    pos: [number, number, number]
    a: number
    l: number
    p: number
  }[] = []
  const shelves: [number, number, number][] = []
  for (let a = 0; a < aisles; a += 1) {
    const z = -depth / 2 + (a + 0.5) * STEP
    for (let l = 0; l < levels; l += 1) {
      shelves.push([0, l * STEP, z])
      for (let p = 0; p < positions; p += 1) {
        const x = -width / 2 + (p + 0.5) * STEP
        bins.push({
          key: `${a}-${l}-${p}`,
          pos: [x, (l + 0.5) * STEP, z],
          a,
          l,
          p
        })
      }
    }
  }

  const posts: [number, number, number][] = [
    [-width / 2, height / 2, -depth / 2],
    [width / 2, height / 2, -depth / 2],
    [-width / 2, height / 2, depth / 2],
    [width / 2, height / 2, depth / 2]
  ]

  const selectArea = () => onSelect(area.id)

  return (
    <group position={position}>
      {/* base slab to select the rack when clicking gaps */}
      <mesh position={[0, 0.05, 0]} {...partHandlers(selectArea)}>
        <boxGeometry args={[width + 0.3, 0.1, depth + 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {posts.map((p, i) => (
        <mesh
          key={`post-${i}`}
          position={p}
          castShadow
          {...partHandlers(selectArea)}
        >
          <boxGeometry args={[0.08, height, 0.08]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {shelves.map((s, i) => (
        <mesh
          key={`shelf-${i}`}
          position={s}
          receiveShadow
          {...partHandlers(selectArea)}
        >
          <boxGeometry args={[width + 0.12, 0.04, BIN + 0.06]} />
          <meshStandardMaterial color={color.shelf} roughness={0.7} />
        </mesh>
      ))}

      {bins.map((bin) => (
        <mesh
          key={bin.key}
          position={bin.pos}
          castShadow
          {...partHandlers(() =>
            onSelectLocation?.(area.id, bin.a + 1, bin.l + 1, bin.p + 1)
          )}
        >
          <boxGeometry args={[BIN, BIN, BIN]} />
          <meshStandardMaterial
            color={color.base}
            emissive={color.base}
            emissiveIntensity={selected ? 0.35 : hovered ? 0.2 : 0.05}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      ))}

      {selected && (
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width + 0.35, height + 0.35, depth + 0.35]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      <Html
        position={[0, height + 0.6, 0]}
        center
        distanceFactor={14}
        zIndexRange={[30, 0]}
      >
        <div
          style={{
            padding: '3px 10px',
            borderRadius: 8,
            background: selected ? '#0f172a' : 'rgba(15,23,42,0.8)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            border: selected ? '1px solid #fff' : 'none'
          }}
        >
          {area.code}
          <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
            {area.levels} andares • {area.count} pts
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
  }, [token, controls])

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
    const maxHeight = Math.max(1, ...areas.map((a) => rackSize(a).height))
    const fh = maxHeight + FLOOR_GAP
    const floors = Array.from(new Set(areas.map((a) => a.floor))).sort(
      (a, b) => a - b
    )

    const itemsList = areas.map((area, index) => {
      const sameFloor = areas.filter((a) => a.floor === area.floor)
      const idxInFloor = sameFloor.indexOf(area)
      const sizes = sameFloor.map(rackSize)
      const cellX = Math.max(2.5, ...sizes.map((s) => s.width)) + 2
      const cellZ = Math.max(2.5, ...sizes.map((s) => s.depth)) + 2.5
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
      14,
      ...itemsList.map((i) => Math.max(Math.abs(i.x), Math.abs(i.z)) + 5)
    )
    const totalHeight = floors.length * fh + 2
    return {
      items: itemsList,
      floorsList: floors,
      floorH: fh,
      room: { width: bound * 2 + 4, depth: bound * 2 + 4, height: totalHeight }
    }
  }, [areas])

  const resolveX = (id: string, baseX: number) =>
    live[id] ? live[id][0] : baseX
  const resolveZ = (id: string, baseZ: number) =>
    live[id] ? live[id][1] : baseZ

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
    const { height } = rackSize(item.area)
    return [item.x, item.platformY + height / 2, item.z]
  }, [focusToken, items])

  const handleDragMove = (event: ThreeEvent<PointerEvent>) => {
    if (dragId) {
      setLive((prev) => ({
        ...prev,
        [dragId]: [event.point.x, event.point.z]
      }))
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
      <fog attach="fog" args={['#0b1120', 30, 90]} />

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
        <Rack
          key={area.id}
          area={area}
          position={[resolveX(area.id, x), platformY, resolveZ(area.id, z)]}
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
