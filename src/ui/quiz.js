import { quizCopy, questions } from '../content/quiz.js'

// 第 7 屏的三问。一次只显示一题，答完给一句解释，三题后给结果。
// 状态存在这里，语言切换只重绘、不重置；重新进入第 7 屏才 reset。

export function createQuiz({ stepEl, qEl, optsEl, whyEl, scoreEl, nextEl }) {
  let lang = 'zh'
  let current = 0
  let answered = []
  let finished = false

  const t = (v) => v[lang]
  const fill = (v, n) => t(v).replace('{n}', String(n))

  function resetState() {
    current = 0
    answered = []
    finished = false
  }

  function renderOptions() {
    const q = questions[current]
    optsEl.innerHTML = ''
    optsEl.setAttribute('aria-label', t(q.q))
    q.options.forEach((opt, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'quiz-opt'
      b.textContent = t(opt)
      b.dataset.index = String(i)
      b.addEventListener('click', () => choose(i))
      if (answered[current] !== undefined) {
        b.disabled = true
        if (i === q.answer) b.classList.add('is-right')
        else if (i === answered[current]) b.classList.add('is-wrong')
      }
      optsEl.appendChild(b)
    })
  }

  function renderWhy() {
    const q = questions[current]
    const picked = answered[current]
    if (picked === undefined) {
      whyEl.hidden = true
      whyEl.textContent = ''
      whyEl.className = 'quiz-why'
      nextEl.hidden = true
      return
    }
    const ok = picked === q.answer
    whyEl.hidden = false
    whyEl.className = `quiz-why ${ok ? 'is-right' : 'is-wrong'}`
    whyEl.textContent = `${ok ? t(quizCopy.right) : t(quizCopy.wrong)}——${t(q.why)}`
    nextEl.hidden = false
    nextEl.textContent = current === questions.length - 1 ? t(quizCopy.finish) : t(quizCopy.next)
  }

  function render() {
    stepEl.textContent = finished ? t(quizCopy.score).replace('{n}', String(score())) : fill(quizCopy.progress, current + 1)
    qEl.textContent = finished ? '' : t(questions[current].q)
    qEl.hidden = finished
    optsEl.innerHTML = ''
    whyEl.hidden = true
    nextEl.hidden = true

    if (finished) {
      const n = score()
      scoreEl.hidden = false
      scoreEl.textContent = (n === questions.length ? `${t(quizCopy.score).replace('{n}', String(n))}。${t(quizCopy.done)}` : t(quizCopy.score).replace('{n}', String(n)))
      scoreEl.className = `quiz-score ${n === questions.length ? 'is-done' : ''}`
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'quiz-next'
      b.textContent = t(quizCopy.again)
      b.addEventListener('click', () => {
        resetState()
        scoreEl.hidden = true
        render()
      })
      optsEl.appendChild(b)
      return
    }

    scoreEl.hidden = true
    renderOptions()
    renderWhy()
  }

  function score() {
    return answered.reduce((sum, picked, i) => sum + (picked === questions[i].answer ? 1 : 0), 0)
  }

  function choose(i) {
    if (finished || answered[current] !== undefined) return
    answered[current] = i
    renderOptions()
    renderWhy()
    const b = optsEl.querySelector(`[data-index="${i}"]`)
    if (b) b.focus()
  }

  function advance() {
    if (finished) return
    if (current < questions.length - 1) {
      current += 1
      render()
      optsEl.querySelector('.quiz-opt')?.focus()
    } else {
      finished = true
      render()
    }
  }

  nextEl.addEventListener('click', advance)
  resetState()
  render()

  return {
    setLang(next) {
      lang = next
      render()
    },
    reset() {
      resetState()
      render()
    },
  }
}
