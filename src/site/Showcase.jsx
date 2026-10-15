import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimate, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { WORK } from './data'
import { Device, Screen, StatusBar, TryButton, STATUS, deviceHeight } from './Device'
import DemoSheet from './DemoSheet'
import Odometer from './Odometer'

function useMedia(q) {
  const [on, setOn] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const sync = () => setOn(m.matches)
    m.addEventListener('change', sync)
    return () => m.removeEventListener('change', sync)
  }, [q])
  return on
}

// Витрина: на компьютере слева услуги, справа закреплённое устройство, в котором сменяются демо.
// Открытые демо остаются загруженными, чтобы при возврате не терялись переписка в боте и корзина.
export default function Showcase() {
  const wide = useMedia('(min-width: 1000px)')
  const roomy = useMedia('(min-width: 1180px)')
  const W = { browser: roomy ? 620 : 520, phone: 280 }
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState(() => new Set([0]))
  const [sheet, setSheet] = useState(null)
  const closeSheet = useCallback(() => setSheet(null), [])
  const list = useRef(null)
  const { scrollYProgress } = useScroll({ target: list, offset: ['start center', 'end center'] })

  function activate(i) {
    setActive(i)
    setSeen((s) => (s.has(i) ? s : new Set(s).add(i)))
  }

  // На компьютере начинаем грузить все демо через секунду после открытия: внешние (лендинг «Подачи»)
  // грузятся по 3–4 секунды, и к тому моменту, когда до них долистают, они уже готовы
  useEffect(() => {
    if (!wide) return
    const t = setTimeout(() => setSeen(new Set(WORK.map((_, i) => i))), 1000)
    return () => clearTimeout(t)
  }, [wide])

  return (
    <section className="work" id="work">
      <div className="work-intro">
        <h2 className="h2">Живые примеры, а не картинки</h2>
        <p className="lead">Нажимайте кнопки, оформляйте заказы, записывайтесь. Всё работает так же, как будет у вас.</p>
      </div>
      <div className="work-grid">
        <div className="work-list" ref={list}>
          {WORK.map((w, i) => (
            <Block key={w.id} w={w} n={i + 1} active={wide && i === active} onActive={() => activate(i)} wide={wide} onTry={() => setSheet(w)} />
          ))}
        </div>
        {wide && <Stage active={active} seen={seen} W={W} progress={scrollYProgress} onTry={setSheet} />}
      </div>
      <DemoSheet demo={sheet} onClose={closeSheet} />
    </section>
  )
}

const pad2 = (n) => String(n).padStart(2, '0')

function Block({ w, n, active, onActive, wide, onTry }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => { if (inView) onActive() }, [inView])

  return (
    <article ref={ref} id={`w-${w.id}`} className={`wb ${active ? 'is-on' : ''}`}>
      <div className="wb-num" aria-hidden="true">{pad2(n)}</div>
      <h3>{w.title}</h3>
      <p className="wb-pitch">{w.pitch}</p>
      <ul>{w.items.map((t) => <li key={t}>{t}</li>)}</ul>
      <div className="wb-price">
        <Odometer className="mono" value={w.price} />
        <span className="wb-term">{w.term}</span>
      </div>
      {w.note && <p className="wb-note">{w.note}</p>}
      {w.guest && <a className="wb-guest" href={w.guest.src} target="_blank" rel="noreferrer">{w.guest.label} <ArrowUpRight size={14} weight="bold" /></a>}
      {!wide && (
        <div className="wb-device">
          <Device kind="phone" src={w.src} title={`Демо: ${w.label}`} width={280} tint={w.tint} dark={w.statusDark} onTry={onTry} />
          <div className="wb-label">{w.label}</div>
        </div>
      )}
    </article>
  )
}

// Смена демо — переворот: устройство поворачивается ребром к зрителю, на ребре подменяется пример
// и рамка (браузер или телефон), и устройство доворачивается уже с новым. Пока листаешь внутри одной
// услуги, устройство слегка покачивается вслед за прокруткой и встаёт ровно к моменту переворота.
function Stage({ active, seen, W, progress, onTry }) {
  const reduce = useReducedMotion()
  const [loaded, setLoaded] = useState(() => new Set())
  const [shown, setShown] = useState(active)
  const [, animate] = useAnimate()
  const prev = useRef(active)
  const turn = useMotionValue(0)
  const shade = useTransform(turn, (v) => Math.min(Math.abs(v) / 90, 1) * 0.45)
  const sway = useTransform(progress, (p) => Math.sin(p * WORK.length * Math.PI * 2) * 7)
  const lift = useTransform(progress, (p) => Math.cos(p * WORK.length * Math.PI * 2) * -8)

  useEffect(() => {
    if (active === prev.current) return
    const dir = active > prev.current ? 1 : -1
    prev.current = active
    if (reduce) { setShown(active); return }
    let cancelled = false
    ;(async () => {
      await animate(turn, dir * 90, { duration: 0.22, ease: [0.55, 0, 0.85, 0.35] })
      if (cancelled) return
      setShown(active)
      turn.set(-dir * 90)
      await animate(turn, 0, { type: 'spring', stiffness: 110, damping: 15 })
    })()
    return () => { cancelled = true }
  }, [active])

  const w = WORK[shown]
  const kind = w.kind
  const width = W[kind]
  const height = deviceHeight(kind, width)
  const pad = kind === 'phone' ? 10 : 0
  const bar = kind === 'browser' ? 38 : 0
  const status = kind === 'phone' ? STATUS : 0

  return (
    <div className="stage">
      <div className="stage-inner">
        <motion.div className="st-tilt" style={reduce ? undefined : { rotateY: sway, y: lift }}>
          <motion.div
            className={`st-dev st-${kind}`}
            style={{
              rotateY: turn,
              width: width + pad * 2,
              height: height + pad * 2 + bar + status,
              borderRadius: kind === 'phone' ? 46 : 14,
              padding: pad,
            }}
          >
            {bar > 0 && <div className="st-bar"><i /><i /><i /><span>{w.label}</span></div>}
            <div className="st-screen" style={{ borderRadius: kind === 'phone' ? 36 : 0 }}>
              {status > 0 && <div className="st-status" style={{ background: w.tint }}><StatusBar tint="transparent" dark={w.statusDark} style={{ height: STATUS }} /></div>}
              <div className="st-layers">
                {WORK.map((x, i) => seen.has(i) && (
                  <div
                    key={x.id}
                    className="st-layer"
                    style={{ opacity: i === shown ? 1 : 0, pointerEvents: i === shown ? 'auto' : 'none', zIndex: i === shown ? 1 : 0 }}
                  >
                    <Screen kind={x.kind} src={x.src} title={`Демо: ${x.label}`} width={W[x.kind]} active={i === shown} scroll={x.scroll !== false}
                      onLoad={() => setLoaded((l) => new Set(l).add(x.id))} />
                    {!loaded.has(x.id) && <div className="st-loading">Загружаю пример…</div>}
                  </div>
                ))}
                <TryButton title={w.label} onTry={() => onTry(w)} />
              </div>
            </div>
            <motion.div className="st-shade" style={{ opacity: shade }} aria-hidden="true" />
          </motion.div>
        </motion.div>
        {/* Номер примера и полоса: сколько пройдено и сколько впереди */}
        <div className="st-foot">
          <span className="st-count"><Odometer value={pad2(shown + 1)} /><span>/ {pad2(WORK.length)}</span></span>
          <span className="st-track" aria-hidden="true"><motion.i style={{ scaleX: progress }} /></span>
          <AnimatePresence mode="wait">
            <motion.a
              key={w.id}
              className="st-label"
              href={w.src}
              target="_blank"
              rel="noreferrer"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
            >
              {w.label} <ArrowUpRight size={14} weight="bold" />
            </motion.a>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
