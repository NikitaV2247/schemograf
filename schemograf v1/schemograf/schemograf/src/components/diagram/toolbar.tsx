'use client'

import { useCallback, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Braces,
  FileDown,
  FileText,
  FolderOpen,
  Grid3x3,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Maximize,
  Moon,
  Network,
  Redo2,
  Shapes,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useReactFlow } from '@xyflow/react'
import { aiToDoc, exportImage, exportJson, exportMarkdown, type AIGenDoc, type Doc } from '@/lib/diagram'
import { TEMPLATES } from '@/components/diagram/templates'
import { useEditor } from '@/components/diagram/store'

interface ToolbarProps {
  snapToGrid: boolean
  onToggleSnap: () => void
}

export function Toolbar({ snapToGrid, onToggleSnap }: ToolbarProps) {
  const store = useEditor()
  const { theme, setTheme } = useTheme()
  const { fitView } = useReactFlow()

  const onFitView = useCallback(() => fitView({ padding: 0.12, duration: 300 }), [fitView])
  const fileInput = useRef<HTMLInputElement>(null)
  const [tplOpen, setTplOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const generateAI = async () => {
    if (aiPrompt.trim().length < 3 || aiBusy) return
    setAiBusy(true)
    setAiError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      })
      const json = (await res.json()) as { doc?: AIGenDoc; error?: string }
      if (!res.ok || !json.doc) throw new Error(json.error ?? 'Ошибка генерации')
      const doc = aiToDoc(json.doc)
      if (!doc) throw new Error('Модель вернула пустую схему')
      store.loadDoc(doc)
      setAiOpen(false)
      setTimeout(onFitView, 120)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Не удалось сгенерировать схему')
    } finally {
      setAiBusy(false)
    }
  }

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id)
    if (!t) return
    store.loadDoc(t.build())
    setTplOpen(false)
    setTimeout(onFitView, 80)
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result)) as Doc
        if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) throw new Error('bad')
        store.loadDoc({ title: doc.title ?? 'Импортированная схема', subtitle: doc.subtitle ?? '', nodes: doc.nodes, edges: doc.edges })
        setTimeout(onFitView, 80)
      } catch {
        alert('Не удалось прочитать файл: ожидается JSON, экспортированный из Схемографа.')
      }
    }
    reader.readAsText(file)
  }

  const doExport = async (format: 'png' | 'svg' | 'json') => {
    try {
      if (format === 'json') {
        exportJson({ title: store.title, subtitle: store.subtitle, nodes: store.nodes, edges: store.edges })
        return
      }
      setBusy(true)
      await exportImage(store.nodes, format, store.title)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка экспорта')
    } finally {
      setBusy(false)
    }
  }

  const clearAll = () => {
    if (window.confirm('Очистить холст? Текущую схему можно вернуть через «Отменить».')) {
      store.clearAll()
    }
  }

  const btn =
    'h-9 gap-1.5 px-2.5 text-[12.5px] font-medium sm:px-3' // компактный стиль

  return (
    <header className="flex flex-wrap items-center gap-1.5 border-b bg-background px-3 py-2">
      {/* Логотип и название */}
      <div className="mr-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[15px] font-bold text-white dark:bg-white dark:text-slate-900">
          С
        </span>
        <span className="hidden text-[15px] font-bold tracking-tight lg:block">Схемограф</span>
      </div>

      <Separator />

      {/* Название схемы */}
      <div className="order-last flex w-full flex-col gap-1 sm:order-none sm:w-auto sm:min-w-[180px] sm:max-w-[340px] sm:flex-1">
        <Input
          value={store.title}
          onChange={(e) => store.setTitle(e.target.value)}
          placeholder="Название схемы"
          aria-label="Название схемы"
          className="h-8 border-transparent bg-transparent px-2 text-[13.5px] font-semibold shadow-none hover:border-input focus-visible:bg-background"
        />
        <Input
          value={store.subtitle}
          onChange={(e) => store.setSubtitle(e.target.value)}
          placeholder="Подзаголовок (необязательно)"
          aria-label="Подзаголовок схемы"
          className="h-6 border-transparent bg-transparent px-2 text-[11.5px] text-muted-foreground shadow-none hover:border-input focus-visible:bg-background"
        />
      </div>

      <Separator />

      {/* Основные действия */}
      <Button variant="outline" size="sm" className={btn} onClick={() => setTplOpen(true)}>
        <LayoutTemplate /> Шаблоны
      </Button>

      <Button
        variant="outline"
        size="sm"
        className={`${btn} border-amber-300/70 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40`}
        onClick={() => {
          setAiError('')
          setAiOpen(true)
        }}
        title="Сгенерировать схему по текстовому описанию"
      >
        <Sparkles /> ИИ
      </Button>

      <Button variant="outline" size="sm" className={btn} onClick={store.undo} disabled={store.past.length === 0} title="Отменить (Ctrl+Z)">
        <Undo2 />
      </Button>
      <Button variant="outline" size="sm" className={btn} onClick={store.redo} disabled={store.future.length === 0} title="Повторить (Ctrl+Shift+Z)">
        <Redo2 />
      </Button>

      <Button variant="outline" size="sm" className={btn} onClick={store.applyAutoLayout} title="Автоматическая раскладка сверху вниз">
        <Network /> <span className="hidden xl:inline">Раскладка</span>
      </Button>

      <Button
        variant={snapToGrid ? 'secondary' : 'outline'}
        size="sm"
        className={btn}
        onClick={onToggleSnap}
        title="Привязка к сетке 16 px"
        aria-pressed={snapToGrid}
      >
        <Grid3x3 />
      </Button>

      <Button variant="outline" size="sm" className={btn} onClick={onFitView} title="Показать всю схему">
        <Maximize />
      </Button>

      <Separator />

      {/* Файл */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={btn}>
            <FileDown /> Файл
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Экспорт</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => doExport('png')} disabled={busy}>
            <ImageIcon /> PNG-картинка
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => doExport('svg')} disabled={busy}>
            <Shapes /> SVG-вектор
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => doExport('json')}>
            <Braces /> Сохранить JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportMarkdown({ title: store.title, subtitle: store.subtitle, nodes: store.nodes, edges: store.edges })}>
            <FileText /> Спецификация Markdown (.md)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInput.current?.click()}>
            <FolderOpen /> Открыть JSON…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearAll} variant="destructive">
            <Trash2 /> Очистить холст
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImport(f)
          e.target.value = ''
        }}
      />

      {/* Тема */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 px-0"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </Button>

      {/* Статистика */}
      <div className="ml-auto hidden pr-1 text-right text-[11px] leading-tight text-muted-foreground xl:block">
        <div>{store.nodes.length} блоков · {store.edges.length} связей</div>
        <div>
          {store.savedAt
            ? `сохранено в браузере ${new Date(store.savedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
            : 'автосохранение в браузере включено'}
        </div>
      </div>

      {/* Диалог ИИ-генерации */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> ИИ-генерация схемы
            </DialogTitle>
            <DialogDescription>
              Опишите схему словами — ИИ построит блок-схему, ER-модель, спецификацию с фазами или прототип UI. Готовый
              результат можно править как любую другую схему.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Например: блок-схема авторизации пользователя: ввод логина и пароля, проверка в БД, при ошибке — сообщение, при успехе — переход на главный экран"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateAI()
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              'Блок-схема проверки пароля при входе',
              'ER-модель интернет-магазина: клиенты, заказы, товары',
              'Спецификация процесса оплаты заказа с проверками BR',
              'Прототип экрана корзины с аннотациями элементов',
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setAiPrompt(ex)}
                className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-slate-400 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
          {aiError ? <p className="text-[12px] font-medium text-destructive">{aiError}</p> : null}
          <Button onClick={generateAI} disabled={aiBusy || aiPrompt.trim().length < 3} className="w-full">
            {aiBusy ? (
              <>
                <Loader2 className="animate-spin" /> Генерируем схему…
              </>
            ) : (
              <>
                <Sparkles /> Сгенерировать
              </>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">Ctrl+Enter — быстрая генерация</p>
        </DialogContent>
      </Dialog>

      {/* Диалог шаблонов */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Шаблоны схем</DialogTitle>
            <DialogDescription>
              Готовые примеры в стиле технической документации. Выбранный шаблон заменит текущую схему (отмена — Ctrl+Z).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-slate-400/70 hover:bg-accent"
              >
                <div className="mb-1 text-[14px] font-semibold">{t.name}</div>
                <div className="text-[12.5px] leading-snug text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Совет: блоки из левой панели можно перетаскивать мышью на холст или добавлять кликом — блок появится в центре.
          </p>
        </DialogContent>
      </Dialog>
    </header>
  )
}

function Separator() {
  return <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" />
}
