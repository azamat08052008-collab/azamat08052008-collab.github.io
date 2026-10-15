import { useEffect, useRef } from 'react'
import { motion, animate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo'
import { ArrowDown } from '@phosphor-icons/react/dist/csr/ArrowDown'
import { WORK, TG, WA } from './data'
import landing from '../assets/img/shots/landing.jpg'
import shop from '../assets/img/shots/shop.jpg'
import admin from '../assets/img/shots/admin.jpg'
import bot from '../assets/img/shots/bot.jpg'
import ai from '../assets/img/shots/ai.jpg'
import qr from '../assets/img/shots/qr.jpg'

// Первый экран: снимки всех демо стоят дугой на внутренней стороне цилиндра и смотрят на зрителя.
// Веер покачивается сам и поворачивается за курсором; при прокрутке наклоняется и растворяется.
// Снимки обновляет scripts/shots.mjs, живые демо — в витрине ниже.
const SHOT = { landing, shop, admin, bot, ai, qr }
const ORDER = ['qr', 'landing', 'bot', 'shop', 'ai', 'admin']
const SIZE = { browser: [340, 212], phone: [168, 364] }
// QR-меню в витрине показано лендингом «Подачи», а в веере — меню глазами гостя на телефоне
const FAN_KIND = { qr: 'phone' }
const R = 1000 // радиус цилиндра, px
const GAP = 44

const cards = (() => {
  const items = ORDER.map((id) => WORK.find((w) => w.id === id))
  const total = items.reduce((s, w) => s + SIZE[FAN_KIND[w.id] || w.kind][0], 0) + GAP * (items.length - 1)
  let x = -total / 2
  return items.map((w, i) => {
    const kind = FAN_KIND[w.id] || w.kind
    const [cw, ch] = SIZE[kind]
    const center = x + cw / 2
    x += cw + GAP
    return { ...w, kind, i, cw, ch, angle: (center / R) * (180 / Math.PI) }
  })
})()

const ease = [0.16, 1, 0.3, 1]
const fadeUp = { hide: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  // Курсор: поворот и наклон веера с пружиной
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const turn = useSpring(useTransform(px, [-1, 1], [14, -14]), { stiffness: 70, damping: 18 })
  const tilt = useSpring(useTransform(py, [-1, 1], [-5, 5]), { stiffness: 70, damping: 18 })

  // Без курсора веер медленно покачивается
  const sway = useMotionValue(0)
  useEffect(() => {
    if (reduce) return
    const c = animate(sway, [-5, 5], { duration: 9, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' })
    return () => c.stop()
  }, [reduce, sway])

  // Прокрутка: веер наклоняется, приближается, уходит вверх и растворяется
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [0, 28])
  const rotateY = useTransform([sway, turn], ([a, b]) => a + b)
  const rotateX = useTransform([tilt, scrollTilt], ([a, b]) => a + b)
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.25])
  const y = useTransform(scrollYProgress, [0, 1], [0, -140])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const spread = useTransform(scrollYProgress, [0, 1], [0, 1])

  function onMove(e) {
    if (reduce || e.pointerType !== 'mouse') return
    px.set((e.clientX / innerWidth) * 2 - 1)
    py.set((e.clientY / innerHeight) * 2 - 1)
  }

  return (
    <section className="hero" ref={ref} onPointerMove={onMove} onPointerLeave={() => { px.set(0); py.set(0) }}>
      <motion.div className="fan-scene" style={reduce ? undefined : { y, scale, opacity }}>
        <div className="fan-fit">
          <motion.div className="fan" style={reduce ? { z: -R } : { z: -R, rotateY, rotateX }}>
            {cards.map((c) => <Card key={c.id} c={c} spread={spread} reduce={reduce} />)}
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="hero-copy" initial={reduce ? false : 'hide'} animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.45 } } }}>
        <motion.p variants={fadeUp} className="hero-who">Привет, я Азамат, разработчик</motion.p>
        <motion.h1 variants={fadeUp}>Сайты, боты и&nbsp;приложения</motion.h1>
        <motion.p variants={fadeUp} className="hero-sub">Под ключ для малого бизнеса, от макета до запуска. Нажмите на пример или листайте ниже: всё работает по-настоящему.</motion.p>
        <motion.div variants={fadeUp} className="hero-cta">
          <a className="btn btn-primary" href="#work">Смотреть примеры <ArrowDown size={18} weight="bold" /></a>
          <span className="hero-msg">
            <a className="btn btn-ghost" href={TG} target="_blank" rel="noreferrer"><TelegramLogo size={20} weight="fill" /> Telegram</a>
            <a className="btn btn-ghost" href={WA} target="_blank" rel="noreferrer"><WhatsappLogo size={20} weight="fill" className="wa-ico" /> WhatsApp</a>
          </span>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Card({ c, spread, reduce }) {
  // При прокрутке соседние карточки расходятся вверх и вниз
  const dy = useTransform(spread, [0, 1], [0, (c.i % 2 ? -1 : 1) * 90])
  return (
    <div className="fan-slot" style={{ width: c.cw, height: c.ch, marginLeft: -c.cw / 2, marginTop: -c.ch / 2, transform: `rotateY(${c.angle}deg) translateZ(${R}px)` }}>
      <motion.div className="fan-lift" style={reduce ? undefined : { y: dy }}>
      <motion.a
        href={`#w-${c.id}`}
        className={`fan-card fan-${c.kind}`}
        aria-label={`${c.title}: ${c.label}, ${c.price}`}
        initial={reduce ? false : { opacity: 0, y: 160, rotateX: 35 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.1 + c.i * 0.07 }}
        whileHover={reduce ? undefined : { z: 70, scale: 1.04, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
      >
        <img src={SHOT[c.id]} alt="" draggable="false" />
        <span className="fan-tag"><b>{c.title}</b>{c.price}</span>
      </motion.a>
      </motion.div>
    </div>
  )
}
