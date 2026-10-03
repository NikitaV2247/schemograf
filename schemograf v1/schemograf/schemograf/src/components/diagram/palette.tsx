'use client'

import { KIND_INFO, PALETTE, type NodeKind } from '@/lib/diagram'

const KIND_ICONS: Record<NodeKind, string> = {
  start: '◯',
  end: '◉',
  process: '▭',
  decision: '◇',
  data: '▱',
  subroutine: '▤',
  return: '⬒',
  connector: '⭘',
  note: '◌',
  entity: '▦',
  phase: '☰',
  annotation: '❝',
  screen: '▢',
  heading: 'T',
  legend: '※',
}

const KIND_MINI: Record<NodeKind, { bg: string; border: string; text: string }> = {
  start: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  end: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  process: { bg: '#f8fafc', border: '#94a3b8', text: '#334155' },
  decision: { bg: '#fff7ed', border: '#f59e0b', text: '#b45309' },
  data: { bg: '#f8fafc', border: '#94a3b8', text: '#334155' },
  subroutine: { bg: '#f8fafc', border: '#94a3b8', text: '#334155' },
  return: { bg: '#ecfdf5', border: '#10b981', text: '#047857' },
  connector: { bg: '#f8fafc', border: '#94a3b8', text: '#334155' },
  note: { bg: '#fefce8', border: '#e3cf6f', text: '#854d0e' },
  entity: { bg: '#ffffff', border: '#cbd5e1', text: '#1e293b' },
  phase: { bg: '#ffffff', border: '#334155', text: '#1e293b' },
  annotation: { bg: '#eff6ff', border: '#7dd3fc', text: '#0369a1' },
  screen: { bg: '#ffffff', border: '#1e293b', text: '#0f172a' },
  heading: { bg: '#fafafa', border: '#e2e8f0', text: '#0f172a' },
  legend: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
}

export function Palette({ onAdd }: { onAdd: (kind: NodeKind) => void }) {
  return (
    <aside
      aria-label="Палитра блоков"
      className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r bg-background md:flex"
    >
      <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Блоки — перетащите на холст
      </div>
      {PALETTE.map((g) => (
        <div key={g.group} className="px-3 pb-3">
          <div className="px-1 pb-1.5 pt-2 text-[11px] font-medium text-muted-foreground/80">{g.group}</div>
          <div className="grid grid-cols-2 gap-2">
            {g.kinds.map((k) => {
              const c = KIND_MINI[k]
              return (
                <button
                  key={k}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/schemograf', k)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => onAdd(k)}
                  title={KIND_INFO[k].hint ? `${KIND_INFO[k].name} — ${KIND_INFO[k].hint}` : KIND_INFO[k].name}
                  className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card p-2.5 text-center transition-colors hover:border-slate-400/70 hover:bg-accent active:cursor-grabbing"
                >
                  <span
                    className="flex h-7 w-10 items-center justify-center rounded text-[15px] leading-none"
                    style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.text }}
                  >
                    {KIND_ICONS[k]}
                  </span>
                  <span className="text-[10.5px] font-medium leading-tight text-foreground/80">
                    {KIND_INFO[k].name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="mt-auto border-t px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <b>Совет:</b> тяните связь от кружка-порта одного блока к другому. У ромба три выхода — снизу, слева и справа.
      </div>
    </aside>
  )
}
