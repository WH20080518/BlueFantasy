// 生成 docs/shots 的关键帧。依赖 Node 22+ 自带的 WebSocket，不需要额外装包。
// 用法：
//   1) npm run build && npx vite preview --port 4176
//   2) msedge --headless=new --disable-gpu --remote-debugging-port=9222
//   3) node tools/shots.mjs

import { mkdirSync, writeFileSync } from 'node:fs'

const CDP = process.env.CDP || 'http://127.0.0.1:9222'
const PAGE = process.env.PAGE || 'http://127.0.0.1:4176/BlueFantasy/'
const OUT = process.env.OUT || 'docs/shots'

// 只留关键帧，避免仓库体积膨胀；要看别的位置改这里
const KEYFRAMES = [
  ['b1', 0.03],
  ['b4', 0.52],
  ['b5', 0.7],
  ['b7', 0.97],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pending = new Map()
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (!msg.id || !pending.has(msg.id)) return
  const { resolve, reject } = pending.get(msg.id)
  pending.delete(msg.id)
  if (msg.error) reject(new Error(JSON.stringify(msg.error)))
  else resolve(msg.result)
})

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

const run = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true })
  return result.result.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})

await send('Page.navigate', { url: PAGE })
await sleep(3600)
await run(`(() => { document.querySelector('#intro-start')?.click(); return 1 })()`)
await sleep(1500)

mkdirSync(OUT, { recursive: true })

for (const [name, ratio] of KEYFRAMES) {
  await run(`(() => { const max = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, ${ratio} * max); return max })()`)
  await sleep(2600)
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 })
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(shot.data, 'base64'))
  console.log('saved', `${OUT}/${name}.jpg`)
}

ws.close()
