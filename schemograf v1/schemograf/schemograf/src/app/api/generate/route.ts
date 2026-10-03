import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import type { AIGenDoc } from '@/lib/diagram'

const SYSTEM_PROMPT = `Ты — генератор диаграмм для редактора «Схемограф». Пользователь описывает схему словами, ты возвращаешь СТРОГИЙ JSON без пояснений и без markdown-ограждений.

Формат:
{
  "title": "строка — название схемы",
  "subtitle": "строка — пояснение (может быть пустым)",
  "nodes": [
    { "id": "короткий-уникальный-id", "kind": "...", "x": число, "y": число, "label": "...", "…доп": "поля" }
  ],
  "edges": [ { "from": "id", "to": "id", "label": "подпись или пусто" } ]
}

Допустимые kind и их доп.поля:
- "start", "end" — пилюли Начало/Конец; label обязателен.
- "process", "data", "subroutine", "return", "note" — label (для process/data/subroutine/return пиши код или действие).
- "decision" — вопрос с "?"; связи от него подписывай "Да"/"Нет".
- "connector" — буква/цифра.
- "entity" — ER-сущность: label = имя, kindLabel = "СПРАВОЧНИК"|"ДОКУМЕНТ"|"СООБЩЕНИЕ", fields = [{ "name": "ИД_клиента", "key": "PK"|"FK"|null }] (3–6 полей).
- "phase" — фаза спецификации: label = "Фаза N. Название", steps = [{ "text": "...", "check": true, "rules": ["BR1"], "subs": [{ "chip": "ОМС", "tone": "blue", "text": "..." }] }]. Шаги-проверки помечай check:true и правилами BR.
- "annotation" — карточка прототипа: label = заголовок элемента, num = номер, body = описание, ссылки на данные оформляй как [[Сущность.Поле]], rules = ["BR1"].
- "screen" — макет мобильного экрана: label, time "9:41", battery "87%", banner (или пусто), person, badge, rows = [{ "text": "...", "badge": "...", "tone": "blue"|"black"|"gray"|"green"|"red" }], button.
- "heading" — крупный заголовок схемы: label + sub.
- "legend" — легенда: legendRows = [{ "chip": "PK", "text": "первичный ключ" }].

Правила раскладки:
- Для блок-схем (start/process/decision/...) ставь x = колонка*320, y = строка*170 — вертикальный поток сверху вниз.
- Фазы спецификации: все x = 40, y наращивай на 420–560 между фазами.
- Аннотации: колонка x = 560 справа от экрана (x экрана = 0), шаг y примерно 180–220.
- Сущности ER: сетка, x через 380–420, y через 380–460.
- edges соединяют только существующие id. Не выдумывай kind вне списка. Отвечай ТОЛЬКО JSON.`

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string }
    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'Опишите схему хотя бы парой слов' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt.trim() },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: 'Модель вернула не JSON. Попробуйте переформулировать запрос.' }, { status: 502 })
    }
    const doc = JSON.parse(cleaned.slice(start, end + 1)) as AIGenDoc
    if (!Array.isArray(doc.nodes) || doc.nodes.length === 0) {
      return NextResponse.json({ error: 'Модель не вернула ни одного блока' }, { status: 502 })
    }
    return NextResponse.json({ doc })
  } catch (err) {
    console.error('AI generate error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Неизвестная ошибка генерации' },
      { status: 500 },
    )
  }
}
