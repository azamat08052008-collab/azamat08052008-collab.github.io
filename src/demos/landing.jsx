import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { ArrowsHorizontal } from '@phosphor-icons/react/dist/csr/ArrowsHorizontal'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import '@fontsource-variable/sofia-sans-extra-condensed'
import '@fontsource-variable/sofia-sans-extra-condensed/wght-italic.css'
import '@fontsource-variable/sofia-sans'
import './landing.css'
import Odometer from '../site/Odometer'
import ChatWidget from './ChatWidget'
import hero from '../assets/img/glyanets/hero.webp'
import polish from '../assets/img/glyanets/polish.webp'
import ceramic from '../assets/img/glyanets/ceramic.webp'
import ppf from '../assets/img/glyanets/ppf.webp'
import interior from '../assets/img/glyanets/interior.webp'

// Демо лендинга вымышленной детейлинг-студии «Глянец». Виджет ИИ-помощника встроен в страницу;
// страница /demo/ai/ открывает тот же лендинг с уже раскрытым чатом.
const ease = [0.16, 1, 0.3, 1]

const SERVICES = [
  { id: 'polish', name: 'Полировка кузова', text: 'Убираем царапины и голограммы, возвращаем глубину цвета', price: 'от 9 000 ₽', time: '1 день', img: polish },
  { id: 'ceramic', name: 'Керамика', text: 'Твёрдое покрытие: блеск и защита до 3 лет', price: 'от 18 000 ₽', time: '2 дня', img: ceramic },
  { id: 'ppf', name: 'Бронеплёнка', text: 'Капот, бампер, фары: от сколов и песка', price: 'от 25 000 ₽', time: '2 дня', img: ppf },
  { id: 'interior', name: 'Химчистка салона', text: 'Кожа, ткань, потолок, запахи', price: 'от 7 000 ₽', time: '1 день', img: interior },
]

// Калькулятор: базовые цены для седана и коэффициенты по классу машины
const CALC = [
  { id: 'polish', name: 'Полировка', base: 9000, days: 1 },
  { id: 'ceramic', name: 'Керамика', base: 18000, days: 2 },
  { id: 'ppf', name: 'Бронеплёнка, зоны риска', base: 25000, days: 2 },
  { id: 'interior', name: 'Химчистка салона', base: 7000, days: 1 },
]
const CLASSES = [
  { id: 's', name: 'Хэтчбек', k: 0.85 },
  { id: 'm', name: 'Седан', k: 1 },
  { id: 'l', name: 'Кроссовер', k: 1.2 },
  { id: 'xl', name: 'Внедорожник', k: 1.4 },
]
const round500 = (n) => Math.round(n / 500) * 500
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽'
const startOpen = document.getElementById('root').dataset.chat === 'open'

function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </motion.div>
  )
}

function Landing() {
  const [request, setRequest] = useState(null)
  const book = (text = 'Хочу записаться на осмотр') => setRequest({ text, id: Date.now() })

  return (
    <div className="gl">
      <header className="gl-nav">
        <a href="#top" className="gl-logo">Глянец<i>/</i></a>
        <nav className="gl-links">
          <a href="#services">Услуги</a>
          <a href="#before">До и после</a>
          <a href="#calc">Калькулятор</a>
        </nav>
        <button className="gl-btn gl-btn-sm" onClick={() => book()}>Записаться</button>
      </header>

      <main id="top">
        <Hero onBook={book} />
        <div className="gl-marquee" aria-hidden="true">
          <div className="gl-marquee-track">
            {[0, 1].map((k) => <span key={k}>Полировка <i /> Керамика <i /> Бронеплёнка <i /> Химчистка <i /> Оклейка фар <i /> Антидождь <i /></span>)}
          </div>
        </div>
        <BeforeAfter />
        <Services />
        <Calculator onBook={book} />
        <section className="gl-facts">
          {[['3 года', 'гарантия на керамику'], ['1 день', 'полировка и химчистка'], ['0 ₽', 'осмотр и замер лака']].map(([n, t], i) => (
            <Reveal key={n} delay={i * 0.08} className="gl-fact"><b>{n}</b><span>{t}</span></Reveal>
          ))}
        </section>
        <section className="gl-final">
          <Reveal>
            <h2>Приезжайте на бесплатный осмотр</h2>
            <p>Покажем дефекты под лампой, замерим лак и назовём точную цену. Казань, 5 минут от центра, каждый день с 9 до 21.</p>
            <button className="gl-btn gl-btn-light" onClick={() => book()}>Записаться на осмотр <ArrowRight size={18} weight="bold" /></button>
          </Reveal>
        </section>
      </main>
      <footer className="gl-foot">«Глянец», детейлинг-студия · Демо-сайт, студия вымышленная</footer>
      <ChatWidget startOpen={startOpen} request={request} />
    </div>
  )
}

// Первый экран: по лаку проходит блик — сразу при загрузке, а дальше вслед за прокруткой
function Hero({ onBook }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const y = useTransform(scrollYProgress, [0, 1], [0, 90])
  const sweep = useMotionValue(-40)
  const sweepX = useTransform(sweep, (v) => `${v}%`)

  useEffect(() => {
    if (reduce) return
    const c = animate(sweep, 140, { duration: 2.2, delay: 0.5, ease: [0.45, 0, 0.2, 1] })
    return () => c.stop()
  }, [reduce, sweep])
  useMotionValueEvent(scrollYProgress, 'change', (p) => { if (!reduce) sweep.set(-40 + p * 220) })

  const words = ['Блеск,', 'как', 'с завода']
  return (
    <section className="gl-hero" ref={ref}>
      <div className="gl-hero-media">
        <motion.img src={hero} alt="Чёрный седан после полировки в студии" style={reduce ? undefined : { scale, y }} />
        {!reduce && <motion.i className="gl-sweep" style={{ x: sweepX }} aria-hidden="true" />}
      </div>
      <div className="gl-hero-copy">
        <motion.p className="gl-kicker" initial={reduce ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease }}>
          Детейлинг-студия в Казани
        </motion.p>
        <h1>
          {words.map((w, i) => (
            <motion.span key={w} className={i === 2 ? 'gl-red' : undefined}
              initial={reduce ? false : { opacity: 0, y: '0.5em', skewX: -8 }} animate={{ opacity: 1, y: 0, skewX: 0 }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease }}>
              {w}{' '}
            </motion.span>
          ))}
        </h1>
        <motion.p className="gl-lead" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease }}>
          Полировка, керамика, бронеплёнка и химчистка. Гарантия на керамику до 3 лет.
        </motion.p>
        <motion.div className="gl-cta" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55, ease }}>
          <a href="#calc" className="gl-btn">Рассчитать стоимость <ArrowRight size={18} weight="bold" /></a>
          <button className="gl-btn gl-btn-ghost" onClick={() => onBook()}>Записаться</button>
        </motion.div>
      </div>
    </section>
  )
}

// «До и после»: одно фото, «до» сделано фильтрами и слоем пыли, поэтому кадры совпадают точно
function BeforeAfter() {
  const box = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(box, { once: true, amount: 0.5 })
  const [pos, setPos] = useState(50)
  const drag = useRef(false)
  const touched = useRef(false)

  // Подсказка при первом показе: ползунок сам качается туда-обратно
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(50, [50, 22, 78, 50], { duration: 2.4, ease: 'easeInOut', onUpdate: (v) => { if (!touched.current) setPos(v) } })
    return () => c.stop()
  }, [inView, reduce])

  function moveTo(clientX) {
    const r = box.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  function down(e) {
    touched.current = true
    drag.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    moveTo(e.clientX)
  }
  function key(e) {
    const step = e.shiftKey ? 10 : 4
    if (e.key === 'ArrowLeft') { touched.current = true; setPos((p) => Math.max(0, p - step)); e.preventDefault() }
    if (e.key === 'ArrowRight') { touched.current = true; setPos((p) => Math.min(100, p + step)); e.preventDefault() }
  }

  return (
    <section className="gl-before" id="before">
      <Reveal className="gl-head">
        <h2>До и после</h2>
        <p>Потяните ползунок: та же машина до полировки и керамики.</p>
      </Reveal>
      <Reveal>
        <div
          ref={box}
          className="ba"
          onPointerDown={down}
          onPointerMove={(e) => drag.current && moveTo(e.clientX)}
          onPointerUp={() => { drag.current = false }}
          onPointerCancel={() => { drag.current = false }}
        >
          <img className="ba-img ba-before" src={hero} alt="Кузов до работ: тусклый лак, пыль и разводы" draggable="false" />
          <i className="ba-dust" aria-hidden="true" />
          <div className="ba-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <img className="ba-img" src={hero} alt="Кузов после полировки и керамики" draggable="false" />
          </div>
          <span className="ba-tag ba-tag-l">До</span>
          <span className="ba-tag ba-tag-r">После</span>
          <div className="ba-line" style={{ left: `${pos}%` }}>
            <button
              className="ba-knob"
              role="slider"
              aria-label="Сравнить до и после"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              onKeyDown={key}
            >
              <ArrowsHorizontal size={20} weight="bold" />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Services() {
  return (
    <section className="gl-services" id="services">
      <Reveal className="gl-head"><h2>Услуги</h2></Reveal>
      <div className="gl-bento">
        {SERVICES.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.06} className={`gl-svc gl-svc-${s.id}`}>
            <img src={s.img} alt="" loading="lazy" />
            <div className="gl-svc-body">
              <h3>{s.name}</h3>
              <p>{s.text}</p>
              <div className="gl-svc-meta"><b>{s.price}</b><span>{s.time}</span></div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Calculator({ onBook }) {
  const [cls, setCls] = useState('m')
  const [picked, setPicked] = useState(() => new Set(['polish', 'ceramic']))
  const k = CLASSES.find((c) => c.id === cls).k
  const items = CALC.filter((c) => picked.has(c.id))
  const total = items.reduce((s, c) => s + round500(c.base * k), 0)
  const days = items.reduce((s, c) => s + c.days, 0)
  const toggle = (id) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const plural = (n) => (n === 1 ? 'дня' : 'дней') // «срок от 1 дня», «от 4 дней»

  return (
    <section className="gl-calc" id="calc">
      <Reveal className="gl-head">
        <h2>Сколько стоит</h2>
        <p>Выберите машину и услуги. Точную цену назовём после бесплатного осмотра.</p>
      </Reveal>
      <div className="gl-calc-grid">
        <Reveal className="gl-calc-form">
          <fieldset>
            <legend>Машина</legend>
            <div className="gl-seg">
              {CLASSES.map((c) => (
                <button key={c.id} type="button" className={cls === c.id ? 'is-on' : ''} aria-pressed={cls === c.id} onClick={() => setCls(c.id)}>{c.name}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Услуги</legend>
            <div className="gl-opts">
              {CALC.map((c) => (
                <label key={c.id} className={`gl-opt ${picked.has(c.id) ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
                  <span className="gl-check" aria-hidden="true"><Check size={14} weight="bold" /></span>
                  <span className="gl-opt-name">{c.name}</span>
                  <span className="gl-opt-price">{rub(round500(c.base * k))}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Reveal>
        <Reveal className="gl-total" delay={0.1}>
          <span className="gl-total-label">Примерно</span>
          <Odometer className="gl-total-sum" value={rub(total)} key={total} />
          <span className="gl-total-days">{items.length ? `Срок от ${days} ${plural(days)}` : 'Выберите хотя бы одну услугу'}</span>
          <button className="gl-btn gl-btn-light" onClick={() => onBook(`Хочу записаться: ${items.map((c) => c.name.toLowerCase()).join(', ') || 'осмотр'}`)} disabled={!items.length}>
            Записаться на осмотр <ArrowRight size={18} weight="bold" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Landing /></StrictMode>)
