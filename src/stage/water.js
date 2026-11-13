import * as THREE from 'three'

// 水面 + 水体：两张网格配合，俯看是水面，侧看是水体。
// - surface：按舱水位的高度场（CPU 写顶点），波纹靠法线贴图滚动
// - body：沿船壳内壁从船底立到水位的两组竖面，侧视时给出「水下」的厚度
// 水位谁都能读、谁都能测，不依赖自定义着色器。
//
// 坐标沿用占位船体：船长 100（X）、船宽 28（Z）、船底 -12、舷顶 6。

const MAX_COMP = 16
const SEG_X = 140
const SEG_Z = 20
const X_MIN = -40
const X_MAX = 40
const Z_HALF = 13
const BODY_SAMPLES = 72

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

// 船体半宽：占位船体轮廓的近似（艏艉收尖），给水面和水体收边
function halfWidthAt(x) {
  // 水面只铺到 ±40（平行中体），再往艏艉船体收得太快，硬铺会穿出船壳
  const t = Math.min(1, Math.abs(x) / 56)
  return 14 * Math.pow(Math.max(0, 1 - Math.pow(t, 3)), 0.5)
}

// 船底纵剖高度：中段近乎水平，艏艉抬起。水体下缘要贴着它，不然会从船底穿出去
function bottomAt(x, floorY) {
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 20) / 26))
  return floorY + 6.2 * t * t
}

// 船体宽度随高度收窄：舷顶最宽，船底收到 62%
function widthScaleAt(y) {
  const t = Math.min(1, Math.max(0, (y + 12) / 18))
  return 0.62 + 0.38 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85)
}

export function createWater({ floorY = -11.6 } = {}) {
  const normalMap = makeRippleNormal()

  /* ---------- 水面 ---------- */
  const geo = new THREE.PlaneGeometry(X_MAX - X_MIN, Z_HALF * 2, SEG_X, SEG_Z)
  geo.rotateX(-Math.PI / 2)
  geo.translate((X_MIN + X_MAX) / 2, 0, 0)

  const pos = geo.attributes.position
  const baseX = new Float32Array(pos.count)
  const baseZ = new Float32Array(pos.count)
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3))
  const colorAttr = geo.attributes.color
  for (let i = 0; i < pos.count; i += 1) {
    baseX[i] = pos.getX(i)
    baseZ[i] = pos.getZ(i)
  }

  // 第二层法线：同一张图不同缩放/流向，两层叠加才不会看出平铺
  const normalMap2 = normalMap.clone()
  normalMap2.repeat.set(3.2, 1.6)
  normalMap2.needsUpdate = true

  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x2a6570,
    roughness: 0.08,
    metalness: 0.06,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    vertexColors: true,
  })

  // 参考 stylized water 的常规做法：两层法线叠加 + 菲涅尔控透明度。
  // 这两份材质是水独占的，不会被剖切逻辑克隆，注入是安全的。
  surfaceMat.onBeforeCompile = (shader) => {
    shader.uniforms.uNormalB = { value: normalMap2 }
    shader.uniforms.uNormalBScale = { value: new THREE.Vector2(0.55, 0.55) }
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying float vViewDist;',
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\nvViewDist = -mvPosition.z;',
    )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uNormalB;
        uniform vec2 uNormalBScale;
        varying float vViewDist;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // 第二层法线：低速反向流动，跟第一层叠加成不规则的水纹
          vec3 mapB = texture2D(uNormalB, vNormalMapUv * vec2(1.7, 0.9) + vec2(0.13, -0.07)).xyz * 2.0 - 1.0;
          mapB.xy *= uNormalBScale;
          normal = normalize(normal + normalize(tbn * mapB) * 0.6);
        }`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          // 菲涅尔：正视看进去透，掠射角接近镜面——这样侧视时才像水
          vec3 V = normalize(vViewPosition);
          float fres = pow(1.0 - clamp(dot(normal, V), 0.0, 1.0), 2.6);
          gl_FragColor.a = mix(gl_FragColor.a, 0.93, fres);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.62, 0.76, 0.79), fres * 0.16);
        }`,
      )
  }

  const surface = new THREE.Mesh(geo, surfaceMat)
  surface.name = 'water_surface'
  surface.renderOrder = 2

  /* ---------- 水体（侧视时看得到水下厚度） ---------- */
  const bodyGeo = new THREE.BufferGeometry()
  const bodyPos = new Float32Array(BODY_SAMPLES * 4 * 3 * 3) // 每段 2 个四边形 = 4 三角形
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3))
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x081f27,
    roughness: 0.55,
    metalness: 0.0,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 0.15,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.name = 'water_body'
  body.renderOrder = 3
  body.frustumCulled = false

  const group = new THREE.Group()
  group.name = 'water'
  group.add(body, surface)
  group.visible = false

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

  function insetX(bx, i) {
    const xIn = edges[i] + 1.0
    const xOut = edges[i + 1] - 1.0
    return xOut > xIn ? Math.min(Math.max(bx, xIn), xOut) : bx
  }

  function halfWidthFor(x, lvl) {
    return Math.max(0.6, halfWidthAt(x) * widthScaleAt(lvl) - 1.4)
  }

  function rebuildSurface() {
    for (let k = 0; k < pos.count; k += 1) {
      const bx = baseX[k]
      const i = compIndexAt(bx)
      let lvl = levelAt(bx)
      // 舱壁处不平移顶点（平移会在接缝处立起一张竖直水幕），
      // 而是把邻近舱壁的那一圈顶点压到两侧较低的水位：
      // 高水位那侧在舱壁前收一个小斜面，视觉上像水被挡板拦住
      // 过渡带放宽到 2.6：窄了会变成一堵近竖直的水墙（就是画面里那块发白的竖片），
      // 放宽后是一段斜面，再配深色顶点色，看起来像舱壁根部的湿面
      let lip = 0
      if (i > 0 && bx - edges[i] < 2.6) {
        lip = Math.max(lip, 1 - (bx - edges[i]) / 2.6)
        lvl = Math.min(lvl, levels[i - 1] + (lvl - levels[i - 1]) * ((bx - edges[i]) / 2.6))
      }
      if (i < comp - 1 && edges[i + 1] - bx < 2.6) {
        lip = Math.max(lip, 1 - (edges[i + 1] - bx) / 2.6)
        lvl = Math.min(lvl, levels[i + 1] + (lvl - levels[i + 1]) * ((edges[i + 1] - bx) / 2.6))
      }
      const x = bx
      const maxZ = halfWidthFor(x, lvl)
      // 该处船底已经高于水位，说明这一段根本没泡到水，把它压到船底高度藏起来
      const bottom = bottomAt(x, floorY)
      const y = lvl <= bottom + 0.05 ? bottom : lvl
      pos.setX(k, x)
      pos.setZ(k, baseZ[k] * (maxZ / Z_HALF))
      pos.setY(k, y)
      // 水浅的地方偏亮偏青，深的地方压暗，剖开的舱室才有纵深
      const depth = Math.max(0, y - bottom)
      const t = Math.min(1, depth / 9)
      // 舱壁根部压暗：过渡斜面在阴影里，不会跳出来
      const shade = 1 - lip * 0.45
      colorAttr.setXYZ(k, (1.05 - t * 0.5) * shade, (1.0 - t * 0.42) * shade, (1.0 - t * 0.3) * shade)
    }
    pos.needsUpdate = true
    colorAttr.needsUpdate = true
    geo.computeBoundingSphere()
  }

  // 水体：沿 x 采样，取船壳内壁高度上的半宽，从船底立到水位
  function rebuildBody() {
    let ptr = 0
    let any = false
    for (let s = 0; s < BODY_SAMPLES; s += 1) {
      const x0 = X_MIN + ((X_MAX - X_MIN) * s) / BODY_SAMPLES
      const x1 = X_MIN + ((X_MAX - X_MIN) * (s + 1)) / BODY_SAMPLES
      const l0 = levelAt(x0)
      const l1 = levelAt(x1)
      const b0 = bottomAt(x0, floorY)
      const b1 = bottomAt(x1, floorY)
      if (l0 <= b0 + 0.02 && l1 <= b1 + 0.02) continue
      const w0 = halfWidthFor(x0, l0)
      const w1 = halfWidthFor(x1, l1)
      for (const sign of [1, -1]) {
        const z0 = w0 * sign
        const z1 = w1 * sign
        // 四边形拆两个三角形
        bodyPos[ptr] = x0; bodyPos[ptr + 1] = b0; bodyPos[ptr + 2] = z0
        bodyPos[ptr + 3] = x0; bodyPos[ptr + 4] = Math.max(l0, b0); bodyPos[ptr + 5] = z0
        bodyPos[ptr + 6] = x1; bodyPos[ptr + 7] = Math.max(l1, b1); bodyPos[ptr + 8] = z1
        ptr += 9
        bodyPos[ptr] = x1; bodyPos[ptr + 1] = Math.max(l1, b1); bodyPos[ptr + 2] = z1
        bodyPos[ptr + 3] = x1; bodyPos[ptr + 4] = b1; bodyPos[ptr + 5] = z1
        bodyPos[ptr + 6] = x0; bodyPos[ptr + 7] = b0; bodyPos[ptr + 8] = z0
        ptr += 9
        any = true
      }
    }
    for (let i = ptr; i < bodyPos.length; i += 1) bodyPos[i] = 0
    bodyGeo.attributes.position.needsUpdate = true
    bodyGeo.setDrawRange(0, ptr / 3)
    // 只有 position 时法线会被当成默认值，竖向水面的受光就不对；补算一次
    if (ptr > 0) bodyGeo.computeVertexNormals()
    body.visible = any
  }

  function rebuild() {
    rebuildSurface()
    rebuildBody()
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
    let changed = false
    for (let i = 0; i < comp; i += 1) {
      if (Math.abs(levels[i] - next[i]) > 0.002) changed = true
      levels[i] = next[i]
    }
    // 水位收敛后不再逐帧重建
    if (changed) rebuild()
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
    normalMap2.offset.x = (normalMap2.offset.x - dt * 0.021) % 1
    normalMap2.offset.y = (normalMap2.offset.y + dt * 0.012) % 1
  }

  setEdges(edges)

  return {
    group,
    mesh: group,
    materials: [surfaceMat, bodyMat],
    surface,
    body,
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
