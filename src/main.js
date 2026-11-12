import './styles.css'
import { beats } from './content/beats.js'
import { createOverlay } from './ui/overlay.js'
import { initFallback } from './ui/fallback.js'
import { introCopy } from './content/intro.js'

// 入口：滚动引擎、语言状态、3D / 降级路由。
// 滚动只在 requestAnimationFrame 里读一次 scrollY，不在 scroll 回调里遍历 DOM。

const base = import.meta.env.BASE_URL
const no3d = new URLSearchParams(window.location.search).has('no3d')
const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
const reducedMotion = () => reducedMQ.matches

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

let lang = 'zh'
let currentBeat = -1
let stage3d = null
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
  handlers: {
    onLangToggle() {
      lang = lang === 'zh' ? 'en' : 'zh'
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
      overlay.setLang(lang)
      if (fallback && currentBeat >= 0) fallback.setBeat(beats[currentBeat], lang)
    },
    onCaulkStep(step) {
      if (!stage3d) return
      const result = stage3d.caulk.push(step)
      overlay.caulkFeedback(result, stage3d.caulk.stack, stage3d.caulk.done)
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

function onBeat(i) {
  currentBeat = i
  clearLabel()
  overlay.renderBeat(i)
  if (stage3d) stage3d.enterBeat(i)
  if (fallback) fallback.setBeat(beats[i], lang)
}

/* ---------- 指针与键盘 ---------- */

canvas.addEventListener('pointerdown', (e) => {
  if (!stage3d) return
  const beat = beats[currentBeat]
  if (!beat || !beat.pick) return
  onPick(stage3d.pickAt(e.clientX, e.clientY))
})

stageEl.addEventListener('keydown', (e) => {
  if (!stage3d) return
  // 只在舞台本身有焦点时接管 Tab/Enter/Escape；焦点在内部按钮上时放行，避免抢走键盘导航
  if (e.target !== stageEl) return
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
  } else if (e.key === 'Escape') {
    stage3d.clearSelection()
    clearLabel()
    stageEl.blur()
  }
})

stageEl.addEventListener('focusout', () => {
  if (!labelPinned) clearLabel()
})

/* ---------- 降级 ---------- */

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
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
  document.querySelectorAll('.intro-mode-btn').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.mode === viewMode)
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

/* ---------- 启动 ---------- */

measureVH()
layout()
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
    })
    .catch((err) => {
      // 3D 加载失败：保留文案与 SVG，不白屏
      console.error('3D stage failed, falling back to SVG:', err)
      useFallback()
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
