import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X } from '@phosphor-icons/react/dist/csr/X'

// Демо на весь экран для сенсорных устройств: в маленькой рамке iframe перехватывал бы прокрутку
// страницы, поэтому там он «картинка», а попробовать по-настоящему можно здесь — в натуральную ширину.
export default function DemoSheet({ demo, onClose }) {
  const reduce = useReducedMotion()
  const close = useRef(null)

  useEffect(() => {
    if (!demo) return
    const y = scrollY
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    addEventListener('keydown', onKey)
    close.current?.focus()
    return () => {
      document.body.style.overflow = ''
      removeEventListener('keydown', onKey)
      scrollTo({ top: y, behavior: 'instant' })
    }
  }, [demo, onClose])

  return (
    <AnimatePresence>
      {demo && (
        <motion.div
          className="ds"
          role="dialog"
          aria-modal="true"
          aria-label={`Демо: ${demo.label}`}
          initial={reduce ? { opacity: 0 } : { y: '100%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        >
          <div className="ds-bar">
            <span className="ds-title">{demo.label}</span>
            <button ref={close} className="ds-close" onClick={onClose}><X size={18} weight="bold" /> Закрыть</button>
          </div>
          <iframe className="ds-frame" src={demo.src} title={`Демо: ${demo.label}`} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
