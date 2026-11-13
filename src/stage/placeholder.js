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

// 船体宽度随高度收窄：舷顶最宽，往下收到 62%，再交给船底弧线收到龙骨。
function hullWidthScale(y) {
  const t = Math.min(1, Math.max(0, (y - HULL.bottom) / (HULL.top - HULL.bottom)))
  return 0.62 + 0.38 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85)
}

// 船底在中轴（z=0）上的纵剖高度：沿 x 找最深的那一层，龙骨直接贴着它走
function hullBottomY(x) {
  const layers = hullLayers()
  const half = HULL.length / 2
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    if (Math.abs(x) <= half * layers[i].s) return layers[i].y
  }
  return layers[0].y
}

// 从舷顶到龙骨的分层：上半段是侧壁，下半段是船底弧。
function hullLayers() {
  const out = []
  const upper = 12
  for (let i = 0; i <= upper; i += 1) {
    const y = HULL.top - (i / upper) * 18
    out.push({ y, s: hullWidthScale(y) })
  }
  const base = hullWidthScale(HULL.bottom)
  const lower = 8
  for (let i = 1; i <= lower; i += 1) {
    const t = i / lower
    out.push({
      y: HULL.bottom - 4.6 * Math.sin((t * Math.PI) / 2),
      s: base * Math.pow(Math.cos((t * Math.PI) / 2), 0.8),
    })
  }
  return out
}

// 把轮廓按层缩放后缝成曲面；flip 用来生成内壁（法线朝里）
function loftSurface(outline, layers, flip) {
  const n = outline.length - 1
  const verts = []
  for (let l = 0; l < layers.length - 1; l += 1) {
    const a = layers[l]
    const b = layers[l + 1]
    for (let i = 0; i < n; i += 1) {
      const p0 = outline[i]
      const p1 = outline[(i + 1) % n]
      const ax = p0.x * a.s, ay = a.y, az = -p0.y * a.s
      const bx = p1.x * a.s, bz = -p1.y * a.s
      const cx = p0.x * b.s, cy = b.y, cz = -p0.y * b.s
      const dx = p1.x * b.s, dz = -p1.y * b.s
      if (flip) {
        verts.push(ax, ay, az, cx, cy, cz, bx, ay, bz)
        verts.push(bx, ay, bz, cx, cy, cz, dx, cy, dz)
      } else {
        verts.push(ax, ay, az, bx, ay, bz, cx, cy, cz)
        verts.push(bx, ay, bz, dx, cy, dz, cx, cy, cz)
      }
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  return geo
}

// 舷缘顶面：把外壁和内衬的顶边连成一圈，直接由放样轮廓派生，尖头处不会自交
function hullRim(outer, inner, y) {
  const n = outer.length - 1
  const v = []
  for (let i = 0; i < n; i += 1) {
    const o0 = outer[i]
    const o1 = outer[(i + 1) % n]
    const i0 = inner[i]
    const i1 = inner[(i + 1) % n]
    v.push(o0.x, y, -o0.y, i0.x, y, -i0.y, o1.x, y, -o1.y)
    v.push(o1.x, y, -o1.y, i0.x, y, -i0.y, i1.x, y, -i1.y)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  geo.computeVertexNormals()
  return geo
}

function buildHullShell() {
  const layers = hullLayers()
  const outer = hullOutline(0).getPoints(64)
  const inner = hullOutline(1.2).getPoints(64)

  const walls = new THREE.Mesh(
    loftSurface(outer, layers, false),
    std(PALETTE.wood, { transparent: true, opacity: 0.82, depthWrite: true, side: THREE.FrontSide }),
  )
  const lining = new THREE.Mesh(
    loftSurface(inner, layers, true),
    std(PALETTE.deepWood, { transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }),
  )

  // 舷缘：外壁与内衬的顶边直接连成环面，把顶上的开口封住（拉伸体会在尖头自交，这里不用）
  const rail = new THREE.Mesh(
    hullRim(outer, inner, HULL.top - 0.15),
    std(PALETTE.deepWood, { transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
  )

  // 甲板：封顶，只在整船镜头出现；剖舱镜头（b4–b6）要能看进舱里，由 beats 的 stage.nodes 控制
  const deckGeo = new THREE.ExtrudeGeometry(hullOutline(0.1), { depth: 1.1, bevelEnabled: false })
  deckGeo.rotateX(-Math.PI / 2)
  deckGeo.translate(0, HULL.top - 1.1, 0)
  const deckMesh = new THREE.Mesh(
    deckGeo,
    std(PALETTE.wood, { transparent: true, opacity: 0.97, side: THREE.DoubleSide }),
  )

  // 舱口：甲板上的深色开口，破掉「一整块平板」的观感
  const hatch = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.5, 11),
    std(PALETTE.deepWood, { transparent: true, opacity: 0.92 }),
  )
  hatch.position.set(-8, HULL.top - 0.5, 0)

  // 艉楼：船尾抬高的矮舱室，古船的典型轮廓
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(15, 4.6, 19),
    std(PALETTE.wood, { transparent: true, opacity: 0.95 }),
  )
  cabin.position.set(-33, HULL.top + 2.3, 0)
  const cabinRoof = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.7, 20),
    std(PALETTE.deepWood, { transparent: true, opacity: 0.95 }),
  )
  cabinRoof.position.set(-33, HULL.top + 4.6, 0)

  // 桅杆：两根，让轮廓一眼读成船而不是箱子
  const mastGeo = new THREE.CylinderGeometry(0.5, 0.75, 26, 10)
  const mastA = new THREE.Mesh(mastGeo, std(PALETTE.deepWood))
  mastA.position.set(16, HULL.top + 13, 0)
  const mastB = new THREE.Mesh(mastGeo, std(PALETTE.deepWood))
  mastB.position.set(-14, HULL.top + 13, 0)

  // 横桁：桅杆上部的横向木杆，帆船的辨识特征
  const yardGeo = new THREE.CylinderGeometry(0.3, 0.3, 17, 8)
  yardGeo.rotateX(Math.PI / 2)
  const yardA = new THREE.Mesh(yardGeo, std(PALETTE.deepWood))
  yardA.position.set(16, HULL.top + 20, 0)
  const yardB = new THREE.Mesh(yardGeo, std(PALETTE.deepWood))
  yardB.position.set(-14, HULL.top + 18, 0)

  const deck = group('ship_deck', [deckMesh, hatch, cabin, cabinRoof, mastA, mastB, yardA, yardB])

  return { hull: group('hull_shell', [walls, lining, rail]), deck }
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
  // 龙骨：沿弧形船底走一条曲线，两端明显上翘，截面用六边近似方木
  // 龙骨：沿船底中轴线的纵剖线生成，每一处高度都由船底算出，必然贴合
  const keelPts = []
  for (let i = -7; i <= 7; i += 1) {
    const x = (i / 7) * 46
    keelPts.push(new THREE.Vector3(x, hullBottomY(x) - 1.15, 0))
  }
  const keelCurve = new THREE.CatmullRomCurve3(keelPts)
  const keel = new THREE.Mesh(
    new THREE.TubeGeometry(keelCurve, 96, 2.0, 6, false),
    std(PALETTE.deepWood, { roughness: 0.95 }),
  )
  const keelG = group('keel', [keel])

  const stem = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2.5), std(PALETTE.deepWood))
  stem.position.set(48, -2, 0)
  stem.rotation.z = -0.18
  const stemG = group('stem', [stem])

  const sternpost = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2.5), std(PALETTE.deepWood))
  sternpost.position.set(-50, -2, 0)
  const sternpostG = group('sternpost', [sternpost])

  // 隔舱板跟着船体收窄，否则船底变窄后会从两侧穿出去
  const bulkGeo = new THREE.BoxGeometry(1.2, 17, 25)
  const bulkBase = hullWidthScale(0)
  const bulkPos = bulkGeo.attributes.position
  for (let i = 0; i < bulkPos.count; i += 1) {
    const worldY = bulkPos.getY(i) - 3
    bulkPos.setZ(i, bulkPos.getZ(i) * (hullWidthScale(worldY) / bulkBase))
  }
  bulkPos.needsUpdate = true

  const bulkheads = [-25, 0, 25].map((x, i) => {
    const b = new THREE.Mesh(bulkGeo, std(PALETTE.wood))
    b.position.set(x, -3, 0)
    return group(`bulkhead_0${i + 1}`, [b])
  })

  return { keelG, stemG, sternpostG, bulkheads }
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
  const { hull, deck } = buildHullShell()
  const { keelG, stemG, sternpostG, bulkheads } = buildShipStructure()
  const joint = buildJoint()
  const seam = buildSeam()
  const shadow = buildShadow()

  const shipGroup = new THREE.Group()
  shipGroup.name = 'ship'
  ;[hull, deck, keelG, stemG, sternpostG, ...bulkheads].forEach((g) => shipGroup.add(g))

  const detailGroup = new THREE.Group()
  detailGroup.name = 'details'
  detailGroup.add(joint.tenon, joint.mortise, seam.seam, seam.nails, seam.caulkLayer)

  const nodes = new Map()
  ;[
    hull,
    deck,
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

  return { shipGroup, detailGroup, shadow, nodes, joint, seam, bulkheads }
}
