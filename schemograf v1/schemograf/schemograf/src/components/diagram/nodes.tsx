'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { SCHEMES, type DiagramNode, type DiagramNodeData, type NodeKind, type Scheme } from '@/lib/diagram'

/* Общие утилиты */

const KIND_SCHEME_FALLBACK: Record<string, string> = {
  process: 'slate',
  return: 'green',
  data: 'slate',
  subroutine: 'slate',
  start: 'blue',
  end: 'blue',
  decision: 'amber',
  connector: 'slate',
}

function schemeOf(data: DiagramNodeData, fallback: string): Scheme {
  return SCHEMES[data.scheme ?? fallback] ?? SCHEMES.slate
}

function handleStyle(selected?: boolean) {
  return {
    width: 10,
    height: 10,
    background: '#ffffff',
    border: `1.5px solid ${selected ? '#0f172a' : '#94a3b8'}`,
  }
}

function Ports({ kind, selected }: { kind: NodeKind; selected?: boolean }) {
  const s = handleStyle(selected)
  if (kind === 'decision') {
    return (
      <>
        <Handle type="target" position={Position.Top} id="in" style={s} />
        <Handle type="source" position={Position.Bottom} id="out" style={s} />
        <Handle type="source" position={Position.Left} id="out-l" style={s} />
        <Handle type="source" position={Position.Right} id="out-r" style={s} />
      </>
    )
  }
  if (kind === 'entity') {
    return (
      <>
        <Handle type="target" position={Position.Left} id="in-l" style={s} />
        <Handle type="target" position={Position.Right} id="in-r" style={s} />
        <Handle type="target" position={Position.Top} id="in" style={s} />
        <Handle type="source" position={Position.Right} id="out-r" style={s} />
        <Handle type="source" position={Position.Left} id="out-l" style={s} />
        <Handle type="source" position={Position.Bottom} id="out" style={s} />
      </>
    )
  }
  return (
    <>
      <Handle type="target" position={Position.Top} id="in" style={s} />
      <Handle type="source" position={Position.Bottom} id="out" style={s} />
    </>
  )
}

const ringCls = (selected?: boolean) =>
  `group relative transition-shadow ${selected ? 'ring-2 ring-slate-900/50 dark:ring-slate-100/60' : ''}`

/* ───────── Пилюля: Начало / Конец ───────── */

export function TerminalNode({ data, selected }: NodeProps<DiagramNode>) {
  const sc = schemeOf(data, 'blue')
  return (
    <div className={ringCls(selected)}>
      <Ports kind="start" selected={selected} />
      <div
        className="whitespace-pre-wrap break-words rounded-full px-8 py-3 text-center text-[14px] font-bold shadow-sm"
        style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.text, maxWidth: 240 }}
      >
        {data.label}
      </div>
    </div>
  )
}

/* ───────── Прямоугольник: Процесс / Результат ───────── */

export function RectNode({ data, selected, type }: NodeProps<DiagramNode>) {
  const kind = (type ?? 'process') as NodeKind
  const sc = schemeOf(data, KIND_SCHEME_FALLBACK[kind] ?? 'slate')
  const mono = kind === 'process' || kind === 'return'
  return (
    <div className={ringCls(selected)}>
      <Ports kind={kind} selected={selected} />
      <div
        className={`whitespace-pre-wrap break-words rounded-lg px-5 py-2.5 text-center text-[13.5px] leading-snug shadow-sm ${mono ? 'font-mono' : ''}`}
        style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.text, maxWidth: 340, minWidth: 90 }}
      >
        {data.label}
      </div>
    </div>
  )
}

/* ───────── Ромб: Решение ───────── */

export function DecisionNode({ data, selected }: NodeProps<DiagramNode>) {
  const sc = schemeOf(data, 'amber')
  const clip = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
  return (
    <div className={ringCls(selected)} style={{ width: 210, height: 130 }}>
      <Ports kind="decision" selected={selected} />
      <div className="absolute inset-0" style={{ background: sc.border, clipPath: clip }} />
      <div className="absolute inset-[1.5px]" style={{ background: sc.bg, clipPath: clip }} />
      <div
        className="absolute inset-0 flex items-center justify-center p-7 text-center text-[13.5px] font-bold leading-tight"
        style={{ color: sc.text }}
      >
        <span className="whitespace-pre-wrap break-words">{data.label}</span>
      </div>
    </div>
  )
}

/* ───────── Параллелограмм: Данные ───────── */

export function DataNode({ data, selected }: NodeProps<DiagramNode>) {
  const sc = schemeOf(data, 'slate')
  return (
    <div className={ringCls(selected)}>
      <Ports kind="data" selected={selected} />
      <div
        className="px-6 py-2.5 shadow-sm"
        style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, transform: 'skewX(-14deg)', borderRadius: 6 }}
      >
        <div
          className="whitespace-pre-wrap break-words text-center font-mono text-[13.5px] leading-snug"
          style={{ color: sc.text, transform: 'skewX(14deg)', maxWidth: 280, minWidth: 80 }}
        >
          {data.label}
        </div>
      </div>
    </div>
  )
}

/* ───────── Подпроцесс (двойные боковые линии) ───────── */

export function SubroutineNode({ data, selected }: NodeProps<DiagramNode>) {
  const sc = schemeOf(data, 'slate')
  return (
    <div className={ringCls(selected)}>
      <Ports kind="subroutine" selected={selected} />
      <div
        className="relative whitespace-pre-wrap break-words rounded-md px-6 py-2.5 text-center font-mono text-[13.5px] leading-snug shadow-sm"
        style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.text, maxWidth: 320, minWidth: 100 }}
      >
        <span className="absolute bottom-0.5 left-[5px] top-0.5 w-px" style={{ background: sc.border }} />
        <span className="absolute bottom-0.5 right-[5px] top-0.5 w-px" style={{ background: sc.border }} />
        {data.label}
      </div>
    </div>
  )
}

/* ───────── Соединитель (кружок с буквой) ───────── */

export function ConnectorNode({ data, selected }: NodeProps<DiagramNode>) {
  const sc = schemeOf(data, 'slate')
  return (
    <div className={ringCls(selected)}>
      <Ports kind="connector" selected={selected} />
      <div
        className="flex h-[54px] w-[54px] items-center justify-center rounded-full text-center font-mono text-[15px] font-bold shadow-sm"
        style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.text }}
      >
        {data.label.slice(0, 3)}
      </div>
    </div>
  )
}

/* ───────── Заметка (стикер) ───────── */

export function NoteNode({ data, selected }: NodeProps<DiagramNode>) {
  return (
    <div className={ringCls(selected)}>
      <Ports kind="note" selected={selected} />
      <div
        className="max-w-[260px] whitespace-pre-wrap break-words rounded-md border px-4 py-3 text-left text-[12.5px] italic leading-snug text-amber-900 shadow-sm"
        style={{ background: '#fefce8', borderColor: '#e3cf6f' }}
      >
        {data.label}
      </div>
    </div>
  )
}

/* ───────── ER-сущность (карточка-таблица) ───────── */

export function EntityNode({ data, selected }: NodeProps<DiagramNode>) {
  const fields = data.fields ?? []
  return (
    <div className={ringCls(selected)}>
      <Ports kind="entity" selected={selected} />
      <div className="w-[300px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-md">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
          <span className="whitespace-pre-wrap break-words text-[14.5px] font-bold leading-tight text-slate-800">
            {data.label}
          </span>
          {data.kindLabel ? (
            <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {data.kindLabel}
            </span>
          ) : null}
        </div>
        {fields.length === 0 ? (
          <div className="px-3 py-2.5 font-mono text-[12.5px] text-slate-400">— нет полей —</div>
        ) : (
          <ul>
            {fields.map((f, i) => (
              <li
                key={i}
                className={`flex items-center justify-between gap-2 px-3 py-[5px] font-mono text-[12.5px] text-slate-700 ${
                  i > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                <span className="break-words leading-snug">{f.name}</span>
                {f.key ? (
                  <span
                    className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold ${
                      f.key === 'PK' ? 'bg-slate-200 text-slate-600' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {f.key}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ───────── Фаза спецификации (шаги + проверки бизнес-правил) ───────── */

export function PhaseNode({ data, selected }: NodeProps<DiagramNode>) {
  const steps = data.steps ?? []
  return (
    <div className={ringCls(selected)}>
      <Ports kind="phase" selected={selected} />
      <div className="w-[640px] rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="rounded-lg border-l-4 border-slate-700 bg-slate-100 px-4 py-2.5 text-[15px] font-bold leading-snug text-slate-800">
          {data.label}
        </div>
        {steps.length > 0 && (
          <div className="mt-2 space-y-2">
            {steps.map((s, i) => (
              <div
                key={s.id ?? i}
                className={`rounded-lg border px-3 py-2 ${
                  s.check ? 'border-amber-300 bg-amber-50/80' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <span className={`flex-1 whitespace-pre-wrap break-words text-[13px] leading-snug text-slate-800 ${s.check ? 'font-bold' : ''}`}>
                    {s.text}
                  </span>
                  {s.rules && s.rules.length > 0 ? (
                    <span className="shrink-0 rounded bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-700">
                      {s.rules.join(', ')}
                    </span>
                  ) : null}
                </div>
                {s.subs && s.subs.length > 0 ? (
                  <div className="mt-1.5 space-y-1 pl-9">
                    {s.subs.map((sub, j) => (
                      <div key={j} className="flex items-start gap-2 text-[12px] leading-snug">
                        <span
                          className={`shrink-0 rounded px-1.5 py-px text-[11px] font-bold ${
                            sub.tone === 'red' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {sub.chip}
                        </span>
                        <span className="text-slate-600">{sub.text}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────── Аннотация прототипа (нумерованная карточка с чипами) ───────── */

function renderChips(body: string) {
  const parts = body.split(/(\[\[[^\]]+\]\])/g)
  return parts.map((p, i) => {
    const m = p.match(/^\[\[([^\]]+)\]\]$/)
    if (m) {
      return (
        <span
          key={i}
          className="mx-px inline-block rounded border border-sky-100 bg-sky-50 px-1.5 py-px align-baseline font-mono text-[11.5px] text-sky-700"
        >
          {m[1]}
        </span>
      )
    }
    return <span key={i}>{p}</span>
  })
}

export function AnnotationNode({ data, selected }: NodeProps<DiagramNode>) {
  return (
    <div className={ringCls(selected)}>
      <Ports kind="annotation" selected={selected} />
      <div className="w-[560px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-600">
            {data.num ?? '•'}
          </span>
          <p className="flex-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700">
            <b className="text-slate-900">{data.label}</b>
            {data.body ? <> — {renderChips(data.body)}</> : null}
            {data.rules && data.rules.length > 0 ? (
              <>
                {' '}
                {data.rules.map((r, i) => (
                  <span key={i} className="mx-px inline-block rounded bg-sky-100 px-1.5 py-px align-baseline font-mono text-[11px] font-bold text-sky-700">
                    {r}
                  </span>
                ))}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ───────── Экран приложения (мокап телефона) ───────── */

const TONE_CLS: Record<string, string> = {
  blue: 'bg-sky-100 text-sky-700',
  black: 'bg-slate-900 text-white',
  gray: 'bg-slate-200 text-slate-500',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-600',
}

export function ScreenNode({ data, selected }: NodeProps<DiagramNode>) {
  const rows = data.rows ?? []
  return (
    <div className={ringCls(selected)}>
      <Ports kind="screen" selected={selected} />
      <div className="w-[300px] overflow-hidden rounded-[26px] border-2 border-slate-800 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-1.5 text-[10.5px] font-semibold text-slate-500">
          <span>{data.time || '9:41'}</span>
          <span className="truncate px-2">{data.kindLabel || ''}</span>
          <span>{data.battery || '100%'}</span>
        </div>
        <div className="space-y-2 px-3 py-2.5">
          {data.banner ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10.5px] leading-snug text-amber-900">
              {data.banner}
            </div>
          ) : null}
          <div className="text-[15px] font-bold leading-tight text-slate-900">{data.title || data.label}</div>
          {data.person || data.badge ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {data.person ? <span className="text-[11.5px] text-slate-600">{data.person}</span> : null}
              {data.badge ? (
                <span className="rounded-full border border-emerald-300 px-1.5 py-px text-[9.5px] font-bold text-emerald-600">
                  {data.badge}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-1">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/60 px-2.5 py-1.5">
                <span className="min-w-0 flex-1 break-words text-[11px] leading-snug text-slate-700">{r.text}</span>
                {r.badge ? (
                  <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-bold ${TONE_CLS[r.tone ?? 'blue']}`}>
                    {r.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {data.button ? (
            <div className="rounded-lg bg-slate-900 py-2 text-center text-[12px] font-bold text-white">{data.button}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ───────── Заголовок диаграммы (попадает в экспорт) ───────── */

export function HeadingNode({ data, selected }: NodeProps<DiagramNode>) {
  return (
    <div className={ringCls(selected)}>
      <Ports kind="heading" selected={selected} />
      <div className="w-[700px] px-6 text-center">
        <div className="whitespace-pre-wrap break-words text-[26px] font-bold leading-tight tracking-tight text-slate-900">
          {data.label}
        </div>
        {data.sub ? (
          <div className="mt-1.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-slate-500">{data.sub}</div>
        ) : null}
      </div>
    </div>
  )
}

/* ───────── Легенда обозначений ───────── */

export function LegendNode({ data, selected }: NodeProps<DiagramNode>) {
  const rows = data.legendRows ?? []
  return (
    <div className={ringCls(selected)}>
      <Ports kind="legend" selected={selected} />
      <div className="w-[540px] rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-3 shadow-sm">
        {rows.length === 0 ? (
          <div className="text-[12.5px] text-slate-400">— пустая легенда —</div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12.5px] text-slate-600">
                <span className="min-w-[46px] rounded bg-sky-100 px-1.5 py-px text-center font-mono text-[11px] font-bold text-sky-700">
                  {r.chip}
                </span>
                <span className="flex-1 break-words">{r.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* Регистрация nodeTypes — вне компонента, чтобы не пересоздавать объект */

export const nodeTypes = {
  start: TerminalNode,
  end: TerminalNode,
  process: RectNode,
  return: RectNode,
  decision: DecisionNode,
  data: DataNode,
  subroutine: SubroutineNode,
  connector: ConnectorNode,
  note: NoteNode,
  entity: EntityNode,
  phase: PhaseNode,
  annotation: AnnotationNode,
  screen: ScreenNode,
  heading: HeadingNode,
  legend: LegendNode,
}
