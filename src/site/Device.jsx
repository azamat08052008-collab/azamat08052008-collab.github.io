import { CellSignalFull } from '@phosphor-icons/react/dist/csr/CellSignalFull'
import { WifiHigh } from '@phosphor-icons/react/dist/csr/WifiHigh'
import { BatteryFull } from '@phosphor-icons/react/dist/csr/BatteryFull'

// Рамки устройств с живым демо внутри. Демо рендерится в настоящем размере экрана и уменьшается под рамку.
const SIZES = {
  browser: { w: 1280, h: 800 },
  phone: { w: 390, h: 844 },
}

export function Screen({ kind, src, title, width, active = true, scroll = true, onLoad }) {
  const { w, h } = SIZES[kind]
  const scale = width / w
  return (
    <iframe
      className="dv-frame"
      src={src}
      title={title}
      loading="lazy"
      scrolling={scroll ? undefined : 'no'}
      tabIndex={active ? 0 : -1}
      aria-hidden={!active}
      onLoad={onLoad}
      style={{ width: w, height: h, transform: `scale(${scale})` }}
    />
  )
}

export const deviceHeight = (kind, width) => Math.round((SIZES[kind].h * width) / SIZES[kind].w)

// Строка состояния телефона: без неё шапка демо упирается в скруглённый угол рамки.
// Цвет совпадает с фоном шапки демо, чтобы строка не читалась отдельной полосой.
export const STATUS = 30
export function StatusBar({ tint, dark, style }) {
  return (
    <div className={`dv-status ${dark ? 'is-dark' : ''}`} style={{ background: tint, ...style }} aria-hidden="true">
      <span>9:41</span>
      <i className="dv-island" />
      <span className="dv-icons"><CellSignalFull size={13} weight="fill" /><WifiHigh size={13} weight="bold" /><BatteryFull size={18} weight="fill" /></span>
    </div>
  )
}

// На сенсорных экранах поверх демо: открывает его на весь экран (DemoSheet)
export function TryButton({ title, onTry }) {
  return <button type="button" className="dv-open" onClick={onTry} aria-label={`Попробовать: ${title}`}><span>Попробовать</span></button>
}

// Одиночное устройство: в первом экране и в мобильной версии витрины.
export function Device({ kind, src, title, width, label, tint, dark, onTry }) {
  const phone = kind === 'phone'
  const h = deviceHeight(kind, width)
  return (
    <div className={`dv dv-${kind}`} style={{ width: width + (phone ? 20 : 0) }}>
      {kind === 'browser' && <div className="dv-bar"><i /><i /><i /><span>{label}</span></div>}
      <div className="dv-screen" style={{ width, height: h + (phone ? STATUS : 0) }}>
        {phone && <StatusBar tint={tint} dark={dark} />}
        <div className="dv-viewport" style={{ top: phone ? STATUS : 0 }}>
          <Screen kind={kind} src={src} title={title} width={width} />
        </div>
        <TryButton title={title} onTry={onTry} />
      </div>
    </div>
  )
}
