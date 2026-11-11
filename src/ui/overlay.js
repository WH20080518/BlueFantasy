import { beats, ui } from '../content/beats.js'
import { termWall, termById, nodeTerms } from '../content/glossary.js'

// 文案渲染、进度条、语言切换、beat 指示、名称浮层。文案全部来自 content/，这里不做硬编码。

// 把正文里的 `**粗体**` / `*斜体*` 渲染成对应元素，其余按纯文本（内容来自受信内容文件，不 innerHTML 注入）。
function inlineMarkup(parent, text) {
  const tokens = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  tokens.forEach((tok) => {
    if (!tok) return
    if (tok.startsWith('**') && tok.endsWith('**')) {
      const strong = document.createElement('strong')
      strong.textContent = tok.slice(2, -2)
      parent.appendChild(strong)
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      const em = document.createElement('em')
      em.textContent = tok.slice(1, -1)
      parent.appendChild(em)
    } else {
      parent.appendChild(document.createTextNode(tok))
    }
  })
}

export function createOverlay({ reducedMotion, fallbackMode, handlers }) {
  const $ = (id) => document.getElementById(id)
  const el = {
    stage: $('stage'),
    canvas: $('stage-canvas'),
    copy: $('copy'),
    eyebrow: $('copy-eyebrow'),
    title: $('copy-title'),
    body: $('copy-body'),
    hint: $('copy-hint'),
    caulkUI: $('caulk-ui'),
    caulkSteps: $('caulk-steps'),
    caulkStatus: $('caulk-status'),
    floodUI: $('flood-ui'),
    termsUI: $('terms-ui'),
    termsTitle: $('terms-title'),
    termsList: $('terms-list'),
    codaUI: $('coda-ui'),
    credits: $('credits'),
    replay: $('replay'),
    indicator: $('beat-indicator'),
    fill: $('progress-fill'),
    bar: $('progressbar'),
    langToggle: $('lang-toggle'),
    partLabel: $('part-label'),
  }
  const floodBtns = [...document.querySelectorAll('.flood-btn')]

  let lang = 'zh'
  let beatIndex = -1
  let swapToken = 0
  let fMode = fallbackMode

  // 交互 UI 状态：语言切换 / 降级重绘后据此恢复，而不是重置成默认值。
  let caulkUIState = { stack: [], done: false, status: '' }
  let floodActiveName = 'with-bulkheads'

  const t = (v) => v[lang]

  function button(label, ariaLabel) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.setAttribute('aria-label', ariaLabel)
    if (fMode) {
      b.disabled = true
      b.setAttribute('aria-disabled', 'true')
    }
    return b
  }

  function renderStatic() {
    document.title = lang === 'zh' ? '榫合 · Joinery' : 'Joinery · 榫合'
    el.langToggle.textContent = t(ui.langSwitch)
    el.langToggle.setAttribute('aria-label', t(ui.langSwitchAria))
    el.bar.setAttribute('aria-label', t(ui.progressAria))
    el.replay.textContent = t(ui.replay)
    el.credits.textContent = t(ui.credits)
    el.termsTitle.textContent = t(ui.termsTitle)

    el.caulkSteps.innerHTML = ''
    ui.caulk.steps.forEach((s, i) => {
      const b = button(t(s), `${t(s)} (${i + 1}/3)`)
      b.className = 'caulk-step'
      b.dataset.step = String(i)
      b.addEventListener('click', () => handlers.onCaulkStep(i))
      el.caulkSteps.appendChild(b)
    })

    floodBtns.forEach((b) => {
      const key = b.dataset.flood === 'with-bulkheads' ? 'withBulkheads' : 'withoutBulkheads'
      b.textContent = t(ui.flood[key])
      if (fMode) {
        b.disabled = true
        b.setAttribute('aria-disabled', 'true')
      }
    })
    el.floodUI.querySelector('.flood-switch').setAttribute('aria-label', t(ui.flood.groupAria))
  }

  function renderTerms() {
    el.termsList.innerHTML = ''
    termWall.forEach((id) => {
      const term = termById(id)
      if (!term) return
      const li = document.createElement('li')
      const zh = document.createElement('span')
      zh.className = 't-zh'
      zh.textContent = term.zh
      const type = document.createElement('span')
      type.className = 't-type'
      type.textContent = t(ui.termType[term.type] || { zh: term.type, en: term.type })
      const en = document.createElement('span')
      en.className = 't-en'
      en.textContent = term.en
      li.append(zh, type, en)
      // 解释译要求「译名 + 一句解释」：有 note 时显示对应语种说明
      if (term.note) {
        const note = document.createElement('span')
        note.className = 't-note'
        note.textContent = t(term.note)
        li.append(note)
      }
      el.termsList.appendChild(li)
    })
  }

  function renderCaulkUI() {
    const buttons = [...el.caulkSteps.children]
    buttons.forEach((b, i) => b.classList.toggle('is-done', caulkUIState.done || caulkUIState.stack.includes(i)))
    if (caulkUIState.status === 'wrong') {
      el.caulkStatus.textContent = t(ui.caulk.wrongOrder)
      el.caulkStatus.className = 'caulk-status is-error'
    } else if (caulkUIState.status === 'done') {
      el.caulkStatus.textContent = t(ui.caulk.done)
      el.caulkStatus.className = 'caulk-status is-ok'
    } else {
      el.caulkStatus.textContent = ''
      el.caulkStatus.className = 'caulk-status'
    }
  }

  // 只更新文案（标题、正文、提示、术语、舞台语义标签），不碰交互状态。
  function applyBeatCopy(i) {
    const beat = beats[i]
    const eyebrow = beat.eyebrow ? t(beat.eyebrow) : ''
    el.eyebrow.hidden = !eyebrow
    el.eyebrow.textContent = eyebrow
    el.title.textContent = t(beat.title)
    el.body.innerHTML = ''
    beat.body[lang].forEach((line) => {
      const p = document.createElement('p')
      inlineMarkup(p, line)
      el.body.appendChild(p)
    })

    const hintText = beat.pick ? t(ui.pickHint) : beat.interaction === 'caulk' ? t(ui.caulk.intro) : ''
    el.hint.hidden = !hintText
    el.hint.textContent = hintText

    if (beat.interaction === 'terms') renderTerms()

    el.canvas.setAttribute('aria-label', t(beat.stageLabel))
    el.indicator.textContent = `${i + 1} / ${beats.length}`
  }

  // 进入 beat 时才执行：面板显隐 + 交互状态复位（语言切换不走这里）。
  function applyBeatInteraction(i) {
    const beat = beats[i]
    el.caulkUI.hidden = beat.interaction !== 'caulk'
    el.floodUI.hidden = beat.interaction !== 'flood'
    el.termsUI.hidden = beat.interaction !== 'terms'
    el.codaUI.hidden = beat.interaction !== 'replay'

    if (beat.interaction === 'caulk') {
      caulkUIState = { stack: [], done: false, status: '' }
      renderCaulkUI()
    }
    if (beat.interaction === 'flood') setFloodActive('with-bulkheads')
  }

  function applyBeatContent(i) {
    applyBeatCopy(i)
    applyBeatInteraction(i)
  }

  function renderBeat(i, { instant = false } = {}) {
    beatIndex = i
    const token = ++swapToken
    const swap = () => {
      if (token !== swapToken) return
      applyBeatContent(i)
      el.copy.classList.remove('is-swapping')
    }
    if (instant || reducedMotion()) {
      swap()
    } else {
      el.copy.classList.add('is-swapping')
      window.setTimeout(swap, 200)
    }
  }

  function setFloodActive(name) {
    floodActiveName = name
    floodBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flood === name)))
  }

  el.replay.addEventListener('click', () => handlers.onReplay())
  el.langToggle.addEventListener('click', () => handlers.onLangToggle())
  floodBtns.forEach((b) => b.addEventListener('click', () => handlers.onFlood(b.dataset.flood)))

  renderStatic()

  return {
    renderBeat,
    setFallbackMode(v) {
      fMode = v
      renderStatic()
      if (beatIndex >= 0) renderBeat(beatIndex, { instant: true })
    },
    get beatIndex() {
      return beatIndex
    },
    setLang(next) {
      lang = next
      renderStatic()
      const i = beatIndex < 0 ? 0 : beatIndex
      beatIndex = i
      el.copy.classList.remove('is-swapping')
      applyBeatCopy(i)
      // 只换文案：交互状态从已记录状态恢复，不重置（不重新走 applyBeatInteraction）。
      renderCaulkUI()
      setFloodActive(floodActiveName)
    },
    get lang() {
      return lang
    },
    setProgress(p) {
      el.fill.style.transform = `scaleX(${p})`
      el.bar.setAttribute('aria-valuenow', String(Math.round(p * 100)))
    },
    caulkFeedback(result, stack, done) {
      caulkUIState = {
        stack: [...stack],
        done,
        status: result === 'wrong' ? 'wrong' : result === 'done' ? 'done' : '',
      }
      renderCaulkUI()
    },
    setFloodActive,
    // 零件名称浮层：中 / 英 / 类型
    showPartLabel(name) {
      const term = termById(nodeTerms[name])
      if (!term) return
      el.partLabel.innerHTML = ''
      const zh = document.createElement('strong')
      const seq = name.match(/_(\d+)$/)
      zh.textContent = seq ? `${term.zh} ${seq[1]}` : term.zh
      const en = document.createElement('span')
      en.className = 'en'
      en.textContent = term.en
      const type = document.createElement('span')
      type.className = 't-type'
      type.textContent = t(ui.termType[term.type] || { zh: term.type, en: term.type })
      el.partLabel.append(zh, en, type)
      el.partLabel.hidden = false
    },
    positionPartLabel(x, y) {
      el.partLabel.style.left = `${x}px`
      el.partLabel.style.top = `${y}px`
    },
    hidePartLabel() {
      el.partLabel.hidden = true
    },
  }
}
