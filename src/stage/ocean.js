import * as THREE from 'three'

// 剖切场景里的水面。
//
// 之前用过 three 的 Water（examples/jsm/objects/Water.js），codex 审查结论是它在这个
// 场景里有结构性冲突，逐条记在这里，免得以后有人再试一遍：
//
// 1. onBeforeRender 里会 `scope.visible = false` 渲反射，渲完再无条件设回 true
//    （Water.js:293-310）。我们用 setVisible() 控制的显隐会被它每帧改写；
//    镜面背对相机时它又在 :226-230 提前 return，连「设回 true」都不执行。
// 2. 它每绘制一次就整场景再渲一遍。而我们自己还有一次「无水场景」预渲染，
//    ocean 不在那次预渲染的排除名单里 → 一帧可能多出两次全场景绘制，
//    两次结果还要互相叠加，闪不闪完全看时序。
// 3. 它的材质不接受我们挂在其它材质上的 clippingPlanes，剖切面对它无效，
//    水面会伸进被切掉的那半空间 —— 这就是「像被截掉一截的方块」的来源。
// 4. 我们为了贴合船体每帧重建 BufferGeometry 并 computeVertexNormals，
//    法线每帧离散变化，叠加它的强镜面高光 → 高光抖成一片（闪烁）。
//
// 所以这里改成：一张自有材质的静态网格。
// - 顶点只在「水位变化超过阈值」时更新位置，法线恒定朝上，不重算 → 不会抖
// - 涟漪全部来自法线贴图采样（两层反向滚动），改变着色而不改变拓扑
// - 材质本身接受 clippingPlanes，跟船壳同一套剖切规则 → 切口干净
// - 不做实时镜面反射（那需要第二次全场景渲染），用菲涅尔 + 天空色近似

let _ripple = null

function rippleTexture() {
  if (_ripple) return _ripple
  const size = 256
  const data = new Uint8Array(size * size * 4)
  const waves = [
    { fx: 1, fy: 2, ph: 0.0, a: 1.0 },
    { fx: 2, fy: -3, ph: 1.7, a: 0.7 },
    { fx: 4, fy: 1, ph: 3.1, a: 0.45 },
    { fx: 7, fy: -5, ph: 5.2, a: 0.25 },
  ]
  const h = new Float32Array(size * size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size
      const v = y / size
      let s = 0
      for (const w of waves) s += Math.sin((u * w.fx + v * w.fy) * Math.PI * 2 + w.ph) * w.a
      h[y * size + x] = s
    }
  }
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = at(x + 1, y) - at(x - 1, y)
      const dy = at(x, y + 1) - at(x, y - 1)
      const n = new THREE.Vector3(-dx, -dy, 1).normalize()
      const i = (y * size + x) * 4
      data[i] = Math.round((n.x * 0.5 + 0.5) * 255)
      data[i + 1] = Math.round((n.y * 0.5 + 0.5) * 255)
      data[i + 2] = Math.round((n.z * 0.5 + 0.5) * 255)
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  _ripple = tex
  return tex
}

const VERT = /* glsl */ `
precision highp float;
#include <clipping_planes_pars_vertex>
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vViewDir = cameraPosition - wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}
`

const FRAG = /* glsl */ `
precision highp float;
#include <clipping_planes_pars_fragment>
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform sampler2D uRipple;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vViewDir;

void main() {
  #include <clipping_planes_fragment>

  // 两层反向滚动的法线贴图：水面在动，但拓扑不动
  vec3 a = texture2D(uRipple, vUv * vec2(7.0, 7.0) + vec2(uTime * 0.024, uTime * 0.017)).xyz * 2.0 - 1.0;
  vec3 b = texture2D(uRipple, vUv * vec2(13.0, 13.0) - vec2(uTime * 0.013, uTime * 0.021)).xyz * 2.0 - 1.0;
  vec3 n = normalize(vec3((a.x + b.x) * 0.42, 1.0, (a.y + b.y) * 0.42));

  vec3 V = normalize(vViewDir);
  float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 3.2);

  // 水体色：深浅之间按法线扰动变化，避免整片死色
  vec3 base = mix(uDeep, uShallow, clamp(0.42 + n.x * 0.35, 0.0, 1.0));
  vec3 col = mix(base, uSky, clamp(fres * 0.62, 0.0, 0.75));

  // 太阳高光
  vec3 L = normalize(uSunDir);
  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 72.0);
  col += vec3(1.0, 0.96, 0.88) * spec * 0.85;

  // 贴壁水线：uv.y 靠边就是水面与舱壁相交处
  float edge = smoothstep(0.12, 0.0, min(vUv.y, 1.0 - vUv.y));
  float lap = 0.55 + 0.45 * sin(uTime * 1.8 + vUv.x * 42.0);
  col = mix(col, uFoam, edge * lap * 0.45);

  gl_FragColor = vec4(col, 0.86 + fres * 0.1);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function createOcean({ sunDir = new THREE.Vector3(0.45, 0.78, 0.44) } = {}) {
  // 20 个纵向采样 × 2 列：宽度逐点变，形状贴船壳，但拓扑固定
  const N = 20
  const pos = new Float32Array(N * 2 * 3)
  const uvs = new Float32Array(N * 2 * 2)
  const idx = []
  for (let i = 0; i < N - 1; i += 1) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(idx)

  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(0x08222b) },
    uShallow: { value: new THREE.Color(0x2a6b74) },
    uFoam: { value: new THREE.Color(0xa8c4c0) },
    uSky: { value: new THREE.Color(0x22414b) },
    uSunDir: { value: sunDir.clone().normalize() },
    uRipple: { value: rippleTexture() },
  }
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
    clippingPlanes: [],
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.name = 'ocean_surface'
  mesh.visible = false
  mesh.renderOrder = 2
  mesh.frustumCulled = false

  // 剖切断面：水面被切开那一侧的厚度
  const cutMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
    clippingPlanes: [],
    uniforms: {
      uTop: { value: new THREE.Color(0x2f7b85) },
      uBottom: { value: new THREE.Color(0x08222b) },
      uTime: { value: 0 },
    },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      precision highp float;
      #include <clipping_planes_pars_fragment>
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vViewDir;
      void main() {
        #include <clipping_planes_fragment>
        vec3 col = mix(uBottom, uTop, clamp(vUv.y, 0.0, 1.0));
        float band = 0.5 + 0.5 * sin(vUv.x * 24.0 + uTime * 0.5 + vUv.y * 10.0);
        col *= 0.93 + 0.07 * band;
        col += vec3(0.18, 0.24, 0.24) * smoothstep(0.93, 1.0, vUv.y);
        gl_FragColor = vec4(col, 0.93);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const cutGeo = new THREE.PlaneGeometry(1, 1, 1, 1)
  const cutFace = new THREE.Mesh(cutGeo, cutMat)
  cutFace.name = 'ocean_cut'
  cutFace.visible = false
  cutFace.renderOrder = 3

  let elapsed = 0
  let cutMode = true

  // 只改位置，不动法线、不重建几何
  function setShape({ x0, x1, y, halfWidth, zCut = 2 }) {
    const P = geo.attributes.position.array
    const U = geo.attributes.uv.array
    let cutAny = false
    for (let i = 0; i < N; i += 1) {
      const t = i / (N - 1)
      const x = x0 + (x1 - x0) * t
      const w = Math.max(0.4, halfWidth(x))
      const zNear = Math.min(w, zCut)
      if (w > zCut + 0.05) cutAny = true
      const a = i * 6
      P[a] = x
      P[a + 1] = y
      P[a + 2] = -w
      P[a + 3] = x
      P[a + 4] = y
      P[a + 5] = zNear
      const u = i * 4
      U[u] = t
      U[u + 1] = 0
      U[u + 2] = t
      U[u + 3] = 1
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.uv.needsUpdate = true

    const depth = Math.max(0.1, y - 0.35 - (-11.6))
    cutFace.scale.set(Math.max(0.1, x1 - x0), depth, 1)
    cutFace.position.set((x0 + x1) / 2, y - 0.35 - depth / 2, zCut - 0.05)
    cutMode = cutAny
  }

  // 跟着船壳用同一套剖切面：水面在切口处被切干净，不会伸进被切掉的那半
  function setClipping(planes) {
    mat.clippingPlanes = planes
    cutMat.clippingPlanes = planes
  }

  function update(dt) {
    elapsed += dt
    uniforms.uTime.value = elapsed
    cutMat.uniforms.uTime.value = elapsed
  }

  function setVisible(v) {
    mesh.visible = v
    cutFace.visible = v && cutMode
  }

  return { mesh, cutFace, setShape, setClipping, setVisible, update }
}
