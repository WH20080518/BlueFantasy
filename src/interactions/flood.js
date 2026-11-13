// 漏水实验（beat 5）：按舱分格的水位模拟。
//
// 不再是「一张板子升降」，而是：
// - 每个舱存自己的水位，破口舱持续进水；
// - 有水密隔舱时，舱与舱之间不连通，水只留在破口那一格，船倾一个小角度稳住；
// - 抽掉隔舱板后相邻舱连通，按水头差逐帧交换水量，水自己漫过去，船随总水量下沉。
// 体积在交换过程中守恒（dV 从一个舱扣掉、加到邻居），所以看上去是水在流，不是数值在插值。

const DRY_SINK = 0

export function createFlood({ ship, water, bulkheads = [], floorY = -11.6, topY = 5.2 }) {
  const bulkMats = []
  const collectBulkMats = () => {
    bulkMats.length = 0
    bulkheads.forEach((b) =>
      b.traverse((o) => {
        if (!o.isMesh || !o.material) return
        o.material.transparent = true
        bulkMats.push(o.material)
      }),
    )
  }
  collectBulkMats()

  let edges = [-47, 47]
  let levels = [floorY]
  let areas = [1]
  let volumes = [0]
  let flows = [0]
  let comp = 1

  // 破口：船艉侧第二个舱（与文案「一个舱破了」对应）
  let breachIndex = 0

  const state = {
    mode: 'dry', // dry | with-bulkheads | without-bulkheads
    open: 0, // 舱壁「被抽掉」的进度 0..1
    sink: DRY_SINK,
    pitch: 0,
    bulkOpacity: 1,
  }

  const capacity = () => {
    const h = Math.max(0.001, topY - floorY)
    return areas.reduce((s, a) => s + a * h, 0)
  }

  function setLayout(nextEdges) {
    edges = nextEdges.slice()
    comp = Math.max(1, edges.length - 1)
    areas = []
    for (let i = 0; i < comp; i += 1) areas.push(Math.max(0.15, edges[i + 1] - edges[i]))
    volumes = new Array(comp).fill(0)
    levels = new Array(comp).fill(floorY)
    flows = new Array(comp).fill(0)
    // 破口放在船艏侧偏中（x≈+14）：这一块在镜头里不会被左侧文案面板压住
    const TARGET_X = 14
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < comp; i += 1) {
      const cx = (edges[i] + edges[i + 1]) / 2
      const d = Math.abs(cx - TARGET_X)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    breachIndex = best
    water.setEdges(edges)
    water.setBlend(state.open * 3.6)
    water.setLevels(levels)
    water.setFlows(flows)
    water.mesh.visible = false
    state.sink = 0
    state.pitch = 0
    ship.position.y = 0
    ship.rotation.z = 0
  }

  setLayout(edges)

  const maxLevel = topY - 1.2
  const compartmentCap = () => (maxLevel - floorY) * 0.8

  function levelsFromVolumes() {
    for (let i = 0; i < comp; i += 1) {
      const lvl = floorY + Math.max(0, volumes[i]) / areas[i]
      levels[i] = Math.min(maxLevel, Math.max(floorY, lvl))
      volumes[i] = Math.max(0, Math.min(volumes[i], (maxLevel - floorY) * areas[i]))
    }
  }

  function totalVolume() {
    let t = 0
    for (let i = 0; i < comp; i += 1) t += volumes[i]
    return t
  }

  function stepPhysics(dt) {
    const k = Math.min(0.06, dt) // 大 dt 时限制步长，避免数值炸开
    const filling = state.mode === 'with-bulkheads' || (state.mode === 'without-bulkheads' && state.open > 0.15)

    // 破口进水：水头越高进得越慢，接近满舱时收敛
    if (filling) {
      const head = compartmentCap() - (levels[breachIndex] - floorY)
      if (head > 0) {
        const q = Math.min(head, k * 5.2 * Math.min(1, head / 2.2 + 0.25))
        volumes[breachIndex] += q * areas[breachIndex]
      }
    }

    // 相邻舱按水头差交换：open=0 时完全隔断，open=1 时自由连通。
    // 每条边的流量都要受两端实际存量约束，否则小舱同时向两侧出水会被抽成负体积。
    if (state.open > 0.01) {
      flows.fill(0)
      for (let i = 0; i < comp - 1; i += 1) {
        const dh = levels[i] - levels[i + 1]
        if (Math.abs(dh) < 0.005) continue
        const rate = Math.min(Math.abs(dh), k * 7.5 * state.open)
        let dV = Math.sign(dh) * rate * Math.min(areas[i], areas[i + 1])
        // 出水舱最多把存水放干；进水舱最多灌到上限水位
        if (dV > 0) {
          dV = Math.min(dV, Math.max(0, volumes[i]))
          const room = (maxLevel - floorY) * areas[i + 1] - volumes[i + 1]
          dV = Math.min(dV, Math.max(0, room))
        } else {
          dV = -Math.min(-dV, Math.max(0, volumes[i + 1]))
          const room = (maxLevel - floorY) * areas[i] - volumes[i]
          dV = -Math.min(-dV, Math.max(0, room))
        }
        volumes[i] -= dV
        volumes[i + 1] += dV
        flows[i] = Math.max(flows[i], Math.abs(dV) / Math.min(areas[i], areas[i + 1]))
        flows[i + 1] = Math.max(flows[i + 1], Math.abs(dV) / Math.min(areas[i], areas[i + 1]))
      }
    } else {
      flows.fill(0)
    }

    levelsFromVolumes()

    // 下沉：按总水量占舱容的比例
    const fill = Math.min(1, totalVolume() / (capacity() * 0.55))
    const wantSink = -fill * 8.4

    // 纵倾：水的重心偏艉还是偏艏（船体 X 轴为艏艉，Z 轴旋转即纵倾）
    let moment = 0
    let vol = 0
    for (let i = 0; i < comp; i += 1) {
      const cx = (edges[i] + edges[i + 1]) / 2
      moment += volumes[i] * cx
      vol += volumes[i]
    }
    const wantPitch = vol > 0.01 ? Math.max(-0.045, Math.min(0.045, (moment / vol) * 0.0011)) : 0

    const kk = 1 - Math.exp(-dt * 3.2)
    state.sink += (wantSink - state.sink) * kk
    state.pitch += (wantPitch - state.pitch) * kk

    const wantOpacity = state.mode === 'without-bulkheads' ? 0.07 : 1
    state.bulkOpacity += (wantOpacity - state.bulkOpacity) * (1 - Math.exp(-dt * 6))
    if (state.mode === 'without-bulkheads') state.open = Math.min(1, state.open + dt * 2.2)
    else state.open = Math.max(0, state.open - dt * 3.4)

    ship.position.y = state.sink
    ship.rotation.z = state.pitch
    bulkMats.forEach((m) => {
      m.opacity = state.bulkOpacity
      m.depthWrite = state.bulkOpacity > 0.5
    })

    water.setBlend(state.open * 3.6)
    water.setLevels(levels)
    water.setFlows(flows)
    water.mesh.visible = totalVolume() > 0.01
  }

  return {
    get active() {
      return state.mode
    },
    get breach() {
      return breachIndex
    },
    // 调试：外部可直接看模拟内部状态
    debug() {
      return {
        mode: state.mode,
        open: state.open,
        sink: state.sink,
        volumes: volumes.slice(),
        levels: levels.slice(),
        areas: areas.slice(),
        street: comp,
      }
    },
    setLayout,

    setState(name, { replay = false } = {}) {
      if (name !== 'with-bulkheads' && name !== 'without-bulkheads') return
      if (replay || state.mode === name) {
        volumes.fill(0)
        levels.fill(floorY)
        state.sink = 0
        state.pitch = 0
        state.open = 0
        state.bulkOpacity = 1
      }
      // 从「无隔舱」切回「有隔舱」时，先前漫出去的水必须清掉：
      // 隔舱板重新装回去，那几格水不会凭空留在原地，演示要回到「只有破口舱进水」
      if (name === 'with-bulkheads' && state.mode !== 'with-bulkheads') {
        volumes.fill(0)
        levels.fill(floorY)
        state.sink = 0
        state.pitch = 0
        state.bulkOpacity = 1
      }
      state.mode = name
      if (name === 'with-bulkheads') state.open = 0
    },

    // 真模型替换占位几何后重新登记隔舱材质
    rebindBulkheads(list) {
      bulkheads = list
      collectBulkMats()
    },

    reset() {
      state.mode = 'dry'
      state.open = 0
      state.sink = 0
      state.pitch = 0
      state.bulkOpacity = 1
      volumes.fill(0)
      levels.fill(floorY)
      flows.fill(0)
      ship.position.y = 0
      ship.rotation.z = 0
      bulkMats.forEach((m) => {
        m.opacity = 1
        m.depthWrite = true
      })
      water.setLevels(levels)
      water.setFlows(flows)
      water.mesh.visible = false
    },

    update(dt) {
      if (state.mode === 'dry') {
        water.update(dt)
        return
      }
      stepPhysics(dt)
      water.update(dt)
    },
  }
}
