import { useCallback, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { WORK } from './data'
import { Device } from './Device'
import DemoSheet from './DemoSheet'
import Odometer from './Odometer'
import { useMedia, useViewport, morph } from './hooks'

const N = WORK.length
const PANEL = 88 // ширина панели ленты, vw

// Витрина — лента: на компьютере экран закреплён, прокрутка вниз везёт шесть примеров справа налево.
// Устройство подъезжает повёрнутым и встаёт ровно в центре. Сверху оглавление: где вы и куда перейти.
// На телефоне — список, где каждый пример собирается при прокрутке: телефон разворачивается к вам,
// заголовок набирает раструбы, как на первом экране. Демо открывается на весь экран кнопкой «Попробовать».
export default function Showcase() {
  const wide = useMedia('(min-width: 1000px)')
  const reduce = useReducedMotion()
  const [sheet, setSheet] = useState(null)
  const closeSheet = useCallback(() => setSheet(null), [])

  return (
    <section className="work" id="work">
      <div className="work-intro">
        <h2 className="h2">Живые примеры, а не картинки</h2>
        <p className="lead">Нажимайте кнопки, оформляйте заказы, записывайтесь. Всё работает так же, как будет у вас.</p>
      </div>
      {wide && !reduce
        ? <Track onTry={setSheet} />
        : <div className="work-list">{WORK.map((w) => <Panel key={w.id} w={w} wide={wide} onTry={() => setSheet(w)} />)}</div>}
      <DemoSheet demo={sheet} onClose={closeSheet} />
    </section>
  )
}

function Track({ onTry }) {
  const wrap = useRef(null)
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })
  // Позиция в ленте с остановками: каждый пример стоит по центру часть прокрутки, потом лента едет дальше
  const pos = useTransform(scrollYProgress, (v) => dwell(v * (N - 1)))
  const x = useTransform(pos, (v) => `${-v * PANEL}vw`)
  const [active, setActive] = useState(0)
  useMotionValueEvent(pos, 'change', (v) => setActive(Math.round(v)))

  function go(i) {
    const el = wrap.current
    const top = el.getBoundingClientRect().top + scrollY
    scrollTo({ top: top + ((el.offsetHeight - innerHeight) * i) / (N - 1), behavior: 'smooth' })
  }

  return (
    <div className="track-wrap" ref={wrap} style={{ height: `${N * 85}vh` }}>
      <div className="track-pin">
        <div className="track-index">
          {WORK.map((w, i) => (
            <button key={w.id} type="button" className={i === active ? 'is-on' : ''} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)}>
              {w.title}
            </button>
          ))}
          <span className="track-rail" aria-hidden="true"><motion.i style={{ scaleX: scrollYProgress }} /></span>
        </div>
        <motion.div className="track" style={{ x }}>
          {WORK.map((w, i) => <Panel key={w.id} w={w} i={i} pos={pos} wide onTry={() => onTry(w)} />)}
        </motion.div>
      </div>
    </div>
  )
}

function Panel({ w, i, pos, wide, onTry }) {
  const { w: vw, h: vh } = useViewport()
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const moving = Boolean(pos)
  const entering = !moving && !reduce
  const still = useMotionValue(0)
  // Положение панели относительно центра: -1 — уехала влево, 0 — по центру, 1 — ещё справа
  const local = useTransform(pos || still, (v) => Math.max(-1, Math.min(1, i - v)))
  const turn = useTransform(local, [-1, 0, 1], [16, 0, -22])
  const shift = useTransform(local, [-1, 0, 1], [-60, 0, 140])
  const fade = useTransform(local, [-1, 0, 1], [0.15, 1, 0.25])

  // Вход в списке: 0 — карточка только показалась снизу, 1 — дошла до трети экрана
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ['start end', 'start 30%'] })
  const inTurn = useTransform(enter, [0, 1], [-34, 0])
  const inTilt = useTransform(enter, [0, 1], [18, 0])
  const inY = useTransform(enter, [0, 1], [90, 0])
  const inScale = useTransform(enter, [0, 1], [0.84, 1])
  const inText = useTransform(enter, [0, 0.7], [36, 0])
  const inFade = useTransform(enter, [0, 0.6], [0, 1])
  const inFont = useTransform(enter, [0.25, 1], [0, 1], { clamp: true })
  const inAxes = useTransform(inFont, morph)

  // Размер устройства под окно: телефон по высоте, браузер по ширине колонки
  const room = vh - 68 - 64 - 64
  const kind = wide ? w.kind : 'phone'
  const width = !wide ? 280
    : kind === 'phone' ? clamp(Math.round((room - 50) / 2.164), 180, 290)
    : clamp(Math.round(Math.min(vw * PANEL / 100 * 0.56, (room - 38) / 0.625)), 420, 640)

  return (
    <article ref={ref} id={`w-${w.id}`} className={`wb wb-${kind} ${moving ? 'is-track' : ''}`}>
      <motion.div className="wb-text" style={moving ? { x: shift, opacity: fade } : entering ? { y: inText, opacity: inFade } : undefined}>
        <motion.h3 style={entering ? { fontVariationSettings: inAxes } : undefined}>{w.title}</motion.h3>
        <p className="wb-pitch">{w.pitch}</p>
        <ul>{w.items.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="wb-price">
          <Odometer value={w.price} />
          <span className="wb-term">{w.term}</span>
        </div>
        {w.note && <p className="wb-note">{w.note}</p>}
        {w.guest && <a className="wb-guest" href={w.guest.src} target="_blank" rel="noreferrer">{w.guest.label} <ArrowUpRight size={14} weight="bold" /></a>}
      </motion.div>
      <div className="wb-device">
        <motion.div className="wb-turn" style={moving ? { rotateY: turn } : entering ? { rotateY: inTurn, rotateX: inTilt, y: inY, scale: inScale } : undefined}>
          <Device kind={kind} src={w.src} title={`Демо: ${w.label}`} label={w.label} width={width} tint={w.tint} dark={w.statusDark} onTry={onTry} />
        </motion.div>
        <a className="wb-label" href={w.src} target="_blank" rel="noreferrer">{w.label} <ArrowUpRight size={13} weight="bold" /></a>
      </div>
    </article>
  )
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
function dwell(p) {
  const k = Math.floor(p)
  const g = clamp((p - k - 0.2) / 0.6, 0, 1)
  return k + (g < 0.5 ? 2 * g * g : 1 - (2 - 2 * g) ** 2 / 2)
}
