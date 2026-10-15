import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import '@fontsource/spectral/500.css'
import '@fontsource-variable/commissioner'
import './landing.css'
import meditate from '../assets/img/prana/meditate.webp'
import group from '../assets/img/prana/group.webp'

// Демо лендинга вымышленной йога-студии «Прана» (та же студия, что у демо ИИ-помощника).
const ease = [0.16, 1, 0.3, 1]

const CLASSES = [
  { name: 'Йога для начинающих', text: 'Базовые позы, дыхание и честная нагрузка. Начать с нуля можно здесь.', level: 'с нуля', time: '60 минут' },
  { name: 'Здоровая спина', text: 'Мягкое вытяжение и укрепление. Для тех, кто много сидит.', level: 'мягко', time: '75 минут' },
  { name: 'Хатха-йога', text: 'Классическая практика в спокойном темпе с удержанием поз.', level: 'средний', time: '90 минут' },
  { name: 'Йога для беременных', text: 'Отдельная группа, безопасные позы, дыхание для родов.', level: 'бережно', time: '60 минут' },
]

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEK = [
  [['08:00', 'Хатха'], ['19:00', 'Спина']],
  [['19:00', 'Начинающие'], ['20:30', 'Хатха']],
  [['08:00', 'Хатха'], ['19:00', 'Беременные']],
  [['19:00', 'Начинающие'], ['20:30', 'Спина']],
  [['08:00', 'Хатха'], ['19:00', 'Спина']],
  [['11:00', 'Начинающие'], ['13:00', 'Беременные']],
  [['11:00', 'Хатха'], ['13:00', 'Спина']],
]

const PRICES = [
  { name: 'Разовое', price: '700 ₽', note: 'Одно занятие в любой группе' },
  { name: '8 занятий', price: '4 800 ₽', note: '600 ₽ за занятие, действует 6 недель', best: true },
  { name: 'Безлимит', price: '6 900 ₽', note: 'Сколько угодно занятий в месяц' },
]

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
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const photoY = useTransform(scrollY, [0, 700], [0, 80])
  const [toast, setToast] = useState(false)
  const today = (new Date().getDay() + 6) % 7

  function book(e) {
    e.preventDefault()
    setToast(true)
    setTimeout(() => setToast(false), 3200)
  }

  return (
    <div className="pl">
      <header className="pl-nav">
        <a href="#top" className="pl-logo"><i className="pl-orb" aria-hidden="true" />Прана</a>
        <nav className="pl-links">
          <a href="#classes">Направления</a>
          <a href="#schedule">Расписание</a>
          <a href="#prices">Цены</a>
        </nav>
        <a href="#book" className="pl-btn pl-btn-sm" onClick={book}>Записаться</a>
      </header>

      <main id="top">
        <section className="pl-hero">
          <motion.div className="pl-hero-copy" initial={reduce ? false : 'hide'} animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}>
            <motion.p className="pl-kicker" variants={up}>Йога-студия в центре Казани</motion.p>
            <motion.h1 variants={up}>Место, где можно выдохнуть</motion.h1>
            <motion.p className="pl-lead" variants={up}>Небольшие группы до 8 человек, мягкие классы для новичков и спины. Первое занятие бесплатно.</motion.p>
            <motion.div className="pl-cta" variants={up}>
              <a href="#book" className="pl-btn" onClick={book}>Записаться на пробное <ArrowRight size={18} weight="bold" /></a>
              <a href="#schedule" className="pl-btn pl-btn-ghost">Расписание</a>
            </motion.div>
          </motion.div>

          <div className="pl-hero-art">
            <motion.div className="pl-arch" initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease }}>
              <motion.img src={meditate} alt="Медитация в зале студии" style={reduce ? undefined : { y: photoY, scale: 1.12 }} />
            </motion.div>
            <i className="pl-hero-orb" aria-hidden="true" />
            <motion.div className="pl-chip" initial={reduce ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease, delay: 0.6 }}>
              <span className="pl-chip-time">{DAYS[today]} · 19:00</span>
              <b>Йога для начинающих</b>
              <span>Осталось 3 места</span>
            </motion.div>
          </div>
        </section>

        <ul className="pl-facts">
          <li>Группы до 8 человек</li>
          <li>Коврики, блоки и пледы есть в зале</li>
          <li>Душ и бесплатная парковка</li>
        </ul>

        <section className="pl-classes" id="classes">
          <Reveal className="pl-classes-photo"><img src={group} alt="Групповое занятие в студии" loading="lazy" /></Reveal>
          <div>
            <Reveal><h2>Направления</h2></Reveal>
            <ul className="pl-list">
              {CLASSES.map((c, i) => (
                <Reveal key={c.name} delay={i * 0.06}>
                  <li className="pl-item">
                    <div>
                      <h3>{c.name}</h3>
                      <p>{c.text}</p>
                    </div>
                    <div className="pl-item-meta"><span>{c.level}</span><span>{c.time}</span></div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="pl-schedule" id="schedule">
          <Reveal><h2>Расписание на неделю</h2></Reveal>
          <Reveal className="pl-week" delay={0.1}>
            {DAYS.map((d, i) => (
              <div key={d} className={`pl-day ${i === today ? 'is-today' : ''}`}>
                <div className="pl-day-name">{d}{i === today && <small>сегодня</small>}</div>
                {WEEK[i].map(([t, n]) => <div key={t} className="pl-slot"><b>{t}</b>{n}</div>)}
              </div>
            ))}
          </Reveal>
        </section>

        <section className="pl-prices" id="prices">
          <Reveal><h2>Цены</h2></Reveal>
          <div className="pl-tiers">
            {PRICES.map((p, i) => (
              <Reveal key={p.name} className={`pl-tier ${p.best ? 'is-best' : ''}`} delay={i * 0.08}>
                {p.best && <span className="pl-best">Выгоднее всего</span>}
                <h3>{p.name}</h3>
                <div className="pl-price">{p.price}</div>
                <p>{p.note}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="pl-final" id="book">
          <div className="pl-aura" aria-hidden="true"><i /><i /></div>
          <Reveal>
            <h2>Первое занятие бесплатно</h2>
            <p>Приходите в удобную группу. Если остались вопросы, помощник студии ответит прямо сейчас.</p>
            <div className="pl-cta pl-cta-center">
              <a href="#book" className="pl-btn" onClick={book}><TelegramLogo size={20} weight="fill" /> Записаться в Telegram</a>
              <a href="../ai/" className="pl-btn pl-btn-ghost"><Sparkle size={18} weight="fill" /> Спросить помощника</a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="pl-foot">Прана, йога-студия · Казань, центр · Демо-сайт, студия вымышленная</footer>

      <AnimatePresence>
        {toast && (
          <motion.div className="pl-toast" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            Это демо: на настоящем сайте здесь откроется чат студии в Telegram
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const up = { hide: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }

createRoot(document.getElementById('root')).render(<StrictMode><Landing /></StrictMode>)
