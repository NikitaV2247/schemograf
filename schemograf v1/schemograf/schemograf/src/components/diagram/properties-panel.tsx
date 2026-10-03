'use client'

import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SCHEMES, KIND_INFO, type DiagramNodeData, type EntityField, type NodeKind } from '@/lib/diagram'
import { useEditor } from '@/components/diagram/store'
import { AnnotationEditor, HeadingEditor, LegendEditor, PhaseEditor, ScreenEditor } from '@/components/diagram/editors'

const SCHEME_KEYS = Object.keys(SCHEMES)

export function PropertiesPanel() {
  const nodes = useEditor((s) => s.nodes)
  const edges = useEditor((s) => s.edges)
  const updateNodeData = useEditor((s) => s.updateNodeData)
  const updateEdge = useEditor((s) => s.updateEdge)
  const deleteSelected = useEditor((s) => s.deleteSelected)

  const selNodes = nodes.filter((n) => n.selected)
  const selEdges = edges.filter((e) => e.selected)

  if (selNodes.length !== 1 && selEdges.length !== 1) {
    return (
      <aside
        aria-label="Панель свойств"
        className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background p-4 lg:block"
      >
        <div className="rounded-lg border border-dashed p-4 text-[12.5px] leading-relaxed text-muted-foreground">
          <p className="mb-2 font-medium text-foreground/80">Ничего не выбрано</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Клик по блоку — текст, цвет и поля</li>
            <li>Клик по связи — подпись и стиль линии</li>
            <li>Shift+клик — выбор нескольких объектов</li>
            <li>Delete — удалить выбранное</li>
          </ul>
        </div>
      </aside>
    )
  }

  /* Свойства связи */
  if (selEdges.length === 1) {
    const e = selEdges[0]
    return (
      <aside aria-label="Свойства связи" className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background p-4 lg:block">
        <PanelHeader title="Связь" onClose={deleteSelected} />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edge-label">Подпись (Да / Нет, 1 ─ N…)</Label>
            <Input
              id="edge-label"
              value={e.label ?? ''}
              placeholder="Например: Да"
              onChange={(ev) => updateEdge(e.id, { label: ev.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Форма линии</Label>
            <Select value={e.type ?? 'smoothstep'} onValueChange={(v) => updateEdge(e.id, { type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoothstep">Ортогональная (по умолчанию)</SelectItem>
                <SelectItem value="straight">Прямая</SelectItem>
                <SelectItem value="step">Ступенчатая</SelectItem>
                <SelectItem value="bezier">Кривая Безье</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edge-anim">Пунктирная анимация</Label>
            <Switch id="edge-anim" checked={!!e.animated} onCheckedChange={(v) => updateEdge(e.id, { animated: v })} />
          </div>
          <Button variant="destructive" size="sm" className="w-full" onClick={deleteSelected}>
            <Trash2 /> Удалить связь
          </Button>
        </div>
      </aside>
    )
  }

  /* Свойства узла */
  const n = selNodes[0]
  const kind = (n.type ?? 'process') as NodeKind
  const d = n.data as DiagramNodeData

  const setFields = (fields: EntityField[]) => updateNodeData(n.id, { fields })

  /* Спец-редакторы вместо общего интерфейса */
  if (kind === 'phase' || kind === 'annotation' || kind === 'screen' || kind === 'heading' || kind === 'legend') {
    const titles: Record<string, string> = {
      phase: 'Фаза спецификации',
      annotation: 'Аннотация прототипа',
      screen: 'Экран приложения',
      heading: 'Заголовок',
      legend: 'Легенда',
    }
    const patch = (p: Partial<DiagramNodeData>) => updateNodeData(n.id, p)
    return (
      <aside aria-label="Свойства блока" className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background p-4 lg:block">
        <PanelHeader title={titles[kind]} onClose={deleteSelected} />
        {kind !== 'phase' && kind !== 'heading' && kind !== 'screen' && (
          <div className="mb-3 space-y-1.5">
            <Label htmlFor="spec-label">Название</Label>
            <Input id="spec-label" value={d.label} onChange={(ev) => patch({ label: ev.target.value })} />
          </div>
        )}
        <div className={kind === 'phase' ? 'space-y-0' : 'space-y-4'}>
          {kind === 'phase' && (
            <>
              <div className="mb-3 space-y-1.5">
                <Label htmlFor="phase-label">Заголовок фазы</Label>
                <Input id="phase-label" value={d.label} onChange={(ev) => patch({ label: ev.target.value })} />
              </div>
              <PhaseEditor data={d} patch={patch} />
            </>
          )}
          {kind === 'annotation' && <AnnotationEditor data={d} patch={patch} />}
          {kind === 'screen' && <ScreenEditor data={d} patch={patch} />}
          {kind === 'heading' && <HeadingEditor data={d} patch={patch} />}
          {kind === 'legend' && <LegendEditor data={d} patch={patch} />}
        </div>
        <Button variant="destructive" size="sm" className="mt-4 w-full" onClick={deleteSelected}>
          <Trash2 /> Удалить блок
        </Button>
      </aside>
    )
  }

  return (
    <aside aria-label="Свойства блока" className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background p-4 lg:block">
      <PanelHeader title={`Блок · ${KIND_INFO[kind].name}`} onClose={deleteSelected} />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="node-label">Текст блока</Label>
          <Textarea
            id="node-label"
            rows={3}
            value={d.label}
            onChange={(ev) => updateNodeData(n.id, { label: ev.target.value })}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Цветовая схема</Label>
          <div className="flex flex-wrap gap-2">
            {SCHEME_KEYS.map((key) => {
              const s = SCHEMES[key]
              const active = (d.scheme ?? KIND_INFO[kind].scheme) === key
              return (
                <button
                  key={key}
                  type="button"
                  title={s.name}
                  onClick={() => updateNodeData(n.id, { scheme: key })}
                  className={`h-8 w-12 rounded-md border text-[10px] font-semibold transition-transform hover:scale-105 ${
                    active ? 'ring-2 ring-slate-900/60 dark:ring-white/70' : ''
                  }`}
                  style={{ background: s.bg, borderColor: s.border, color: s.text }}
                >
                  Аа
                </button>
              )
            })}
          </div>
        </div>

        {kind === 'entity' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="entity-kind">Тип сущности (справа в шапке)</Label>
              <Input
                id="entity-kind"
                value={d.kindLabel ?? ''}
                placeholder="СПРАВОЧНИК / ДОКУМЕНТ…"
                onChange={(ev) => updateNodeData(n.id, { kindLabel: ev.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Поля сущности</Label>
              <div className="space-y-1.5">
                {(d.fields ?? []).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      value={f.name}
                      className="h-8 font-mono text-[12px]"
                      onChange={(ev) => {
                        const fields = (d.fields ?? []).map((x, j) =>
                          j === i ? { ...x, name: ev.target.value } : x,
                        )
                        setFields(fields)
                      }}
                    />
                    <Select
                      value={f.key ?? 'none'}
                      onValueChange={(v) => {
                        const fields = (d.fields ?? []).map((x, j) =>
                          j === i ? { ...x, key: v === 'none' ? null : (v as 'PK' | 'FK') } : x,
                        )
                        setFields(fields)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[68px] shrink-0 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="PK">PK</SelectItem>
                        <SelectItem value="FK">FK</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setFields((d.fields ?? []).filter((_, j) => j !== i))}
                      aria-label="Удалить поле"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setFields([...(d.fields ?? []), { name: 'Новое поле', key: null }])}
              >
                + Добавить поле
              </Button>
            </div>
          </>
        )}

        <Button variant="destructive" size="sm" className="w-full" onClick={deleteSelected}>
          <Trash2 /> Удалить блок
        </Button>
      </div>
    </aside>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b pb-2">
      <h2 className="text-[13px] font-semibold">{title}</h2>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Удалить выбранное">
        <X />
      </Button>
    </div>
  )
}
