'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { uid, type DiagramNodeData, type LegendRow, type ScreenRow, type SpecStep } from '@/lib/diagram'

interface EditorProps {
  data: DiagramNodeData
  patch: (p: Partial<DiagramNodeData>) => void
}

/* ───────────────── Фаза спецификации ───────────────── */

export function PhaseEditor({ data, patch }: EditorProps) {
  const steps = data.steps ?? []

  const setSteps = (next: SpecStep[]) => patch({ steps: next })

  const updateStep = (idx: number, p: Partial<SpecStep>) => {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...p } : s)))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Шаги фазы ({steps.length})</Label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11.5px]"
          onClick={() => setSteps([...steps, { id: uid('s'), text: 'Новый шаг' }])}
        >
          <Plus /> Шаг
        </Button>
      </div>
      {steps.length === 0 && (
        <p className="rounded-md border border-dashed px-3 py-2 text-[12px] text-muted-foreground">Шагов пока нет</p>
      )}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <StepEditor key={s.id ?? i} index={i} step={s} onChange={(p) => updateStep(i, p)} onRemove={() => setSteps(steps.filter((_, j) => j !== i))} canRemove={steps.length > 1} />
        ))}
      </div>
    </div>
  )
}

function StepEditor({
  index,
  step,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number
  step: SpecStep
  onChange: (p: Partial<SpecStep>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [open, setOpen] = useState(index === 0)
  const subs = step.subs ?? []
  return (
    <div className={`rounded-lg border p-2 ${step.check ? 'border-amber-300 bg-amber-50/50' : 'border-border'}`}>
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10.5px] font-bold text-slate-600">
          {index + 1}
        </span>
        <Input
          value={step.text}
          className="h-8 text-[12.5px]"
          placeholder="Текст шага"
          onChange={(e) => onChange({ text: e.target.value })}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setOpen(!open)} aria-label="Подробнее">
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
        {canRemove ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Удалить шаг">
            <X />
          </Button>
        ) : null}
      </div>
      {open && (
        <div className="mt-2 space-y-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11.5px]">Проверка бизнес-правила (ромб, янтарная карточка)</Label>
            <Switch checked={!!step.check} onCheckedChange={(v) => onChange({ check: v })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11.5px]">Правила (через запятую)</Label>
            <Input
              value={(step.rules ?? []).join(', ')}
              className="h-8 font-mono text-[12px]"
              placeholder="BR1, BR2"
              onChange={(e) =>
                onChange({
                  rules: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11.5px]">Уточнения (чип + текст)</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={() => onChange({ subs: [...subs, { chip: 'ОМС', tone: 'blue', text: 'условие' }] })}
              >
                <Plus /> уточнение
              </Button>
            </div>
            {subs.map((sub, j) => (
              <div key={j} className="flex items-center gap-1.5">
                <Input
                  value={sub.chip}
                  className="h-7 w-20 shrink-0 text-[11.5px] font-semibold"
                  onChange={(e) =>
                    onChange({ subs: subs.map((x, k) => (k === j ? { ...x, chip: e.target.value } : x)) })
                  }
                />
                <Select
                  value={sub.tone ?? 'blue'}
                  onValueChange={(v) =>
                    onChange({ subs: subs.map((x, k) => (k === j ? { ...x, tone: v as 'blue' | 'red' } : x)) })
                  }
                >
                  <SelectTrigger className="h-7 w-[74px] shrink-0 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">синий</SelectItem>
                    <SelectItem value="red">красный</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={sub.text}
                  className="h-7 text-[11.5px]"
                  onChange={(e) =>
                    onChange({ subs: subs.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onChange({ subs: subs.filter((_, k) => k !== j) })}
                  aria-label="Удалить уточнение"
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────── Аннотация прототипа ───────────────── */

export function AnnotationEditor({ data, patch }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="ann-num">Номер</Label>
        <Input
          id="ann-num"
          type="number"
          min={1}
          value={data.num ?? 1}
          onChange={(e) => patch({ num: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ann-title">Заголовок (жирный)</Label>
        <Input id="ann-title" value={data.label} onChange={(e) => patch({ label: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ann-body">Описание</Label>
        <Textarea id="ann-body" rows={4} value={data.body ?? ''} onChange={(e) => patch({ body: e.target.value })} className="resize-none text-[12.5px]" />
        <p className="text-[11px] leading-snug text-muted-foreground">
          Пишите <code className="rounded bg-muted px-1 font-mono">[[Сущность.Поле]]</code> — в тексте это станет синим чипом, как в справочнике сущностей.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="ann-rules">Правила (через запятую)</Label>
        <Input
          id="ann-rules"
          value={(data.rules ?? []).join(', ')}
          placeholder="BR1, BR4"
          className="font-mono text-[12px]"
          onChange={(e) =>
            patch({
              rules: e.target.value
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  )
}

/* ───────────────── Экран приложения ───────────────── */

const ROW_TONES: { value: string; label: string }[] = [
  { value: 'blue', label: 'синий' },
  { value: 'black', label: 'чёрный' },
  { value: 'gray', label: 'серый' },
  { value: 'green', label: 'зелёный' },
  { value: 'red', label: 'красный' },
]

export function ScreenEditor({ data, patch }: EditorProps) {
  const rows = data.rows ?? []
  const setRows = (next: ScreenRow[]) => patch({ rows: next })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="scr-time">Время</Label>
          <Input id="scr-time" value={data.time ?? ''} onChange={(e) => patch({ time: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="scr-batt">Батарея</Label>
          <Input id="scr-batt" value={data.battery ?? ''} onChange={(e) => patch({ battery: e.target.value })} className="h-8" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="scr-title">Заголовок экрана</Label>
        <Input id="scr-title" value={data.title ?? ''} onChange={(e) => patch({ title: e.target.value })} className="h-8" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="scr-banner">Баннер-уведомление (пусто — скрыть)</Label>
        <Textarea id="scr-banner" rows={2} value={data.banner ?? ''} onChange={(e) => patch({ banner: e.target.value })} className="resize-none text-[12.5px]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="scr-person">Пользователь</Label>
          <Input id="scr-person" value={data.person ?? ''} onChange={(e) => patch({ person: e.target.value })} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="scr-badge">Бейдж</Label>
          <Input id="scr-badge" value={data.badge ?? ''} onChange={(e) => patch({ badge: e.target.value })} className="h-8" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Строки экрана ({rows.length})</Label>
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11.5px]" onClick={() => setRows([...rows, { text: 'Элемент' }])}>
            <Plus /> строка
          </Button>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={r.text}
              className="h-7 text-[11.5px]"
              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
            <Input
              value={r.badge ?? ''}
              placeholder="бейдж"
              className="h-7 w-24 shrink-0 text-[11.5px]"
              onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, badge: e.target.value || undefined } : x)))}
            />
            <Select value={r.tone ?? 'blue'} onValueChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, tone: v as ScreenRow['tone'] } : x)))}>
              <SelectTrigger className="h-7 w-[74px] shrink-0 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROW_TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Удалить строку">
              <X />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label htmlFor="scr-btn">Главная кнопка (пусто — скрыть)</Label>
        <Input id="scr-btn" value={data.button ?? ''} onChange={(e) => patch({ button: e.target.value })} className="h-8" />
      </div>
    </div>
  )
}

/* ───────────────── Заголовок ───────────────── */

export function HeadingEditor({ data, patch }: EditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="h-title">Заголовок</Label>
        <Textarea id="h-title" rows={2} value={data.label} onChange={(e) => patch({ label: e.target.value })} className="resize-none" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="h-sub">Подзаголовок</Label>
        <Textarea id="h-sub" rows={2} value={data.sub ?? ''} onChange={(e) => patch({ sub: e.target.value })} className="resize-none text-[12.5px]" />
      </div>
      <p className="text-[11.5px] leading-snug text-muted-foreground">
        Заголовок внутри холста попадает в PNG/SVG-экспорт — удобно для оформления документов.
      </p>
    </div>
  )
}

/* ───────────────── Легенда ───────────────── */

export function LegendEditor({ data, patch }: EditorProps) {
  const rows = data.legendRows ?? []
  const setRows = (next: LegendRow[]) => patch({ legendRows: next })
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Ряды легенды ({rows.length})</Label>
        <Button variant="outline" size="sm" className="h-7 px-2 text-[11.5px]" onClick={() => setRows([...rows, { chip: 'BRn', text: 'пояснение' }])}>
          <Plus /> ряд
        </Button>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={r.chip}
            className="h-7 w-24 shrink-0 font-mono text-[11.5px] font-bold"
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, chip: e.target.value } : x)))}
          />
          <Input
            value={r.text}
            className="h-7 text-[11.5px]"
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Удалить ряд">
            <X />
          </Button>
        </div>
      ))}
    </div>
  )
}
