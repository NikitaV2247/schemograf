import { makeEdge, makeNode, uid, type Doc, type NodeKind } from '@/lib/diagram'

interface Template {
  id: string
  name: string
  desc: string
  doc: () => Doc
}

function build(
  title: string,
  subtitle: string,
  defs: { id: string; kind: NodeKind; x: number; y: number; label: string; extra?: Record<string, unknown> }[],
  links: { s: string; t: string; label?: string; sh?: string; th?: string }[],
): Doc {
  const idMap = new Map<string, string>()
  const nodes = defs.map((d) => {
    const n = makeNode(d.kind, d.x, d.y, d.label, d.extra as never)
    idMap.set(d.id, n.id)
    return n
  })
  const edges = links.map((l) =>
    makeEdge(idMap.get(l.s)!, idMap.get(l.t)!, l.label, {
      sourceHandle: l.sh ?? 'out',
      targetHandle: l.th ?? 'in',
    }),
  )
  return { title, subtitle, nodes, edges }
}

/* ───────── Шаблон 1: блок-схема алгоритма (по референсу) ───────── */

const calcTotal = () =>
  build(
    'Схема алгоритма функции calculate_total()',
    'модуль order_processor.py — расчёт итоговой суммы заказа',
    [
      { id: 'start', kind: 'start', x: 480, y: 0, label: 'Начало' },
      { id: 'd1', kind: 'decision', x: 450, y: 130, label: 'items пуст?' },
      { id: 'r0', kind: 'return', x: 80, y: 240, label: 'Возврат 0' },
      { id: 's1', kind: 'process', x: 400, y: 340, label: 'subtotal = sum(items.values())' },
      { id: 'd2', kind: 'decision', x: 450, y: 470, label: 'subtotal > 2000?' },
      { id: 'disc', kind: 'process', x: 880, y: 490, label: 'discount = subtotal * 0.15' },
      { id: 's2', kind: 'process', x: 400, y: 660, label: 'total = subtotal - discount' },
      { id: 'd3', kind: 'decision', x: 450, y: 790, label: 'total < порога доставки?' },
      { id: 'del', kind: 'process', x: 880, y: 830, label: 'total = total + delivery_cost' },
      { id: 'ret', kind: 'return', x: 400, y: 990, label: 'Возврат round(total, 2)' },
      { id: 'end', kind: 'end', x: 480, y: 1130, label: 'Конец' },
      {
        id: 'note1',
        kind: 'note',
        x: 950,
        y: 640,
        label: 'Скидка 15% применяется только при subtotal > 2000',
      },
    ],
    [
      { s: 'start', t: 'd1' },
      { s: 'd1', t: 'r0', label: 'Да', sh: 'out-l' },
      { s: 'd1', t: 's1', label: 'Нет' },
      { s: 's1', t: 'd2' },
      { s: 'd2', t: 'disc', label: 'Да', sh: 'out-r' },
      { s: 'd2', t: 's2', label: 'Нет' },
      { s: 'disc', t: 's2', th: 'in' },
      { s: 's2', t: 'd3' },
      { s: 'd3', t: 'del', label: 'Да', sh: 'out-r' },
      { s: 'd3', t: 'ret', label: 'Нет' },
      { s: 'del', t: 'ret' },
      { s: 'ret', t: 'end' },
      { s: 'r0', t: 'end' },
    ],
  )

/* ───────── Шаблон 2: ER-модель (по референсу) ───────── */

const erClinic = () =>
  build(
    'Модель данных предметной области «Электронная регистратура»',
    'Связи «один-ко-многим» (1 : N); ключевые поля выделены по словарю сущностей',
    [
      {
        id: 'patient',
        kind: 'entity',
        x: 0,
        y: 0,
        label: 'Пациент',
        extra: {
          kindLabel: 'СПРАВОЧНИК',
          fields: [
            { name: 'ИД_пациента', key: 'PK' },
            { name: 'ФИО', key: null },
            { name: 'Тип_полиса (ОМС / ДМС)', key: null },
            { name: 'Номер_полиса', key: null },
            { name: 'Контактный_телефон', key: null },
          ],
        },
      },
      {
        id: 'visit',
        kind: 'entity',
        x: 420,
        y: 0,
        label: 'Запись',
        extra: {
          kindLabel: 'ДОКУМЕНТ',
          fields: [
            { name: 'ИД_записи', key: 'PK' },
            { name: 'ИД_пациента', key: 'FK' },
            { name: 'ИД_врача', key: 'FK' },
            { name: 'ИД_смены', key: 'FK' },
            { name: 'Дата_и_время_приёма', key: null },
            { name: 'Статус (Активна / Отменена / Состоялась)', key: null },
          ],
        },
      },
      {
        id: 'doctor',
        kind: 'entity',
        x: 840,
        y: 0,
        label: 'Врач',
        extra: {
          kindLabel: 'СПРАВОЧНИК',
          fields: [
            { name: 'ИД_врача', key: 'PK' },
            { name: 'ФИО', key: null },
            { name: 'Специализация (Терапевт / Узкий спец.)', key: null },
            { name: 'Статус (Работает / Болеет)', key: null },
          ],
        },
      },
      {
        id: 'notif',
        kind: 'entity',
        x: 60,
        y: 360,
        label: 'Уведомление',
        extra: {
          kindLabel: 'СООБЩЕНИЕ',
          fields: [
            { name: 'ИД_уведомления', key: 'PK' },
            { name: 'ИД_записи', key: 'FK' },
            { name: 'Тип (Отмена врача / Подтверждение)', key: null },
            { name: 'Текст', key: null },
            { name: 'Время_отправки', key: null },
          ],
        },
      },
      {
        id: 'shift',
        kind: 'entity',
        x: 500,
        y: 380,
        label: 'Смена (Расписание приёма)',
        extra: {
          kindLabel: 'СПРАВОЧНИК',
          fields: [
            { name: 'ИД_смены', key: 'PK' },
            { name: 'ИД_врача', key: 'FK' },
            { name: 'Дата', key: null },
            { name: 'Время_начала', key: null },
            { name: 'Время_окончания', key: null },
          ],
        },
      },
    ],
    [
      { s: 'patient', t: 'visit', label: '1 ─ N · оформляет', sh: 'out-r', th: 'in-l' },
      { s: 'doctor', t: 'visit', label: '1 ─ N · принимает', sh: 'out-l', th: 'in-l' },
      { s: 'visit', t: 'notif', label: '1 ─ N · порождает', sh: 'out', th: 'in' },
      { s: 'visit', t: 'shift', label: 'N ─ 1 · расписан на', sh: 'out', th: 'in' },
    ],
  )

/* легенда добавляется к ER-шаблону */
function erClinicWithLegend(): Doc {
  const doc = erClinic()
  doc.nodes.push(
    makeNode('legend', 60, 760, 'Легенда', {
      legendRows: [
        { chip: 'PK', text: 'первичный ключ' },
        { chip: 'FK', text: 'внешний ключ' },
        { chip: '1 ─ N', text: 'связь «один-ко-многим»' },
      ],
    }),
  )
  return doc
}

/* ───────── Шаблон 3: процесс онбординга (быстрый старт) ───────── */

const onboarding = () =>
  build(
    'Процесс регистрации нового пользователя',
    'Шаблон: старт → ввод данных → валидация → сохранение',
    [
      { id: 'start', kind: 'start', x: 360, y: 0, label: 'Начало' },
      { id: 'form', kind: 'data', x: 330, y: 120, label: 'Форма: email + пароль' },
      { id: 'check', kind: 'decision', x: 340, y: 240, label: 'Данные валидны?' },
      { id: 'err', kind: 'return', x: 60, y: 260, label: 'Показать ошибку' },
      { id: 'save', kind: 'process', x: 330, y: 430, label: 'user = create(email, hash)' },
      { id: 'mail', kind: 'subroutine', x: 330, y: 550, label: 'Отправить письмо' },
      { id: 'done', kind: 'data', x: 330, y: 670, label: 'Экран «Готово»' },
      { id: 'end', kind: 'end', x: 400, y: 790, label: 'Конец' },
      { id: 'note1', kind: 'note', x: 660, y: 250, label: 'Пароль ≥ 8 символов, email — по RFC 5322' },
    ],
    [
      { s: 'start', t: 'form' },
      { s: 'form', t: 'check' },
      { s: 'check', t: 'err', label: 'Нет', sh: 'out-l' },
      { s: 'err', t: 'form' },
      { s: 'check', t: 'save', label: 'Да' },
      { s: 'save', t: 'mail' },
      { s: 'mail', t: 'done' },
      { s: 'done', t: 'end' },
    ],
  )

/* ───────── Шаблон 4: спецификация логики с фазами (по 4-му референсу) ───────── */

const specProcess = (): Doc => {
  const idMap = new Map<string, string>()
  const phaseDefs: { id: string; label: string; steps: { text: string; check?: boolean; rules?: string[]; subs?: { chip: string; tone: 'blue' | 'red'; text: string }[] }[] }[] = [
    {
      id: 'p1',
      label: 'Фаза 1. Идентификация пациента',
      steps: [
        { text: 'Вход в систему через АРМ регистратуры или мобильное приложение (BR5)' },
        { text: 'Аутентификация по номеру полиса, загрузка профиля из сущности «Пациент»' },
      ],
    },
    {
      id: 'p2',
      label: 'Фаза 2. Проверка бизнес-правил (валидация)',
      steps: [
        {
          text: 'Определение списка доступных врачей по типу полиса',
          check: true,
          rules: ['BR1', 'BR2'],
          subs: [
            { chip: 'ОМС', tone: 'blue', text: 'доступен только терапевт, ведущий приём в смену пациента' },
            { chip: 'ДМС', tone: 'blue', text: 'доступны все терапевты и узкие специалисты' },
          ],
        },
        {
          text: 'Проверка статуса выбранного врача',
          check: true,
          rules: ['BR4'],
          subs: [{ chip: 'Болеет', tone: 'red', text: 'врач исключён из списка, оформление записи запрещено' }],
        },
        {
          text: 'Проверка срока закрытия записи',
          check: true,
          rules: ['BR3'],
          subs: [{ chip: 'Отказ', tone: 'red', text: 'Время_текущее > (Время_приёма − 15 мин) — слот заблокирован' }],
        },
      ],
    },
    {
      id: 'p3',
      label: 'Фаза 3. Создание записи',
      steps: [
        { text: 'Выбор свободного слота в смене врача (сущность «Смена», BR6 — уникальность слота)' },
        { text: 'Создание экземпляра сущности «Запись» со статусом «Активна»' },
        { text: 'Вывод подтверждения пациенту и фиксация записи в базе данных' },
      ],
    },
    {
      id: 'p4',
      label: 'Фаза 4. Событийная реакция: отмена приёма врачом',
      steps: [
        { text: 'Статус врача меняется на «Болеет» — новые записи на него блокируются (BR4)' },
        { text: 'Автоматическая генерация уведомлений для всех пациентов с активными записями к врачу (BR4)' },
      ],
    },
  ]
  const nodes: Doc['nodes'] = [
    makeNode('heading', 40, -40, 'Спецификация логики: процесс «Запись пациента на приём»', {
      sub: 'Каждый шаг проверяет бизнес-правила из словаря (Этап 1); проверки BR1–BR4 выполняются на сервере',
      scheme: 'slate',
    }),
  ]
  let y = 110
  const ids: string[] = []
  for (const p of phaseDefs) {
    const n = makeNode('phase', 40, y, p.label, { steps: p.steps.map((s) => ({ id: uid('s'), ...s })) } as never)
    idMap.set(p.id, n.id)
    ids.push(n.id)
    nodes.push(n)
    const h = 96 + p.steps.length * 58 + p.steps.reduce((a, s) => a + (s.subs?.length ?? 0), 0) * 24
    y += h + 96
  }
  nodes.push(
    makeNode('legend', 40, y + 20, 'Легенда', {
      legendRows: [
        { chip: '1', text: 'обычный шаг процесса — выполняется последовательно внутри фазы' },
        { chip: '◆', text: 'проверка бизнес-правила (ромб классической схемы), выделена янтарным' },
        { chip: 'BRn', text: 'ссылка на правило словаря бизнес-правил' },
      ],
    }),
  )
  const edges: Doc['edges'] = []
  for (let i = 0; i < ids.length - 1; i++) {
    edges.push(makeEdge(ids[i], ids[i + 1], undefined, { sourceHandle: 'out', targetHandle: 'in' }))
  }
  return {
    title: 'Спецификация логики: процесс «Запись пациента на приём»',
    subtitle: 'Фазы связаны стрелками основного потока управления; шаги внутри фазы выполняются последовательно',
    nodes,
    edges,
  }
}

/* ───────── Шаблон 5: прототип экрана + аннотации (по 3-му референсу) ───────── */

const uiPrototype = (): Doc => ({
  title: 'Прототип главного экрана пациента — «Электронная регистратура»',
  subtitle: 'Каждый элемент управления связан с данными словаря сущностей и правилами бизнес-логики',
  nodes: [
    makeNode('heading', 0, -20, 'Прототип главного экрана пациента — мобильное приложение', {
      sub: 'Тип элемента + источник данных + поведение — прототип становится точным описанием интерфейса',
    }),
    makeNode('screen', 40, 140, 'Главный экран пациента', {
      time: '9:41',
      battery: '87%',
      kindLabel: 'Оператор связи',
      banner: 'УВЕДОМЛЕНИЕ · 10:02 — Приём к Смирновой Е. В. отменён: врач заболел. Выберите другое время.',
      title: 'Электронная регистратура',
      person: 'Иванова Анна Сергеевна',
      badge: 'Полис ОМС',
      rows: [
        { text: 'Смирнова Е. В. · терапевт · смена 08:00–14:00', badge: '5 свободных слотов', tone: 'blue' },
        { text: 'Петров И. И. · терапевт · статус: болеет', badge: 'Запись закрыта', tone: 'red' },
        { text: 'ПН 05.10 · ВТ 06.10 · СР 07.10 · ЧТ 08.10', badge: 'ВТ выбран', tone: 'black' },
        { text: 'Слоты: 08:30 · 09:00 · 09:30 · 10:00 · 11:20', badge: '09:30 выбран', tone: 'blue' },
        { text: 'Мои записи: Смирнова Е. В. · 06.10, 09:30', badge: 'активна', tone: 'green' },
      ],
      button: 'Записаться на приём',
    }),
    makeNode('annotation', 480, 140, 'Баннер уведомления', {
      num: 1,
      body: 'тип: карточка-оповещение. Данные: [[Уведомление.Тип]], [[Уведомление.Текст]], [[Уведомление.Время_отправки]]. Показ при смене статуса врача',
      rules: ['BR4'],
    }),
    makeNode('annotation', 480, 330, 'Индикатор типа полиса', {
      num: 2,
      body: 'тип: метка (badge). Данные: [[Пациент.Тип_полиса]]. Определяет состав доступных врачей',
      rules: ['BR1', 'BR2'],
    }),
    makeNode('annotation', 480, 500, 'Карточка врача', {
      num: 3,
      body: 'тип: элемент списка. Данные: [[Врач.ФИО]], [[Врач.Специализация]], [[Врач.Статус]], [[Смена]]. Статус «Болеет» — карточка неактивна',
      rules: ['BR4'],
    }),
    makeNode('annotation', 480, 670, 'Сетка временных слотов', {
      num: 4,
      body: 'тип: сетка кнопок. Данные: [[Смена.Время_начала]], [[Запись.Дата_и_время_приёма]]. Занятые слоты и слоты позже порога BR3 — неактивны',
      rules: ['BR3', 'BR6'],
    }),
    makeNode('annotation', 480, 840, 'Кнопка «Записаться на приём»', {
      num: 5,
      body: 'тип: primary-кнопка. Действие: создание записи в сущности [[Запись]] (статус «Активна») после проверок BR1–BR4',
      rules: ['BR1–BR4'],
    }),
    makeNode('annotation', 480, 1010, 'Блок «Мои записи»', {
      num: 6,
      body: 'тип: список-карточек. Данные: [[Запись]] по фильтру текущего пациента, [[Запись.Статус]] = «Активна»',
    }),
  ],
  edges: [],
})

/* ───────── Пустой документ ───────── */

const blank = (): Doc => ({
  title: 'Новая схема',
  subtitle: '',
  nodes: [makeNode('start', 360, 60, 'Начало'), makeNode('end', 360, 260, 'Конец')],
  edges: [],
})

export interface TemplateDef {
  id: string
  name: string
  desc: string
  build: () => Doc
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'calc-total',
    name: 'Блок-схема алгоритма',
    desc: 'calculate_total(): ветвления, скидки, доставка — как в классической схеме',
    build: calcTotal,
  },
  {
    id: 'er-clinic',
    name: 'ER-модель данных',
    desc: '«Электронная регистратура»: 5 сущностей, ключи PK/FK, связи 1:N, легенда',
    build: erClinicWithLegend,
  },
  {
    id: 'spec-process',
    name: 'Спецификация процесса (фазы)',
    desc: 'Фазы с пронумерованными шагами, проверки бизнес-правил BR1–BR4, легенда',
    build: specProcess,
  },
  {
    id: 'ui-prototype',
    name: 'Прототип UI + аннотации',
    desc: 'Макет экрана приложения и нумерованные карточки с привязкой к сущностям',
    build: uiPrototype,
  },
  {
    id: 'onboarding',
    name: 'Процесс с валидацией',
    desc: 'Регистрация пользователя: ввод, проверка, сохранение, уведомление',
    build: onboarding,
  },
  {
    id: 'blank',
    name: 'Пустая схема',
    desc: 'Начать с чистого холста: Начало → Конец',
    build: blank,
  },
]
