import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { Paperclip } from '@phosphor-icons/react/dist/csr/Paperclip'
import { Microphone } from '@phosphor-icons/react/dist/csr/Microphone'
import { Checks } from '@phosphor-icons/react/dist/csr/Checks'
import { List } from '@phosphor-icons/react/dist/csr/List'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { MASTERS, dayIso, dayLabel, addBooking, freeTimes, photoOf, avaStyle, readServices } from './bookings'
import interior from '../assets/img/britva/interior.webp'
import './bot.css'

// Демо Telegram-бота записи. Сценарий целиком на клиенте; запись уходит в localStorage для демо-админки.
const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const START = {
  media: interior,
  text: 'Привет! Я бот барбершопа «Бритва». Запишу к мастеру за минуту и напомню перед визитом.',
  buttons: [['book', 'Записаться'], ['prices', 'Цены'], ['where', 'Где вы находитесь?']],
}
// Меню команд бота, как у кнопки «Меню» в Telegram
const COMMANDS = [['book', '/book', 'Записаться к мастеру'], ['prices', '/prices', 'Цены на услуги'], ['where', '/where', 'Адрес и часы работы']]

function Bot() {
  const reduce = useReducedMotion()
  // До «Старта» чат пуст и виден экран «Что умеет этот бот?», как при первом открытии бота в Telegram
  const [msgs, setMsgs] = useState([])
  const [menu, setMenu] = useState(false)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState({})
  const chat = useRef(null)

  // Прокручиваем только сам чат: scrollIntoView внутри iframe сдвинул бы и страницу, куда встроено демо
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) }, [msgs, typing, reduce])

  function reply(m) {
    setTyping(true)
    setTimeout(() => { setTyping(false); setMsgs((all) => [...all, { from: 'bot', at: now(), ...m }]) }, reduce ? 0 : 650)
  }

  function start() {
    setMsgs([{ from: 'me', text: '/start', at: now() }])
    reply(START)
  }

  function press(key, label) {
    setMenu(false)
    // кнопки прошлых сообщений гасим, чтобы диалог шёл по порядку
    setMsgs((all) => [...all.map((m) => ({ ...m, buttons: undefined })), { from: 'me', text: label, at: now() }])
    const d = { ...draft }

    if (key === 'prices') return reply({ text: readServices().filter((s) => !s.hidden).map((s) => `${s.name}: ${s.price.toLocaleString('ru-RU')} ₽`).join('\n'), buttons: [['book', 'Записаться']] })
    if (key === 'where') return reply({ text: 'Мы в центре Казани, работаем каждый день с 10 до 22. Точный адрес пришлю вместе с записью.', buttons: [['book', 'Записаться']] })
    if (key === 'book' || key === 'again') {
      setDraft({})
      return reply({ text: 'Какая услуга?', buttons: readServices().filter((s) => !s.hidden).map((s) => [`svc:${s.id}`, `${s.name} · ${s.price.toLocaleString('ru-RU')} ₽`]) })
    }
    if (key.startsWith('svc:')) {
      d.service = readServices().find((s) => s.id === key.slice(4))
      setDraft(d)
      return reply({ text: 'К какому мастеру?', masters: true, cols: 2, buttons: [...MASTERS.map((m) => [`m:${m.name}`, m.name]), ['m:any', 'Любой свободный']] })
    }
    if (key.startsWith('m:')) {
      d.master = key === 'm:any' ? MASTERS[Math.floor(Math.random() * MASTERS.length)].name : key.slice(2)
      setDraft(d)
      return reply({ text: 'Выберите день', cols: 3, buttons: [0, 1, 2].map((o) => [`d:${dayIso(o)}`, dayLabel(dayIso(o))]) })
    }
    if (key.startsWith('d:')) {
      d.day = key.slice(2)
      setDraft(d)
      const free = freeTimes(d.master, d.day, d.service)
      if (!free.length) return reply({ text: `${dayLabel(d.day)} у мастера ${d.master} всё занято. Выберите другой день`, buttons: [0, 1, 2].filter((o) => dayIso(o) !== d.day).map((o) => [`d:${dayIso(o)}`, dayLabel(dayIso(o))]) })
      return reply({ text: `Свободное время у мастера ${d.master}`, cols: 3, buttons: free.map((t) => [`t:${t}`, t]) })
    }
    if (key.startsWith('t:')) {
      d.time = key.slice(2)
      setDraft(d)
      return reply({
        text: `Проверьте запись:\n${d.service.name}, ${d.service.price.toLocaleString('ru-RU')} ₽\nМастер: ${d.master}\n${dayLabel(d.day)}, ${d.time}`,
        cols: 2, buttons: [['ok', 'Подтвердить'], ['book', 'Изменить']],
      })
    }
    if (key === 'ok') {
      addBooking({ id: Date.now(), service: d.service.name, price: d.service.price, master: d.master, day: d.day, time: d.time, source: 'bot', status: 'new' })
      return reply({ ticket: { ...d }, text: 'Готово, вы записаны! Напомню за два часа до визита.', buttons: [['again', 'Записаться ещё раз']] })
    }
  }

  const started = msgs.length > 0
  return (
    <div className="tg">
      <header className="tg-head">
        <span className="tg-back"><CaretLeft size={24} weight="bold" /><span>Чаты</span><i className="tg-badge">3</i></span>
        <div className="tg-title">
          <b>Бритва</b>
          <span className={typing ? 'is-typing' : ''}>{typing ? <>печатает<i className="tg-dots"><i /><i /><i /></i></> : 'бот'}</span>
        </div>
        <span className="tg-ava" aria-hidden="true"><img src={interior} alt="" /></span>
      </header>

      <main className="tg-chat" ref={chat}>
        {!started && (
          <motion.div className="tg-about" initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <img src={interior} alt="Зал барбершопа «Бритва»" />
            <div className="tg-about-body">
              <b>Что умеет этот бот?</b>
              <p>Запись в барбершоп «Бритва» за минуту: выберите услугу, мастера и свободное время. Напомню о визите за два часа.</p>
            </div>
          </motion.div>
        )}
        {started && <div className="tg-day">Сегодня</div>}
        {msgs.map((m, i) => (
          <motion.div
            key={i}
            className={`tg-row ${m.from === 'me' ? 'is-me' : ''}`}
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ transformOrigin: m.from === 'me' ? '100% 100%' : '0% 100%' }}
          >
            <div className={`tg-bubble ${m.media || m.masters || m.ticket ? 'has-media' : ''}`}>
              {m.media && <img className="tg-media" src={m.media} alt="Зал барбершопа" />}
              {m.masters && (
                <div className="tg-masters">
                  {MASTERS.map((x) => (
                    <figure key={x.name}>
                      <img src={x.photo} alt={`Мастер ${x.name}`} />
                      <figcaption><b>{x.name}</b><span>{x.about}</span></figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {m.ticket && <Ticket t={m.ticket} reduce={reduce} />}
              <span className="tg-text">{m.text}</span>
              <span className="tg-time">{m.at}{m.from === 'me' && <Checks size={15} weight="bold" />}</span>
            </div>
            {m.buttons && (
              <div className="tg-kb" style={{ gridTemplateColumns: `repeat(${m.cols || 1}, 1fr)` }}>
                {m.buttons.map(([k, label]) => (
                  <button key={k} onClick={() => press(k, label)}>{label}</button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </main>

      <AnimatePresence>
        {menu && (
          <motion.div className="tg-cmds" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}>
            {COMMANDS.map(([k, cmd, hint]) => (
              <button key={k} onClick={() => press(k, cmd)}><b>{cmd}</b><span>{hint}</span></button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="tg-input">
        {started ? (
          <>
            <button className={`tg-menu ${menu ? 'is-on' : ''}`} onClick={() => setMenu((v) => !v)} aria-expanded={menu}>
              {menu ? <X size={16} weight="bold" /> : <List size={16} weight="bold" />} Меню
            </button>
            <Paperclip size={24} className="tg-ico" />
            <span className="tg-field">Сообщение</span>
            <Microphone size={24} className="tg-ico" />
          </>
        ) : (
          <motion.button className="tg-start" onClick={start} whileTap={reduce ? undefined : { scale: 0.97 }}>Начать</motion.button>
        )}
      </footer>
    </div>
  )
}

// «Билет» записи: появляется с печатью и короткой вспышкой конфетти, это редкий момент, можно порадовать
function Ticket({ t, reduce }) {
  const bits = Array.from({ length: 14 }, (_, i) => i)
  return (
    <div className="tk">
      <div className="tk-top">
        <span className="ava"><img src={photoOf(t.master)} style={avaStyle(t.master)} alt="" /></span>
        <div>
          <div className="tk-day">{dayLabel(t.day)}</div>
          <div className="tk-time">{t.time}</div>
        </div>
        <motion.div
          className="tk-stamp"
          initial={reduce ? false : { scale: 1.8, rotate: -24, opacity: 0 }}
          animate={{ scale: 1, rotate: -12, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 }}
        >
          Записан
        </motion.div>
      </div>
      <div className="tk-line" />
      <div className="tk-rows">
        <span>{t.service.name}</span><b>{t.service.price.toLocaleString('ru-RU')} ₽</b>
        <span>Мастер</span><b>{t.master}</b>
      </div>
      {!reduce && (
        <div className="tk-confetti" aria-hidden="true">
          {bits.map((i) => (
            <motion.i
              key={i}
              style={{ background: ['#e0894a', '#5fa85a', '#3a8fd9', '#c4472f'][i % 4] }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: Math.cos((i / bits.length) * Math.PI * 2) * (70 + (i % 3) * 25), y: Math.sin((i / bits.length) * Math.PI * 2) * (50 + (i % 4) * 15) + 40, opacity: 0, rotate: 200 + i * 20 }}
              transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1], delay: 0.3 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Bot /></StrictMode>)
