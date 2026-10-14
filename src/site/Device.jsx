// Рамки устройств с живым демо внутри. Демо рендерится в настоящем размере экрана и уменьшается под рамку.
const SIZES = {
  browser: { w: 1280, h: 800 },
  phone: { w: 390, h: 844 },
}

export function Screen({ kind, src, title, width, active = true, scroll = true }) {
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
      style={{ width: w, height: h, transform: `scale(${scale})` }}
    />
  )
}

export const deviceHeight = (kind, width) => Math.round((SIZES[kind].h * width) / SIZES[kind].w)

// Одиночное устройство: в первом экране и в мобильной версии витрины.
export function Device({ kind, src, title, width, label }) {
  const h = deviceHeight(kind, width)
  return (
    <div className={`dv dv-${kind}`} style={{ width: width + (kind === 'phone' ? 20 : 0) }}>
      {kind === 'browser' && <div className="dv-bar"><i /><i /><i /><span>{label}</span></div>}
      <div className="dv-screen" style={{ width, height: h }}>
        <Screen kind={kind} src={src} title={title} width={width} />
        <a className="dv-open" href={src} target="_blank" rel="noreferrer" aria-label={`Открыть демо: ${title}`}><span>Открыть демо</span></a>
      </div>
    </div>
  )
}
