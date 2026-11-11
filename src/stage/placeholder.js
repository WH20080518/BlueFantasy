import * as THREE from 'three'

// 占位几何。节点名与 docs/07-modeling-brief.md T12 / parts.json 完全一致。
// 尺寸：船长 100（X，+X 为艏）、船宽 28（Z）、船深 18（Y，原点在水线，船底 -12，甲板 +6）。

export const PALETTE = {
  wood: 0x6b4b33,
  deepWood: 0x3a2a1d,
  iron: 0x3a3f44,
  paper: 0xe8e4dc,
  cinnabar: 0xb23a2e,
  water: 0x7e9a9a,
}

const HULL = { length: 100, width: 28, bottom: -12, top: 6 }

function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts })
}

function group(name, children = []) {
  const g = new THREE.Group()
  g.name = name
  children.forEach((c) => g.add(c))
  return g
}

// 俯视轮廓（X 船长，shape 的 Y 是半宽，之后旋转成 Z）
function hullOutline(inset = 0) {
  const l = HULL.length / 2 - inset
  const w = HULL.width / 2 - inset
  const s = new THREE.Shape()
  s.moveTo(-l, -w + 1)
  s.lineTo(20 - inset * 0.5, -w)
  s.quadraticCurveTo(42 - inset, -w + 2, l, 0)
  s.quadraticCurveTo(42 - inset, w - 2, 20 - inset * 0.5, w)
  s.lineTo(-l, w - 1)
  s.quadraticCurveTo(-l - 3, 0, -l, -w + 1)
  return s
}

function upright(geometry, y0) {
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, y0, 0)
  return geometry
}

function buildHullShell() {
  const wallShape = hullOutline(0)
  wallShape.holes.push(hullOutline(1.2))
  const walls = new THREE.Mesh(
    upright(new THREE.ExtrudeGeometry(wallShape, { depth: 18, bevelEnabled: false }), HULL.bottom),
    std(PALETTE.wood, { transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }),
  )
  const bottom = new THREE.Mesh(
    upright(new THREE.ExtrudeGeometry(hullOutline(0), { depth: 1.2, bevelEnabled: false }), HULL.bottom),
    std(PALETTE.deepWood, { transparent: true, opacity: 0.55, depthWrite: false }),
  )
  return group('hull_shell', [walls, bottom])
}

function buildJoint() {
  // 装配态：榫头组在 x=-5，卯眼组在 x=+5；爆炸沿 X 分离
  const tenonBeam = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 5), std(PALETTE.wood))
  tenonBeam.position.set(-6.5, 0, 0)
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.6), std(PALETTE.deepWood))
  tongue.position.set(3, 0, 0)
  const tenon = group('joint_tenon', [tenonBeam, tongue])
  tenon.position.set(-5, 0, 0)

  const top = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 5), std(PALETTE.wood))
  top.position.set(0, 1.9, 0)
  const bottom = top.clone()
  bottom.material = std(PALETTE.wood)
  bottom.position.set(0, -1.9, 0)
  const back = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 5), std(PALETTE.wood))
  back.position.set(7, 0, 0)
  const mortise = group('joint_mortise', [top, bottom, back])
  mortise.position.set(5, 0, 0)

  return { tenon, mortise, assembledX: 5, explodedX: 13 }
}

function buildSeam() {
  // 一段船壳板 + 可见缝隙；板厚 1.5，缝初始宽 1.6
  const plankGeo = new THREE.BoxGeometry(40, 7, 1.5)
  const upper = new THREE.Mesh(plankGeo, std(PALETTE.wood))
  const lower = new THREE.Mesh(plankGeo, std(PALETTE.deepWood))
  upper.position.y = 4.3
  lower.position.y = -4.3
  // 缝端的榫卯定位标记（补缝第一步亮起）
  const marker = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.2), std(PALETTE.paper))
  marker.position.set(-17, 0, 0)
  marker.visible = false
  const seam = group('plank_seam', [upper, lower, marker])

  const nails = group('nail_set')
  const nailGeo = new THREE.CylinderGeometry(0.35, 0.35, 9.5, 10)
  for (let i = 0; i < 8; i += 1) {
    const nail = new THREE.Mesh(nailGeo, std(PALETTE.iron))
    nail.position.set(-14 + i * 4, 0, 0)
    nails.add(nail)
  }

  const caulk = new THREE.Mesh(new THREE.BoxGeometry(40, 1.0, 1.7), std(PALETTE.paper))
  const caulkLayer = group('caulk_layer', [caulk])

  return {
    seam,
    nails,
    caulkLayer,
    refs: { upper, lower, marker, caulk, openY: 4.3, closedY: 3.7 },
  }
}

function buildShipStructure() {
  const keel = new THREE.Mesh(new THREE.BoxGeometry(96, 2, 2.5), std(PALETTE.deepWood))
  keel.position.y = HULL.bottom - 1
  const keelG = group('keel', [keel])

  const stem = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2.5), std(PALETTE.deepWood))
  stem.position.set(48, -2, 0)
  stem.rotation.z = -0.18
  const stemG = group('stem', [stem])

  const sternpost = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2.5), std(PALETTE.deepWood))
  sternpost.position.set(-50, -2, 0)
  const sternpostG = group('sternpost', [sternpost])

  const bulkGeo = new THREE.BoxGeometry(1.2, 17, 25)
  const bulkheads = [-25, 0, 25].map((x, i) => {
    const b = new THREE.Mesh(bulkGeo, std(PALETTE.wood))
    b.position.set(x, -3, 0)
    return group(`bulkhead_0${i + 1}`, [b])
  })

  return { keelG, stemG, sternpostG, bulkheads }
}

function buildWater() {
  const mat = () =>
    new THREE.MeshStandardMaterial({
      color: PALETTE.water,
      transparent: true,
      opacity: 0.5,
      roughness: 0.3,
      depthWrite: false,
    })
  // bulkhead_01 与 bulkhead_02 之间的舱（x -25..0）
  const comp = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 24), mat())
  comp.position.set(-12.5, HULL.bottom + 0.5, 0)
  comp.visible = false
  const full = new THREE.Mesh(new THREE.BoxGeometry(96, 0.5, 24), mat())
  full.position.set(0, HULL.bottom + 0.5, 0)
  full.visible = false
  return { comp, full, hiddenY: HULL.bottom + 0.5, compLevel: HULL.bottom + 18 * 0.8, fullLevel: HULL.bottom + 18 * 0.6 }
}

function buildShadow() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(128, 64, 8, 128, 64, 120)
  grad.addColorStop(0, 'rgba(0,0,0,0.42)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 128)
  const tex = new THREE.CanvasTexture(canvas)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(130, 44),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = HULL.bottom - 2.4
  return shadow
}

// 占位构建入口：返回零件注册表与各交互需要的句柄
export function buildPlaceholders() {
  const hull = buildHullShell()
  const { keelG, stemG, sternpostG, bulkheads } = buildShipStructure()
  const joint = buildJoint()
  const seam = buildSeam()
  const water = buildWater()
  const shadow = buildShadow()

  const shipGroup = new THREE.Group()
  shipGroup.name = 'ship'
  ;[hull, keelG, stemG, sternpostG, ...bulkheads, water.comp, water.full].forEach((g) => shipGroup.add(g))

  const detailGroup = new THREE.Group()
  detailGroup.name = 'details'
  detailGroup.add(joint.tenon, joint.mortise, seam.seam, seam.nails, seam.caulkLayer)

  const nodes = new Map()
  ;[
    hull,
    keelG,
    stemG,
    sternpostG,
    ...bulkheads,
    joint.tenon,
    joint.mortise,
    seam.seam,
    seam.nails,
    seam.caulkLayer,
  ].forEach((g) => nodes.set(g.name, g))

  return { shipGroup, detailGroup, shadow, nodes, joint, seam, water, bulkheads }
}
