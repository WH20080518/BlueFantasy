// 交互用例自动跑批（tests/interactions.md 的 20 条）
//
// 用法：
//   1) npm run build && npx vite preview --port 4177 --base /Joinery/
//   2) 启动一个可连 CDP 的 Chromium（OpenClaw 的浏览器即可）
//   3) CDP=http://127.0.0.1:18800 PAGE=http://localhost:4177/Joinery/ node tests/interactions.run.mjs
//
// 只做 DOM 层断言：补缝状态机、按钮 disabled/aria、语言与 URL 持久化、降级路径。
// 3D 视觉收敛（水面高度、船体姿态）无法在无 GPU 环境判定，脚本里会明确标成「未验证」。

const CDP = process.env.CDP || 'http://127.0.0.1:18800'
const PAGE = process.env.PAGE || 'http://localhost:4177/Joinery/'

let ws
let msgId = 0
const pending = new Map()

function connect(url) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url)
    ws.onopen = () => resolve()
    ws.onerror = (e) => reject(new Error(`CDP 连接失败: ${e?.message || e}`))
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (!msg.id) return
      const p = pending.get(msg.id)
      if (!p) return
      pending.delete(msg.id)
      if (msg.error) p.reject(new Error(msg.error.message))
      else p.resolve(msg.result)
    }
  })
}

function send(method, params = {}) {
  const id = ++msgId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'evaluate failed')
  return r.result.value
}

async function waitFor(expression, timeout = 8000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if (await evaluate(expression)) return true
    await sleep(120)
  }
  return false
}

// 每次重新进页面：点掉开场，等文案出现
async function enter(query) {
  await send('Page.navigate', { url: `${PAGE}${query}` })
  await waitFor(`!!document.getElementById('intro-start')`)
  await evaluate(`document.getElementById('intro-start').click()`)
  await waitFor(`!document.getElementById('intro') || document.getElementById('intro').hidden`)
  await sleep(300)
}

async function gotoBeat(index) {
  await evaluate(`(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = ${index}
    window.scrollTo(0, Math.round(max * ((p - 0.5) / 7)))
  })()`)
  await sleep(1000)
}

// 按 dataset 逐段滚，避免 7 屏高度不一致时算错落点
async function gotoBeatExact(target) {
  for (let i = 0; i < 40; i += 1) {
    const cur = await evaluate(`document.body.dataset.beat || ''`)
    if (cur === `b${target}`) return true
    const dir = Number(cur.slice(1) || 0) < target ? 1 : -1
    await evaluate(`window.scrollBy(0, ${dir} * Math.round(window.innerHeight * 0.6))`)
    await sleep(260)
  }
  return false
}

async function clickSel(sel) {
  const ok = await evaluate(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return false; n.click(); return true })()`)
  if (!ok) throw new Error(`找不到 ${sel}`)
}

const results = []
function record(id, pass, actual) {
  results.push({ id, pass, actual })
  console.log(`${pass ? 'PASS' : 'FAIL'} #${id} ${actual}`)
}

async function run() {
  // ---------- 一、补缝三步 ----------
  await enter('?no3d=0&beat=3&lang=zh')
  await gotoBeat(3)
// 「重来」按钮也带 caulk-step 类，量尺寸/数状态时限定在步骤容器里
const steps = '.caulk-steps .caulk-step'
  await evaluate(`document.querySelectorAll('${steps}')[0].click()`)
  await evaluate(`document.querySelectorAll('${steps}')[1].click()`)
  await evaluate(`document.querySelectorAll('${steps}')[2].click()`)
  await sleep(200)
  {
    const done = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    const status = await evaluate(`document.querySelector('.caulk-status').textContent`)
    const reset = await evaluate(`!document.querySelector('.caulk-reset').hidden`)
    record(1, done === 3 && reset, `三步都亮(${done}/3)，状态「${status}」，重来按钮${reset ? '出现' : '未出现'}`)
  }
  {
    const disabled = await evaluate(`[...document.querySelectorAll('${steps}')].every(b => b.disabled && b.getAttribute('aria-disabled') === 'true')`)
    record(4, disabled, disabled ? '三个按钮均 disabled，aria-disabled=true' : '仍有按钮可点')
  }
  {
    await clickSel('.caulk-reset')
    await sleep(150)
    const done = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    const resetHidden = await evaluate(`document.querySelector('.caulk-reset').hidden`)
    record(5, done === 0 && resetHidden, `已亮步骤 ${done}，重来按钮${resetHidden ? '隐藏' : '仍在'}（回到初始态）`)
  }
  {
    await clickSel('.caulk-reset')
    await evaluate(`document.querySelectorAll('${steps}')[1].click()`)
    await sleep(120)
    const status = await evaluate(`document.querySelector('.caulk-status').textContent`)
    const count = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    // 11 §6C：顺序错 → 提示 + 已入栈步骤清空（与规则一致，不保留）
    record(2, status.includes('顺序不对') && count === 0, `状态「${status}」，已入栈步骤清空（剩 ${count} 步）`)
    await sleep(1100)
    const after = await evaluate(`document.querySelector('.caulk-status').textContent`)
    const count2 = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    record(3, after === '' && count2 === 0, `1 秒后提示「${after || '已清空'}」，步骤仍为 ${count2} 步（已清空）`)
  }
  {
    await clickSel('.caulk-reset')
    await evaluate(`document.querySelectorAll('${steps}')[0].click()`)
    await evaluate(`document.querySelectorAll('${steps}')[1].click()`)
    for (let i = 0; i < 5; i += 1) await evaluate(`document.querySelectorAll('${steps}')[2].click()`)
    await sleep(200)
    const done = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    const statusText = await evaluate(`document.querySelector('.caulk-status').textContent`)
    record(7, done === 3 && statusText.includes('缝合上了'), `连点 5 次「捻缝」后仍只推进一次：亮 ${done} 步，状态「${statusText.slice(0, 12)}…」`)
  }
  {
    const h = await evaluate(`Math.min(...[...document.querySelectorAll('${steps}')].map(b => b.getBoundingClientRect().height))`)
    record(8, h >= 44, `补缝按钮最小命中高 ${Math.round(h)}px（桌面指针；触屏按 @media (pointer: coarse) 提到 44）`)
  }
  {
    // 完成态按 Tab 能跑到「重来」
    await clickSel('.caulk-reset')
    await evaluate(`document.querySelectorAll('${steps}')[0].click()`)
    await evaluate(`document.querySelectorAll('${steps}')[1].click()`)
    await evaluate(`document.querySelectorAll('${steps}')[2].click()`)
    await sleep(150)
    // 用真实键盘事件走一遍 Tab：从「重来」按 Tab 应回到面板的可聚焦元素，而不是卡在 disabled 步骤
    await evaluate(`document.querySelector('.caulk-reset').focus()`)
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await sleep(120)
    const focusInfo = await evaluate(`(() => {
      const a = document.activeElement
      return { tag: a?.tagName || '', cls: a?.className || '', disabled: !!a?.disabled }
    })()`)
    record(6, !focusInfo.disabled && focusInfo.tag !== '', `Tab 后焦点落在 ${focusInfo.tag}.${focusInfo.cls || '-'}（未卡在被 disabled 的步骤）`)
  }

  // ---------- 二、漏水实验 ----------
  await enter('?no3d=0&beat=5&lang=zh')
  await gotoBeat(5)
  {
    await clickSel('.flood-btn[data-flood="without-bulkheads"]')
    await sleep(300)
    const pressed = await evaluate(`document.querySelector('.flood-btn[data-flood="without-bulkheads"]').getAttribute('aria-pressed')`)
    const status = await evaluate(`document.getElementById('flood-status')?.textContent || ''`)
    record(9, pressed === 'true' && status.length > 0, `按钮 aria-pressed=${pressed}，状态「${status.slice(0, 24)}」（视觉收敛需 GPU，未验证）`)
  }
  {
    for (let i = 0; i < 4; i += 1) await clickSel('.flood-btn[data-flood="without-bulkheads"]')
    await sleep(300)
    const pressed = await evaluate(`document.querySelector('.flood-btn[data-flood="without-bulkheads"]').getAttribute('aria-pressed')`)
    record(11, pressed === 'true', `连点 5 次后仍为单一选中态 aria-pressed=${pressed}`)
  }
  {
    await clickSel('.flood-btn[data-flood="with-bulkheads"]')
    await sleep(1400)
    const pressed = await evaluate(`document.querySelector('.flood-btn[data-flood="with-bulkheads"]').getAttribute('aria-pressed')`)
    record(10, pressed === 'true', `转场后切回「有隔舱」，最终 aria-pressed=${pressed}`)
  }
  {
    const role = await evaluate(`document.getElementById('flood-status')?.getAttribute('role') || ''`)
    record(13, role === 'status', `#flood-status role=${role || '缺失'}`)
  }
  {
    const h = await evaluate(`Math.min(...[...document.querySelectorAll('.flood-btn')].map(b => b.getBoundingClientRect().height))`)
    record(14, h >= 44, `漏水按钮最小命中高 ${Math.round(h)}px（桌面指针）`)
  }
  record(12, null, '重播同一状态需观察水面动画，无 GPU 环境未验证')

  // ---------- 三、语言与状态 ----------
  await enter('?no3d=0&beat=3&lang=zh')
  await gotoBeat(3)
  {
    await evaluate(`document.querySelectorAll('${steps}')[0].click()`)
    await evaluate(`document.querySelectorAll('${steps}')[1].click()`)
    await sleep(150)
    await clickSel('#lang-toggle')
    await sleep(400)
    const done = await evaluate(`document.querySelectorAll('${steps}.is-done').length`)
    const title = await evaluate(`document.getElementById('copy-title').textContent`)
    record(15, done === 2 && /nails|joinery/i.test(title), `切 EN 后已亮 ${done} 步，标题「${title}」`)
  }
  await enter('?no3d=0&beat=5&lang=zh')
  await gotoBeat(5)
  {
    await clickSel('.flood-btn[data-flood="without-bulkheads"]')
    await sleep(200)
    await clickSel('#lang-toggle')
    await sleep(400)
    const pressed = await evaluate(`document.querySelector('.flood-btn[data-flood="without-bulkheads"]').getAttribute('aria-pressed')`)
    record(16, pressed === 'true', `切 EN 后「无隔舱」仍选中（aria-pressed=${pressed}）`)
  }
  {
    await send('Page.navigate', { url: `${PAGE}?no3d=0&beat=4` })
    await waitFor(`!!document.getElementById('intro-start')`)
    const lang = await evaluate(`document.documentElement.lang`)
    const stored = await evaluate(`localStorage.getItem('bf.lang')`)
    record(17, lang === 'en' && stored === 'en', `刷新后 html lang=${lang}，localStorage=${stored}`)
  }
  {
    await send('Page.navigate', { url: `${PAGE}?no3d=0&beat=4&lang=zh` })
    await waitFor(`!!document.getElementById('intro-start')`)
    await evaluate(`localStorage.setItem('bf.lang', 'en')`)
    await send('Page.navigate', { url: `${PAGE}?no3d=0&beat=4&lang=zh` })
    await waitFor(`!!document.getElementById('intro-start')`)
    const lang = await evaluate(`document.documentElement.lang`)
    record(18, lang === 'zh-CN' || lang === 'zh', `localStorage=en 时带 ?lang=zh 打开，html lang=${lang}（URL 优先）`)
  }

  // ---------- 四、URL 与降级 ----------
  {
    await send('Page.navigate', { url: `${PAGE}?no3d=0&beat=5&lang=zh` })
    await waitFor(`!!document.getElementById('intro-start')`)
    await evaluate(`document.getElementById('intro-start').click()`)
    await waitFor(`document.body.dataset.beat === 'b5'`, 6000)
    const beat = await evaluate(`document.body.dataset.beat`)
    const title = await evaluate(`document.getElementById('copy-title').textContent`)
    record(19, beat === 'b5', `body[data-beat]=${beat}，标题「${title}」`)
  }
  {
    await enter('?no3d=1&lang=zh')
    const beats = []
    for (let i = 1; i <= 7; i += 1) {
      await gotoBeatExact(i)
      const r = await evaluate(`(() => {
        const img = document.getElementById('stage-fallback')
        const title = document.getElementById('copy-title').textContent
        const btns = [...document.querySelectorAll('.caulk-step, .flood-btn')]
        const locked = btns.every(b => b.disabled && b.getAttribute('aria-disabled') === 'true')
        return { beat: document.body.dataset.beat, img: !!img && !img.hidden, title, locked: btns.length ? locked : null }
      })()`)
      beats.push(r)
    }
    const ok = beats.every((b) => b.img && b.title && (b.locked === null || b.locked === true))
    record(20, ok, `7 屏都走完：${beats.map((b) => `${b.beat}${b.img ? '✓' : '✗'}`).join(' ')}；交互按钮均 disabled`)
  }

  const pass = results.filter((r) => r.pass === true).length
  const fail = results.filter((r) => r.pass === false).length
  const skip = results.filter((r) => r.pass === null).length
  console.log(`\n汇总：通过 ${pass} / 失败 ${fail} / 未验证 ${skip}`)
  process.exitCode = fail ? 1 : 0
}

const targets = await (await fetch(`${CDP}/json/list`)).json()
const page = targets.find((t) => t.type === 'page')
if (!page) throw new Error('没有可用的 page target')
await connect(page.webSocketDebuggerUrl)
await send('Page.enable')
await send('Runtime.enable')
try {
  await run()
} finally {
  ws.close()
}
