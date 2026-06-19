'use client'

import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  ContactShadows,
  Grid,
  Html,
  OrbitControls,
  RoundedBox
} from '@react-three/drei'

export interface SceneArea {
  id: string
  code: string
  name: string
  count: number
}

interface WarehouseSceneProps {
  areas: SceneArea[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const palette = [
  '#3b82f6',
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444'
]

interface AreaBoxProps {
  area: SceneArea
  position: [number, number, number]
  color: string
  selected: boolean
  onSelect: (id: string) => void
}

function AreaBox({ area, position, color, selected, onSelect }: AreaBoxProps) {
  const [hovered, setHovered] = useState(false)
  const height = Math.min(0.5 + area.count * 0.08, 4.5)

  return (
    <group position={position}>
      <RoundedBox
        args={[1.3, height, 1.3]}
        radius={0.06}
        smoothness={4}
        position={[0, height / 2, 0]}
        castShadow
        onClick={(event) => {
          event.stopPropagation()
          onSelect(area.id)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.5 : hovered ? 0.25 : 0.05}
          roughness={0.45}
          metalness={0.1}
        />
      </RoundedBox>
      <Html
        position={[0, height + 0.45, 0]}
        center
        distanceFactor={10}
        pointerEvents="none"
      >
        <div
          style={{
            padding: '2px 8px',
            borderRadius: 8,
            background: selected ? '#0f172a' : 'rgba(15,23,42,0.75)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            border: selected ? '1px solid #fff' : 'none'
          }}
        >
          {area.code}
          <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
            {area.count} pos.
          </div>
        </div>
      </Html>
    </group>
  )
}

export default function WarehouseScene({
  areas,
  selectedId,
  onSelect
}: WarehouseSceneProps) {
  const layout = useMemo(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(areas.length)))
    const rows = Math.ceil(areas.length / cols)
    const spacing = 2
    return areas.map((area, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = (col - (cols - 1) / 2) * spacing
      const z = (row - (rows - 1) / 2) * spacing
      return {
        area,
        position: [x, 0, z] as [number, number, number],
        color: palette[index % palette.length]
      }
    })
  }, [areas])

  const span = Math.max(8, Math.ceil(Math.sqrt(areas.length)) * 2 + 2)

  return (
    <Canvas
      shadows
      camera={{ position: [7, 7, 7], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0b1120']} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Grid
        args={[span, span]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#334155"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#475569"
        position={[0, 0.001, 0]}
        fadeDistance={span * 2.2}
        infiniteGrid={false}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[span, span]} />
        <meshStandardMaterial color="#1e293b" roughness={1} />
      </mesh>

      {layout.map(({ area, position, color }) => (
        <AreaBox
          key={area.id}
          area={area}
          position={position}
          color={color}
          selected={selectedId === area.id}
          onSelect={onSelect}
        />
      ))}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={span}
        blur={2.4}
        far={6}
      />
      <OrbitControls
        makeDefault
        enablePan
        minDistance={4}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0.6, 0]}
      />
    </Canvas>
  )
}
