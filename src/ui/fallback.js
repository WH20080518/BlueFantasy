// 降级：?no3d=1 或 WebGL 不可用 → 隐藏 canvas，每个 beat 显示对应 SVG。
// SVG 用 <img loading="lazy">，不 inline。交互按钮由 overlay 在 fallbackMode 下禁用。

export function initFallback({ stageEl, img, base }) {
  stageEl.classList.add('is-fallback')
  // 纸面主题：整页切浅色，和 SVG 自带的纸底对齐
  document.body.classList.add('is-fallback')
  img.hidden = false

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  return {
    setBeat(beat, lang) {
      const src = `${base}${beat.fallback}`
      img.alt = beat.stageLabel[lang]

      // 同一张不重复切换，避免抖动时反复闪烁
      if (img.getAttribute('src') === src) return

      if (reduced.matches) {
        img.src = src
        return
      }

      // 淡出 → 换源 → 解码完成再淡入（200ms 过渡，CSS 里定义）
      img.style.opacity = '0'
      img.src = src
      const show = () => {
        img.style.opacity = '1'
      }
      if (typeof img.decode === 'function') {
        img.decode().then(() => requestAnimationFrame(show)).catch(show)
      } else {
        img.addEventListener('load', show, { once: true })
      }
    },
  }
}
