// 漏水实验状态机（beat 5）。
// 两个状态：with-bulkheads / without-bulkheads。切换可中断、可重复播放，目标 1.2s 内收敛。

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

  return {
    get active() {
      return active
    },
    // replay=true 时先复位到干船再播一遍
    setState(name, { replay = false } = {}) {
      if (!PRESETS[name]) return
      if (replay || active === name) snapDry()
      active = name
      target = PRESETS[name]()
      if (reducedMotion()) {
        Object.assign(state, target)
        apply()
      }
    },
    // 真模型替换占位几何后，重新登记隔舱材质，否则淡出作用在旧网格上
    rebindBulkheads(list) {
      bulkMats.length = 0
      list.forEach((g) =>
        g.traverse((o) => {
          if (!o.isMesh || !o.material) return
          o.material.transparent = true
          bulkMats.push(o.material)
        }),
      )
    },
    reset() {
      active = null
      target = null
      snapDry()
    },
    update(dt) {
      if (!target) return
      const k = 1 - Math.exp(-dt * 4.5)
      let settled = true
      for (const key of Object.keys(target)) {
        const next = state[key] + (target[key] - state[key]) * k
        if (Math.abs(next - target[key]) > 0.01) settled = false
        state[key] = next
      }
      if (settled) {
        Object.assign(state, target)
        target = null
      }
      apply()
    },
  }
}
