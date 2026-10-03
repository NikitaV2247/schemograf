'use client'

import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react'
import { create } from 'zustand'
import {
  autoLayout,
  edgeFromConnection,
  makeNode,
  type DiagramEdge,
  type DiagramNode,
  type DiagramNodeData,
  type Doc,
  type NodeKind,
} from '@/lib/diagram'
import { TEMPLATES } from '@/components/diagram/templates'

interface Snap {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

const MAX_HISTORY = 60
const STORAGE_KEY = 'schemograf-doc-v1'

interface EditorState {
  title: string
  subtitle: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  past: Snap[]
  future: Snap[]
  savedAt: number

  setTitle: (t: string) => void
  setSubtitle: (s: string) => void
  commit: () => void
  onNodesChange: (c: NodeChange<DiagramNode>[]) => void
  onEdgesChange: (c: EdgeChange<DiagramEdge>[]) => void
  markDragStart: () => void
  connect: (c: Connection) => void
  addNode: (kind: NodeKind, x: number, y: number) => string
  updateNodeData: (id: string, patch: Partial<DiagramNodeData>) => void
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  applyAutoLayout: () => void
  loadDoc: (doc: Doc) => void
  clearAll: () => void
  undo: () => void
  redo: () => void
  loadFromStorage: () => void
}

let lastPushAt = 0

export const useEditor = create<EditorState>((set, get) => ({
  title: 'Новая схема',
  subtitle: '',
  nodes: [],
  edges: [],
  past: [],
  future: [],
  savedAt: 0,

  setTitle: (t) => set({ title: t }),
  setSubtitle: (s) => set({ subtitle: s }),

  commit: () => {
    const now = Date.now()
    if (now - lastPushAt < 700) return // склейка быстрых правок
    lastPushAt = now
    const { nodes, edges, past } = get()
    set({
      past: [...past.slice(-MAX_HISTORY), { nodes, edges }],
      future: [],
    })
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  markDragStart: () => get().commit(),

  connect: (c) => {
    if (!c.source || !c.target || c.source === c.target) return
    get().commit()
    set({ edges: addEdge(edgeFromConnection(c), get().edges) })
  },

  addNode: (kind, x, y) => {
    get().commit()
    const n = makeNode(kind, x, y)
    set({ nodes: [...get().nodes, n] })
    return n.id
  },

  updateNodeData: (id, patch) => {
    get().commit()
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    })
  },

  updateEdge: (id, patch) => {
    get().commit()
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  },

  deleteSelected: () => {
    const { nodes, edges } = get()
    const hasSel = nodes.some((n) => n.selected) || edges.some((e) => e.selected)
    if (!hasSel) return
    get().commit()
    const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
    set({
      nodes: nodes.filter((n) => !n.selected),
      edges: edges.filter((e) => !e.selected && !ids.has(e.source) && !ids.has(e.target)),
    })
  },

  duplicateSelected: () => {
    const { nodes, edges } = get()
    const sel = nodes.filter((n) => n.selected)
    if (sel.length === 0) return
    get().commit()
    const idMap = new Map<string, string>()
    const copies = sel.map((n) => {
      const copy = makeNode(n.type as NodeKind, n.position.x + 36, n.position.y + 40)
      copy.data = { ...n.data, ...(Array.isArray(n.data.fields) ? { fields: n.data.fields.map((f) => ({ ...f })) } : {}) }
      idMap.set(n.id, copy.id)
      return copy
    })
    const inner = edges.filter((e) => idMap.has(e.source) && idMap.has(e.target))
    const edgeCopies = inner.map((e) => ({
      ...e,
      id: `${e.id}_c${Math.random().toString(36).slice(2, 6)}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      selected: false,
    }))
    set({
      nodes: [...nodes.map((n) => ({ ...n, selected: false })), ...copies.map((c) => ({ ...c, selected: true }))],
      edges: [...edges.map((e) => ({ ...e, selected: false })), ...edgeCopies],
    })
  },

  applyAutoLayout: () => {
    get().commit()
    set({ nodes: autoLayout(get().nodes, get().edges) })
  },

  loadDoc: (doc) => {
    get().commit()
    lastPushAt = 0
    set({
      title: doc.title,
      subtitle: doc.subtitle ?? '',
      nodes: doc.nodes.map((n) => ({ ...n, selected: false })),
      edges: doc.edges.map((e) => ({ ...e, selected: false })),
      past: [],
      future: [],
    })
  },

  clearAll: () => {
    get().commit()
    set({
      nodes: [makeNode('start', 360, 60, 'Начало'), makeNode('end', 360, 260, 'Конец')],
      edges: [],
    })
  },

  undo: () => {
    const { past, future, nodes, edges } = get()
    if (past.length === 0) return
    const prev = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [...future.slice(-MAX_HISTORY), { nodes, edges }],
      nodes: prev.nodes,
      edges: prev.edges,
    })
  },

  redo: () => {
    const { past, future, nodes, edges } = get()
    if (future.length === 0) return
    const next = future[future.length - 1]
    set({
      future: future.slice(0, -1),
      past: [...past.slice(-MAX_HISTORY), { nodes, edges }],
      nodes: next.nodes,
      edges: next.edges,
    })
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const doc = JSON.parse(raw) as Doc
      if (!Array.isArray(doc.nodes)) return false
      set({
        title: doc.title ?? 'Новая схема',
        subtitle: doc.subtitle ?? '',
        nodes: doc.nodes,
        edges: doc.edges ?? [],
      })
      return true
    } catch {
      return false
    }
  },
}))

/* Автосохранение: подписка на стор */
let saveTimer: ReturnType<typeof setTimeout> | null = null
useEditor.subscribe((state) => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const doc: Doc = {
        title: state.title,
        subtitle: state.subtitle,
        nodes: state.nodes,
        edges: state.edges,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
      useEditor.setState({ savedAt: Date.now() })
    } catch {
      /* localStorage может быть недоступен */
    }
  }, 600)
})

/* Первичная загрузка документа — на этапе импорта модуля (до рендера компонентов,
   чтобы не вызывать setState во время рендера). Модуль загружается только на клиенте
   через dynamic(..., { ssr: false }), но проверяем window на всякий случай. */
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const doc = JSON.parse(raw) as Doc
      if (Array.isArray(doc.nodes) && Array.isArray(doc.edges)) {
        useEditor.setState({
          title: doc.title ?? 'Новая схема',
          subtitle: doc.subtitle ?? '',
          nodes: doc.nodes,
          edges: doc.edges,
        })
      }
    } else {
      useEditor.setState(TEMPLATES[0].build())
    }
  } catch {
    /* игнорируем повреждённое хранилище */
  }
}
