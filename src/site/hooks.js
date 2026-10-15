import { useEffect, useState } from 'react'

export function useMedia(q) {
  const [on, setOn] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const sync = () => setOn(m.matches)
    sync()
    m.addEventListener('change', sync)
    return () => m.removeEventListener('change', sync)
  }, [q])
  return on
}

export function useViewport() {
  const get = () => ({ w: innerWidth, h: innerHeight })
  const [v, setV] = useState(get)
  useEffect(() => {
    const on = () => setV(get())
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return v
}

// Заголовки на Commissioner: t = 0 — ровный гротеск «как в макете», t = 1 — с раструбами и контрастом
export const morph = (t) => `"wght" ${Math.round(480 + 260 * t)}, "FLAR" ${Math.round(100 * t)}, "VOLM" ${Math.round(100 * t)}`
