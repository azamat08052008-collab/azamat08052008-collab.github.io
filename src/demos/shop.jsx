import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Handbag } from '@phosphor-icons/react/dist/csr/Handbag'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { Minus } from '@phosphor-icons/react/dist/csr/Minus'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import '@fontsource/spectral/500.css'
import '@fontsource-variable/commissioner'
import './shop.css'
import mug from '../assets/img/shop/mug.webp'
import plate from '../assets/img/shop/plate.webp'
import vase from '../assets/img/shop/vase.webp'
import bowls from '../assets/img/shop/bowls.webp'
import teapot from '../assets/img/shop/teapot.webp'
import candle from '../assets/img/shop/candle.webp'
import hero from '../assets/img/shop/hero.webp'

// Демо интернет-магазина: вымышленная мастерская, оплата не проводится.
const PRODUCTS = [
  { id: 'mug', name: 'Кружка «Утро»', note: '350 мл, белая глазурь', price: 1400, left: 4, cat: 'table', img: mug },
  { id: 'plate', name: 'Тарелка «Шалфей»', note: 'Ø 26 см, обеденная', price: 1900, left: 6, cat: 'table', img: plate },
  { id: 'teapot', name: 'Чайник «Графит»', note: '700 мл, бамбуковая ручка', price: 4800, left: 1, cat: 'tea', img: teapot },
  { id: 'bowls', name: 'Пиалы «Песок», пара', note: '2 × 150 мл', price: 2200, left: 3, cat: 'tea', img: bowls },
  { id: 'vase', name: 'Ваза «Капля»', note: 'Высота 16 см', price: 2600, left: 2, cat: 'decor', img: vase },
  { id: 'candle', name: 'Свеча в керамике', note: 'Соевый воск, 40 часов', price: 1300, left: 9, cat: 'decor', img: candle },
]
const CATS = [['all', 'Всё'], ['table', 'Посуда'], ['tea', 'Для чая'], ['decor', 'Декор']]
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽'
const ease = [0.16, 1, 0.3, 1]

function Shop() {
  const reduce = useReducedMotion()
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState({})
  const [open, setOpen] = useState(false)
  const [delivery, setDelivery] = useState('pickup')
  const [step, setStep] = useState('cart') // cart | paying | paid
  const [orderNo, setOrderNo] = useState(0)
  const [flights, setFlights] = useState([])
  const [bump, setBump] = useState(0)
  const bag = useRef(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 90])

  // Товар «летит» в корзину: копия фото из карточки уменьшается и падает в иконку сумки
  function addFromCard(p, e) {
    add(p.id)
    if (reduce) return
    const img = e.currentTarget.closest('.s-card').querySelector('img').getBoundingClientRect()
    const to = bag.current.getBoundingClientRect()
    const id = Date.now() + Math.random()
    setFlights((f) => [...f, { id, src: p.img, x: img.left, y: img.top, w: img.width, tx: to.left + to.width / 2 - 14, ty: to.top + to.height / 2 - 14 }])
  }
  function landed(id) {
    setFlights((f) => f.filter((x) => x.id !== id))
    setBump((b) => b + 1)
  }

  const add = (id, d = 1) => step !== 'paying' && setCart((c) => {
    const q = Math.max(0, Math.min(PRODUCTS.find((p) => p.id === id).left, (c[id] || 0) + d))
    const next = { ...c }
    if (q) next[id] = q; else delete next[id]
    return next
  })
  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }))
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const goods = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const ship = delivery === 'courier' ? 300 : 0
  const list = PRODUCTS.filter((p) => cat === 'all' || p.cat === cat)

  function pay() {
    setStep('paying')
    setTimeout(() => { setOrderNo(1040 + Math.floor(Math.random() * 50)); setCart({}); setStep('paid') }, 1400)
  }
  function close() {
    if (step === 'paying') return
    setOpen(false)
    if (step === 'paid') setStep('cart')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  return (
    <div className="s">
      <header className="s-head">
        <div className="s-logo">Глина</div>
        <nav className="s-cats">
          {CATS.map(([k, label]) => (
            <button key={k} className={`s-cat ${cat === k ? 'is-on' : ''}`} onClick={() => setCat(k)}>
              {cat === k && <motion.span layoutId="cat" className="s-cat-bg" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="s-cat-label">{label}</span>
            </button>
          ))}
        </nav>
        <motion.button
          ref={bag}
          key={bump}
          className="s-bag"
          onClick={() => setOpen(true)}
          aria-label={`Корзина, товаров: ${count}`}
          initial={bump && !reduce ? { scale: 1.22 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <Handbag size={22} />
          <AnimatePresence>
            {count > 0 && (
              <motion.span key={count} className="s-bag-n" initial={reduce ? false : { scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </header>

      <section className="s-hero">
        <motion.img src={hero} alt="Посуда мастерской на столе у окна" style={reduce ? undefined : { y: heroY, scale: 1.12 }} />
        <motion.div className="s-hero-card" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.2 }}>
          <h1>Керамика ручной работы</h1>
          <p>Лепим и обжигаем малыми партиями. По Казани привезём завтра.</p>
        </motion.div>
      </section>

      <div className="s-marquee" aria-hidden="true">
        <div className="s-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>Лепим вручную <i /> Обжигаем малыми партиями <i /> Каждая вещь немного другая <i /> Привезём по Казани завтра <i /></span>
          ))}
        </div>
      </div>

      <motion.main className="s-grid" layout={!reduce}>
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.article
              key={p.id}
              layout={!reduce}
              className="s-card"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease }}
            >
              <div className="s-img"><img src={p.img} alt={p.name} loading="lazy" /></div>
              <div className="s-info">
                <h2>{p.name}</h2>
                <p>{p.note}</p>
                <div className="s-left">{p.left === 1 ? 'Последняя' : `Осталось ${p.left}`}</div>
              </div>
              <div className="s-buy">
                <span className="s-price">{rub(p.price)}</span>
                {cart[p.id] ? (
                  <div className="s-step">
                    <button onClick={() => add(p.id, -1)} aria-label={`Меньше: ${p.name}`}><Minus size={14} weight="bold" /></button>
                    <span>{cart[p.id]}</span>
                    <button onClick={() => add(p.id)} disabled={cart[p.id] >= p.left} aria-label={`Больше: ${p.name}`}><Plus size={14} weight="bold" /></button>
                  </div>
                ) : (
                  <motion.button whileTap={reduce ? undefined : { scale: 0.95 }} className="s-add" onClick={(e) => addFromCard(p, e)}>В корзину</motion.button>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.main>

      {flights.map((f) => (
        <motion.img
          key={f.id}
          src={f.src}
          alt=""
          className="s-fly"
          style={{ width: f.w, height: f.w, originX: 0, originY: 0 }}
          initial={{ x: f.x, y: f.y, scale: 1, opacity: 1 }}
          animate={{ x: f.tx, y: f.ty, scale: 28 / f.w, opacity: 0.7 }}
          transition={{ x: { duration: 0.7, ease: [0.6, 0, 0.3, 1] }, y: { duration: 0.7, ease: [0.4, -0.45, 0.7, 1] }, scale: { duration: 0.7, ease: [0.5, 0, 0.2, 1] }, opacity: { duration: 0.7 } }}
          onAnimationComplete={() => landed(f.id)}
        />
      ))}

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="s-backdrop" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              className="s-drawer" role="dialog" aria-modal="true" aria-label="Корзина"
              initial={reduce ? { opacity: 0 } : { x: '100%' }} animate={reduce ? { opacity: 1 } : { x: 0 }} exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            >
              <div className="s-drawer-head">
                <h2>{step === 'paid' ? 'Готово' : 'Корзина'}</h2>
                <button onClick={close} aria-label="Закрыть"><X size={20} /></button>
              </div>

              {step === 'paid' ? (
                <div className="s-paid">
                  <motion.div className="s-paid-mark" initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                    <Check size={30} weight="bold" />
                  </motion.div>
                  <h3>Заказ №{orderNo} оплачен</h3>
                  <p>Чек и время доставки придут в SMS. Это демо: деньги не списываются.</p>
                  <button className="s-btn" onClick={close}>Вернуться в магазин</button>
                </div>
              ) : lines.length === 0 ? (
                <p className="s-empty">Пока пусто. Добавьте что-нибудь из каталога.</p>
              ) : (
                <>
                  <div className="s-lines">
                    {lines.map((l) => (
                      <div key={l.id} className="s-line">
                        <img src={l.img} alt="" />
                        <div>
                          <div className="s-line-name">{l.name}</div>
                          <div className="s-line-sum">{l.qty} × {rub(l.price)}</div>
                        </div>
                        <div className="s-step s-step-sm">
                          <button onClick={() => add(l.id, -1)} aria-label={`Меньше: ${l.name}`}><Minus size={12} weight="bold" /></button>
                          <span>{l.qty}</span>
                          <button onClick={() => add(l.id)} disabled={l.qty >= l.left} aria-label={`Больше: ${l.name}`}><Plus size={12} weight="bold" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <fieldset className="s-ship">
                    <legend>Получение</legend>
                    <label><input type="radio" name="ship" checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} /> Самовывоз из мастерской, бесплатно</label>
                    <label><input type="radio" name="ship" checked={delivery === 'courier'} onChange={() => setDelivery('courier')} /> Курьер по Казани завтра, 300 ₽</label>
                  </fieldset>
                  <div className="s-total"><span>Итого</span><span>{rub(goods + ship)}</span></div>
                  <button className="s-btn" onClick={pay} disabled={step === 'paying'}>
                    {step === 'paying' ? 'Переходим к оплате…' : `Оплатить ${rub(goods + ship)}`}
                  </button>
                  <p className="s-note">Демо: оплата не проводится, данные карты не нужны.</p>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Shop /></StrictMode>)
