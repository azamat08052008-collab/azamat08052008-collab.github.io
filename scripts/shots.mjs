// Снимки демо для 3D-веера в первом экране. Запуск при работающем `npm run dev` (порт 5192):
//   node scripts/shots.mjs
// Нужен Google Chrome и playwright-core (devDependency).
import { chromium } from 'playwright-core'
import { fileURLToPath } from 'node:url'

const base = process.env.BASE || 'http://localhost:5192'
const podacha = 'https://azamat08052008-collab.github.io/podacha/'
const out = fileURLToPath(new URL('../src/assets/img/shots/', import.meta.url))
const browser = { width: 1280, height: 800 }
const phone = { width: 390, height: 844 }

const b = await chromium.launch({ channel: 'chrome' })
async function shot(name, url, size, act) {
  const p = await b.newPage({ viewport: size, deviceScaleFactor: size === phone ? 2 : 1 })
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  if (act) await act(p)
  await p.screenshot({ path: out + name + '.jpg', type: 'jpeg', quality: 82 })
  await p.close()
  console.log('снято:', name)
}
const click = async (p, names) => { for (const n of names) { await p.getByRole('button', { name: n }).last().click(); await p.waitForTimeout(900) } }

await shot('landing', base + '/demo/landing/', browser)
await shot('shop', base + '/demo/shop/', browser)
await shot('admin', base + '/demo/admin/', browser)
await shot('bot', base + '/demo/bot/', phone, (p) => click(p, ['Начать', 'Записаться', 'Стрижка · 1 200 ₽']))
await shot('ai', base + '/demo/ai/', phone, async (p) => { await click(p, ['Сколько стоит керамика?']); await p.waitForTimeout(3000) })
await shot('qr', podacha + 'kofe/?t=4', phone)
await b.close()
