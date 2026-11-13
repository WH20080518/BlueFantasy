import * as THREE from 'three'
import { createFluidSolver } from './fluid.js'

// 水面 + 水体。
//
// 分工：
// - 水位、连通、体积守恒：flood.js 的 CPU 模拟（可测、可断言）
// - 这里的几何：按舱水位写顶点，给出水面的形状和水体的轮廓
// - 表面的细节：GPU 流体（fluid.js，Stable Fluids）推动的染料/速度场，
//   水面着色器拿它扰动法线和生成泡沫；没有半浮点支持时自动退回纯程序化波纹
//
// 之前那版「像玻璃」的根源是：只有标准材质的 envMap 反射、没有吸收、没有泡沫，
// 掠射角整片泛白。现在改成手写着色器：菲涅尔反射 + 体积吸收 + 泡沫遮罩。

const MAX_COMP = 16
const NX = 12 // 每舱沿 x 的网格段数
const NZ = 8 // 沿 z 的段数
const INSET = 0.62 // 距舱壁板的间隙（板半厚 0.6，再留 0.02 防 z-fighting）
const X_MIN = -40
const X_MAX = 40
const Z_HALF = 13
const MAX_Q = MAX_COMP * NX * NZ

const CLIP_PARS_VERT = '#include <clipping_planes_pars_vertex>'
const CLIP_VERT = '#include <clipping_planes_vertex>'
const CLIP_PARS_FRAG = '#include <clipping_planes_pars_fragment>'
const CLIP_FRAG = '#include <clipping_planes_fragment>'

// 可平铺的水波法线（程序生成，避开外部素材授权问题）
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
  tex.needsUpdate = true
  return tex
}

// 船体半宽：水面只铺到平行中体，再往艏艉船壳收得太快
function halfWidthAt(x) {
  const t = Math.min(1, Math.abs(x) / 56)
  return 14 * Math.pow(Math.max(0, 1 - Math.pow(t, 3)), 0.5)
}

// 船底纵剖：中段近水平，艏艉抬起
function bottomAt(x, floorY) {
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 20) / 26))
  return floorY + 6.2 * t * t
}

// 船体宽度随高度收窄
function widthScaleAt(y) {
  const t = Math.min(1, Math.max(0, (y + 12) / 18))
  return 0.62 + 0.38 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85)
}

const SURFACE_VERT = /* glsl */ `
precision highp float;
attribute vec3 color;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv2;
varying float vDepthC;
${CLIP_PARS_VERT}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vUv2 = uv;
  vDepthC = color.r;
  // 名字必须是 mvPosition：three 的 clipping_planes_vertex 里会读它
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${CLIP_VERT}
}
`

const SURFACE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uRipple;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float uTime;
uniform float uFluid;
uniform float uOpacity;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uSunDir;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv2;
varying float vDepthC;
${CLIP_PARS_FRAG}

void main() {
  ${CLIP_FRAG}

  vec3 V = normalize(cameraPosition - vWorldPos);

  // 两层法线：一层程序化波纹，一层由流体速度场拉扯
  vec3 rA = texture2D(uRipple, vUv2 * 6.0 + vec2(uTime * 0.017, uTime * 0.011)).xyz * 2.0 - 1.0;
  vec3 rB = texture2D(uRipple, vUv2 * 13.0 + vec2(-uTime * 0.009, uTime * 0.014)).xyz * 2.0 - 1.0;
  vec2 vel = (texture2D(uVelocity, vUv2).xy) * uFluid;

  vec3 N = normalize(vec3(
    rA.x * 0.55 + rB.x * 0.30 + vel.x * 0.0065,
    1.0,
    rA.y * 0.55 + rB.y * 0.30 + vel.y * 0.0065
  ));

  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

  // 天空反射：用竖直渐变近似，比 envMap 稳，也不会把整个水面照成白片
  vec3 sky = mix(vec3(0.055, 0.085, 0.10), vec3(0.30, 0.37, 0.40), clamp(N.y * 0.5 + 0.5, 0.0, 1.0));

  // 体积吸收：浅处透青，深处压到墨绿
  vec3 body = mix(uShallow, uDeep, clamp(vDepthC, 0.0, 1.0));

  vec3 col = mix(body, sky, mix(0.04, 0.80, fres));

  // 太阳高光
  vec3 L = normalize(uSunDir);
  float spec = pow(max(dot(reflect(-V, N), L), 0.0), 80.0);
  col += vec3(1.0, 0.95, 0.86) * spec * 0.9;

  // 泡沫：染料浓度 + 波纹峰值，靠近浅滩（vDepthC≈0）更容易起泡
  float dye = texture2D(uDye, vUv2).r * uFluid;
  float peak = clamp(rA.z * 0.5 + 0.5, 0.0, 1.0);
  float shore = smoothstep(0.22, 0.0, vDepthC);
  float foam = smoothstep(0.30, 0.85, dye * 1.6 + peak * 0.25 + shore * 0.35) * (0.35 + shore * 0.65);
  col = mix(col, uFoam, clamp(foam, 0.0, 0.92));

  float alpha = mix(uOpacity, 0.97, fres);
  alpha = max(alpha, foam * 0.85);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const BODY_VERT = /* glsl */ `
precision highp float;
attribute vec3 color;
varying vec3 vWorldPos;
varying float vDepthC;
varying float vTop;
${CLIP_PARS_VERT}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vDepthC = color.r;
  vTop = color.g;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${CLIP_VERT}
}
`

const BODY_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform float uOpacity;
varying vec3 vWorldPos;
varying float vDepthC;
varying float vTop;
${CLIP_PARS_FRAG}
void main() {
  ${CLIP_FRAG}
  // 水下体积：越深越暗越浑，靠近水线处略亮（散射），整体偏哑光
  vec3 col = mix(uShallow * 0.70, uDeep * 0.42, clamp(vDepthC, 0.0, 1.0));
  col += uShallow * 0.18 * pow(vTop, 5.0);
  float alpha = mix(0.44, 0.88, clamp(vDepthC, 0.0, 1.0));
  gl_FragColor = vec4(col, alpha * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function createWater({ floorY = -11.6, renderer = null } = {}) {
  const ripple = makeRippleNormal()
  ripple.repeat.set(1, 1)

  const fluid = renderer ? createFluidSolver(renderer) : null
  const fluidOn = fluid ? 1 : 0

  /* ---------- 水面 ---------- */
  // 每个舱单独一块水平面片，舱与舱之间不共享顶点。
  // 之前用一整张 PlaneGeometry：两侧水位差 12 个单位时，
  // 相邻顶点之间必然拉出一堵近竖直的「水幕」，无论怎么调过渡带都会露出来。
  const geo = new THREE.BufferGeometry()
  const surfPos = new Float32Array(MAX_Q * 6 * 3)
  const surfCol = new Float32Array(MAX_Q * 6 * 3)
  const surfUv = new Float32Array(MAX_Q * 6 * 2)
  geo.setAttribute('position', new THREE.BufferAttribute(surfPos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(surfCol, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(surfUv, 2))

  const surfaceUniforms = {
    uRipple: { value: ripple },
    uVelocity: { value: fluid ? fluid.velocityTexture : ripple },
    uDye: { value: fluid ? fluid.dyeTexture : ripple },
    uTime: { value: 0 },
    uFluid: { value: fluidOn },
    uOpacity: { value: 0.82 },
    uDeep: { value: new THREE.Color(0x061b23) },
    uShallow: { value: new THREE.Color(0x1c5a66) },
    uFoam: { value: new THREE.Color(0xcfdedb) },
    uSunDir: { value: new THREE.Vector3(0.45, 0.78, 0.44) },
  }

  const surfaceMat = new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
    uniforms: surfaceUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
  })

  const surface = new THREE.Mesh(geo, surfaceMat)
  surface.name = 'water_surface'
  surface.renderOrder = 2

  /* ---------- 水体 ---------- */
  const bodyGeo = new THREE.BufferGeometry()
  const bodyPos = new Float32Array(MAX_Q * 6 * 3)
  const bodyCol = new Float32Array(MAX_Q * 6 * 3)
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3))
  bodyGeo.setAttribute('color', new THREE.BufferAttribute(bodyCol, 3))

  const bodyUniforms = {
    uDeep: { value: new THREE.Color(0x061b23) },
    uShallow: { value: new THREE.Color(0x1c5a66) },
    uOpacity: { value: 1 },
  }
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
    uniforms: bodyUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
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
  let elapsed = 0
  let splatClock = 0
  let fluidIdleFrames = 0

  function compIndexAt(x) {
    let i = 0
    while (i < comp - 1 && x >= edges[i + 1]) i += 1
    return i
  }

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

  function halfWidthFor(x, lvl) {
    return Math.max(0.6, halfWidthAt(x) * widthScaleAt(lvl) - 1.4)
  }

  function rebuildSurface() {
    let ptr = 0
    const put = (x, y, z, d) => {
      surfPos[ptr * 3] = x
      surfPos[ptr * 3 + 1] = y
      surfPos[ptr * 3 + 2] = z
      surfCol[ptr * 3] = d
      surfCol[ptr * 3 + 1] = 1
      surfCol[ptr * 3 + 2] = 1
      surfUv[ptr * 2] = (x - X_MIN) / (X_MAX - X_MIN)
      surfUv[ptr * 2 + 1] = (z + Z_HALF) / (Z_HALF * 2)
      ptr += 1
    }

    for (let i = 0; i < comp; i += 1) {
      const lvl = levels[i]
      // 干舱完全不出面
      if (lvl <= floorY + 0.05) continue
      const x0 = Math.max(X_MIN, edges[i] + INSET)
      const x1 = Math.min(X_MAX, edges[i + 1] - INSET)
      if (x1 - x0 < 0.6) continue

      for (let ix = 0; ix < NX; ix += 1) {
        const xa = x0 + ((x1 - x0) * ix) / NX
        const xb = x0 + ((x1 - x0) * (ix + 1)) / NX
        const wa = halfWidthFor(xa, lvl)
        const wb = halfWidthFor(xb, lvl)
        const da = Math.max(0, lvl - bottomAt(xa, floorY)) / 9
        const db = Math.max(0, lvl - bottomAt(xb, floorY)) / 9
        for (let iz = 0; iz < NZ; iz += 1) {
          const za = -wa + (2 * wa * iz) / NZ
          const zb = -wa + (2 * wa * (iz + 1)) / NZ
          const zc = -wb + (2 * wb * iz) / NZ
          const zd = -wb + (2 * wb * (iz + 1)) / NZ
          put(xa, lvl, za, da)
          put(xa, lvl, zb, da)
          put(xb, lvl, zd, db)
          put(xa, lvl, za, da)
          put(xb, lvl, zd, db)
          put(xb, lvl, zc, db)
        }
      }
    }

    for (let k = ptr * 3; k < surfPos.length; k += 1) surfPos[k] = 0
    for (let k = ptr * 3; k < surfCol.length; k += 1) surfCol[k] = 0
    for (let k = ptr * 2; k < surfUv.length; k += 1) surfUv[k] = 0
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    geo.attributes.uv.needsUpdate = true
    geo.setDrawRange(0, ptr)
    if (ptr > 0) geo.computeVertexNormals()
    geo.computeBoundingSphere()
    surface.visible = ptr > 0
  }

  function rebuildBody() {
    let ptr = 0
    const put = (x, y, z, d, t) => {
      bodyPos[ptr * 3] = x
      bodyPos[ptr * 3 + 1] = y
      bodyPos[ptr * 3 + 2] = z
      bodyCol[ptr * 3] = d
      bodyCol[ptr * 3 + 1] = t
      bodyCol[ptr * 3 + 2] = 0
      ptr += 1
    }

    for (let i = 0; i < comp; i += 1) {
      const lvl = levels[i]
      if (lvl <= floorY + 0.05) continue
      const x0 = Math.max(X_MIN, edges[i] + INSET)
      const x1 = Math.min(X_MAX, edges[i + 1] - INSET)
      if (x1 - x0 < 0.6) continue

      for (const sign of [1, -1]) {
        for (let ix = 0; ix < NX; ix += 1) {
          const xa = x0 + ((x1 - x0) * ix) / NX
          const xb = x0 + ((x1 - x0) * (ix + 1)) / NX
          const wa = halfWidthFor(xa, lvl) * sign
          const wb = halfWidthFor(xb, lvl) * sign
          const ba = bottomAt(xa, floorY)
          const bb = bottomAt(xb, floorY)
          const ta = Math.max(lvl, ba)
          const tb = Math.max(lvl, bb)
          put(xa, ba, wa, 1, 0)
          put(xa, ta, wa, 0, 1)
          put(xb, tb, wb, 0, 1)
          put(xa, ba, wa, 1, 0)
          put(xb, tb, wb, 0, 1)
          put(xb, bb, wb, 1, 0)
        }
      }
    }

    for (let k = ptr * 3; k < bodyPos.length; k += 1) bodyPos[k] = 0
    for (let k = ptr * 3; k < bodyCol.length; k += 1) bodyCol[k] = 0
    bodyGeo.attributes.position.needsUpdate = true
    bodyGeo.attributes.color.needsUpdate = true
    bodyGeo.setDrawRange(0, ptr)
    if (ptr > 0) bodyGeo.computeVertexNormals()
    bodyGeo.computeBoundingSphere()
    body.visible = ptr > 0
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
    if (changed) rebuild()
  }

  // 有流量的舱往流体场里打速度/染料：水面因此是「被水推动的」，不是贴图在滚
  function splatAt(xWorld, zWorld, strength) {
    if (!fluid) return
    const u = (xWorld - X_MIN) / (X_MAX - X_MIN)
    const v = (zWorld + Z_HALF) / (Z_HALF * 2)
    if (u < 0 || u > 1 || v < 0 || v > 1) return
    const s = Math.min(1, Math.abs(strength))
    if (s < 0.02) return
    fluid.splatVel(u, v, (Math.random() - 0.5) * s * 3.2, (Math.random() - 0.5) * s * 2.2, 0.006 + s * 0.02)
    fluid.splatDye(u, v, s * 0.9, s * 0.7, s * 0.6, 0.01 + s * 0.03)
  }

  function setFlows(next) {
    for (let i = 0; i < comp; i += 1) {
      const v = next[i] || 0
      const was = flows[i]
      flows[i] = v
      // 流量突变（漫水、破口进水）时才打点，稳定后不刷
      if (fluid && Math.abs(v - was) > 0.05 && v > 0.05) {
        const cx = (edges[i] + edges[i + 1]) / 2
        splatAt(cx, (Math.random() - 0.5) * 12, v)
      }
    }
  }

  function setBlend(v) {
    const next = Math.max(0.01, v)
    if (Math.abs(next - blend) > 0.05) {
      blend = next
      rebuild()
    }
  }

  function update(dt) {
    elapsed += dt
    surfaceUniforms.uTime.value = elapsed
    if (!fluid) return

    // 仍然在流动的舱持续补充扰动，避免水面「死掉」
    let flowing = false
    splatClock += dt
    if (splatClock > 0.09) {
      splatClock = 0
      for (let i = 0; i < comp; i += 1) {
        if (flows[i] > 0.04) {
          const cx = (edges[i] + edges[i + 1]) / 2 + (Math.random() - 0.5) * (edges[i + 1] - edges[i]) * 0.5
          splatAt(cx, (Math.random() - 0.5) * 11, flows[i] * 0.7)
          flowing = true
        }
      }
    }

    // 求解器每帧约 19 个离屏 pass（修正压力后降到 12 次迭代）。
    // 静止且没人看的时候没必要一直算：没流动就每 3 帧走一步。
    // 走动起来（有流量/有打点）立刻恢复每帧。
    const moving = flowing || flows.some((f) => f > 0.02)
    fluidIdleFrames = moving ? 0 : fluidIdleFrames + 1
    if (!moving && fluidIdleFrames % 3 !== 0) return

    fluid.step(dt)
    surfaceUniforms.uVelocity.value = fluid.velocityTexture
    surfaceUniforms.uDye.value = fluid.dyeTexture
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
    get hasFluid() {
      return !!fluid
    },
  }
}
