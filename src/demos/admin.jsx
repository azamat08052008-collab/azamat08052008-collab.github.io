import { StrictMode, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence, animate, useReducedMotion } from 'motion/react'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { Scissors } from '@phosphor-icons/react/dist/csr/Scissors'
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { BellRinging } from '@phosphor-icons/react/dist/csr/BellRinging'
import { X } from '@phosphor-icons/react/dist/csr/X'
import '@fontsource-variable/commissioner'
import { KEY, SEED, MASTERS, dayIso, dayLabel, readBookings, minutesOf, avaStyle } from './bookings'
import './admin.css'

// Демо панели управления барбершопа. Свои записи вымышленные (SEED), записи из демо-бота подтягиваются из localStorage.

const STATUS = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Пришёл',
  cancel: 'Отменена',
}
const NEXT = { new: 'confirmed', confirmed: 'done' }
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽'
const OPEN = 10, CLOSE = 22
const pos = (time) => { const [h, m] = time.split(':').map(Number); return ((h + m / 60 - OPEN) / (CLOSE - OPEN)) * 100 }

// Число докручивается до нового значения: выручка и счётчики «оживают», когда меняется статус
function Num({ value, format = (n) => n }) {
  const ref = useRef(null)
  const prev = useRef(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (reduce) { el.textContent = format(value); prev.current = value; return }
    const c = animate(prev.current, value, { duration: 0.8, ease: [0.23, 1, 0.32, 1], onUpdate: (v) => { el.textContent = format(Math.round(v)) } })
    prev.current = value
    return () => c.stop()
  }, [value])
  return <b ref={ref}>{format(value)}</b>
}

// Лента дня: у каждого мастера своя дорожка, запись стоит по времени и длительности услуги
function Timeline({ rows, fresh, reduce }) {
  const hours = Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => OPEN + i)
  return (
    <section className="tl" aria-label="Лента дня">
      <div className="tl-hours">{hours.map((h) => <span key={h} style={{ left: `${((h - OPEN) / (CLOSE - OPEN)) * 100}%` }}>{h}</span>)}</div>
      {MASTERS.map(({ name, photo }) => (
        <div key={name} className="tl-lane">
          <div className="tl-who"><span className="ava"><img src={photo} style={avaStyle(name)} alt="" /></span>{name}</div>
          <div className="tl-track">
            {rows.filter((r) => r.master === name && r.status !== 'cancel').map((r) => (
              <motion.div
                key={r.id}
                className={`tl-slot st-${r.status} ${fresh === r.id ? 'is-fresh' : ''}`}
                style={{ left: `${pos(r.time)}%`, width: `${(minutesOf(r.service) / 60 / (CLOSE - OPEN)) * 100}%` }}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                title={`${r.time} ${r.client}, ${r.service}`}
              >
                {r.time}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function fromBot() {
  return readBookings().map((b) => ({ ...b, client: 'Гость из Telegram' }))
}

function Admin() {
  const reduce = useReducedMotion()
  const [rows, setRows] = useState(() => [...SEED, ...fromBot()])
  const [filter, setFilter] = useState('today')
  const [fresh, setFresh] = useState(null)
  const [toast, setToast] = useState(null)

  const known = useRef(new Set(rows.map((r) => r.id)))
  const filterFor = (day) => (day === dayIso(0) ? 'today' : day === dayIso(1) ? 'tomorrow' : 'all')
  function announce(b) {
    setFresh(b.id)
    setToast(b)
    setFilter(filterFor(b.day))
  }

  // Админку открыли сразу после записи в боте: покажем эту запись, а не молча добавим строку
  useEffect(() => {
    const recent = fromBot().filter((b) => b.id > Date.now() - 10 * 60 * 1000).at(-1)
    if (recent) announce(recent)
  }, [])

  // Запись, сделанная в демо-боте в соседнем окне, появляется здесь сразу
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY) return
      const added = fromBot().filter((b) => !known.current.has(b.id))
      if (!added.length) return
      added.forEach((b) => known.current.add(b.id))
      setRows((r) => [...r, ...added])
      announce(added.at(-1))
    }
    addEventListener('storage', onStorage)
    return () => removeEventListener('storage', onStorage)
  }, [])

  const today = dayIso(0)
  const shown = useMemo(() => rows
    .filter((r) => filter === 'all' || (filter === 'today' ? r.day === today : r.day === dayIso(1)))
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time)), [rows, filter, today])

  const todayRows = rows.filter((r) => r.day === today && r.status !== 'cancel')
  const revenue = todayRows.filter((r) => r.status === 'done').reduce((s, r) => s + r.price, 0)
  const newCount = rows.filter((r) => r.status === 'new').length

  const setStatus = (id, status) => setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)))

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-logo">Бритва</div>
        <nav>
          <a className="is-on"><CalendarBlank size={18} /> Записи</a>
          <a><Users size={18} /> Клиенты</a>
          <a><Scissors size={18} /> Услуги</a>
          <a><ChartBar size={18} /> Отчёты</a>
        </nav>
      </aside>

      <main className="ad-main">
        <header className="ad-top">
          <h1>Записи</h1>
          <div className="ad-tabs" role="tablist">
            {[['today', 'Сегодня'], ['tomorrow', 'Завтра'], ['all', 'Все']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </header>

        <section className="ad-stats">
          <div><span>Записей сегодня</span><Num value={todayRows.length} /></div>
          <div><span>Выручка за день</span><Num value={revenue} format={rub} /></div>
          <div className={newCount ? 'is-hot' : ''}><span>Ждут подтверждения</span><Num value={newCount} /></div>
        </section>

        <Timeline rows={rows.filter((r) => r.day === (filter === 'tomorrow' ? dayIso(1) : today))} fresh={fresh} reduce={reduce} />

        <div className="ad-table" role="table" aria-label="Записи">
          <div className="ad-row ad-headrow" role="row">
            <span>Время</span><span>Клиент</span><span>Услуга</span><span>Мастер</span><span>Статус</span>
          </div>
          <AnimatePresence initial={false}>
            {shown.map((r) => (
              <motion.div
                key={r.id}
                role="row"
                layout={!reduce}
                className={`ad-row ${r.status === 'cancel' ? 'is-cancel' : ''} ${fresh === r.id ? 'is-fresh' : ''}`}
                initial={reduce ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="ad-time">{filter === 'all' && r.day !== today ? `${dayLabel(r.day)}, ` : ''}{r.time}</span>
                <span className="ad-client">
                  {r.client}
                  {r.source === 'bot' && <em className="ad-src"><TelegramLogo size={12} weight="fill" /> из бота</em>}
                </span>
                <span>{r.service} <small>{rub(r.price)}</small></span>
                <span>{r.master}</span>
                <span className="ad-status">
                  <button className={`ad-pill st-${r.status}`} onClick={() => setStatus(r.id, NEXT[r.status])} disabled={r.status === 'done' || r.status === 'cancel'}>
                    {STATUS[r.status]}
                  </button>
                  {r.status !== 'cancel' && r.status !== 'done' && (
                    <button className="ad-cancel" onClick={() => setStatus(r.id, 'cancel')} aria-label={`Отменить запись ${r.client} в ${r.time}`}>Отменить</button>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {shown.length === 0 && <p className="ad-empty">На этот день записей нет</p>}
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              className="ad-toast"
              role="status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <motion.span className="ad-toast-bell" animate={reduce ? undefined : { rotate: [0, -18, 14, -10, 6, 0] }} transition={{ duration: 0.8, delay: 0.15 }}>
                <BellRinging size={20} weight="fill" />
              </motion.span>
              <div>
                <b>Новая запись из Telegram</b>
                <span>{dayLabel(toast.day)}, {toast.time} · {toast.service} · {toast.master}</span>
              </div>
              <button className="ad-toast-x" onClick={() => setToast(null)} aria-label="Закрыть уведомление"><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="ad-note">Демо: нажмите на статус, чтобы перевести запись дальше. Запишитесь в демо-боте, и запись появится здесь.</p>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Admin /></StrictMode>)
