import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { TelegramLogo } from '@phosphor-icons/react/dist/csr/TelegramLogo'
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple'
import Hero from './Hero'
import Showcase from './Showcase'
import { PRICES, TG, EMAIL } from './data'

const ease = [0.16, 1, 0.3, 1]

function Reveal({ children, className, delay = 0 }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  )
}

export default function App() {
  return (
    <>
      <nav className="nav">
        <a href="#top" className="logo">Азамат Назмутдинов</a>
        <div className="nav-links">
          <a href="#work">Примеры</a>
          <a href="#price">Цены</a>
          <a href="#terms">Условия</a>
        </div>
        <a className="btn btn-primary btn-sm" href={TG} target="_blank" rel="noreferrer" aria-label="Написать в Telegram">
          <TelegramLogo size={18} weight="fill" /><span className="nav-cta-text">Написать в Telegram</span>
        </a>
      </nav>
      <main id="top">
        <Hero />
        <Showcase />
        <Prices />
        <Terms />
        <Final />
      </main>
      <footer className="footer">
        <span>Азамат Назмутдинов, разработчик</span>
        <a href={TG} target="_blank" rel="noreferrer">@galossn</a>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <span className="footer-note">Цены действуют с сентября 2026</span>
      </footer>
    </>
  )
}

function Prices() {
  const reduce = useReducedMotion()
  const [tab, setTab] = useState(0)
  return (
    <section className="prices" id="price">
      <Reveal>
        <h2 className="h2">Цены</h2>
        <p className="lead">Стартовые. Точную цену считаю после короткого разговора о задаче и присылаю смету по этапам.</p>
      </Reveal>
      <div className="pr-tabs" role="tablist">
        {PRICES.map((g, i) => (
          <button key={g.group} role="tab" aria-selected={tab === i} className={tab === i ? 'is-on' : ''} onClick={() => setTab(i)}>
            {tab === i && <motion.span layoutId="pr-tab" className="pr-tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="pr-tab-label">{g.group}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="pr-grid"
          role="tabpanel"
          initial={reduce ? false : 'hide'}
          animate="show"
          exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {PRICES[tab].rows.map(([name, desc, term, price]) => (
            <motion.div key={name} className="pr-card" variants={{ hide: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }}>
              <h3>{name}</h3>
              <p>{desc}</p>
              <div className="pr-foot">
                <span className="pr-term">{term}</span>
                <span className="mono pr-price">{price}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function Terms() {
  return (
    <section className="terms" id="terms">
      <Reveal className="terms-main">
        <h2 className="h2">Расчёт по вашей задаче бесплатно</h2>
        <p className="lead">Пишете, что нужно. Задаю вопросы, присылаю смету и срок, обычно в тот же день.</p>
        <div className="terms-incl">
          <h3>Входит в стоимость</h3>
          <ul>
            <li>Адаптив под телефон и планшет</li>
            <li>Подключение домена и хостинга</li>
            <li>Яндекс Метрика</li>
            <li>Инструкция по управлению</li>
            <li>Две недели правок после запуска</li>
          </ul>
        </div>
      </Reveal>
      <div className="terms-cards">
        <Reveal className="tc tc-accent" delay={0.05}>
          <span className="mono">50%</span>
          <h3>Оплата</h3>
          <p>Предоплата половины, остаток после приёмки. Крупные проекты по этапам.</p>
        </Reveal>
        <Reveal className="tc" delay={0.12}>
          <span className="mono">Срок</span>
          <h3>Фиксирую до старта</h3>
          <p>Считается в рабочих днях с момента, когда получены материалы.</p>
        </Reveal>
        <Reveal className="tc" delay={0.19}>
          <span className="mono">Ваше</span>
          <h3>Исходники и доступы</h3>
          <p>Код, доступы к хостингу и админке передаю вам. Вы не привязаны ко мне.</p>
        </Reveal>
      </div>
    </section>
  )
}

function Final() {
  return (
    <section className="final">
      <Reveal>
        <h2 className="final-title">Опишите задачу, посчитаю цену</h2>
        <p className="lead">Ответ с вопросами, оценкой и сроком обычно в тот же день.</p>
        <div className="final-cta">
          <a className="btn btn-light btn-lg" href={TG} target="_blank" rel="noreferrer"><TelegramLogo size={22} weight="fill" /> Написать в Telegram</a>
          <a className="final-mail" href={`mailto:${EMAIL}`}><EnvelopeSimple size={18} /> {EMAIL}</a>
        </div>
      </Reveal>
    </section>
  )
}
