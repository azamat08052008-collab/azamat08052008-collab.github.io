import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

// Цифры как на табло: каждая цифра — колонка 0–9 дважды, при появлении на экране колонка
// прокручивается на полный круг и останавливается на своей цифре. Правые цифры крутятся дольше.
const STRIP = '01234567890123456789'.split('')

export default function Odometer({ value, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const reduce = useReducedMotion()
  let k = 0

  return (
    <span ref={ref} className={`odo ${className}`} aria-label={value} role="text">
      {[...value].map((ch, i) => {
        // пробел внутри флекс-строки схлопывается, поэтому ставим неразрывный
        if (!/\d/.test(ch)) return <span key={i} aria-hidden="true">{ch === ' ' ? '\u00a0' : ch}</span>
        const target = `${-(10 + Number(ch)) * 5}%`
        const order = k++
        return (
          <span key={i} className="odo-col" aria-hidden="true">
            <motion.span
              className="odo-strip"
              initial={reduce ? { y: target } : { y: '0%' }}
              animate={{ y: inView || reduce ? target : '0%' }}
              transition={{ duration: reduce ? 0 : 1.1 + order * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              {STRIP.map((n, j) => <span key={j}>{n}</span>)}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}
