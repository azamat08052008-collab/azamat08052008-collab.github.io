import { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'
import { GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap'
import { SealCheck } from '@phosphor-icons/react/dist/csr/SealCheck'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import Hero from './Hero'
import Showcase from './Showcase'
import Odometer from './Odometer'
import { morph } from './hooks'
import { PRICES, TG, EMAIL, WA, WA_PHONE } from './data'

const ease = [0.16, 1, 0.3, 1]

function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  )
}

export default function App() {
  const { scrollYProgress } = useScroll()
  return (
    <>
      <nav className="nav">
        <a href="#top" className="logo">Азамат Назмутдинов</a>
        <div className="nav-links">
          <a href="#work">Примеры</a>
          <a href="#about">Обо мне</a>
          <a href="#price">Цены</a>
          <a href="#terms">Условия</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-ghost btn-sm btn-icon" href={WA} target="_blank" rel="noreferrer" aria-label="Написать в WhatsApp">
            <WhatsappLogo size={20} weight="fill" className="wa-ico" />
          </a>
          <a className="btn btn-primary btn-sm" href={TG} target="_blank" rel="noreferrer" aria-label="Написать в Telegram">
            <TelegramLogo size={18} weight="fill" /><span className="nav-cta-text">Написать в Telegram</span>
          </a>
        </div>
        <motion.i className="nav-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      </nav>
      <main id="top">
        <Hero />
        <Showcase />
        <About />
        <Prices />
        <Terms />
        <Final />
      </main>
      <footer className="footer">
        <span>Азамат Назмутдинов, разработчик</span>
        <a href={TG} target="_blank" rel="noreferrer">Telegram @galossn</a>
        <a href={WA} target="_blank" rel="noreferrer">WhatsApp {WA_PHONE}</a>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <span className="footer-note">Цены действуют с сентября 2026</span>
      </footer>
    </>
  )
}

// Обо мне: только текст. Проекты — из заметок пользователя, без имён заказчиков
const STEPS = [
  ['Разбираю задачу', 'Короткая переписка или созвон. Задаю вопросы, чтобы понять, что нужно бизнесу, а не только сайту.'],
  ['Считаю', 'Присылаю смету по этапам и срок, который фиксирую до старта.'],
  ['Показываю по ходу', 'Вы видите промежуточные версии и правите их, а не ждёте финала вслепую.'],
  ['Передаю', 'Исходники, доступы к хостингу и инструкция остаются у вас.'],
]
const DONE = [
  'Сайт базы отдыха с видео на прокрутке',
  'Интернет-магазин цветов с админкой заказов',
  'Настольное приложение для руководителя сети АЗС',
  'QR-меню с заказом к столу для кафе-паба',
  'Telegram-бот для визажиста',
  'Сайт мебельной фабрики',
]

// Сертификаты: карточка ведёт на официальную страницу проверки, подлинность видна там
const CERTS = [
  { org: 'Anthropic', title: 'Claude Code in Action', text: 'Разработка вместе с ИИ-агентом Claude Code', url: 'https://verify.skilljar.com/c/cv7bw4hczeg2', tone: 'sage' },
  { org: 'Google · Coursera', title: 'AI for App Building', text: 'Создание приложений с помощью ИИ', date: 'август 2026', url: 'https://www.coursera.org/account/accomplishments/verify/DSEXFSUL66AX', tone: 'paper' },
]

function About() {
  return (
    <section className="about" id="about">
      <div className="about-top">
        <Reveal className="about-lead">
          <h2 className="h2">Делаю сам, от макета до запуска</h2>
          <p className="lead">Вы общаетесь напрямую с тем, кто пишет код: без менеджеров и испорченного телефона. Сайты, боты, интеграции с 1С и CRM, маркетплейсы.</p>
        </Reveal>
        <Reveal className="about-edu" delay={0.1}>
          <span className="about-edu-ico"><GraduationCap size={28} /></span>
          <b>Студент МЦК-КТИТС</b>
          <span>Казанский техникум информационных технологий и связи. Учусь на программиста-разработчика.</span>
        </Reveal>
      </div>
      <Steps />
      <div className="about-bottom">
        <div className="about-done">
          <Reveal><h3 className="about-h3">Что уже делал</h3></Reveal>
          <Reveal delay={0.05}>
            <ul>{DONE.map((t) => <li key={t}><Check size={18} weight="bold" />{t}</li>)}</ul>
          </Reveal>
        </div>
        <div className="about-certs">
          <Reveal><h3 className="about-h3">Сертификаты</h3></Reveal>
          <div className="certs">
            {CERTS.map((c, i) => <Cert key={c.url} c={c} i={i} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

// Как работаю — это последовательность, поэтому шкала: линия дорисовывается прокруткой и зажигает этапы
function Steps() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 55%'] })
  const [lit, setLit] = useState(reduce ? STEPS.length : 0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => { if (!reduce) setLit(Math.floor(v * STEPS.length + 0.15)) })
  return (
    <div className="steps" ref={ref}>
      <h3 className="about-h3">Как работаю</h3>
      <ol>
        <motion.i className="steps-line" style={{ scaleX: reduce ? 1 : scrollYProgress }} aria-hidden="true" />
        {STEPS.map(([t, d], i) => (
          <li key={t} className={i < lit ? 'is-lit' : ''}>
            <span className="steps-dot" aria-hidden="true">{i + 1}</span>
            <b>{t}</b>
            <span>{d}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Сертификат лежит на столе чуть повёрнутым и выравнивается, когда доезжает до середины экрана
function Cert({ c, i }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 60%'] })
  const rotate = useTransform(scrollYProgress, [0, 1], [i ? 5 : -6, i ? 1.2 : -1.2])
  const y = useTransform(scrollYProgress, [0, 1], [80, 0])
  return (
    <motion.a ref={ref} className={`cert cert-${c.tone}`} href={c.url} target="_blank" rel="noreferrer" style={reduce ? undefined : { rotate, y }}>
      <span className="cert-badge"><SealCheck size={18} weight="fill" /> Сертификат</span>
      <span className="cert-org">{c.org}</span>
      <b className="cert-title">{c.title}</b>
      <span className="cert-text">{c.text}{c.date ? `, ${c.date}` : ''}</span>
      <span className="cert-foot">
        <span className="cert-name">Azamat Nazmutdinov</span>
        <span className="cert-check">Проверить <ArrowUpRight size={14} weight="bold" /></span>
      </span>
    </motion.a>
  )
}

function Prices() {
  const reduce = useReducedMotion()
  const [tab, setTab] = useState(0)
  return (
    <section className="prices" id="price">
      <Reveal className="prices-head">
        <h2 className="h2">Цены</h2>
        <p className="lead">Стартовые. Точную цену считаю после короткого разговора о задаче и присылаю смету по этапам.</p>
      </Reveal>
      <div className="pr-tabs" role="tablist">
        {PRICES.map((g, i) => (
          <button key={g.group} role="tab" aria-selected={tab === i} className={tab === i ? 'is-on' : ''} onClick={() => setTab(i)}>
            <span className="pr-tab-label">{g.group}</span>
            {tab === i && <motion.span layoutId="pr-tab" className="pr-tab-mark" transition={{ type: 'spring', stiffness: 480, damping: 40 }} />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ul
          key={tab}
          className="pr-list"
          role="tabpanel"
          initial={reduce ? false : 'hide'}
          animate="show"
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {PRICES[tab].rows.map(([name, desc, term, price]) => (
            <motion.li key={name} className="pr-row" variants={row}>
              <h3>{name}</h3>
              <p>{desc}</p>
              <span className="pr-term">{term}</span>
              <Odometer className="pr-price" value={price} />
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  )
}

// Строка прайса выезжает из-под линейки сверху
const row = {
  hide: { opacity: 0, y: -18, clipPath: 'inset(0 0 100% 0)' },
  show: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.5, ease } },
}

function Terms() {
  return (
    <section className="terms" id="terms">
      <Reveal className="terms-main">
        <h2 className="h2">Расчёт по вашей задаче бесплатно</h2>
        <p className="lead">Пишете, что нужно. Задаю вопросы, присылаю смету и срок, обычно в тот же день.</p>
      </Reveal>
      <div className="terms-cols">
        <Reveal className="tc" delay={0.05}>
          <Odometer className="tc-big" value="50%" />
          <h3>Оплата</h3>
          <p>Предоплата половины, остаток после приёмки. Крупные проекты по этапам.</p>
        </Reveal>
        <Reveal className="tc" delay={0.12}>
          <span className="tc-big">Срок</span>
          <h3>Фиксирую до старта</h3>
          <p>Считается в рабочих днях с момента, когда получены материалы.</p>
        </Reveal>
        <Reveal className="tc" delay={0.19}>
          <span className="tc-big">Ваше</span>
          <h3>Исходники и доступы</h3>
          <p>Код, доступы к хостингу и админке передаю вам. Вы не привязаны ко мне.</p>
        </Reveal>
      </div>
      <Reveal className="terms-incl" delay={0.1}>
        <h3>Входит в стоимость</h3>
        <ul>
          <li><Check size={16} weight="bold" />Адаптив под телефон и планшет</li>
          <li><Check size={16} weight="bold" />Подключение домена и хостинга</li>
          <li><Check size={16} weight="bold" />Яндекс Метрика</li>
          <li><Check size={16} weight="bold" />Инструкция по управлению</li>
          <li><Check size={16} weight="bold" />Две недели правок после запуска</li>
        </ul>
      </Reveal>
    </section>
  )
}

// Финал: тёмно-зелёная полоса во всю ширину, заголовок «собирается» так же, как в первом экране
function Final() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 55%'] })
  const fvs = useTransform(scrollYProgress, (v) => morph(reduce ? 1 : v))
  return (
    <section className="final" ref={ref}>
      <motion.h2 className="final-title" style={{ fontVariationSettings: fvs }}>Опишите задачу, посчитаю цену</motion.h2>
      <Reveal>
        <p className="lead">Ответ с вопросами, оценкой и сроком обычно в тот же день.</p>
        <div className="final-cta">
          <a className="btn btn-mark btn-lg" href={TG} target="_blank" rel="noreferrer"><TelegramLogo size={22} weight="fill" /> Написать в Telegram</a>
          <a className="btn btn-outline-light btn-lg" href={WA} target="_blank" rel="noreferrer"><WhatsappLogo size={22} weight="fill" /> Написать в WhatsApp</a>
          <a className="final-mail" href={`mailto:${EMAIL}`}><EnvelopeSimple size={18} /> {EMAIL}</a>
        </div>
      </Reveal>
    </section>
  )
}
