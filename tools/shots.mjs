import WebSocket from 'ws'
import { writeFileSync, mkdirSync } from 'node:fs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const OUT = 'C:/Users/m1568/Documents/BlueFantasy/docs/shots'
const URL = 'http://127.0.0.1:4176/BlueFantasy/'
const RATIOS = [0.03, 0.21, 0.38, 0.52, 0.7, 0.86, 0.97]

const t = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 })
await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej) })
let id = 0
const pending = new Map()
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
})
const send = (m, p = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method: m, params: p })) })
const run = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value
const shot = async (path) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); writeFileSync(path, Buffer.from(s.data, 'base64')) }

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

async function runSet(dirName, mode) {
  const dir = `${OUT}/${dirName}`
  mkdirSync(dir, { recursive: true })
  await send('Page.navigate', { url: mode === '2d' ? URL + '?no3d=1' : URL })
  await sleep(3600)
  await run(`(() => { document.querySelector('#intro-start')?.click(); return 1 })()`)
  await sleep(1500)
  for (let i = 0; i < RATIOS.length; i += 1) {
    await run(`(() => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, ${RATIOS[i]} * m); return m })()`)
    await sleep(2600)
    await shot(`${dir}/b${i + 1}.jpg`)
  }
  console.log(dirName, 'done')
}

await runSet('', '3d')
await runSet('2d', '2d')

ws.close()
console.log('DONE')
