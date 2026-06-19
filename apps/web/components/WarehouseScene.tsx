'use client'

import { useMemo, useState } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
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
  mapX?: number | null
  mapZ?: number | null
}

interface WarehouseSceneProps {
  areas: SceneArea[]
  selectedId: string | null
  onSelect: (id: string) => void
  editable?: boolean
  onMove?: (id: string, x: number, z: number) => void
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
  onStartDrag: (id: string) => void
}

function Rack({
  area,
  position,
  color,
  selected,
  editable,
  onSelect,
  onStartDrag
}: RackProps) {
  const [hovered, setHovered] = useState(false)
  const { positions, aisles, levels, width, depth, height } = rackSize(area)

  const bins: { key: string; pos: [number, number, number] }[] = []
  const shelves: [number, number, number][] = []
  for (let a = 0; a < aisles; a += 1) {
    const z = -depth / 2 + (a + 0.5) * STEP
    for (let l = 0; l < levels; l += 1) {
      shelves.push([0, l * STEP, z])
      for (let p = 0; p < positions; p += 1) {
        const x = -width / 2 + (p + 0.5) * STEP
        bins.push({ key: `${a}-${l}-${p}`, pos: [x, (l + 0.5) * STEP, z] })
      }
    }
  }

  const posts: [number, number, number][] = [
    [-width / 2, height / 2, -depth / 2],
    [width / 2, height / 2, -depth / 2],
    [-width / 2, height / 2, depth / 2],
    [width / 2, height / 2, depth / 2]
  ]

  return (
    <group position={position}>
      <mesh
        position={[0, height / 2, 0]}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(area.id)
        }}
        onPointerDown={(event) => {
          if (editable) {
            event.stopPropagation()
            onSelect(area.id)
            onStartDrag(area.id)
          }
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = editable ? 'grab' : 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <boxGeometry args={[width + 0.3, height + 0.3, depth + 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {posts.map((p, i) => (
        <mesh key={`post-${i}`} position={p} castShadow>
          <boxGeometry args={[0.08, height, 0.08]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {shelves.map((s, i) => (
        <mesh key={`shelf-${i}`} position={s} receiveShadow>
          <boxGeometry args={[width + 0.12, 0.04, BIN + 0.06]} />
          <meshStandardMaterial color={color.shelf} roughness={0.7} />
        </mesh>
      ))}

      {bins.map((bin) => (
        <mesh key={bin.key} position={bin.pos} castShadow>
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

export default function WarehouseScene({
  areas,
  selectedId,
  onSelect,
  editable = false,
  onMove
}: WarehouseSceneProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [live, setLive] = useState<Record<string, [number, number]>>({})

  const autoLayout = useMemo(() => {
    const sizes = areas.map(rackSize)
    const cellX = Math.max(2.5, ...sizes.map((s) => s.width)) + 2
    const cellZ = Math.max(2.5, ...sizes.map((s) => s.depth)) + 2.5
    const cols = Math.max(1, Math.ceil(Math.sqrt(areas.length)))
    const map: Record<string, [number, number]> = {}
    areas.forEach((area, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const rows = Math.ceil(areas.length / cols)
      map[area.id] = [
        (col - (cols - 1) / 2) * cellX,
        (row - (rows - 1) / 2) * cellZ
      ]
    })
    return map
  }, [areas])

  const resolvePos = (area: SceneArea): [number, number] => {
    if (live[area.id]) {
      return live[area.id]
    }
    if (area.mapX != null && area.mapZ != null) {
      return [area.mapX, area.mapZ]
    }
    return autoLayout[area.id] ?? [0, 0]
  }

  const items = areas.map((area, index) => ({
    area,
    color: palette[index % palette.length],
    xz: resolvePos(area)
  }))

  const bound = Math.max(
    16,
    ...items.map((i) => Math.max(Math.abs(i.xz[0]), Math.abs(i.xz[1])) + 4)
  )
  const room = { width: bound * 2 + 4, depth: bound * 2 + 4, height: 9 }

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
      camera={{ position: [room.width * 0.45, 8, room.depth * 0.55], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1120']} />
      <fog attach="fog" args={['#0b1120', 26, 80]} />

      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#dbeafe', '#1e293b', 0.5]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, room.height - 1, 0]} intensity={0.6} />

      <mesh position={[0, room.height / 2, 0]}>
        <boxGeometry args={[room.width, room.height, room.depth]} />
        <meshStandardMaterial color="#cbd5e1" side={BackSide} roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color="#94a3b8" roughness={1} />
      </mesh>
      <gridHelper
        args={[Math.max(room.width, room.depth), 40, '#64748b', '#7c899c']}
        position={[0, 0.02, 0]}
      />

      {[-room.depth / 4, room.depth / 4].map((z, i) => (
        <mesh key={i} position={[0, room.height - 0.1, z]}>
          <boxGeometry args={[room.width * 0.6, 0.1, 0.4]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fef9c3"
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* drag catcher while moving a rack */}
      {dragId && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <planeGeometry args={[room.width * 2, room.depth * 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {items.map(({ area, color, xz }) => (
        <Rack
          key={area.id}
          area={area}
          position={[xz[0], 0, xz[1]]}
          color={color}
          selected={selectedId === area.id}
          editable={editable}
          onSelect={onSelect}
          onStartDrag={setDragId}
        />
      ))}

      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.4}
        scale={Math.max(room.width, room.depth)}
        blur={2.2}
        far={8}
      />
      <OrbitControls
        makeDefault
        enabled={dragId === null}
        enablePan
        minDistance={4}
        maxDistance={70}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.5, 0]}
      />
    </Canvas>
  )
}
