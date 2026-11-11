// 降级：?no3d=1 或 WebGL 不可用 → 隐藏 canvas，每个 beat 显示对应 SVG。
// SVG 用 <img loading="lazy">，不 inline。交互按钮由 overlay 在 fallbackMode 下禁用。

export function initFallback({ stageEl, img, base }) {
  stageEl.classList.add('is-fallback')
  // 纸面主题：整页切浅色，和 SVG 自带的纸底对齐
  document.body.classList.add('is-fallback')
  img.hidden = false

  return {
    setBeat(beat, lang) {
      const src = `${base}${beat.fallback}`
      if (!img.getAttribute('src') || !img.src.includes(beat.fallback)) {
        img.src = src
      }
      img.alt = beat.stageLabel[lang]
    },
  }
}
