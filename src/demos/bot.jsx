import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, useReducedMotion } from 'motion/react'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { Paperclip } from '@phosphor-icons/react/dist/csr/Paperclip'
import { Microphone } from '@phosphor-icons/react/dist/csr/Microphone'
import { Checks } from '@phosphor-icons/react/dist/csr/Checks'
import { SERVICES, MASTERS, dayIso, dayLabel, addBooking, freeTimes, photoOf, avaStyle } from './bookings'
import interior from '../assets/img/britva/interior.webp'
import './bot.css'

// Демо Telegram-бота записи. Сценарий целиком на клиенте; запись уходит в localStorage для демо-админки.
const now = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const START = {
  media: interior,
  text: 'Привет! Я бот барбершопа «Бритва». Запишу к мастеру за минуту и напомню перед визитом.',
  buttons: [['book', 'Записаться'], ['prices', 'Цены'], ['where', 'Где вы находитесь?']],
}

function Bot() {
  const reduce = useReducedMotion()
  const [msgs, setMsgs] = useState([{ from: 'bot', ...START, at: now() }])
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState({})
  const chat = useRef(null)

  // Прокручиваем только сам чат: scrollIntoView внутри iframe сдвинул бы и страницу, куда встроено демо
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) }, [msgs, typing, reduce])

  function reply(m) {
    setTyping(true)
    setTimeout(() => { setTyping(false); setMsgs((all) => [...all, { from: 'bot', at: now(), ...m }]) }, reduce ? 0 : 650)
  }

  function press(key, label) {
    // кнопки прошлых сообщений гасим, чтобы диалог шёл по порядку
    setMsgs((all) => [...all.map((m) => ({ ...m, buttons: undefined })), { from: 'me', text: label, at: now() }])
    const d = { ...draft }

    if (key === 'prices') return reply({ text: SERVICES.map((s) => `${s.name}: ${s.price.toLocaleString('ru-RU')} ₽`).join('\n'), buttons: [['book', 'Записаться']] })
    if (key === 'where') return reply({ text: 'Мы в центре Казани, работаем каждый день с 10 до 22. Точный адрес пришлю вместе с записью.', buttons: [['book', 'Записаться']] })
    if (key === 'book' || key === 'again') {
      setDraft({})
      return reply({ text: 'Какая услуга?', buttons: SERVICES.map((s) => [`svc:${s.id}`, `${s.name} · ${s.price.toLocaleString('ru-RU')} ₽`]) })
    }
    if (key.startsWith('svc:')) {
      d.service = SERVICES.find((s) => s.id === key.slice(4))
      setDraft(d)
      return reply({ text: 'К какому мастеру?', masters: true, buttons: [...MASTERS.map((m) => [`m:${m.name}`, m.name]), ['m:any', 'Любой свободный']] })
    }
    if (key.startsWith('m:')) {
      d.master = key === 'm:any' ? MASTERS[Math.floor(Math.random() * MASTERS.length)].name : key.slice(2)
      setDraft(d)
      return reply({ text: 'Выберите день', buttons: [0, 1, 2].map((o) => [`d:${dayIso(o)}`, dayLabel(dayIso(o))]) })
    }
    if (key.startsWith('d:')) {
      d.day = key.slice(2)
      setDraft(d)
      const free = freeTimes(d.master, d.day, d.service)
      if (!free.length) return reply({ text: `${dayLabel(d.day)} у мастера ${d.master} всё занято. Выберите другой день`, buttons: [0, 1, 2].filter((o) => dayIso(o) !== d.day).map((o) => [`d:${dayIso(o)}`, dayLabel(dayIso(o))]) })
      return reply({ text: `Свободное время у мастера ${d.master}`, buttons: free.map((t) => [`t:${t}`, t]) })
    }
    if (key.startsWith('t:')) {
      d.time = key.slice(2)
      setDraft(d)
      return reply({
        text: `Проверьте запись:\n${d.service.name}, ${d.service.price.toLocaleString('ru-RU')} ₽\nМастер: ${d.master}\n${dayLabel(d.day)}, ${d.time}`,
        buttons: [['ok', 'Подтвердить'], ['book', 'Изменить']],
      })
    }
    if (key === 'ok') {
      addBooking({ id: Date.now(), service: d.service.name, price: d.service.price, master: d.master, day: d.day, time: d.time, source: 'bot', status: 'new' })
      return reply({ ticket: { ...d }, text: 'Готово, вы записаны! Напомню за два часа до визита.', buttons: [['again', 'Записаться ещё раз']] })
    }
  }

  return (
    <div className="tg">
      <header className="tg-head">
        <CaretLeft size={22} className="tg-back" />
        <div className="tg-ava" aria-hidden="true">Б</div>
        <div>
          <div className="tg-name">Бритва · барбершоп</div>
          <div className="tg-status">{typing ? 'печатает…' : 'бот'}</div>
        </div>
      </header>

      <main className="tg-chat" ref={chat}>
        <div className="tg-day">Сегодня</div>
        {msgs.map((m, i) => (
          <motion.div
            key={i}
            className={`tg-row ${m.from === 'me' ? 'is-me' : ''}`}
            initial={reduce || i === 0 ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className={`tg-bubble ${m.media || m.masters || m.ticket ? 'has-media' : ''}`}>
              {m.media && <img className="tg-media" src={m.media} alt="Зал барбершопа" />}
              {m.masters && (
                <div className="tg-masters">
                  {MASTERS.map((m) => (
                    <figure key={m.name}>
                      <img src={m.photo} alt={`Мастер ${m.name}`} />
                      <figcaption><b>{m.name}</b><span>{m.about}</span></figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {m.ticket && <Ticket t={m.ticket} reduce={reduce} />}
              <span className="tg-text">{m.text}</span>
              <span className="tg-time">{m.at}{m.from === 'me' && <Checks size={14} weight="bold" />}</span>
            </div>
            {m.buttons && (
              <div className="tg-kb">
                {m.buttons.map(([k, label]) => (
                  <button key={k} onClick={() => press(k, label)}>{label}</button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        {typing && (
          <div className="tg-row"><div className="tg-bubble tg-typing" aria-label="Бот печатает"><i /><i /><i /></div></div>
        )}
      </main>

      <footer className="tg-input">
        <Paperclip size={22} />
        <span>Выберите вариант в сообщении</span>
        <Microphone size={22} />
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
