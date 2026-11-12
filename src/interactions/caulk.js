// 补缝三步状态机（beat 3）。顺序：榫卯 → 铁钉 → 捻缝。
// 顺序错：caulk_layer 渗水色闪烁 + 提示，但已完成步骤保留（is-done 不清）。
// 提示由 UI 在 900ms 后自动清除。三步完成：缝闭合。

import { PALETTE } from '../stage/placeholder.js'

const ORDER = [0, 1, 2]

export function createCaulk(refs, reducedMotion) {
  // refs: { upper, lower, marker, caulk, nails(Group), openY, closedY }
  const { upper, lower, marker, caulk, nails, openY, closedY } = refs
  const caulkBase = PALETTE.paper
  let stack = []
  let done = false
  let flashT = 0

  function applyFlash() {
    if (flashT > 0) {
      const on = Math.floor(flashT * 7) % 2 === 0
      caulk.material.color.setHex(on ? PALETTE.cinnabar : caulkBase)
      caulk.visible = true
      marker.visible = true
      marker.material.color.setHex(on ? PALETTE.cinnabar : PALETTE.paper)
    } else {
      caulk.material.color.setHex(caulkBase)
      marker.material.color.setHex(PALETTE.paper)
    }
  }

  return {
    get stack() {
      return stack
    },
    get done() {
      return done
    },
    push(step) {
      if (done) return 'done'
      if (step === ORDER[stack.length]) {
        stack = [...stack, step]
        if (stack.length === ORDER.length) {
          done = true
          return 'done'
        }
        return 'step'
      }
      // 顺序错：只闪渗水提示，不抹掉已完成的步骤（按钮 is-done 保留）。
      flashT = 1
      return 'wrong'
    },
    reset() {
      stack = []
      done = false
      flashT = 0
      upper.position.y = openY
      lower.position.y = -openY
      applyFlash()
    },
    // localT：beat 内滚动进度，用于分层预览（钉与捻缝随滚动淡入提示位）
    update(dt, localT = 1) {
      if (flashT > 0) {
        flashT = Math.max(0, flashT - dt / 0.9)
        applyFlash()
      }
      const nailed = done || stack.includes(1) || localT > 0.35
      const caulked = done || stack.includes(2) || localT > 0.7
      nails.visible = nailed
      if (flashT === 0) {
        caulk.visible = caulked
        marker.visible = stack.includes(0) || done
      }
      const targetY = done ? closedY : openY
      if (reducedMotion()) {
        upper.position.y = targetY
        lower.position.y = -targetY
      } else {
        const k = 1 - Math.exp(-dt * 6)
        upper.position.y += (targetY - upper.position.y) * k
        lower.position.y += (-targetY - lower.position.y) * k
      }
    },
  }
}
