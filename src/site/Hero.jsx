import { useEffect, useRef, useState } from 'react'
import { motion, animate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo'
import { ArrowDown } from '@phosphor-icons/react/dist/csr/ArrowDown'
import { TG, WA } from './data'
import { useMedia, morph } from './hooks'
import landing from '../assets/img/shots/landing.jpg'
import bot from '../assets/img/shots/bot.jpg'

// Первый экран — «от макета до запуска» буквально. Слева заголовок, справа сайт собирается на глазах:
// каркас из линий → сканер проявляет готовую страницу → рядом встаёт телефон с ботом и приходит заявка.
// На компьютере сборку ведёт прокрутка (экран закреплён), на телефоне она проигрывается сама.
// Заголовок собирается вместе с сайтом: у Commissioner растут оси «раструб» и «объём».
const STEPS = [
  ['Макет', 0],
  ['Вёрстка', 0.18],
  ['Запуск', 0.62],
]

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const pinned = useMedia('(min-width: 900px)') && !reduce
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Одна шкала сборки 0→1: на компьютере от прокрутки, на телефоне по времени
  const p = useMotionValue(reduce ? 1 : 0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => { if (pinned) p.set(v) })
  useEffect(() => {
    if (reduce) { p.set(1); return }
    if (pinned) { p.set(scrollYProgress.get()); return }
    p.set(0)
    const c = animate(p, 1, { duration: 4.2, delay: 0.9, ease: [0.45, 0, 0.25, 1] })
    return () => c.stop()
  }, [pinned, reduce])

  const [step, setStep] = useState(reduce ? 2 : 0)
  useMotionValueEvent(p, 'change', (v) => setStep(STEPS.reduce((s, [, at], i) => (v >= at ? i : s), 0)))

  const font = useTransform(p, [0, 0.7], [0, 1])
  const fvs = useTransform(font, morph)
  const reveal = useTransform(p, [0.14, 0.52], [100, 0])
  const clip = useTransform(reveal, (v) => `inset(0 ${v}% 0 0)`)
  const scanX = useTransform(reveal, (v) => `${100 - v}%`)
  const scanOn = useTransform(p, [0.12, 0.16, 0.5, 0.54], [0, 1, 1, 0])
  const tiltX = useTransform(p, [0, 0.5], [24, 0])
  const tiltY = useTransform(p, [0, 0.5, 1], [-10, 0, -6])
  const lift = useTransform(p, [0, 0.5], [0.9, 1])
  const phoneY = useTransform(p, [0.54, 0.74], ['115%', '0%'])
  const phoneR = useTransform(p, [0.54, 0.74], [10, -4])
  const phoneO = useTransform(p, [0.52, 0.6], [0, 1])
  const toastO = useTransform(p, [0.8, 0.86], [0, 1])
  const toastY = useTransform(p, [0.8, 0.88], [16, 0])
  const fill = useTransform(p, [0, 0.92], [0, 1])

  return (
    <section className={`hero ${pinned ? 'is-pinned' : ''}`} ref={ref}>
      <div className="hero-pin">
        <motion.div className="hero-copy" initial={reduce ? false : 'hide'} animate="show" variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}>
          <motion.p variants={rise} className="hero-who">Привет, я Азамат, разработчик</motion.p>
          <motion.h1 variants={rise} style={{ fontVariationSettings: fvs }}>Сайты, боты и&nbsp;приложения</motion.h1>
          <motion.p variants={rise} className="hero-sub">Под ключ для малого бизнеса, от макета до запуска. Листайте ниже: всё работает по-настоящему.</motion.p>
          <motion.div variants={rise} className="hero-cta">
            <a className="btn btn-primary" href="#work">Смотреть примеры <ArrowDown size={18} weight="bold" /></a>
            <span className="hero-msg">
              <a className="btn btn-ghost" href={TG} target="_blank" rel="noreferrer"><TelegramLogo size={20} weight="fill" /> Telegram</a>
              <a className="btn btn-ghost" href={WA} target="_blank" rel="noreferrer"><WhatsappLogo size={20} weight="fill" className="wa-ico" /> WhatsApp</a>
            </span>
          </motion.div>
          <motion.ol variants={rise} className="hero-steps" aria-label="Этапы работы">
            {STEPS.map(([t], i) => <li key={t} className={i <= step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>{t}</li>)}
            <motion.i className="hero-steps-fill" style={{ scaleX: fill }} aria-hidden="true" />
          </motion.ol>
        </motion.div>

        <div className="build" aria-hidden="true">
          <motion.div className="build-board" style={{ rotateX: tiltX, rotateY: tiltY, scale: lift }}>
            <div className="build-bar"><i /><i /><i /><span>Детейлинг-студия «Глянец»</span></div>
            <div className="build-page">
              <Wireframe />
              <motion.img className="build-shot" src={landing} alt="" style={{ clipPath: clip }} draggable="false" />
              <motion.span className="build-scan" style={{ left: scanX, opacity: scanOn }} />
              <span className="build-note n-h1">Заголовок</span>
              <span className="build-note n-img">Фото</span>
              <span className="build-note n-btn">Кнопка заявки</span>
            </div>
          </motion.div>
          <motion.div className="build-phone" style={{ y: phoneY, rotate: phoneR, opacity: phoneO }}>
            <img src={bot} alt="" draggable="false" />
          </motion.div>
          <motion.div className="build-toast" style={{ opacity: toastO, y: toastY }}>
            <TelegramLogo size={18} weight="fill" />
            <span><b>Новая заявка</b>с сайта, 13:20</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const rise = { hide: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }

// Каркас страницы «Глянца» в координатах снимка 1280×800: линии чертятся при загрузке
function Wireframe() {
  return (
    <svg className="wire" viewBox="0 0 1280 800" preserveAspectRatio="none">
      <line x1="0" y1="68" x2="1280" y2="68" pathLength="1" />
      <rect x="32" y="20" width="100" height="28" rx="4" pathLength="1" />
      <rect x="846" y="27" width="46" height="12" rx="6" className="wire-fill" />
      <rect x="918" y="27" width="72" height="12" rx="6" className="wire-fill" />
      <rect x="1018" y="27" width="84" height="12" rx="6" className="wire-fill" />
      <rect x="1134" y="12" width="114" height="44" rx="10" pathLength="1" />
      <rect x="77" y="146" width="220" height="12" rx="6" className="wire-fill" />
      <rect x="77" y="184" width="486" height="94" rx="6" pathLength="1" />
      <rect x="77" y="294" width="412" height="94" rx="6" pathLength="1" />
      <rect x="77" y="422" width="310" height="14" rx="7" className="wire-fill" />
      <rect x="77" y="452" width="320" height="14" rx="7" className="wire-fill" />
      <rect x="77" y="482" width="60" height="14" rx="7" className="wire-fill" />
      <rect x="77" y="532" width="232" height="54" rx="10" pathLength="1" />
      <rect x="322" y="532" width="130" height="54" rx="10" pathLength="1" />
      <rect x="478" y="350" width="700" height="370" rx="8" pathLength="1" />
      <line x1="478" y1="350" x2="1178" y2="720" pathLength="1" />
      <line x1="1178" y1="350" x2="478" y2="720" pathLength="1" />
      <circle cx="1226" cy="746" r="32" pathLength="1" />
    </svg>
  )
}
