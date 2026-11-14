import './styles.css'
import { beats } from './content/beats.js'
import { createOverlay } from './ui/overlay.js'
import { initFallback } from './ui/fallback.js'
import { introCopy } from './content/intro.js'

// 入口：滚动引擎、语言状态、3D / 降级路由。
// 滚动只在 requestAnimationFrame 里读一次 scrollY，不在 scroll 回调里遍历 DOM。

const base = import.meta.env.BASE_URL
const params = new URLSearchParams(window.location.search)
const no3d = params.has('no3d')
const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
const reducedMotion = () => reducedMQ.matches

const LANG_KEY = 'bf.lang'
const isLang = (v) => v === 'zh' || v === 'en'

function readStoredLang() {
  try {
    const v = window.localStorage.getItem(LANG_KEY)
    return isLang(v) ? v : null
  } catch {
    // 隐私模式 / 禁用存储时不影响阅读
    return null
  }
}

function storeLang(v) {
  try {
    window.localStorage.setItem(LANG_KEY, v)
  } catch {
    /* 忽略写入失败 */
  }
}

// 语言优先级：URL ?lang= → localStorage → 中文。document lang 同步设置。
const urlLang = params.get('lang')
let lang = isLang(urlLang) ? urlLang : readStoredLang() || 'zh'
document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'

const story = document.getElementById('story')
const stageEl = document.getElementById('stage')
const canvas = document.getElementById('stage-canvas')
const introEl = document.getElementById('intro')
const introBtn = document.getElementById('intro-start')
const fallbackImg = document.getElementById('stage-fallback')

// 稳定 svh 基准：100svh 不随移动端地址栏收缩变化，用它做高度与进度基准，避免地址栏收起时重算进度跳动。
const svhProbe = document.createElement('div')
svhProbe.setAttribute('aria-hidden', 'true')
svhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
document.body.appendChild(svhProbe)

let vhBaseline = window.innerHeight
function measureVH() {
  const h = svhProbe.getBoundingClientRect().height
  vhBaseline = h > 0 ? h : window.innerHeight
}

let currentBeat = -1
let stage3d = null
let threeFailed = false
let stageFailReason = ''
let fallback = null
let labelPart = null
let labelPinned = false

/* ---------- 滚动区间（总高 ≈ 7 × 100vh，按 beat 占比切分） ---------- */

const spacers = beats.map(() => {
  const d = document.createElement('div')
  d.setAttribute('aria-hidden', 'true')
  story.appendChild(d)
  return d
})

function layout() {
  const vh = vhBaseline
  stageEl.style.height = `${vh}px`
  beats.forEach((b, i) => {
    spacers[i].style.height = `${(b.progress[1] - b.progress[0]) * 6 * vh}px`
  })
}

function beatIndexAt(p) {
  for (let i = 0; i < beats.length; i += 1) {
    if (p < beats[i].progress[1] || i === beats.length - 1) return i
  }
  return beats.length - 1
}

/* ---------- 交互处理 ---------- */

function clearLabel() {
  labelPart = null
  labelPinned = false
  overlay.hidePartLabel()
}

function onPick(name) {
  if (!stage3d) return
  if (!name) {
    stage3d.clearSelection()
    clearLabel()
    return
  }
  const selected = stage3d.select(name)
  if (selected) {
    labelPart = name
    labelPinned = true
    overlay.showPartLabel(name)
  } else {
    clearLabel()
  }
}

function positionLabel() {
  if (!labelPart || !stage3d) return
  const a = stage3d.anchorOf(labelPart)
  if (!a) {
    overlay.hidePartLabel()
    return
  }
  overlay.showPartLabel(labelPart)
  overlay.positionPartLabel(a.x, a.y)
}

const overlay = createOverlay({
  reducedMotion,
  fallbackMode: no3d || !webglAvailable(),
  initialLang: lang,
  handlers: {
    onLangToggle() {
      lang = lang === 'zh' ? 'en' : 'zh'
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
      storeLang(lang)
      overlay.setLang(lang)
      if (fallback && currentBeat >= 0) fallback.setBeat(beats[currentBeat], lang)
      scheduleUrlWrite()
    },
    onCaulkStep(step) {
      if (!stage3d) return
      const result = stage3d.caulk.push(step)
      overlay.caulkFeedback(result, stage3d.caulk.stack, stage3d.caulk.done)
    },
    onCaulkReset() {
      if (stage3d) stage3d.caulk.reset()
      overlay.resetCaulk()
    },
    onFlood(name) {
      if (!stage3d) return
      stage3d.flood.setState(name, { replay: stage3d.flood.active === name })
      overlay.setFloodActive(name)
    },
    onReplay() {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
    },
  },
})

/* ---------- URL 状态（?beat=N&lang=zh|en） ---------- */

let urlTimer = 0

function writeUrlState() {
  if (currentBeat < 0) return
  const url = new URL(window.location.href)
  url.searchParams.set('beat', String(currentBeat + 1))
  url.searchParams.set('lang', lang)
  if (url.href !== window.location.href) window.history.replaceState(null, '', url)
}

// 节流：最多每 300ms 写回一次，滚动过程中不逐帧 replaceState。
function scheduleUrlWrite() {
  if (urlTimer) return
  urlTimer = window.setTimeout(() => {
    urlTimer = 0
    writeUrlState()
  }, 300)
}

function onBeat(i) {
  currentBeat = i
  // 按屏切版式：漏水那一屏的水在画面右半，文案要收窄让开
  if (beats[i]) document.body.dataset.beat = beats[i].id
  clearLabel()
  overlay.renderBeat(i)
  if (stage3d) stage3d.enterBeat(i)
  if (fallback) fallback.setBeat(beats[i], lang)
  scheduleUrlWrite()
}

/* ---------- 指针与键盘 ---------- */

canvas.addEventListener('pointerdown', (e) => {
  if (!stage3d) return
  const beat = beats[currentBeat]
  if (!beat || !beat.pick) return
  onPick(stage3d.pickAt(e.clientX, e.clientY))
})

stageEl.addEventListener('keydown', (e) => {
  // 只在舞台本身有焦点时接管键盘；焦点在内部按钮上时放行，避免抢走键盘导航
  if (e.target !== stageEl) return
  // Escape 任何 beat / 降级模式下都退出舞台焦点。
  if (e.key === 'Escape') {
    if (stage3d) stage3d.clearSelection()
    clearLabel()
    stageEl.blur()
    return
  }
  if (!stage3d) return
  const beat = beats[currentBeat]
  if (!beat || !beat.pick) return
  if (e.key === 'Tab') {
    e.preventDefault()
    const name = stage3d.cyclePart(e.shiftKey ? -1 : 1)
    if (name) {
      labelPart = name
      labelPinned = false
      overlay.showPartLabel(name)
    }
  } else if (e.key === 'Enter') {
    const focused = stage3d.focusedPart()
    if (focused) onPick(focused)
    e.preventDefault()
  }
})

stageEl.addEventListener('focusout', () => {
  if (!labelPinned) clearLabel()
})

/* ---------- 降级 ---------- */

// three 0.170 起只支持 WebGL2：这里若放行 WebGL1，
// 会出现「检测通过 → new WebGLRenderer 抛 Error creating WebGL context →
// 3D 被锁死」的情况，表现为 3D 按钮点不了。所以只认 webgl2。
function webglAvailable() {
  try {
    if (!window.WebGL2RenderingContext) {
      stageFailReason = '这个浏览器没有 WebGL2（three 0.170 起只支持 WebGL2）'
      return false
    }
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (!gl) {
      stageFailReason = 'WebGL2 被浏览器或显卡驱动禁用（检查 chrome://gpu 的 WebGL2 状态）'
      return false
    }
    return true
  } catch {
    return false
  }
}

function useFallback() {
  if (fallback) return
  overlay.setFallbackMode(true)
  fallback = initFallback({ stageEl, img: fallbackImg, base })
  if (currentBeat >= 0) fallback.setBeat(beats[currentBeat], lang)
}

/* ---------- 开场 ---------- */

let viewMode = !no3d && webglAvailable() ? '3d' : '2d'

function applyViewMode() {
  // three 加载失败过，3D 就回不去了，直接锁在 2D
  if (viewMode === '3d' && threeFailed) viewMode = '2d'
  document.querySelectorAll('.intro-mode-btn').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.mode === viewMode)
    if (b.dataset.mode === '3d' && threeFailed) {
      b.disabled = true
      b.setAttribute('aria-disabled', 'true')
      if (stageFailReason) b.title = stageFailReason
    }
  })
  if (viewMode === '2d') {
    useFallback()
  } else if (fallback) {
    fallback = null
    stageEl.classList.remove('is-fallback')
    document.body.classList.remove('is-fallback')
    fallbackImg.hidden = true
    overlay.setFallbackMode(false)
  }
}

// 开场页在进站前，站内语言还没确定，先按浏览器语言选一版
const introLang = (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en'

function presentIntro() {
  if (!introEl || !introBtn) return
  document.getElementById('intro-eyebrow').textContent = introCopy.eyebrow[introLang]
  document.getElementById('intro-title').textContent = introCopy.title[introLang]
  document.getElementById('intro-sub').textContent = introCopy.sub[introLang]
  document.getElementById('intro-note').textContent = introCopy.note[introLang]
  introBtn.textContent = introCopy.start[introLang]
  introBtn.setAttribute('aria-label', introCopy.startAria[introLang])

  const modeBtns = [...document.querySelectorAll('.intro-mode-btn')]
  const mode3d = modeBtns.find((b) => b.dataset.mode === '3d')
  if (mode3d && viewMode === '2d') {
    mode3d.disabled = true
    mode3d.setAttribute('aria-disabled', 'true')
  }
  modeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      if (b.disabled) return
      viewMode = b.dataset.mode
      applyViewMode()
    })
  })

  introEl.hidden = false
  document.documentElement.classList.add('intro-locked')
  window.scrollTo(0, 0)
  applyViewMode()
  introBtn.focus({ preventScroll: true })
}

function enterSite() {
  if (!introEl || introEl.hidden || introEl.classList.contains('is-leaving')) return
  window.scrollTo(0, 0)
  document.documentElement.classList.remove('intro-locked')
  if (reducedMotion()) {
    introEl.remove()
    stageEl.focus({ preventScroll: true })
    return
  }
  introEl.classList.add('is-leaving')
  window.setTimeout(() => {
    introEl.remove()
    stageEl.focus({ preventScroll: true })
  }, 560)
}

introBtn?.addEventListener('click', enterSite)
presentIntro()


/* ---------- 深链 ---------- */

// ?beat=N（1 起）：定位到该 beat 的中点。要等布局结算，浏览器还可能把滚动还原成 0。
function applyInitialLocation() {
  window.__dl = (window.__dl || 0) + 1
  const raw = new URLSearchParams(window.location.search).get('beat')
  if (raw === null) return
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) return
  const i = Math.min(beats.length, n) - 1
  const beat = beats[i]
  const mid = (beat.progress[0] + beat.progress[1]) / 2
  const max = document.documentElement.scrollHeight - vhBaseline
  if (window.__dlLog !== false) console.info("[deep] max=" + max)
  if (max > 0) window.scrollTo({ top: Math.round(max * mid), behavior: 'auto' })
}
/* ---------- 启动 ---------- */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// 深链需要在文档高度结算后再滚；这里等真实可滚高度出现再定位一次
function scheduleDeepLink() {
  let tries = 0
  const tick = () => {
    const max = document.documentElement.scrollHeight - vhBaseline
    if (max > 100) {
      applyInitialLocation()
      return
    }
    if (tries++ < 90) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

measureVH()
layout()
scheduleDeepLink()

// load 之后再定位一次：首帧时文档高度可能还没结算
window.addEventListener('load', () => {
  requestAnimationFrame(applyInitialLocation)
  // 浏览器的滚动还原/布局结算可能晚于 load，再补两次
  setTimeout(applyInitialLocation, 120)
  setTimeout(applyInitialLocation, 400)
})

window.addEventListener('resize', () => {
  measureVH()
  layout()
  if (stage3d) stage3d.resize()
})

if (!no3d && webglAvailable()) {
  // three 走动态 import，独立 chunk；失败则降级
  import('./stage/scene.js')
    .then((mod) => mod.createStage({ canvas, beats, reducedMotion, base }))
    .then((stage) => {
      stage3d = stage
      stage3d.resize()
      if (currentBeat >= 0) stage3d.enterBeat(currentBeat)
      // 只在 dev 暴露调试句柄：拾取/可见性出问题时可以直接在控制台查，
      // 不用靠截图猜。
      if (import.meta.env.DEV) {
        window.__bf = {
          stage,
          beats,
          get beat() {
            return beats[currentBeat]?.id ?? null
          },
        }
      }
    })
    .catch((err) => {
      // 3D 加载失败：保留文案与 SVG，不白屏；并锁死 3D 选项
      threeFailed = true
      stageFailReason = (err && err.message) ? err.message : String(err)
      console.error('3D stage failed, falling back to SVG:', err)
      // 现场没有控制台也要能看到为什么退回 2D
      const note = document.getElementById('intro-note')
      if (note && !document.getElementById('intro-3d-error')) {
        const p = document.createElement('p')
        p.id = 'intro-3d-error'
        p.className = 'intro-note'
        p.style.color = '#c08a4a'
        p.textContent = `3D 无法启动：${stageFailReason}`
        note.insertAdjacentElement('afterend', p)
      }
      useFallback()
      applyViewMode()
    })
} else {
  useFallback()
}

/* ---------- 主循环：每帧读一次 scrollY ---------- */

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now

  const max = document.documentElement.scrollHeight - vhBaseline
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  const i = beatIndexAt(p)
  const beat = beats[i]
  const lt = Math.min(1, Math.max(0, (p - beat.progress[0]) / (beat.progress[1] - beat.progress[0])))
  const blend = i < beats.length - 1 ? Math.min(1, Math.max(0, (lt - 0.55) / 0.45)) : 0

  if (i !== currentBeat) onBeat(i)
  overlay.setProgress(p)

  if (stage3d) {
    stage3d.update(dt, i, lt, blend)
    positionLabel()
  }

  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
