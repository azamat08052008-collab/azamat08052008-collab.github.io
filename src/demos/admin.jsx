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
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Minus } from '@phosphor-icons/react/dist/csr/Minus'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import '@fontsource-variable/commissioner'
import { KEY, SEED, MASTERS, dayIso, dayLabel, readBookings, minutesOf, avaStyle, readServices, saveServices } from './bookings'
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

// Вымышленная история визитов за четыре недели: из неё собираются «Клиенты» и «Отчёты»
const REGULARS = ['Ринат К.', 'Камиль Г.', 'Тимофей С.', 'Айдар М.', 'Денис В.', 'Марсель Х.', 'Артём Л.', 'Ильнур Ш.', 'Булат Ф.', 'Егор П.']
const PAST = Array.from({ length: 27 }, (_, k) => k + 1).flatMap((d) =>
  Array.from({ length: 3 + ((d * 7) % 4) }, (_, i) => {
    const svc = readServices()[(d + i) % 3]
    return { id: `p${d}-${i}`, client: REGULARS[(d * 3 + i * 5) % REGULARS.length], service: svc.name, price: svc.price, master: MASTERS[(d + i) % 2].name, day: dayIso(-d), time: '12:00', status: 'done' }
  }),
)

const SECTIONS = [
  ['bookings', 'Записи', CalendarBlank],
  ['clients', 'Клиенты', Users],
  ['services', 'Услуги', Scissors],
  ['reports', 'Отчёты', ChartBar],
]

function fromBot() {
  return readBookings().map((b) => ({ ...b, client: 'Гость из Telegram' }))
}

function Admin() {
  const reduce = useReducedMotion()
  const [rows, setRows] = useState(() => [...SEED, ...fromBot()])
  const [filter, setFilter] = useState('today')
  const [fresh, setFresh] = useState(null)
  const [toast, setToast] = useState(null)
  const [section, setSection] = useState('bookings')
  const [services, setServices] = useState(readServices)

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

  // Новая цена услуги применяется к записям, которые ещё не оплачены; бот видит её через localStorage
  function updateService(id, patch) {
    setServices((list) => {
      const next = list.map((s) => (s.id === id ? { ...s, ...patch } : s))
      saveServices(next)
      const svc = next.find((s) => s.id === id)
      setRows((r) => r.map((x) => (x.service === svc.name && (x.status === 'new' || x.status === 'confirmed') ? { ...x, price: svc.price } : x)))
      return next
    })
  }

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-logo">Бритва</div>
        <nav role="tablist" aria-label="Разделы">
          {SECTIONS.map(([k, l, Icon]) => (
            <button key={k} role="tab" aria-selected={section === k} className={section === k ? 'is-on' : ''} onClick={() => setSection(k)}>
              <Icon size={18} /> {l}
            </button>
          ))}
        </nav>
      </aside>

      <main className="ad-main">
        <nav className="ad-mnav" role="tablist" aria-label="Разделы">
          {SECTIONS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={section === k} className={section === k ? 'is-on' : ''} onClick={() => setSection(k)}>{l}</button>
          ))}
        </nav>

        {section === 'clients' && <Clients rows={rows} />}
        {section === 'services' && <Services services={services} onChange={updateService} />}
        {section === 'reports' && <Reports rows={rows} services={services} />}

        {section === 'bookings' && <>
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
        <p className="ad-note">Демо: нажмите на статус, чтобы перевести запись дальше. Запишитесь в демо-боте, и запись появится здесь.</p>
        </>}
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
      </main>
    </div>
  )
}

// Клиенты: собраны из истории и текущих записей, сортировка по последнему визиту
function Clients({ rows }) {
  const [q, setQ] = useState('')
  const reduce = useReducedMotion()
  const list = useMemo(() => {
    const map = new Map()
    for (const r of [...PAST, ...rows]) {
      if (r.status === 'cancel') continue
      const c = map.get(r.client) || { name: r.client, visits: 0, spent: 0, last: '', next: '', bot: false }
      if (r.status === 'done') { c.visits += 1; c.spent += r.price; if (r.day > c.last) c.last = r.day }
      else if (!c.next || r.day + r.time < c.next) c.next = r.day + r.time
      if (r.source === 'bot') c.bot = true
      map.set(r.client, c)
    }
    return [...map.values()].sort((a, b) => (b.next || b.last).localeCompare(a.next || a.last))
  }, [rows])
  const shown = list.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
  const ago = (iso) => { const d = Math.round((new Date(dayIso(0)) - new Date(iso)) / 864e5); return d === 0 ? 'сегодня' : d === 1 ? 'вчера' : `${d} дн. назад` }
  return (
    <>
      <header className="ad-top">
        <h1>Клиенты</h1>
        <label className="ad-search">
          <MagnifyingGlass size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени" aria-label="Поиск клиента" />
        </label>
      </header>
      <section className="ad-stats">
        <div><span>Клиентов</span><Num value={list.length} /></div>
        <div><span>Визитов за месяц</span><Num value={list.reduce((s, c) => s + c.visits, 0)} /></div>
        <div><span>Средний чек</span><Num value={Math.round(list.reduce((s, c) => s + c.spent, 0) / Math.max(1, list.reduce((s, c) => s + c.visits, 0)))} format={rub} /></div>
      </section>
      <div className="ad-table">
        <div className="ad-row ad-headrow cl-row"><span>Клиент</span><span>Визитов</span><span>Потратил</span><span>Последний визит</span><span>Следующая запись</span></div>
        {shown.map((c, i) => (
          <motion.div key={c.name} className="ad-row cl-row" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
            <span className="ad-client">{c.name}{c.bot && <em className="ad-src"><TelegramLogo size={12} weight="fill" /> из бота</em>}</span>
            <span><small className="cl-l">Визитов: </small>{c.visits || '—'}</span>
            <span><small className="cl-l">Потратил: </small>{c.spent ? rub(c.spent) : '—'}</span>
            <span><small className="cl-l">Был: </small>{c.last ? ago(c.last) : 'ещё не был'}</span>
            <span><small className="cl-l">Запись: </small>{c.next ? `${dayLabel(c.next.slice(0, 10))}, ${c.next.slice(10)}` : '—'}</span>
          </motion.div>
        ))}
        {shown.length === 0 && <p className="ad-empty">Никого не нашли</p>}
      </div>
    </>
  )
}

// Услуги: цена и длительность правятся здесь и сразу видны в боте
function Services({ services, onChange }) {
  return (
    <>
      <header className="ad-top"><h1>Услуги</h1></header>
      <p className="ad-note ad-note-top">Измените цену и запишитесь в демо-боте: он покажет новую цену.</p>
      <div className="sv-grid">
        {services.map((s) => (
          <div key={s.id} className={`sv-card ${s.hidden ? 'is-off' : ''}`}>
            <div className="sv-head">
              <h2>{s.name}</h2>
              <label className="sv-toggle">
                <input type="checkbox" checked={!s.hidden} onChange={(e) => onChange(s.id, { hidden: !e.target.checked })} />
                <span>{s.hidden ? 'Скрыта в боте' : 'В записи'}</span>
              </label>
            </div>
            <div className="sv-field">
              <span>Цена</span>
              <div className="sv-step">
                <button onClick={() => onChange(s.id, { price: Math.max(100, s.price - 100) })} aria-label={`Дешевле: ${s.name}`}><Minus size={14} weight="bold" /></button>
                <Num value={s.price} format={rub} />
                <button onClick={() => onChange(s.id, { price: s.price + 100 })} aria-label={`Дороже: ${s.name}`}><Plus size={14} weight="bold" /></button>
              </div>
            </div>
            <div className="sv-field">
              <span>Длительность</span>
              <div className="sv-chips">
                {[30, 45, 60, 90].map((m) => (
                  <button key={m} className={s.min === m ? 'is-on' : ''} onClick={() => onChange(s.id, { min: m })}>{m} мин</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Отчёты: выручка за неделю столбиками, мастера и услуги, ожидаемая выручка по будущим записям
function Reports({ rows, services }) {
  const reduce = useReducedMotion()
  const all = [...PAST, ...rows].filter((r) => r.status !== 'cancel')
  const done = all.filter((r) => r.status === 'done')
  const week = Array.from({ length: 7 }, (_, i) => dayIso(i - 6)).map((day) => ({ day, sum: done.filter((r) => r.day === day).reduce((s, r) => s + r.price, 0) }))
  const max = Math.max(...week.map((w) => w.sum), 1)
  const weekSum = week.reduce((s, w) => s + w.sum, 0)
  const expected = all.filter((r) => r.status === 'new' || r.status === 'confirmed').reduce((s, r) => s + r.price, 0)
  const by = (key) => {
    const m = new Map()
    for (const r of done.filter((r) => r.day >= week[0].day)) m.set(r[key], (m.get(r[key]) || 0) + r.price)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  const short = (iso) => new Date(iso + 'T12:00').toLocaleDateString('ru-RU', { weekday: 'short' })
  return (
    <>
      <header className="ad-top"><h1>Отчёты</h1><span className="rp-sub">последние 7 дней</span></header>
      <section className="ad-stats">
        <div><span>Выручка за неделю</span><Num value={weekSum} format={rub} /></div>
        <div><span>Визитов за неделю</span><Num value={done.filter((r) => r.day >= week[0].day).length} /></div>
        <div className="is-hot"><span>Ожидается по записям</span><Num value={expected} format={rub} /></div>
      </section>
      <div className="rp-grid">
        <section className="rp-card rp-week" aria-label="Выручка по дням">
          <h2>Выручка по дням</h2>
          <div className="rp-bars">
            {week.map((w, i) => (
              <div key={w.day} className="rp-bar">
                <span className="rp-val">{(w.sum / 1000).toFixed(1).replace('.', ',')}к</span>
                <motion.i
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: w.sum / max }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: reduce ? 0 : i * 0.05 }}
                  className={i === 6 ? 'is-today' : ''}
                />
                <span className="rp-day">{short(w.day)}</span>
              </div>
            ))}
          </div>
        </section>
        {[['master', 'По мастерам'], ['service', 'По услугам']].map(([key, title]) => {
          const list = by(key)
          const top = list[0]?.[1] || 1
          return (
            <section key={key} className="rp-card">
              <h2>{title}</h2>
              {list.map(([name, sum], i) => (
                <div key={name} className="rp-line">
                  <div className="rp-line-top"><span>{name}</span><b>{rub(sum)}</b></div>
                  <span className="rp-track"><motion.i initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: sum / top }} transition={{ duration: 0.8, delay: reduce ? 0 : i * 0.08, ease: [0.23, 1, 0.32, 1] }} /></span>
                </div>
              ))}
            </section>
          )
        })}
      </div>
      <p className="ad-note">Цены услуг сейчас: {services.map((s) => `${s.name.toLowerCase()} ${rub(s.price)}`).join(', ')}.</p>
    </>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Admin /></StrictMode>)
