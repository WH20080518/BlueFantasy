import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'

// three 官方 Water：自带反射 + 折射两个渲染通道、法线贴图扰动、太阳高光。
// 这是「真实 3D 水」那条路——之前手写的水面无论怎么调，本质还是一张被着色的片。
//
// 只在单舱进水的 b4 用。b5 是 13 个舱同时有水，每个实例要两次全场景渲染，
// 那个数量级撑不住，b5 仍走原来的轻量方案。

let _normals = null

// Water 需要一张「法线贴图」：RGB 编码法线。程序生成，不引外部素材。
function waterNormals() {
  if (_normals) return _normals
  const size = 256
  const data = new Uint8Array(size * size * 4)
  const waves = [
    { fx: 1, fy: 2, ph: 0.0, a: 1.0 },
    { fx: 2, fy: -3, ph: 1.7, a: 0.7 },
    { fx: 4, fy: 1, ph: 3.1, a: 0.45 },
    { fx: 7, fy: -5, ph: 5.2, a: 0.25 },
  ]
  const height = new Float32Array(size * size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size
      const v = y / size
      let h = 0
      for (const w of waves) {
        h += Math.sin((u * w.fx + v * w.fy) * Math.PI * 2 + w.ph) * w.a
      }
      height[y * size + x] = h
    }
  }
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = at(x + 1, y) - at(x - 1, y)
      const dy = at(x, y + 1) - at(x, y - 1)
      const n = new THREE.Vector3(-dx * 0.9, -dy * 0.9, 1).normalize()
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
  _normals = tex
  return tex
}

export function createOcean({ renderer, scene, camera, sunDir = new THREE.Vector3(0.45, 0.78, 0.44) }) {
  // 水面不是一个矩形：舱是船体里的一段，两侧是弧形的船壳。
  // 用 N 个横向采样点把宽度画出来，水面才会「贴合船舱」而不是一块方板。
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
  const mesh = new Water(geo, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals(),
    sunDirection: sunDir.clone().normalize(),
    sunColor: 0xfff2e0,
    waterColor: 0x1b5e6b,
    distortionScale: 3.6,
    fog: !!scene.fog,
  })
  mesh.name = 'ocean_surface'
  mesh.rotation.x = -Math.PI / 2
  mesh.visible = false
  mesh.renderOrder = 2
  // 法线纹理平铺：只铺一次会看到重复的方块，铺 12x8 更像水面
  mesh.material.uniforms.size.value = 6.0

  // 剖切面：水面被切开的那一侧需要一块「断面」，否则它永远读成一张纸。
  // 真实水体切开也是不透明的——断面就等于水的厚度，这是剖面图的基本语法。
  const cutGeo = new THREE.PlaneGeometry(1, 1, 1, 1)
  const cutMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    // 断面和它是「贴在切口上的一层标签」，不参与深度竞争。
    // 顶边只要还有一点点重叠就会闪，polygonOffset 让它稳定压在水面前面。
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
    uniforms: {
      uTop: { value: new THREE.Color(0x2f7b85) },
      uBottom: { value: new THREE.Color(0x08222b) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vY;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vY = wp.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform float uTime;
      varying vec2 vUv;
      varying float vY;
      void main() {
        // 竖向梯度 + 缓慢的浑浊纹路：越深越暗
        vec3 col = mix(uBottom, uTop, clamp(vUv.y, 0.0, 1.0));
        float band = 0.5 + 0.5 * sin(vUv.x * 26.0 + uTime * 0.6 + vUv.y * 12.0);
        col *= 0.94 + 0.06 * band;
        // 顶部一条亮边：水线
        col += vec3(0.16, 0.22, 0.22) * smoothstep(0.94, 1.0, vUv.y);
        gl_FragColor = vec4(col, 0.9);
      }
    `,
  })
  const cutFace = new THREE.Mesh(cutGeo, cutMat)
  cutFace.name = 'ocean_cut'
  cutFace.visible = false
  cutFace.renderOrder = 3

  let elapsed = 0
  let cutMode = true

  // halfWidth(x) → 该处船壳的内半宽；zCut 是剖切面位置（没有剖切时给 Infinity）
  function setShape({ x0, x1, y, halfWidth, zCut = 2 }) {
    const P = geo.attributes.position.array
    const U = geo.attributes.uv.array
    let cutAny = false
    for (let i = 0; i < N; i += 1) {
      const t = N === 1 ? 0 : i / (N - 1)
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
    geo.computeVertexNormals()
    geo.computeBoundingSphere()

    // 断面：从舱底铺到水面下 0.06（共面会 z-fighting，表现为闪烁）
    const depth = Math.max(0.1, y - 0.3 - (-11.6))
    cutFace.scale.set(Math.max(0.1, x1 - x0), depth, 1)
    cutFace.position.set((x0 + x1) / 2, y - 0.3 - depth / 2, zCut - 0.02)
    cutMode = cutAny
  }

  function update(dt) {
    elapsed += dt
    // Water 的 time 单位是「秒 × 0.6」量级，走太快会像沸水
    mesh.material.uniforms.time.value = elapsed * 0.55
    cutMat.uniforms.uTime.value = elapsed
  }

  function setVisible(v) {
    mesh.visible = v
    cutFace.visible = v && cutMode
  }

  return { mesh, cutFace, setShape, setVisible, update }
}
