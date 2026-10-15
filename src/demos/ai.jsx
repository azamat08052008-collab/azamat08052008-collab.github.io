import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, useReducedMotion } from 'motion/react'
import { PaperPlaneRight } from '@phosphor-icons/react/dist/csr/PaperPlaneRight'
import '@fontsource-variable/commissioner'
import studio from '../assets/img/prana/studio.webp'
import './ai.css'

// Демо ИИ-помощника. Ответы заготовлены и подбираются по словам вопроса: без настоящей модели,
// чтобы демо ничего не стоило. В настоящем проекте отвечает модель по базе знаний клиента.
const KB = [
  { keys: ['цен', 'стоим', 'сколько', 'абонем', 'руб', 'дорог'], text: 'Разовое занятие 700 ₽. Абонемент на 8 занятий 4 800 ₽, это 600 ₽ за занятие. Безлимит на месяц 6 900 ₽. Первое пробное занятие бесплатно.' },
  { keys: ['нович', 'начина', 'первый раз', 'пробн', 'никогда', 'опыт'], text: 'Да, есть группа «Йога для начинающих» по вторникам и четвергам в 19:00. Первое занятие бесплатно, инструктор покажет базовые позы и подберёт нагрузку.', follow: 'trial' },
  { keys: ['взять', 'одежд', 'коврик', 'форм', 'с собой'], text: 'Удобную одежду, в которой легко тянуться, и воду. Коврики, блоки и пледы есть в студии. Есть раздевалки и душ.' },
  { keys: ['распис', 'время', 'когда', 'утр', 'вечер', 'выходн'], text: 'Утренние классы в 8:00 по будням, вечерние в 19:00 и 20:30. В субботу и воскресенье в 11:00 и 13:00. Расписание на неделю пришлю ссылкой.' },
  { keys: ['запис', 'прийти', 'хочу'], text: 'Запишу вас на бесплатное пробное занятие. Когда удобнее?', follow: 'trial' },
  { keys: ['где', 'адрес', 'парков', 'добрат', 'метро'], text: 'Мы в центре, пять минут пешком от метро. Во дворе бесплатная парковка для учеников.' },
  { keys: ['спин', 'берем', 'травм', 'здоров', 'колен', 'давлен'], text: 'Есть мягкие классы для спины и отдельная группа для беременных. Но при травмах и болезнях сначала посоветуйтесь с врачом, а инструктору расскажите перед занятием.' },
  { keys: ['привет', 'здравст', 'добрый'], text: 'Здравствуйте! Спрашивайте про цены, расписание или первое занятие.' },
  { keys: ['спасиб'], text: 'Пожалуйста! Ждём вас в «Пране».' },
]
const FALLBACK = 'Точно не знаю ответ. Передам вопрос администратору, он ответит в течение часа.'
const CHIPS = ['Сколько стоит абонемент?', 'Есть занятия для новичков?', 'Что взять с собой?', 'Где вы находитесь?']
const TRIAL = ['Вторник, 19:00', 'Четверг, 19:00']

// Ключ из одного слова совпадает с началом слова вопроса («цен» → «цены», но не «оценить»), фраза ищется целиком
function answer(q) {
  const s = q.toLowerCase().replace(/ё/g, 'е')
  const words = s.split(/[^а-яa-z0-9]+/)
  const hit = (k) => (k.includes(' ') ? s.includes(k) : words.some((w) => w.startsWith(k)))
  return KB.find((item) => item.keys.some(hit)) || { text: FALLBACK }
}

function Assistant() {
  const reduce = useReducedMotion()
  const [msgs, setMsgs] = useState([{ from: 'ai', text: 'Здравствуйте! Я помощник йога-студии «Прана». Отвечу про цены, расписание и первое занятие.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const chat = useRef(null)

  // Прокручиваем только сам чат: scrollIntoView внутри iframe сдвинул бы и страницу, куда встроено демо
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) }, [msgs, reduce])

  // Ответ появляется по словам, как у настоящей модели
  function stream(text, follow) {
    setBusy(true)
    const words = text.split(' ')
    setMsgs((m) => [...m, { from: 'ai', text: '' }])
    let i = 0
    const tick = () => {
      i = reduce ? words.length : i + 1
      setMsgs((m) => [...m.slice(0, -1), { from: 'ai', text: words.slice(0, i).join(' '), follow: i >= words.length ? follow : undefined }])
      if (i < words.length) setTimeout(tick, 45)
      else setBusy(false)
    }
    setTimeout(tick, reduce ? 0 : 500)
  }

  function ask(q) {
    if (!q.trim() || busy) return
    setInput('')
    setMsgs((m) => [...m.map((x) => ({ ...x, follow: undefined })), { from: 'me', text: q.trim() }])
    const a = answer(q)
    stream(a.text, a.follow)
  }

  function book(slot) {
    setMsgs((m) => [...m.map((x) => ({ ...x, follow: undefined })), { from: 'me', text: slot }])
    stream(`Записал вас на пробное занятие: ${slot.toLowerCase()}. Накануне пришлю напоминание.`)
  }

  const asked = msgs.some((m) => m.from === 'me')

  return (
    <div className="ai">
      <div className="ai-aura" aria-hidden="true"><i /><i /><i /></div>
      <header className="ai-head">
        <div className={`ai-orb ${busy ? 'is-thinking' : ''}`} aria-hidden="true" />
        <div>
          <div className="ai-name">Помощник «Праны»</div>
          <div className="ai-sub">{busy ? 'Думает…' : 'Отвечает сразу, днём и ночью'}</div>
        </div>
      </header>

      <main className="ai-chat" aria-live="polite" ref={chat}>
        {msgs.map((m, i) => (
          <motion.div key={i} className={`ai-msg ${m.from === 'me' ? 'is-me' : ''}`}
            initial={reduce || i === 0 ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {i === 0 && <img className="ai-photo" src={studio} alt="Зал студии «Прана»" />}
            {m.from === 'ai'
              ? (m.text ? m.text.split(' ').map((w, k) => <span key={k} className={i === 0 ? undefined : 'ai-w'}>{w} </span>) : <span className="ai-dots"><i /><i /><i /></span>)
              : m.text}
            {m.follow === 'trial' && (
              <div className="ai-slots">{TRIAL.map((t) => <button key={t} onClick={() => book(t)}>{t}</button>)}</div>
            )}
          </motion.div>
        ))}
      </main>

      {!asked && (
        <div className="ai-chips">
          {CHIPS.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
        </div>
      )}

      <form className="ai-input" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
        <label className="sr-only" htmlFor="q">Ваш вопрос</label>
        <input id="q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Напишите вопрос" autoComplete="off" maxLength={200} />
        <button type="submit" aria-label="Отправить" disabled={busy || !input.trim()}><PaperPlaneRight size={20} weight="fill" /></button>
      </form>
      <p className="ai-note">Демо: ответы заготовлены заранее, без настоящего ИИ</p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Assistant /></StrictMode>)
