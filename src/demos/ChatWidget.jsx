import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ChatCircleDots } from '@phosphor-icons/react/dist/csr/ChatCircleDots'
import { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'

// Виджет ИИ-помощника на сайте студии. Ответы заготовлены и подбираются по словам вопроса:
// без настоящей модели, чтобы демо ничего не стоило. У заказчика отвечает модель по его базе знаний.
export const PRICES = [
  ['Полировка кузова', 'от 9 000 ₽', '1 день'],
  ['Керамика', 'от 18 000 ₽', '2 дня'],
  ['Бронеплёнка, зоны риска', 'от 25 000 ₽', '2 дня'],
  ['Химчистка салона', 'от 7 000 ₽', '1 день'],
]
const SLOTS = ['Сегодня, 18:00', 'Завтра, 11:00', 'Завтра, 15:30']

// Порядок важен: запись проверяется первой, иначе «Хочу записаться на керамику» ушло бы в ответ про керамику
const KB = [
  { keys: ['запис', 'осмотр', 'приех'], text: 'Осмотр бесплатный: замерим лак, покажем дефекты под лампой и назовём точную цену. Когда удобно приехать?', slots: true },
  { keys: ['цен', 'стоит', 'стоим', 'сколько', 'прайс', 'руб'], text: 'Вот базовые цены для седана. Для кроссовера и внедорожника дороже на 20–40%, точную сумму назову после осмотра.', card: 'prices' },
  { keys: ['керамик'], text: 'Керамика для седана от 18 000 ₽, работа занимает 2 дня: сначала полировка, потом покрытие и сушка. Гарантия до 3 лет при мойке раз в месяц у нас или по нашей инструкции.' },
  { keys: ['полиров'], text: 'Полировка кузова от 9 000 ₽, обычно за 1 день. Сначала замеряем толщину лака, чтобы не снять лишнего, потом убираем царапины и голограммы.' },
  { keys: ['плёнк', 'пленк', 'бронь', 'брон'], text: 'Бронеплёнка на зоны риска (капот, бампер, фары, зеркала) от 25 000 ₽, 2 дня. Полиуретан, самозатягивается от тёплой воды.' },
  { keys: ['химчист', 'салон', 'запах', 'пятн'], text: 'Химчистка салона от 7 000 ₽ за день. Чистим кожу, ткань, потолок и багажник, убираем запахи паром и озоном.' },
  { keys: ['гарант'], text: 'На керамику даём гарантию до 3 лет, на бронеплёнку 5 лет от производителя. Всё прописываем в договоре.' },
  { keys: ['долго', 'время', 'срок', 'дней', 'когда заб', 'быстро'], text: 'Полировка и химчистка занимают 1 день, керамика и плёнка 2 дня. Машину можно оставить на ночь в закрытом боксе.' },
  { keys: ['мыть', 'мойк', 'помыть'], text: 'После керамики первую неделю лучше не мыть машину на автомойке. Дальше бесконтактная мойка раз в 2–3 недели, без щёток.' },
  { keys: ['где', 'адрес', 'добрат', 'находит', 'парков'], text: 'Мы в Казани, 5 минут от центра, закрытый тёплый бокс и парковка. Работаем каждый день с 9 до 21.' },
  { keys: ['привет', 'здравст', 'добрый'], text: 'Здравствуйте! Спросите про цены, сроки или запишитесь на бесплатный осмотр.' },
  { keys: ['спасиб'], text: 'Пожалуйста! Будем рады видеть вашу машину в «Глянце».' },
]
const FALLBACK = 'Точно не знаю ответ. Передал вопрос мастеру, он ответит в течение 15 минут.'
const CHIPS = ['Сколько стоит керамика?', 'Какие у вас цены?', 'Есть гарантия?', 'Записаться на осмотр']

// Ключ из одного слова совпадает с началом слова вопроса, фраза ищется целиком
function answer(q) {
  const s = q.toLowerCase().replace(/ё/g, 'е')
  const words = s.split(/[^а-яa-z0-9]+/)
  const hit = (k) => { const key = k.replace(/ё/g, 'е'); return key.includes(' ') ? s.includes(key) : words.some((w) => w.startsWith(key)) }
  return KB.find((item) => item.keys.some(hit)) || { text: FALLBACK }
}

export default function ChatWidget({ startOpen = false, request }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(startOpen)
  const [hint, setHint] = useState(false)
  const [msgs, setMsgs] = useState([{ from: 'ai', text: 'Здравствуйте! Я помощник студии «Глянец». Подскажу цену, сроки и запишу на бесплатный осмотр.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const chat = useRef(null)
  const timer = useRef(0)

  // Прокручиваем только ленту чата: scrollIntoView в iframe сдвинул бы страницу, куда встроено демо
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) }, [msgs, reduce])

  // Через пару секунд помощник сам здоровается рядом с кнопкой — только пока чат ни разу не открывали
  const opened = useRef(startOpen)
  useEffect(() => {
    if (open) { opened.current = true; return }
    if (opened.current) return
    const t = setTimeout(() => setHint(true), 2500)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Кнопки «Записаться» на самом сайте открывают чат с готовым вопросом
  useEffect(() => {
    if (!request) return
    setOpen(true)
    ask(request.text)
  }, [request])

  function stream(m) {
    clearTimeout(timer.current) // новый ответ обрывает недопечатанный, чтобы два не смешались
    setBusy(true)
    const words = m.text.split(' ')
    setMsgs((all) => [...all, { from: 'ai', text: '' }])
    let i = 0
    const tick = () => {
      i = reduce ? words.length : i + 1
      const done = i >= words.length
      setMsgs((all) => [...all.slice(0, -1), { ...m, from: 'ai', text: words.slice(0, i).join(' '), card: done ? m.card : undefined, slots: done ? m.slots : undefined }])
      if (!done) timer.current = setTimeout(tick, 38)
      else setBusy(false)
    }
    timer.current = setTimeout(tick, reduce ? 0 : 550)
  }

  function ask(q) {
    if (!q.trim()) return
    setInput('')
    setMsgs((all) => [...all.map((x) => ({ ...x, slots: undefined })), { from: 'me', text: q.trim() }])
    stream(answer(q))
  }

  function book(slot) {
    setMsgs((all) => [...all.map((x) => ({ ...x, slots: undefined })), { from: 'me', text: slot }])
    stream({ text: `Записал вас на бесплатный осмотр: ${slot.toLowerCase()}. Напоминание придёт за два часа, адрес пришлю там же.`, booked: slot })
  }

  const asked = msgs.some((m) => m.from === 'me')

  return (
    <div className="cw">
      <AnimatePresence>
        {open && (
          <motion.section
            className="cw-panel"
            role="dialog"
            aria-label="Чат с помощником студии"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <header className="cw-head">
              <span className={`cw-ava ${busy ? 'is-busy' : ''}`} aria-hidden="true"><Sparkle size={18} weight="fill" /></span>
              <div className="cw-who">
                <b>Помощник «Глянца»</b>
                <span>{busy ? 'печатает…' : <><i className="cw-online" /> онлайн, отвечает сразу</>}</span>
              </div>
              <button className="cw-x" onClick={() => setOpen(false)} aria-label="Свернуть чат"><X size={18} weight="bold" /></button>
            </header>

            <div className="cw-chat" ref={chat} aria-live="polite">
              {msgs.map((m, i) => (
                <motion.div key={i} className={`cw-msg ${m.from === 'me' ? 'is-me' : ''}`}
                  initial={reduce || i === 0 ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  {m.from === 'ai'
                    ? (m.text ? m.text.split(' ').map((w, k) => <span key={k} className={i === 0 ? undefined : 'cw-w'}>{w} </span>) : <span className="cw-dots"><i /><i /><i /></span>)
                    : m.text}
                  {m.card === 'prices' && (
                    <div className="cw-card">
                      {PRICES.map(([n, p, t]) => <div key={n} className="cw-card-row"><span>{n}<small>{t}</small></span><b>{p}</b></div>)}
                    </div>
                  )}
                  {m.booked && <div className="cw-booked"><CheckCircle size={18} weight="fill" /> Осмотр: {m.booked}</div>}
                  {m.slots && <div className="cw-slots">{SLOTS.map((s) => <button key={s} onClick={() => book(s)}>{s}</button>)}</div>}
                </motion.div>
              ))}
            </div>

            {!asked && <div className="cw-chips">{CHIPS.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}</div>}

            <form className="cw-input" onSubmit={(e) => { e.preventDefault(); if (!busy) ask(input) }}>
              <label className="cw-sr" htmlFor="cw-q">Ваш вопрос</label>
              <input id="cw-q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Спросите про цену или сроки" autoComplete="off" maxLength={200} />
              <button type="submit" aria-label="Отправить" disabled={busy || !input.trim()}><PaperPlaneRight size={18} weight="fill" /></button>
            </form>
            <p className="cw-note">Демо: ответы заготовлены заранее, без настоящего ИИ</p>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && hint && (
          <motion.button
            className="cw-hint"
            onClick={() => { setHint(false); setOpen(true) }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            Здравствуйте! Посчитаю стоимость за минуту
          </motion.button>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          className="cw-launch"
          onClick={() => { setHint(false); setOpen(true) }}
          aria-label="Открыть чат с помощником"
          whileTap={reduce ? undefined : { scale: 0.92 }}
        >
          <ChatCircleDots size={30} weight="fill" />
          <span className="cw-badge">1</span>
        </motion.button>
      )}
    </div>
  )
}
