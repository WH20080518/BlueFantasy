// 降级：?no3d=1 或 WebGL 不可用 → 隐藏 canvas，每个 beat 显示对应 SVG。
// 双缓冲交叉淡入：两张图叠在同一个 stage 里换源，滚动再快也不会闪一下白底。
// 动效只碰 opacity / transform，且整体尊重 prefers-reduced-motion。

export function initFallback({ stageEl, img, base }) {
  stageEl.classList.add('is-fallback')
  // 纸面主题：整页切浅色，和 SVG 自带的纸底对齐
  document.body.classList.add('is-fallback')

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  const back = document.createElement('img')
  back.className = 'stage-fallback'
  back.alt = ''
  back.decoding = 'async'
  back.setAttribute('aria-hidden', 'true')

  img.hidden = false
  img.classList.add('is-on')
  img.after(back)

  let front = img
  let spare = back
  let srcNow = img.getAttribute('src') || ''
  let token = 0

  const swapTo = (next, src, alt) => {
    // 减少动效时 next 就是当前层：原地换源，不做过场
    if (next === front) {
      front.src = src
      front.alt = alt
      front.removeAttribute('aria-hidden')
      front.classList.add('is-on')
      return
    }
    next.src = src
    next.alt = alt
    next.removeAttribute('aria-hidden')
    front.setAttribute('aria-hidden', 'true')
    // 层级靠 CSS 的 z-index 决定；不在这里重排 DOM，否则元素被重新挂载会吃掉过渡
    next.classList.add('is-on')
    front.classList.remove('is-on')
    front.alt = ''
    const old = front
    front = next
    spare = old
  }

  return {
    setBeat(beat, lang) {
      const src = `${base}${beat.fallback}`
      const alt = beat.stageLabel[lang]

      // 同一张不重复切换：只更新 alt，避免滚动抖动时反复过场
      if (src === srcNow) {
        front.alt = alt
        return
      }
      srcNow = src

      // 减少动效：直接换源，不做交叉淡入
      if (reduced.matches) {
        swapTo(front, src, alt)
        return
      }

      const next = spare
      const my = ++token
      next.src = src

      // 解码完成再上屏，避免 SVG 还没画出来就开始淡入
      const reveal = () => {
        if (my !== token) return
        requestAnimationFrame(() => {
          if (my !== token) return
          swapTo(next, src, alt)
        })
      }
      if (typeof next.decode === 'function') {
        next.decode().then(reveal).catch(reveal)
      } else {
        next.addEventListener('load', reveal, { once: true })
      }
    },

    hide() {
      token++
      img.hidden = true
      img.classList.remove('is-on')
      back.classList.remove('is-on')
      back.remove()
    },
  }
}
