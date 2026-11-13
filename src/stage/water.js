import * as THREE from 'three'

// 水面：一整片按舱分格的高度场。
// 顶点高度在 CPU 上按「每个舱的水位」写进 position 属性，
// 水位谁都能读、谁都能测，也不依赖自定义着色器（之前 onBeforeCompile + 裁剪克隆
// 的组合会让注入悄无声息地失效）。波纹交给法线贴图滚动做，几何保持平坦。
//
// 坐标沿用占位船体：船长 100（X）、船宽 28（Z）、船底 -12、舷顶 6。

const MAX_COMP = 16
const SEG_X = 140
const SEG_Z = 20
const X_MIN = -47
const X_MAX = 47
const Z_HALF = 13

// 可平铺的水波法线：多层正弦叠加生成一次，之后靠 offset 滚动
function makeRippleNormal(size = 256) {
  const data = new Uint8Array(size * size * 4)
  const height = new Float32Array(size * size)
  const waves = [
    { fx: 1, fy: 3, ph: 0.0, a: 1.0 },
    { fx: 3, fy: -2, ph: 1.7, a: 0.7 },
    { fx: 5, fy: 4, ph: 3.1, a: 0.45 },
    { fx: 8, fy: -7, ph: 0.6, a: 0.25 },
  ]
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * Math.PI * 2
      const v = (y / size) * Math.PI * 2
      let h = 0
      for (const w of waves) h += Math.sin(u * w.fx + v * w.fy + w.ph) * w.a
      height[y * size + x] = h
    }
  }
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)]
  const strength = 1.7
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const n = new THREE.Vector3(-dx, -dy, 1).normalize()
      const i = (y * size + x) * 4
      data[i] = (n.x * 0.5 + 0.5) * 255
      data[i + 1] = (n.y * 0.5 + 0.5) * 255
      data[i + 2] = (n.z * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 4)
  tex.needsUpdate = true
  return tex
}

// 船体半宽：占位船体轮廓的近似（艏艉收尖），用来给水面收边
function halfWidthAt(x) {
  const t = Math.min(1, Math.abs(x) / 50)
  return 14 * Math.pow(Math.max(0, 1 - Math.pow(t, 3)), 0.55)
}

// 船体宽度随高度收窄：舷顶最宽，船底收到 62%
function widthScaleAt(y) {
  const t = Math.min(1, Math.max(0, (y + 12) / 18))
  return 0.62 + 0.38 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85)
}

export function createWater({ floorY = -11.6 } = {}) {
  const geo = new THREE.PlaneGeometry(X_MAX - X_MIN, Z_HALF * 2, SEG_X, SEG_Z)
  geo.rotateX(-Math.PI / 2)
  geo.translate((X_MIN + X_MAX) / 2, 0, 0)

  const pos = geo.attributes.position
  const baseX = new Float32Array(pos.count)
  const baseZ = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i += 1) {
    baseX[i] = pos.getX(i)
    baseZ[i] = pos.getZ(i)
  }

  const normalMap = makeRippleNormal()
  const material = new THREE.MeshStandardMaterial({
    color: 0x24535c,
    roughness: 0.05,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geo, material)
  mesh.name = 'water_surface'
  mesh.visible = false
  mesh.renderOrder = 1

  let edges = [X_MIN, X_MAX]
  let levels = [floorY]
  let flows = [0]
  let blend = 0.01
  let comp = 1

  function compIndexAt(x) {
    let i = 0
    while (i < comp - 1 && x >= edges[i + 1]) i += 1
    return i
  }

  // 舱壁处 blend 宽度内线性过渡；blend≈0 时就是硬台阶（正好被舱壁板挡住）
  function levelAt(x) {
    const i = compIndexAt(x)
    let lvl = levels[i]
    const half = blend * 0.5
    if (half > 0.02) {
      if (i > 0 && x - edges[i] < half) {
        const w = (x - edges[i]) / half
        lvl = levels[i - 1] + (lvl - levels[i - 1]) * w
      } else if (i < comp - 1 && edges[i + 1] - x < half) {
        const w = (edges[i + 1] - x) / half
        lvl = levels[i + 1] + (lvl - levels[i + 1]) * w
      }
    }
    return lvl
  }

  function rebuild() {
    for (let k = 0; k < pos.count; k += 1) {
      const bx = baseX[k]
      const lvl = levelAt(bx)
      const i = compIndexAt(bx)
      // 舱壁处往里收 0.65，水位差藏在舱壁板后面，不会变成一张透明水幕
      const xIn = edges[i] + 0.65
      const xOut = edges[i + 1] - 0.65
      const x = xOut > xIn ? Math.min(Math.max(bx, xIn), xOut) : bx
      // 按船体轮廓收边：船底窄、舷顶宽，不收边会从船壳里穿出去
      const maxZ = Math.max(0.8, halfWidthAt(x) * widthScaleAt(lvl) - 1.2)
      pos.setX(k, x)
      pos.setZ(k, baseZ[k] * (maxZ / Z_HALF))
      pos.setY(k, lvl)
    }
    pos.needsUpdate = true
    geo.computeBoundingSphere()
  }

  function setEdges(xs) {
    const list = xs.slice(0, MAX_COMP + 1)
    comp = Math.max(1, list.length - 1)
    edges = list.slice()
    levels = new Array(comp).fill(floorY)
    flows = new Array(comp).fill(0)
    rebuild()
  }

  function setLevels(next) {
    for (let i = 0; i < comp; i += 1) levels[i] = next[i]
    rebuild()
  }

  function setFlows(next) {
    for (let i = 0; i < comp; i += 1) flows[i] = next[i] || 0
  }

  function setBlend(v) {
    const next = Math.max(0.01, v)
    if (Math.abs(next - blend) > 0.05) {
      blend = next
      rebuild()
    }
  }

  function update(dt) {
    normalMap.offset.x = (normalMap.offset.x + dt * 0.03) % 1
    normalMap.offset.y = (normalMap.offset.y + dt * 0.018) % 1
  }

  return {
    mesh,
    material,
    floorY,
    setEdges,
    setLevels,
    setFlows,
    setBlend,
    update,
    get compartments() {
      return comp
    },
  }
}
