# Схемограф

Веб-редактор диаграмм в стиле технической документации: блок-схемы алгоритмов, ER-модели данных, спецификации процессов, прототипы UI с аннотациями.

## Возможности

- **15 типов блоков**: старт/конец, процесс, решение (ромб), данные, подпроцесс, возврат, соединитель, заметка, ER-сущность с полями PK/FK, фаза спецификации с нумерованными шагами, аннотация, макет мобильного экрана, заголовок, легенда
- **6 готовых шаблонов**: блок-схема расчёта, ER-модель «Электронная регистратура», процесс с валидацией, спецификация процесса, прототип UI и другие
- **ИИ-генерация схемы** по текстовому описанию (через встроенный API-эндпоинт)
- **Экспорт**: PNG, SVG, JSON, Markdown-спецификация; импорт JSON
- **Автосохранение** в браузере (localStorage), отмена/повтор (undo/redo)
- Авто-раскладка (dagre), мини-карта, тёмная тема, сетка, зум и панорама
- Свойства узлов и связей: текст, 6 цветовых схем, подписи «Да/Нет», форма линии, анимация

## Технологии

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · React Flow (@xyflow/react) · dagre · zustand

## Запуск локально

Нужен **Node.js 20+** (https://nodejs.org).

```bash
npm install
npm run dev
```

Откройте http://localhost:3000

Продакшен-сборка:

```bash
npm run build
npm start
```

## Публикация в интернете

### Вариант 1. Vercel (самый простой, бесплатный)

1. Загрузите проект в репозиторий на GitHub:

   ```bash
   cd schemograf
   git init
   git add .
   git commit -m "Схемограф v1.0"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/schemograf.git
   git push -u origin main
   ```

2. Откройте https://vercel.com → войдите через GitHub.
3. **Add New… → Project** → выберите репозиторий `schemograf`.
4. Vercel сам определит Next.js. Ничего менять не нужно — нажмите **Deploy**.
5. Через 1–2 минуты приложение будет доступно по адресу вида `https://schemograf-ваш-логин.vercel.app`.

Позже в настройках проекта (Settings → Domains) можно подключить свой домен, например `scheme.mysite.ru` — Vercel сам выпустит SSL-сертификат.

Каждый `git push` в `main` автоматически обновляет сайт.

### Вариант 2. Netlify / Render / Railway

Все три платформы умеют Next.js «из коробки»:

- **Netlify**: https://app.netlify.com → Add new site → Import from Git. Build command: `npm run build`; публикацию определит официальный плагин Next.js автоматически.
- **Render**: https://render.com → New → Web Service → подключить репозиторий. Build: `npm install && npm run build`, Start: `npm start`.
- **Railway**: https://railway.app → New Project → Deploy from GitHub. Railway сам подставит команды.

### Вариант 3. Docker (свой сервер / VPS)

В проекте есть готовый `Dockerfile`:

```bash
cd schemograf
docker build -t schemograf .
docker run -d -p 3000:3000 --name schemograf --restart unless-stopped schemograf
```

Приложение будет на `http://IP_СЕРВЕРА:3000`. Для HTTPS поставьте перед контейнером Nginx или Caddy (proxy на порт 3000), либо используйте Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

### Вариант 4. Любой Node-хостинг без Docker

```bash
npm install
npm run build
npm start   # слушает порт 3000, переменной PORT можно изменить
```

Подойдёт любой VPS (Ubuntu + Node 20) с процесс-менеджером:

```bash
npm i -g pm2
pm2 start "npm start" --name schemograf
pm2 save
```

## Про ИИ-генерацию

Кнопка «ИИ» вызывает эндпоинт `POST /api/generate`, который использует SDK `z-ai-web-dev-sdk` (работает в среде Z.ai). При самостоятельном деплое на других площадках этот эндпоинт вернёт ошибку — **всё остальное приложение полностью работоспособно**.

Чтобы ИИ-генерация работала на своём хостинге, замените реализацию в `src/app/api/generate/route.ts` на любой доступный вам API (OpenAI, Anthropic, Ollama и т.д.): нужно отправить системный промпт из этого файла в модель и вернуть строгий JSON описанной структуры.

## Структура проекта

```
src/
├── app/
│   ├── layout.tsx              # корневой layout, шрифты, тема, metadata
│   ├── page.tsx                # подключение редактора (dynamic import)
│   ├── globals.css             # Tailwind 4, CSS-переменные, тёмная тема
│   └── api/generate/route.ts   # ИИ-эндпоинт генерации схемы
├── components/
│   ├── diagram/
│   │   ├── diagram-узлы        # nodes.tsx — 15 кастомных узлов
│   │   ├── editor.tsx          # холст React Flow, drag&drop, хоткеи
│   │   ├── toolbar.tsx         # верхняя панель, шаблоны, файлы, ИИ
│   │   ├── palette.tsx         # левая палитра блоков
│   │   ├── properties-panel.tsx# правая панель свойств
│   │   ├── editors.tsx         # редакторы фаз/аннотаций/экранов
│   │   ├── store.ts            # zustand: undo/redo, автосохранение
│   │   └── templates.ts        # 6 готовых шаблонов
│   ├── theme-provider.tsx
│   └── ui/                     # shadcn/ui компоненты
├── hooks/use-toast.ts
└── lib/
    ├── diagram.ts              # типы, фабрики, раскладка, экспорт
    └── utils.ts
```

## Горячие клавиши

| Клавиши | Действие |
|---|---|
| `Ctrl+Z` / `Ctrl+Y` | Отмена / повтор |
| `Ctrl+D` | Дублировать выделенное |
| `Delete` / `Backspace` | Удалить выделенное |
| `Ctrl+G` | Сетка вкл/выкл |
| `Shift` + клик | Мультивыделение |
| Колесо мыши | Зум |
