import * as THREE from 'three'
import { buildPlaceholders } from './placeholder.js'
import { CameraRig, CAMERAS } from './camera.js'
import { Parts } from './parts.js'
import { createFlood } from '../interactions/flood.js'
import { createCaulk } from '../interactions/caulk.js'

// three 场景：渲染循环、resize（DPR 上限 2）、半球光 + 方向光（无阴影贴图）。

// parts.json 加载器：models/parts.json 存在则按 name 绑定装配/爆炸位，
// 否则（或解析失败）用占位几何。真 GLB 到位后在 bindRealMeshes 里接。
async function loadPartsSpec(base) {
  try {
    const res = await fetch(`${base}models/parts.json`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function bindRealMeshes(/* gltfRoot, nodes */) {
  // TODO(models): 真 GLB 到位后，按 name 把 gltfRoot.getObjectByName(name)
  // 的网格替换进 nodes 对应 Group（保留 Group 的装配/爆炸变换）。
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

function clampedDPR() {
  return Math.min(window.devicePixelRatio || 1, 1.6)
}

export async function createStage({ canvas, beats, reducedMotion, base }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: (window.devicePixelRatio || 1) < 1.5,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(clampedDPR())
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x3a2a20, 220, 560)

  const camera = new THREE.PerspectiveCamera(CAMERAS.wide.fov, 1, 0.1, 1000)
  const rig = new CameraRig(camera, reducedMotion)

  scene.add(new THREE.HemisphereLight(0xe9e3d6, 0x3a2a1d, 1.7))
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.4)
  sun.position.set(60, 80, 40)
  scene.add(sun)

  const built = buildPlaceholders()
  const { shipGroup, detailGroup, shadow, nodes, joint, seam, water, bulkheads } = built
  scene.add(shipGroup, detailGroup, shadow)

  // parts.json（可选）：应用装配/爆炸位
  const spec = await loadPartsSpec(base)
  if (Array.isArray(spec)) {
    spec.forEach((p) => {
      const g = nodes.get(p.name)
      if (!g) return
      if (Array.isArray(p.assembled)) g.position.fromArray(p.assembled)
      if (Array.isArray(p.exploded)) g.userData.exploded = p.exploded
    })
    bindRealMeshes(null, nodes)
  }

  const parts = new Parts(nodes)
  const flood = createFlood({ ship: shipGroup, compWater: water.comp, fullWater: water.full, bulkheads, water }, reducedMotion)
  const caulk = createCaulk(
    { upper: seam.refs.upper, lower: seam.refs.lower, marker: seam.refs.marker, caulk: seam.refs.caulk, nails: seam.nails, openY: seam.refs.openY, closedY: seam.refs.closedY },
    reducedMotion,
  )

  let beatIndex = 0
  let spin = 0
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
