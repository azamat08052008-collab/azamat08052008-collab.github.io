// Общий справочник барбершопа для демо-бота и демо-админки. Записи бот кладёт в localStorage:
// обе страницы с одного адреса, поэтому хранилище общее, а событие storage сообщает админке о новой записи.
import artur from '../assets/img/britva/artur.webp'
import ildar from '../assets/img/britva/ildar.webp'

export const KEY = 'britva-bookings'

export const SERVICES = [
  { id: 'cut', name: 'Стрижка', price: 1200, min: 60 },
  { id: 'beard', name: 'Борода', price: 700, min: 30 },
  { id: 'combo', name: 'Стрижка и борода', price: 1700, min: 90 },
]
export const MASTERS = [
  { name: 'Артур', photo: artur, face: [73, 29], about: 'Фейды и машинка, 8 лет' },
  { name: 'Ильдар', photo: ildar, face: [65, 26], about: 'Бритьё и бороды, 5 лет' },
]
export const photoOf = (name) => MASTERS.find((m) => m.name === name)?.photo

// Круглая аватарка из кадра 3:4: увеличиваем фото вокруг лица и сдвигаем лицо в центр круга.
// Сдвиг в процентах от размеров картинки: центр квадрата по вертикали — это 37,5% её высоты.
export function avaStyle(name) {
  const [x, y] = MASTERS.find((m) => m.name === name).face
  return { transformOrigin: `${x}% ${y}%`, transform: `translate(${50 - x}%, ${37.5 - y}%) scale(2.6)` }
}
export const minutesOf = (service) => SERVICES.find((s) => s.name === service)?.min ?? 60

export function dayIso(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function dayLabel(iso) {
  if (iso === dayIso(0)) return 'Сегодня'
  if (iso === dayIso(1)) return 'Завтра'
  return new Date(iso + 'T12:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
}

// Вымышленные записи, которые «уже есть» в журнале: их видит админка, и с ними не пересекается бот
export const SEED = [
  { id: 1, client: 'Ринат К.', service: 'Стрижка', master: 'Артур', day: 0, time: '10:30', status: 'done' },
  { id: 2, client: 'Камиль Г.', service: 'Стрижка и борода', master: 'Ильдар', day: 0, time: '11:00', status: 'done' },
  { id: 3, client: 'Тимофей С.', service: 'Борода', master: 'Артур', day: 0, time: '13:00', status: 'confirmed' },
  { id: 4, client: 'Айдар М.', service: 'Стрижка', master: 'Ильдар', day: 0, time: '15:30', status: 'confirmed' },
  { id: 5, client: 'Денис В.', service: 'Стрижка и борода', master: 'Артур', day: 0, time: '18:00', status: 'new' },
  { id: 6, client: 'Марсель Х.', service: 'Стрижка', master: 'Ильдар', day: 1, time: '12:00', status: 'confirmed' },
  { id: 7, client: 'Артём Л.', service: 'Борода', master: 'Артур', day: 1, time: '16:30', status: 'new' },
].map((b) => ({ ...b, day: dayIso(b.day), price: SERVICES.find((s) => s.name === b.service).price }))

export function readBookings() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function addBooking(b) {
  const all = readBookings()
  all.push(b)
  try { localStorage.setItem(KEY, JSON.stringify(all.slice(-30))) } catch { /* приватный режим */ }
}

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const CANDIDATES = ['11:00', '12:00', '13:30', '14:30', '16:00', '17:00', '19:30', '20:30']

// Свободное время мастера: без прошедшего и без пересечений с уже существующими записями
export function freeTimes(master, day, service) {
  const busy = [...SEED, ...readBookings()].filter((b) => b.master === master && b.day === day && b.status !== 'cancel')
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes() + 15
  return CANDIDATES.filter((t) => {
    const start = toMin(t), end = start + service.min
    if (day === dayIso(0) && start <= nowMin) return false
    if (end > 22 * 60) return false
    return busy.every((b) => end <= toMin(b.time) || start >= toMin(b.time) + minutesOf(b.service))
  })
}
