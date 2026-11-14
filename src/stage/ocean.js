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
  const geo = new THREE.PlaneGeometry(1, 1, 1, 1)
  const mesh = new Water(geo, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals(),
    sunDirection: sunDir.clone().normalize(),
    sunColor: 0xfff2e0,
    waterColor: 0x0d3440,
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
    uniforms: {
      uTop: { value: new THREE.Color(0x1d4e57) },
      uBottom: { value: new THREE.Color(0x04161e) },
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

  // extent: {x0,x1,z0,z1}（船体坐标），y: 水位
  function setExtent({ x0, x1, z0, z1, y }) {
    const sx = Math.max(0.1, x1 - x0)
    const sz = Math.max(0.1, z1 - z0)
    mesh.scale.set(sx, sz, 1)
    mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2)
    // 断面贴在 z1（靠近观察者的切口），从舱底一直到水面
    const depth = Math.max(0.1, y - (-11.6))
    cutFace.scale.set(sx, depth, 1)
    // 贴在切口内侧 0.02，避免正好落在裁剪平面上被裁掉
    cutFace.position.set((x0 + x1) / 2, y - depth / 2, z1 - 0.02)
  }

  function update(dt) {
    elapsed += dt
    // Water 的 time 单位是「秒 × 0.6」量级，走太快会像沸水
    mesh.material.uniforms.time.value = elapsed * 0.55
    cutMat.uniforms.uTime.value = elapsed
  }

  function setVisible(v) {
    mesh.visible = v
    cutFace.visible = v
  }

  return { mesh, cutFace, setExtent, setVisible, update }
}
