import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { WORK } from './data'
import { Device, Screen, StatusBar, STATUS, deviceHeight } from './Device'

const spring = { type: 'spring', stiffness: 170, damping: 26 }

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
        <div className="work-list">
          {WORK.map((w, i) => (
            <Block key={w.id} w={w} active={wide && i === active} onActive={() => activate(i)} wide={wide} />
          ))}
        </div>
        {wide && <Stage active={active} seen={seen} W={W} />}
      </div>
    </section>
  )
}

function Block({ w, active, onActive, wide }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => { if (inView) onActive() }, [inView])

  return (
    <article ref={ref} id={`w-${w.id}`} className={`wb ${active ? 'is-on' : ''}`}>
      <h3>{w.title}</h3>
      <p className="wb-pitch">{w.pitch}</p>
      <ul>{w.items.map((t) => <li key={t}>{t}</li>)}</ul>
      <div className="wb-price">
        <span className="mono">{w.price}</span>
        <span className="wb-term">{w.term}</span>
      </div>
      {w.note && <p className="wb-note">{w.note}</p>}
      {w.guest && <a className="wb-guest" href={w.guest.src} target="_blank" rel="noreferrer">{w.guest.label} <ArrowUpRight size={14} weight="bold" /></a>}
      {!wide && (
        <div className="wb-device">
          <Device kind="phone" src={w.src} title={`Демо: ${w.label}`} width={280} tint={w.tint} />
          <div className="wb-label">{w.label}</div>
        </div>
      )}
    </article>
  )
}

function Stage({ active, seen, W }) {
  const reduce = useReducedMotion()
  const [loaded, setLoaded] = useState(() => new Set())
  const w = WORK[active]
  const kind = w.kind
  const width = W[kind]
  const height = deviceHeight(kind, width)
  const pad = kind === 'phone' ? 10 : 0
  const bar = kind === 'browser' ? 38 : 0
  const status = kind === 'phone' ? STATUS : 0

  return (
    <div className="stage">
      <div className="stage-inner">
        <motion.div
          className={`st-dev st-${kind}`}
          initial={false}
          animate={{ width: width + pad * 2, height: height + pad * 2 + bar + status, borderRadius: kind === 'phone' ? 46 : 14, padding: pad }}
          transition={reduce ? { duration: 0 } : spring}
        >
          <motion.div className="st-bar" initial={false} animate={{ height: bar, opacity: bar ? 1 : 0 }} transition={reduce ? { duration: 0 } : spring}>
            <i /><i /><i /><span>{w.label}</span>
          </motion.div>
          <motion.div className="st-screen" initial={false} animate={{ borderRadius: kind === 'phone' ? 36 : 0 }}>
            <motion.div className="st-status" initial={false} animate={{ height: status, backgroundColor: w.tint }} transition={reduce ? { duration: 0 } : spring}>
              <StatusBar tint="transparent" style={{ height: STATUS }} />
            </motion.div>
            <div className="st-layers">
            {WORK.map((x, i) => seen.has(i) && (
              <motion.div
                key={x.id}
                className="st-layer"
                initial={false}
                animate={{ opacity: i === active ? 1 : 0, scale: i === active || reduce ? 1 : 0.98 }}
                transition={{ duration: reduce ? 0 : 0.45, delay: i === active && !reduce ? 0.15 : 0 }}
                style={{ pointerEvents: i === active ? 'auto' : 'none', zIndex: i === active ? 1 : 0 }}
              >
                <Screen kind={x.kind} src={x.src} title={`Демо: ${x.label}`} width={W[x.kind]} active={i === active} scroll={x.scroll !== false}
                  onLoad={() => setLoaded((l) => new Set(l).add(x.id))} />
                {!loaded.has(x.id) && <div className="st-loading">Загружаю пример…</div>}
              </motion.div>
            ))}
            <a className="dv-open" href={w.src} target="_blank" rel="noreferrer" aria-label={`Открыть демо: ${w.label}`}><span>Открыть демо</span></a>
            </div>
          </motion.div>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.a
            key={w.id}
            className="st-label"
            href={w.src}
            target="_blank"
            rel="noreferrer"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
          >
            {w.label} <ArrowUpRight size={14} weight="bold" />
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  )
}
