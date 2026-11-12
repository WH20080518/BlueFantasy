// 漏水实验状态机（beat 5）。
// 两个状态：with-bulkheads / without-bulkheads。切换可中断、可重复播放，目标 1.2s 内收敛。
// 互斥 + 排队：转场进行中只记录「最后一次」请求，当前转场收敛后再执行，不叠加多次补间。

const DRY = { shipY: 0, list: 0, compWater: null, fullWater: null, bulkOpacity: 1 }

export function createFlood(refs, reducedMotion) {
  // refs: { ship, compWater, fullWater, bulkheads[], water: {hiddenY, compLevel, fullLevel} }
  const { ship, compWater, fullWater, bulkheads, water } = refs
  const bulkMats = []
  bulkheads.forEach((b) =>
    b.traverse((o) => {
      if (o.isMesh) {
        o.material.transparent = true
        bulkMats.push(o.material)
      }
    }),
  )

  const state = { ...DRY, compWater: water.hiddenY, fullWater: water.hiddenY }
  let target = null
  let active = null
  // 转场中收到的请求：只保留最后一个，避免连点叠加。
  let pending = null

  function apply() {
    ship.position.y = state.shipY
    ship.rotation.z = state.list
    compWater.position.y = state.compWater
    compWater.visible = state.compWater > water.hiddenY + 0.05
    fullWater.position.y = state.fullWater
    fullWater.visible = state.fullWater > water.hiddenY + 0.05
    bulkMats.forEach((m) => {
      m.opacity = state.bulkOpacity
      m.depthWrite = state.bulkOpacity > 0.5
    })
  }

  function snapDry() {
    Object.assign(state, { shipY: 0, list: 0, compWater: water.hiddenY, fullWater: water.hiddenY, bulkOpacity: 1 })
    apply()
  }

  const PRESETS = {
    // 有水密隔舱：仅 bulkhead_02 左侧舱进水到舱高 80%，船体倾斜 2° 后稳住
    'with-bulkheads': () => ({ shipY: 0, list: (2 * Math.PI) / 180, compWater: water.compLevel, fullWater: water.hiddenY, bulkOpacity: 1 }),
    // 无隔舱：水面升到船深 60%，船体下沉 8 单位
    'without-bulkheads': () => ({ shipY: -8, list: 0, compWater: water.hiddenY, fullWater: water.fullLevel, bulkOpacity: 0.06 }),
  }

  // 开始一次转场（调用方保证当前没有进行中的转场）。
  function begin(name, replay) {
    if (replay || active === name) snapDry()
    active = name
    target = PRESETS[name]()
    if (reducedMotion()) {
      Object.assign(state, target)
      target = null
      apply()
    }
  }

  return {
    get active() {
      return active
    },
    // replay=true 时先复位到干船再播一遍
    setState(name, { replay = false } = {}) {
      if (!PRESETS[name]) return
      // 互斥：转场中不开启第二条补间。
      if (target) {
        // 当前转场本来就指向该状态：重复点击忽略，不排队、不重播。
        // 同时取消已排队的其他目标，保证「最后一次点击」生效。
        if (name === active) {
          pending = null
          return
        }
        // 转向其他状态：只保留最后一次请求，收敛后再执行。
        if (pending && pending.name === name) pending.replay = pending.replay || replay
        else pending = { name, replay }
        return
      }
      begin(name, replay)
    },
    reset() {
      active = null
      target = null
      pending = null
      snapDry()
    },
    update(dt) {
      if (!target) {
        // 理论上 pending 会在收敛时立即出队；这里兜底，保证请求不丢。
        if (pending) {
          const next = pending
          pending = null
          begin(next.name, next.replay)
        }
        return
      }
      const k = 1 - Math.exp(-dt * 5.6)
      let settled = true
      for (const key of Object.keys(target)) {
        const next = state[key] + (target[key] - state[key]) * k
        if (Math.abs(next - target[key]) > 0.01) settled = false
        state[key] = next
      }
      if (settled) {
        Object.assign(state, target)
        target = null
        // 当前转场收敛后再执行排队中的最后一次请求。
        if (pending) {
          const next = pending
          pending = null
          begin(next.name, next.replay)
        }
      }
      apply()
    },
  }
}
