import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildPlaceholders } from './placeholder.js'
import { CameraRig, CAMERAS } from './camera.js'
import { Parts } from './parts.js'
import { createFlood } from '../interactions/flood.js'
import { createCaulk } from '../interactions/caulk.js'
import { loadShip } from './loader.js'

// three 场景：渲染循环、resize（DPR 上限 2）、半球光 + 方向光（无阴影贴图）。

// parts.json 加载器：models/parts.json 存在则按 name 绑定装配/爆炸位，
// 否则（或解析失败）用占位几何。真 GLB 到位后在 bindRealMeshes 里接。
async function loadPartsSpec(base, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${base}models/parts.json`, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    // 缺失、超时、解析失败都静默回落到占位几何
    return null
  } finally {
    clearTimeout(timer)
  }
}

// parts.json 允许两种形态：数组（旧）或 { unit, parts }（推荐）。
function normalizeSpec(raw) {
  if (Array.isArray(raw)) return { unit: null, parts: raw }
  if (raw && Array.isArray(raw.parts)) return { unit: raw.unit ?? null, parts: raw.parts }
  return null
}

// 真模型材质统一到项目四色，避免 GLB 自带贴图带来的体积与风格不一致。
const MODEL_PALETTE = {
  wood: 0x6b4b33,
  accent: 0xc08a4a,
  iron: 0x3a3f44,
  paper: 0xe8e4dc,
}

function paletteFor(name) {
  if (/iron|nail/i.test(name)) return MODEL_PALETTE.iron
  if (/caulk|seam/i.test(name)) return MODEL_PALETTE.paper
  if (/joint|tenon|mortise/i.test(name)) return MODEL_PALETTE.accent
  return MODEL_PALETTE.wood
}

const materialCache = new Map()

function sharedMaterial(color) {
  let mat = materialCache.get(color)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: color === MODEL_PALETTE.iron ? 0.35 : 0.05,
    })
    materialCache.set(color, mat)
  }
  return mat
}

// 按 name 把 GLB 网格塞进占位 Group：
// - 只替换子物体，保留 Group 的 position/rotation（装配位、爆炸位都在 Group 上）
// - 子物体自身位移归零，单位按包围盒判断（>100 视为毫米，整树 0.001）
// 返回成功接上的零件数。
function bindRealMeshes(gltf, nodes, { unit } = {}) {
  // 这些零件被交互模块持有网格引用（caulk 的上下板、flood 的隔舱材质、joint 的爆炸件）。
  // 直接替换会让 refs 指向已移除的网格，表现为「点了没反应」。P2 阶段先保留占位。
  const KEEP_PLACEHOLDER = new Set([
    'plank_seam', 'nail_set', 'caulk_layer',
    'joint_tenon', 'joint_mortise',
  ])
  const root = gltf?.scene ?? gltf?.scenes?.[0]
  if (!root) return 0

  root.updateMatrixWorld(true)

  const UNIT_SCALE = { m: 1, cm: 0.01, mm: 0.001 }
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)

  let unitScale
  if (unit && UNIT_SCALE[unit] !== undefined) {
    unitScale = UNIT_SCALE[unit]
  } else {
    // 没声明单位时才靠包围盒推断；推断结果还要过 20–40 m 的船体校验
    unitScale = maxDim > 100 ? 0.001 : 1
    console.warn('[stage] parts.json 未声明 unit，按包围盒推断；建议写 "unit": "m"')
  }

  // 建模尺度：100 单位 ≈ 30 m 实船（1 单位 ≈ 0.3 m）。上限放到 150，正常模型不刷警告；
  // 真正的单位写错（mm/cm 当 m）会落到 0.1 或 1 的量级，仍然会被这条抓到。
  const scaledMax = maxDim * unitScale
  if (scaledMax < 20 || scaledMax > 150) {
    console.warn(`[stage] 模型最大边 ${scaledMax.toFixed(1)} m，超出船体 20–150 m 预期，检查 parts.json 的 unit 或模型比例`)
  }

  const worldPos = new THREE.Vector3()
  const worldQuat = new THREE.Quaternion()
  const worldScale = new THREE.Vector3()
  const parentInv = new THREE.Matrix4()
  const worldMat = new THREE.Matrix4()
  const localMat = new THREE.Matrix4()

  let bound = 0
  nodes.forEach((group, name) => {
    if (KEEP_PLACEHOLDER.has(name)) return
    const source = root.getObjectByName(name)
    if (!source) return

    // 父级可能是带变换的空节点或骨架：先取世界变换，再换算成挂载后的局部变换
    source.getWorldPosition(worldPos)
    source.getWorldQuaternion(worldQuat)
    source.getWorldScale(worldScale)

    const clone = source.clone(true)
    clone.position.set(0, 0, 0)
    clone.quaternion.identity()
    clone.scale.set(1, 1, 1)

    // 优先用 GLB 自带材质（含风化木纹贴图）；只有缺材质时才回退到项目四色。
    const fallback = sharedMaterial(paletteFor(name))
    // 船体是开口放样：单面渲染会只剩朝向相机的一半。外壳与甲板强制双面。
    const twoSided = name === 'hull_shell' || name === 'ship_deck'
    const sidedCache = new Map()
    clone.traverse((obj) => {
      if (!obj.isMesh) return
      const base = obj.material || fallback
      if (twoSided) {
        let sided = sidedCache.get(base)
        if (!sided) {
          sided = base.clone()
          sided.side = THREE.DoubleSide
          sidedCache.set(base, sided)
        }
        obj.material = sided
      } else {
        obj.material = base
      }
      obj.castShadow = false
      obj.receiveShadow = false
    })

    group.clear()
    group.add(clone)
    group.updateWorldMatrix(true, false)

    worldMat.compose(worldPos, worldQuat, worldScale.clone().multiplyScalar(unitScale))
    parentInv.copy(group.matrixWorld).invert()
    localMat.multiplyMatrices(parentInv, worldMat)
    localMat.decompose(clone.position, clone.quaternion, clone.scale)

    bound += 1
  })

  return bound
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

function clampedDPR() {
  return Math.min(window.devicePixelRatio || 1, 2)
}

export async function createStage({ canvas, beats, reducedMotion, base, onModelFail }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(clampedDPR())
  renderer.setClearColor(0x000000, 0)
  // 纯色/贴图材质都需要色调映射与 sRGB 输出，否则发灰发脏。
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x3a2a20, 220, 560)

  // 环境探针：给木料一点漫反射层次，纯靠平行光会显得平。
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.4
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(CAMERAS.wide.fov, 1, 0.1, 1000)
  const rig = new CameraRig(camera, reducedMotion)

  scene.add(new THREE.HemisphereLight(0xe9e3d6, 0x3a2a1d, 1.05))
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.5)
  sun.position.set(60, 80, 40)
  scene.add(sun)

  const built = buildPlaceholders()
  const { shipGroup, detailGroup, shadow, nodes, joint, seam, water, bulkheads } = built
  scene.add(shipGroup, detailGroup, shadow)

  // parts.json（可选）：应用装配/爆炸位
  // 实船 12 道隔舱板时，占位几何只有 3 道；这里按 parts.json 补建缺失的 Group，
  // 否则 GLB 里多出来的节点没有容器可挂。
  const spec = normalizeSpec(await loadPartsSpec(base))
  if (spec) {
    spec.parts.forEach((p) => {
      let g = nodes.get(p.name)
      if (!g) {
        g = new THREE.Group()
        g.name = p.name
        shipGroup.add(g)
        nodes.set(p.name, g)
      }
      if (Array.isArray(p.assembled)) g.position.fromArray(p.assembled)
      if (Array.isArray(p.exploded)) g.userData.exploded = p.exploded
    })
  }

  // 真模型异步接入：不阻塞首屏，失败/超时保持占位几何。
  let realModel = null
  loadShip(`${base}models/ship.glb`, {
    base,
    // 仅“文件存在但解析失败”上报给上层；缺失/超时属于模型未交付，保持占位。
    onError: (reason) => {
      if (reason === 'error' && onModelFail) onModelFail(reason)
    },
  })
    .then((gltf) => {
      if (!gltf || realModel) return
      realModel = gltf
      const bound = bindRealMeshes(gltf, nodes, { unit: spec?.unit })
      if (bound > 0) {
        // 隔舱被替换后，flood 里的旧材质引用失效；把 12 道重新登记给它
        const list = []
        for (let i = 1; i <= 12; i += 1) {
          const g = nodes.get(`bulkhead_${String(i).padStart(2, '0')}`)
          if (g) list.push(g)
        }
        flood.rebindBulkheads(list)
        console.info(`[stage] GLB 已接入 ${bound} 个零件，隔舱 ${list.length} 道`)
      }
    })
    .catch((err) => console.warn('[stage] 接入 GLB 失败：', err))

  // DEV 调试钩子：浏览器里可直接读场景状态
  if (import.meta.env.DEV) {
    window.__bf = { scene, camera, renderer }
  }

  const parts = new Parts(nodes)
  const flood = createFlood({ ship: shipGroup, compWater: water.comp, fullWater: water.full, bulkheads, water }, reducedMotion)
  const caulk = createCaulk(
    { upper: seam.refs.upper, lower: seam.refs.lower, marker: seam.refs.marker, caulk: seam.refs.caulk, nails: seam.nails, openY: seam.refs.openY, closedY: seam.refs.closedY },
    reducedMotion,
  )

  let beatIndex = 0
  let spin = 0
  let callsChecked = false
  const anchorV = new THREE.Vector3()
  const visibleSet = new Set()
  const boxCache = new Map()
  let frameNo = 0

  function resize() {
    renderer.setPixelRatio(clampedDPR())
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  function nodeSetFor(i) {
    return beats[i] ? beats[i].stage.nodes : []
  }

  return {
    renderer,
    parts,
    flood,
    caulk,
    resize,

    enterBeat(i) {
      const prev = beats[beatIndex]
      if (prev && prev.interaction === 'flood' && i !== beatIndex) flood.reset()
      if (prev && prev.interaction === 'caulk' && i !== beatIndex) caulk.reset()
      beatIndex = i
      const beat = beats[i]
      if (beat.interaction === 'flood') {
        flood.reset()
        flood.setState('with-bulkheads')
      }
      if (beat.interaction === 'caulk') caulk.reset()
      parts.clear()
      parts.setPickables(beat.pick || [])
    },

    // progress 全局 0..1；i 当前 beat；lt beat 内进度；blend 朝下一 beat 的相机混合
    update(dt, i, lt, blend) {
      const beat = beats[i]
      const next = beats[i + 1]

      // 可见性：相机混合期间显示两个 beat 的并集
      visibleSet.clear()
      nodeSetFor(i).forEach((n) => visibleSet.add(n))
      if (blend > 0 && next) next.stage.nodes.forEach((n) => visibleSet.add(n))
      parts.setVisible(visibleSet)

      // 剖舱与漏水两屏需要看进船体：有真模型时把外壳调透明，其余屏恢复不透明
      const seeThrough = beat.id === 'b4' || beat.id === 'b5'
      for (const nm of ['hull_shell', 'ship_deck']) {
        const node = nodes.get(nm)
        if (!node) continue
        node.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return
          obj.material.transparent = seeThrough
          obj.material.opacity = seeThrough ? 0.55 : 1
          obj.material.depthWrite = !seeThrough
        })
      }

      // 相机
      rig.update(beat.stage.camera, next ? next.stage.camera : null, blend, lt, dt)

      // beat 1 缓慢自转；离开后回到 0
      const wantSpin = beat.stage.motion === 'idle-spin' && !reducedMotion()
      if (wantSpin) spin += dt * 0.08
      const targetRot = beat.id === 'b1' ? spin : 0
      shipGroup.rotation.y += (targetRot - shipGroup.rotation.y) * (reducedMotion() ? 1 : 0.08)

      // beat 2 榫卯爆炸（随 beat 内进度）；reduced-motion 下直接设分离目标位置，不做滚动插值
      if (beat.id === 'b2' || (next && next.id === 'b2' && blend > 0)) {
        const raw = (Math.max(lt, blend) - 0.12) / 0.5
        const e = reducedMotion() ? 1 : smoothstep(raw)
        const d = joint.assembledX + (joint.explodedX - joint.assembledX) * e
        joint.tenon.position.x = -d
        joint.mortise.position.x = d
      }

      if (beat.interaction === 'caulk' || (next && next.interaction === 'caulk' && blend > 0)) {
        caulk.update(dt, lt)
      }
      flood.update(dt)

      renderer.render(scene, camera)

      // 真模型接入后查一次 draw call 预算（阈值 20），避免逐帧刷日志
      if (realModel && !callsChecked) {
        callsChecked = true
        const calls = renderer.info.render.calls
        if (calls > 20) console.warn(`[stage] draw calls ${calls} 超过预算 20`)
      }
    },

    // 指针拾取：client 坐标 → 节点名
    pickAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((clientY - rect.top) / rect.height) * 2 + 1
      return parts.pick(nx, ny, camera)
    },

    select(name) {
      return parts.select(name)
    },
    clearSelection() {
      parts.clear()
    },
    cyclePart(dir) {
      return parts.cycle(dir)
    },
    focusedPart() {
      return parts.focused()
    },

    // 名称浮层锚点（canvas 内像素坐标）；不可见/在背后返回 null
    anchorOf(name) {
      frameNo += 1
      let box = boxCache.get(name)
      const g = nodes.get(name)
      if (!g || !g.visible) return null
      // 包围盒每 6 帧更新一次，避免逐帧 setFromObject 造成的卡顿
      if (!box || frameNo % 6 === 1) {
        box = new THREE.Box3().setFromObject(g)
        boxCache.set(name, box)
      }
      if (box.isEmpty()) return null
      anchorV.set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)
      anchorV.project(camera)
      if (anchorV.z > 1) return null
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      return { x: (anchorV.x * 0.5 + 0.5) * w, y: (-anchorV.y * 0.5 + 0.5) * h }
    },
  }
}
