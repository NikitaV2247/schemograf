import dagre from '@dagrejs/dagre'
import {
  getNodesBounds,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react'

/* ───────────────────────── Типы ───────────────────────── */

export type NodeKind =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'data'
  | 'subroutine'
  | 'return'
  | 'connector'
  | 'note'
  | 'entity'
  | 'phase'
  | 'annotation'
  | 'screen'
  | 'heading'
  | 'legend'

export interface EntityField {
  name: string
  key?: 'PK' | 'FK' | null
}

/* Шаг внутри фазы спецификации */
export interface SpecStep {
  id: string
  text: string
  check?: boolean
  rules?: string[]
  subs?: { chip: string; tone: 'blue' | 'red'; text: string }[]
}

/* Ряд легенды: [чип] пояснение */
export interface LegendRow {
  chip: string
  text: string
}

/* Ряд макета экрана: текст + необязательный бейдж */
export interface ScreenRow {
  text: string
  badge?: string
  tone?: 'blue' | 'black' | 'gray' | 'green' | 'red'
}

export interface DiagramNodeData extends Record<string, unknown> {
  label: string
  scheme?: string
  kindLabel?: string
  fields?: EntityField[]
  /* phase */
  steps?: SpecStep[]
  /* annotation */
  num?: number
  body?: string
  rules?: string[]
  /* screen */
  time?: string
  battery?: string
  banner?: string
  person?: string
  badge?: string
  rows?: ScreenRow[]
  button?: string
  /* heading */
  sub?: string
  /* legend */
  legendRows?: LegendRow[]
}

export type DiagramNode = Node<DiagramNodeData>
export type DiagramEdge = Edge

export interface Doc {
  title: string
  subtitle: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

/* ─────────────────── Цветовые схемы ─────────────────── */

export interface Scheme {
  name: string
  bg: string
  border: string
  text: string
}

export const SCHEMES: Record<string, Scheme> = {
  slate: { name: 'Серая', bg: '#f8fafc', border: '#94a3b8', text: '#334155' },
  blue: { name: 'Синяя', bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  green: { name: 'Зелёная', bg: '#ecfdf5', border: '#10b981', text: '#047857' },
  amber: { name: 'Янтарная', bg: '#fff7ed', border: '#f59e0b', text: '#b45309' },
  rose: { name: 'Красная', bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  violet: { name: 'Фиолетовая', bg: '#f5f3ff', border: '#8b5cf6', text: '#6d28d9' },
}

export const EDGE_COLOR = '#64748b'

/* ─────────────────── Виды узлов ─────────────────── */

export const KIND_INFO: Record<NodeKind, { name: string; scheme: string; mono?: boolean; hint?: string }> = {
  start: { name: 'Начало', scheme: 'blue', hint: 'Точка входа алгоритма' },
  end: { name: 'Конец', scheme: 'blue', hint: 'Завершение алгоритма' },
  process: { name: 'Процесс', scheme: 'slate', mono: true, hint: 'Действие или вычисление' },
  decision: { name: 'Решение', scheme: 'amber', hint: 'Ветвление: Да / Нет' },
  data: { name: 'Данные', scheme: 'slate', mono: true, hint: 'Ввод или вывод данных' },
  subroutine: { name: 'Подпроцесс', scheme: 'slate', mono: true, hint: 'Вызов другой функции' },
  return: { name: 'Результат', scheme: 'green', mono: true, hint: 'Возврат значения' },
  connector: { name: 'Соединитель', scheme: 'slate', hint: 'Разрыв линии потока' },
  note: { name: 'Заметка', scheme: 'amber', hint: 'Пояснение на схеме' },
  entity: { name: 'ER-сущность', scheme: 'slate', hint: 'Таблица модели данных' },
  phase: { name: 'Фаза спецификации', scheme: 'slate', hint: 'Этап процесса с пронумерованными шагами и проверками BR' },
  annotation: { name: 'Аннотация прототипа', scheme: 'blue', hint: 'Нумерованная карточка с привязкой к сущностям — используйте [[Сущность.Поле]] для синих чипов' },
  screen: { name: 'Экран приложения', scheme: 'slate', hint: 'Макет мобильного экрана: баннер, заголовок, строки, кнопка' },
  heading: { name: 'Заголовок', scheme: 'slate', hint: 'Крупный заголовок со подзаголовком — попадает в экспорт' },
  legend: { name: 'Легенда', scheme: 'slate', hint: 'Расшифровка обозначений: [чип] — пояснение' },
}

export const PALETTE: { group: string; kinds: NodeKind[] }[] = [
  { group: 'Блок-схема', kinds: ['start', 'process', 'decision', 'data', 'subroutine', 'return', 'connector', 'end'] },
  { group: 'Модель данных', kinds: ['entity', 'legend'] },
  { group: 'Спецификация и прототипы', kinds: ['phase', 'annotation', 'screen', 'heading', 'note'] },
]

/* ─────────────────── Фабрики ─────────────────── */

let seq = 0
export function uid(prefix = 'n'): string {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}_${seq}_${Math.random().toString(36).slice(2, 6)}`
}

const DEFAULT_LABEL: Record<NodeKind, string> = {
  start: 'Начало',
  end: 'Конец',
  process: 'Действие',
  decision: 'Условие?',
  data: 'Ввод / вывод данных',
  subroutine: 'Подпроцесс',
  return: 'Возврат результата',
  connector: 'A',
  note: 'Заметка — выберите блок и измените текст в панели свойств',
  entity: 'Сущность',
  phase: 'Фаза 1. Название этапа',
  annotation: 'Элемент интерфейса',
  screen: 'Экран приложения',
  heading: 'Заголовок диаграммы',
  legend: 'Легенда',
}

export function makeNode(
  kind: NodeKind,
  x: number,
  y: number,
  label?: string,
  extra?: Partial<DiagramNodeData>,
): DiagramNode {
  const data: DiagramNodeData = {
    label: label ?? DEFAULT_LABEL[kind],
    scheme: KIND_INFO[kind].scheme,
  }
  if (kind === 'entity') {
    data.kindLabel = 'СПРАВОЧНИК'
    data.fields = [
      { name: 'ИД', key: 'PK' },
      { name: 'Название', key: null },
    ]
  }
  if (kind === 'phase') {
    data.steps = [
      { id: uid('s'), text: 'Первый шаг процесса' },
      { id: uid('s'), text: 'Проверка условия', check: true, rules: ['BR1'] },
    ]
  }
  if (kind === 'annotation') {
    data.num = 1
    data.body = 'Тип: элемент списка. Данные: [[Сущность.Поле]]. Поведение при изменении статуса'
    data.rules = ['BR1']
  }
  if (kind === 'screen') {
    data.time = '9:41'
    data.battery = '87%'
    data.title = 'Название экрана'
    data.person = 'Иванова Анна Сергеевна'
    data.badge = 'Полис ОМС'
    data.rows = [
      { text: 'Элемент списка', badge: 'бейдж', tone: 'blue' },
      { text: 'Второй элемент' },
    ]
    data.button = 'Главная кнопка'
  }
  if (kind === 'legend') {
    data.legendRows = [
      { chip: 'PK', text: 'первичный ключ' },
      { chip: 'FK', text: 'внешний ключ' },
    ]
  }
  if (extra) Object.assign(data, extra)
  return { id: uid(kind), type: kind, position: { x, y }, data, selected: false }
}

export function makeEdge(
  source: string,
  target: string,
  label?: string,
  handles?: { sourceHandle?: string | null; targetHandle?: string | null },
): DiagramEdge {
  return {
    id: uid('e'),
    source,
    target,
    sourceHandle: handles?.sourceHandle ?? 'out',
    targetHandle: handles?.targetHandle ?? 'in',
    type: 'smoothstep',
    label: label || undefined,
    animated: false,
    style: { stroke: EDGE_COLOR, strokeWidth: 1.6 },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 18, height: 18 },
    labelStyle: { fill: '#475569', fontSize: 12, fontWeight: 600 },
    labelBgStyle: { fill: '#ffffff' },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 4,
  }
}

export function edgeFromConnection(c: {
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
}): DiagramEdge {
  return makeEdge(c.source, c.target, undefined, {
    sourceHandle: c.sourceHandle,
    targetHandle: c.targetHandle,
  })
}

/* ─────────────── Приблизительные размеры узлов ─────────────── */

export function approxSize(n: DiagramNode): { w: number; h: number } {
  const k = (n.type ?? 'process') as NodeKind
  const rows = n.data.fields?.length ?? 0
  switch (k) {
    case 'start':
    case 'end':
      return { w: 150, h: 52 }
    case 'decision':
      return { w: 210, h: 130 }
    case 'connector':
      return { w: 54, h: 54 }
    case 'note':
      return { w: 250, h: 96 }
    case 'entity':
      return { w: 300, h: 66 + rows * 30 + (rows === 0 ? 26 : 6) }
    case 'data':
    case 'subroutine':
      return { w: 250, h: 56 }
    case 'phase': {
      const steps = n.data.steps ?? []
      const subs = steps.reduce((acc, s) => acc + (s.subs?.length ?? 0), 0)
      return { w: 640, h: 84 + steps.length * 58 + subs * 24 }
    }
    case 'annotation':
      return { w: 560, h: 118 }
    case 'screen':
      return { w: 310, h: 380 + (n.data.rows?.length ?? 0) * 34 + (n.data.banner ? 60 : 0) }
    case 'heading':
      return { w: 700, h: 88 }
    case 'legend':
      return { w: 540, h: 48 + (n.data.legendRows?.length ?? 2) * 30 }
    default:
      return { w: 280, h: 56 }
  }
}

/* ─────────────────── Авто-раскладка (dagre) ─────────────────── */

export function autoLayout(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
  if (nodes.length === 0) return nodes
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 80, marginx: 40, marginy: 40 })
  g.setDefaultEdgeLabel(() => ({}))
  const sizes = new Map<string, { w: number; h: number }>()
  for (const n of nodes) {
    const s = approxSize(n)
    sizes.set(n.id, s)
    g.setNode(n.id, { width: s.w, height: s.h })
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target)
  }
  dagre.layout(g)
  return nodes.map((n) => {
    const p = g.node(n.id)
    const s = sizes.get(n.id)!
    return { ...n, position: { x: p.x - s.w / 2, y: p.y - s.h / 2 } }
  })
}

/* ─────────────────── Экспорт изображения ─────────────────── */

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function safeFileName(s: string): string {
  return (s || 'diagram').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80)
}

export async function exportImage(
  nodes: DiagramNode[],
  format: 'png' | 'svg',
  title: string,
): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewportEl) return
  if (nodes.length === 0) throw new Error('Схема пуста — нечего экспортировать')

  const { toPng, toSvg } = await import('html-to-image')
  const bounds = getNodesBounds(nodes)
  const pad = 64
  const w = Math.max(560, Math.ceil(bounds.width) + pad * 2)
  const h = Math.max(420, Math.ceil(bounds.height) + pad * 2)
  const zoom = Math.min(2, Math.min(w / Math.max(bounds.width, 1), h / Math.max(bounds.height, 1)))
  const x = (w - bounds.width * zoom) / 2 - bounds.x * zoom
  const y = (h - bounds.height * zoom) / 2 - bounds.y * zoom

  const opts = {
    backgroundColor: '#ffffff',
    width: w,
    height: h,
    style: {
      width: `${w}px`,
      height: `${h}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
  }

  const dataUrl = format === 'png' ? await toPng(viewportEl, opts) : await toSvg(viewportEl, opts)
  download(dataUrl, `${safeFileName(title)}.${format}`)
}

export function exportJson(doc: Doc): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  download(url, `${safeFileName(doc.title)}.json`)
  URL.revokeObjectURL(url)
}

/* ─────────────────── Экспорт Markdown ─────────────────── */

export function buildMarkdown(doc: Doc): string {
  const out: string[] = []
  out.push(`# ${doc.title || 'Схема'}`)
  if (doc.subtitle) out.push('', `_${doc.subtitle}_`)
  let stepCounter = 0
  for (const n of doc.nodes) {
    const k = (n.type ?? 'process') as NodeKind
    const d = n.data
    switch (k) {
      case 'phase':
        out.push('', `## ${d.label}`)
        for (const s of d.steps ?? []) {
          stepCounter += 1
          const rules = s.rules?.length ? ` \\[${s.rules.join(', ')}\\]` : ''
          out.push(`${stepCounter}. ${s.check ? '**' : ''}${s.text}${s.check ? '**' : ''}${rules}`)
          for (const sub of s.subs ?? []) {
            out.push(`   - **${sub.chip}:** ${sub.text}`)
          }
        }
        break
      case 'entity': {
        out.push('', `### ${d.label}${d.kindLabel ? ` (${d.kindLabel})` : ''}`, '', '| Поле | Ключ |', '| --- | --- |')
        for (const f of d.fields ?? []) out.push(`| ${f.name} | ${f.key ?? ''} |`)
        break
      }
      case 'annotation':
        out.push('', `**${d.num ?? ''}. ${d.label}** — ${(d.body ?? '').replace(/\[\[([^\]]+)\]\]/g, '\`$1\`')}${d.rules?.length ? ` (${d.rules.join(', ')})` : ''}`)
        break
      case 'screen':
        out.push('', `### Экран: ${d.title ?? d.label}`)
        if (d.banner) out.push(`> УВЕДОМЛЕНИЕ: ${d.banner}`)
        if (d.person) out.push(`Пользователь: ${d.person}${d.badge ? ` — ${d.badge}` : ''}`)
        for (const r of d.rows ?? []) out.push(`- ${r.text}${r.badge ? ` (${r.badge})` : ''}`)
        if (d.button) out.push(`**[ ${d.button} ]**`)
        break
      case 'legend':
        out.push('', '---')
        for (const r of d.legendRows ?? []) out.push(`**[${r.chip}]** ${r.text}`)
        break
      case 'heading':
        break
      default: {
        const info = KIND_INFO[k]?.name ?? k
        out.push('', `- **${info}:** ${d.label}`)
      }
    }
  }
  return out.join('\n')
}

export function exportMarkdown(doc: Doc): void {
  const blob = new Blob([buildMarkdown(doc)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  download(url, `${safeFileName(doc.title)}.md`)
  URL.revokeObjectURL(url)
}

/* ─────────────────── ИИ-генерация ─────────────────── */

export interface AIGenNode {
  id: string
  kind: string
  x?: number
  y?: number
  label?: string
  sub?: string
  kindLabel?: string
  fields?: { name: string; key?: string | null }[]
  steps?: { text?: string; check?: boolean; rules?: string[]; subs?: { chip?: string; tone?: string; text?: string }[] }[]
  num?: number
  body?: string
  rules?: string[]
  time?: string
  battery?: string
  banner?: string
  person?: string
  badge?: string
  rows?: ScreenRow[]
  button?: string
  legendRows?: LegendRow[]
}

export interface AIGenEdge {
  from: string
  to: string
  label?: string
}

export interface AIGenDoc {
  title?: string
  subtitle?: string
  nodes?: AIGenNode[]
  edges?: AIGenEdge[]
}

const AI_KINDS: Record<string, NodeKind> = {
  start: 'start',
  end: 'end',
  process: 'process',
  decision: 'decision',
  data: 'data',
  subroutine: 'subroutine',
  return: 'return',
  connector: 'connector',
  note: 'note',
  entity: 'entity',
  phase: 'phase',
  annotation: 'annotation',
  screen: 'screen',
  heading: 'heading',
  legend: 'legend',
}

/** Безопасное преобразование ответа модели в документ редактора */
export function aiToDoc(gen: AIGenDoc): Doc | null {
  const defs = (gen.nodes ?? []).filter((n) => n && n.id && AI_KINDS[n.kind])
  if (defs.length === 0) return null
  const idMap = new Map<string, string>()
  const nodes: DiagramNode[] = []
  for (const n of defs) {
    const kind = AI_KINDS[n.kind]
    const extra: Partial<DiagramNodeData> = {}
    if (kind === 'entity') {
      extra.kindLabel = n.kindLabel ?? 'СПРАВОЧНИК'
      extra.fields = (n.fields ?? []).slice(0, 10).map((f) => ({
        name: String(f?.name ?? 'Поле'),
        key: f?.key === 'PK' ? 'PK' : f?.key === 'FK' ? 'FK' : null,
      }))
    }
    if (kind === 'phase') {
      extra.steps = (n.steps ?? []).slice(0, 12).map((s) => ({
        id: uid('s'),
        text: String(s?.text ?? 'Шаг'),
        check: !!s?.check,
        rules: (s?.rules ?? []).map(String).slice(0, 6),
        subs: (s?.subs ?? []).slice(0, 6).map((x) => ({
          chip: String(x?.chip ?? '').slice(0, 16),
          tone: x?.tone === 'red' ? ('red' as const) : ('blue' as const),
          text: String(x?.text ?? ''),
        })),
      }))
    }
    if (kind === 'annotation') {
      extra.num = Number(n.num) || 1
      extra.body = String(n.body ?? '')
      extra.rules = (n.rules ?? []).map(String).slice(0, 6)
    }
    if (kind === 'screen') {
      extra.time = String(n.time ?? '9:41')
      extra.battery = String(n.battery ?? '87%')
      extra.banner = n.banner ? String(n.banner) : undefined
      extra.person = n.person ? String(n.person) : undefined
      extra.badge = n.badge ? String(n.badge) : undefined
      extra.button = n.button ? String(n.button) : undefined
      extra.rows = (n.rows ?? []).slice(0, 10).map((r) => ({
        text: String(r?.text ?? ''),
        badge: r?.badge ? String(r.badge) : undefined,
        tone: (['blue', 'black', 'gray', 'green', 'red'] as const).includes(r?.tone as 'blue')
          ? (r?.tone as ScreenRow['tone'])
          : 'blue',
      }))
    }
    if (kind === 'heading') {
      extra.sub = String(n.sub ?? '')
    }
    if (kind === 'legend') {
      extra.legendRows = (n.legendRows ?? []).slice(0, 8).map((r) => ({
        chip: String(r?.chip ?? '?').slice(0, 12),
        text: String(r?.text ?? ''),
      }))
    }
    const node = makeNode(kind, Number(n.x) || 0, Number(n.y) || 0, n.label ? String(n.label) : undefined, extra)
    idMap.set(n.id, node.id)
    nodes.push(node)
  }
  const edges: DiagramEdge[] = []
  for (const e of gen.edges ?? []) {
    const s = idMap.get(e?.from)
    const t = idMap.get(e?.to)
    if (!s || !t || s === t) continue
    edges.push(makeEdge(s, t, e?.label ? String(e.label) : undefined))
  }
  return {
    title: gen.title ? String(gen.title) : 'Схема от ИИ',
    subtitle: gen.subtitle ? String(gen.subtitle) : '',
    nodes,
    edges,
  }
}
