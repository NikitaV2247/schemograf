'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  ConnectionLineType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from 'next-themes'
import { nodeTypes } from '@/components/diagram/nodes'
import { Palette } from '@/components/diagram/palette'
import { PropertiesPanel } from '@/components/diagram/properties-panel'
import { Toolbar } from '@/components/diagram/toolbar'
import { useEditor } from '@/components/diagram/store'
import { KIND_INFO, type DiagramEdge, type DiagramNode, type NodeKind } from '@/lib/diagram'

const defaultEdgeOptions = {
  type: 'smoothstep',
} as const

function FlowInner({ onToggleSnap }: { onToggleSnap: () => void }) {
  const nodes = useEditor((s) => s.nodes)
  const edges = useEditor((s) => s.edges)
  const onNodesChange = useEditor((s) => s.onNodesChange)
  const onEdgesChange = useEditor((s) => s.onEdgesChange)
  const connect = useEditor((s) => s.connect)
  const addNode = useEditor((s) => s.addNode)
  const markDragStart = useEditor((s) => s.markDragStart)
  const duplicateSelected = useEditor((s) => s.duplicateSelected)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)

  const { screenToFlowPosition, fitView } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const wrapper = useRef<HTMLDivElement>(null)

  const isDark = resolvedTheme === 'dark'

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const kind = e.dataTransfer.getData('application/schemograf') as NodeKind
      if (!kind || !KIND_INFO[kind]) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(kind, pos.x - 60, pos.y - 20)
    },
    [screenToFlowPosition, addNode],
  )

  const addCenter = useCallback(
    (kind: NodeKind) => {
      const rect = wrapper.current?.getBoundingClientRect()
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
      const pos = screenToFlowPosition({ x: cx, y: cy })
      addNode(kind, pos.x - 70 + Math.random() * 40 - 20, pos.y - 24 + Math.random() * 40 - 20)
    },
    [screenToFlowPosition, addNode],
  )

  /* Горячие клавиши */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        onToggleSnap()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [undo, redo, duplicateSelected, onToggleSnap])

  const miniNodeColor = useMemo(
    () => (n: DiagramNode) => {
      const k = n.type as NodeKind
      if (k === 'decision') return '#f59e0b'
      if (k === 'start' || k === 'end') return '#3b82f6'
      if (k === 'return') return '#10b981'
      if (k === 'entity') return '#64748b'
      if (k === 'note') return '#facc15'
      if (k === 'phase') return '#334155'
      if (k === 'annotation') return '#0ea5e9'
      if (k === 'screen') return '#111827'
      if (k === 'heading') return '#e2e8f0'
      if (k === 'legend') return '#94a3b8'
      return '#cbd5e1'
    },
    [],
  )

  return (
    <div className="flex min-h-0 flex-1">
      <Palette onAdd={addCenter} />

      <div ref={wrapper} className="relative min-h-0 min-w-0 flex-1" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow<DiagramNode, DiagramEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={connect}
          onNodeDragStart={markDragStart}
          onInit={(inst) => {
            inst.fitView({ padding: 0.12, maxZoom: 1.1 })
            setTimeout(() => inst.fitView({ padding: 0.12, maxZoom: 1.1, duration: 250 }), 320)
          }}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#64748b', strokeWidth: 1.6 }}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={['Delete', 'Backspace']}
          multiSelectionKeyCode="Shift"
          snapToGrid={false}
          snapGrid={[16, 16]}
          fitView
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-50 dark:bg-slate-950"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.6}
            color={isDark ? '#334155' : '#b6c2d2'}
          />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            style={{ width: 178, height: 118 }}
            nodeColor={miniNodeColor}
            maskColor={isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(226, 232, 240, 0.7)'}
            className="!bottom-3 !right-3 !rounded-lg !border !border-slate-200 dark:!border-slate-700"
            ariaLabel="Мини-карта схемы"
          />
        </ReactFlow>

        {/* Подсказка при пустом холсте */}
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl border border-dashed bg-background/80 px-6 py-4 text-center text-[13px] text-muted-foreground backdrop-blur-sm">
              Перетащите блок из левой панели или откройте <b>Шаблоны</b>
            </div>
          </div>
        )}
      </div>

      <PropertiesPanel />
    </div>
  )
}

export default function Editor() {
  const [snap, setSnap] = useState(false)
  const toggleSnap = useCallback(() => setSnap((v) => !v), [])

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <ReactFlowProvider>
        <Toolbar snapToGrid={snap} onToggleSnap={toggleSnap} />
        <FlowInner onToggleSnap={toggleSnap} />
      </ReactFlowProvider>
    </div>
  )
}
