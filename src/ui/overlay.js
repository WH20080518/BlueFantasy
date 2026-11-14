import { beats, ui } from '../content/beats.js'
import { termWall, termById, resolveNode, termGloss } from '../content/glossary.js'
import { createQuiz } from './quiz.js'
import { sealChars } from '../content/seal.js'

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

// 交互面板内的补充文案（重来按钮、漏水状态）。内容文件不在本角色改动范围，故就近放在 UI 层。
const CAULK_RESET_LABEL = { zh: '重来', en: 'Reset' }
const CAULK_RESET_ARIA = { zh: '重新开始补缝', en: 'Restart caulking' }
const FLOOD_STATUS = {
  'with-bulkheads': {
    zh: '有水密隔舱：一个舱进水，船体倾斜后稳住。',
    en: 'With bulkheads: one hold floods; the hull lists and settles.',
  },
  'without-bulkheads': {
    zh: '无隔舱：水沿船体漫过，船身下沉。',
    en: 'Without bulkheads: water runs the length of the hull and the ship sinks lower.',
  },
}

export function createOverlay({ reducedMotion, fallbackMode, handlers, initialLang = 'zh' }) {
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
    seal: $('seal'),
    quizStep: $('quiz-step'),
    quizQ: $('quiz-q'),
    quizOpts: $('quiz-opts'),
    quizWhy: $('quiz-why'),
    quizScore: $('quiz-score'),
    quizNext: $('quiz-next'),
  }
  const floodBtns = [...document.querySelectorAll('.flood-btn')]

  const quiz = createQuiz({
    stepEl: el.quizStep,
    qEl: el.quizQ,
    optsEl: el.quizOpts,
    whyEl: el.quizWhy,
    scoreEl: el.quizScore,
    nextEl: el.quizNext,
  })


  // 漏水状态读屏区：index.html 不在本次改动范围，运行时补一个 role=status 元素。
  const floodStatus = document.createElement('p')
  floodStatus.id = 'flood-status'
  floodStatus.className = 'caulk-status'
  floodStatus.setAttribute('role', 'status')
  floodStatus.setAttribute('aria-live', 'polite')
  el.floodUI.appendChild(floodStatus)
  el.caulkStatus.setAttribute('aria-live', 'polite')

  // 零件浮层：视觉层每帧重建（相机在动），所以 aria-live 放在一个常驻的隐藏 status 上，
  // 视觉浮层本身对辅助技术隐藏，避免同一句话被反复朗读。
  const partAnnounce = document.createElement('p')
  partAnnounce.id = 'part-announce'
  partAnnounce.className = 'sr-only'
  partAnnounce.setAttribute('role', 'status')
  partAnnounce.setAttribute('aria-live', 'polite')
  el.stage.appendChild(partAnnounce)
  el.partLabel.setAttribute('aria-hidden', 'true')
  let announcedPart = null

  // 「重来」按钮：三步完成后显示，点击回到补缝前状态。
  const caulkReset = document.createElement('button')
  caulkReset.type = 'button'
  caulkReset.className = 'caulk-step caulk-reset'
  caulkReset.hidden = true
  el.caulkSteps.insertAdjacentElement('afterend', caulkReset)

  let lang = initialLang === 'en' ? 'en' : 'zh'
  let beatIndex = -1
let lastInteractionBeat = -1
  let swapToken = 0
  let fMode = fallbackMode

  // 交互 UI 状态：语言切换 / 降级重绘后据此恢复，而不是重置成默认值。
  let caulkUIState = { stack: [], done: false, status: '' }
  let floodActiveName = 'with-bulkheads'
  let caulkErrorTimer = 0

  function clearCaulkErrorTimer() {
    if (caulkErrorTimer) {
      window.clearTimeout(caulkErrorTimer)
      caulkErrorTimer = 0
    }
  }

  // 错误提示 900ms 后自动消失；只清 status，不动 stack/done，按钮 is-done 保留。
  function scheduleCaulkErrorClear() {
    clearCaulkErrorTimer()
    caulkErrorTimer = window.setTimeout(() => {
      caulkErrorTimer = 0
      if (caulkUIState.status === 'wrong') {
        caulkUIState = { ...caulkUIState, status: '' }
        renderCaulkUI()
      }
    }, 900)
  }

  const t = (v) => v[lang]

  // 读屏文本：中文念「中文名 英文名，类型。解释」；英文念「英文名 编号 — 类型. 解释」
  function announceText(term, seq) {
    const typeLabel = t(ui.termType[term.type] || { zh: term.type, en: term.type })
    const gloss = termGloss[term.id]
    if (lang === 'en') {
      const name = seq ? `${term.en} ${seq}` : term.en
      return `${name} — ${typeLabel}.${gloss ? ' ' + gloss.en : ''}`
    }
    const name = seq ? `${term.zh} ${seq}` : term.zh
    return `${name} ${term.en}，${typeLabel}。${gloss ? gloss.zh : ''}`
  }

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
    if (beatIndex >= 0 && beats[beatIndex].interaction === 'terms') renderTerms()
    caulkReset.textContent = t(CAULK_RESET_LABEL)
    caulkReset.setAttribute('aria-label', t(CAULK_RESET_ARIA))
    caulkReset.disabled = fMode
    caulkReset.setAttribute('aria-disabled', String(fMode))

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

    // 窄屏折叠：默认只露前 4 条，其余点「展开全部」（桌面 CSS 里按钮不显示）
    const prev = el.termsTitle.nextElementSibling
    if (prev && prev.classList.contains('terms-more')) prev.remove()
    el.termsList.classList.remove('is-open')
    if (el.termsList.children.length > 3) {
      const more = document.createElement('button')
      more.type = 'button'
      more.className = 'terms-more'
      more.textContent = t({ zh: '展开全部', en: 'Show all terms' })
      more.addEventListener('click', () => {
        el.termsList.classList.add('is-open')
        more.remove()
      })
      el.termsTitle.after(more)
    }
  }

  function renderCaulkUI() {
    const buttons = [...el.caulkSteps.children]
    const locked = caulkUIState.done || fMode
    const focusWasOnStep = el.caulkSteps.contains(document.activeElement)
    buttons.forEach((b, i) => {
      b.classList.toggle('is-done', caulkUIState.done || caulkUIState.stack.includes(i))
      b.disabled = locked
      b.setAttribute('aria-disabled', String(locked))
    })
    caulkReset.hidden = !caulkUIState.done
    // 完成时第三步按钮变 disabled 会丢焦点，把焦点交给刚出现的「重来」。
    if (caulkUIState.done && focusWasOnStep) caulkReset.focus()
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

    if (el.seal) {
      el.seal.replaceChildren()
      if (sealChars[i]) {
        sealChars[i].zh.forEach((ch) => {
          const span = document.createElement('span')
          span.textContent = ch
          el.seal.appendChild(span)
        })
      }
    }
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
      clearCaulkErrorTimer()
      caulkUIState = { stack: [], done: false, status: '' }
      renderCaulkUI()
    }
    if (beat.interaction === 'flood') setFloodActive('with-bulkheads')
    // 只在真正换到这一屏时重置，b6/b7 边界抖动不打断答题
    if (beat.interaction === 'replay' && lastInteractionBeat !== i) quiz.reset()
    lastInteractionBeat = i
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
    const text = FLOOD_STATUS[name]
    floodStatus.textContent = text ? t(text) : ''
  }

  el.replay.addEventListener('click', () => handlers.onReplay())
  el.langToggle.addEventListener('click', () => handlers.onLangToggle())
  caulkReset.addEventListener('click', () => {
    handlers.onCaulkReset()
    // 重来按钮随即隐藏，焦点交给第一个可用步骤，键盘用户不会掉回 body。
    const first = el.caulkSteps.querySelector('.caulk-step:not(:disabled)')
    if (first) first.focus()
  })
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
      quiz.setLang(lang)
      // 浮层可能钉在某个零件上：换语言后让它按新语言重新朗读一次
      announcedPart = null
    },
    get lang() {
      return lang
    },
    setProgress(p) {
      el.fill.style.transform = `scaleX(${p})`
      el.bar.setAttribute('aria-valuenow', String(Math.round(p * 100)))
    },
    caulkFeedback(result, stack, done) {
      clearCaulkErrorTimer()
      caulkUIState = {
        stack: [...stack],
        done,
        status: result === 'wrong' ? 'wrong' : result === 'done' ? 'done' : '',
      }
      renderCaulkUI()
      if (result === 'wrong') scheduleCaulkErrorClear()
    },
    resetCaulk() {
      clearCaulkErrorTimer()
      caulkUIState = { stack: [], done: false, status: '' }
      renderCaulkUI()
    },
    setFloodActive,
    // 零件名称浮层：中 / 英 / 类型 / 一句解释（四类文字，上限见 docs/17-node-terms.md）
    showPartLabel(name) {
      const hit = resolveNode(name)
      if (!hit) {
        el.partLabel.hidden = true
        return
      }
      const { term, seq } = hit
      el.partLabel.innerHTML = ''
      const zh = document.createElement('strong')
      zh.textContent = seq ? `${term.zh} ${seq}` : term.zh
      const en = document.createElement('span')
      en.className = 'en'
      en.textContent = term.en
      const type = document.createElement('span')
      type.className = 't-type'
      type.textContent = t(ui.termType[term.type] || { zh: term.type, en: term.type })
      el.partLabel.append(zh, en, type)
      const gloss = termGloss[term.id]
      if (gloss) {
        const g = document.createElement('span')
        g.className = 'gloss'
        g.textContent = t(gloss)
        el.partLabel.append(g)
      }
      el.partLabel.hidden = false
      // 只在换成另一个零件时朗读，相机移动导致的重绘不触发
      if (announcedPart !== name) {
        announcedPart = name
        partAnnounce.textContent = announceText(term, seq)
      }
    },
    positionPartLabel(x, y) {
      // 浮层用 translate(-50%, -115%) 定位，所以 x 是中线、y 是底边之上。
      // 窄屏 / 零件靠近边缘时把浮层夹回视口内，否则会飘到屏幕外。
      const pad = 8
      const w = el.partLabel.offsetWidth
      const h = el.partLabel.offsetHeight
      const minX = w / 2 + pad
      const maxX = window.innerWidth - w / 2 - pad
      const minY = h * 1.15 + pad
      const maxY = window.innerHeight - pad
      const cx = Math.min(Math.max(x, minX), Math.max(minX, maxX))
      const cy = Math.min(Math.max(y, minY), Math.max(minY, maxY))
      el.partLabel.style.left = `${Math.round(cx)}px`
      el.partLabel.style.top = `${Math.round(cy)}px`
    },
    hidePartLabel() {
      el.partLabel.hidden = true
      announcedPart = null
    },
  }
}
