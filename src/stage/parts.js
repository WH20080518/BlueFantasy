import * as THREE from 'three'

// 零件注册表：beat 可见性、点击拾取（Raycaster）、emissive 高亮、名称浮层锚点。

const HIGHLIGHT = new THREE.Color(0xc08a4a)

export class Parts {
  constructor(nodes) {
    this.nodes = nodes // Map<name, THREE.Group>
    this.pickables = [] // 当前 beat 可拾取的节点名
    this.selected = null
    this.focusIndex = -1
    this._raycaster = new THREE.Raycaster()
    this._pointer = new THREE.Vector2()
    this._saved = new Map() // mesh -> 原 emissive
  }

  setVisible(names) {
    const show = new Set(names)
    this.nodes.forEach((g, name) => {
      g.visible = show.has(name)
    })
  }

  setPickables(names) {
    this.pickables = names.filter((n) => this.nodes.has(n))
    this.focusIndex = -1
    if (this.selected && !this.pickables.includes(this.selected)) this.clear()
  }

  _meshes(name) {
    const g = this.nodes.get(name)
    if (!g) return []
    const out = []
    g.traverse((o) => {
      if (o.isMesh) out.push(o)
    })
    return out
  }

  _setEmissive(name, on) {
    this._meshes(name).forEach((m) => {
      if (!m.material || !('emissive' in m.material)) return
      if (on) {
        if (!this._saved.has(m)) this._saved.set(m, m.material.emissive.clone())
        m.material.emissive.copy(HIGHLIGHT)
        m.material.emissiveIntensity = 0.45
      } else if (this._saved.has(m)) {
        m.material.emissive.copy(this._saved.get(m))
        m.material.emissiveIntensity = 1
        this._saved.delete(m)
      }
    })
  }

  select(name) {
    if (this.selected === name) {
      this.clear()
      return null
    }
    this.clear()
    this.selected = name
    this._setEmissive(name, true)
    return name
  }

  clear() {
    if (this.selected) this._setEmissive(this.selected, false)
    this.selected = null
  }

  // ndcX/ndcY：归一化设备坐标
  pick(ndcX, ndcY, camera) {
    this._pointer.set(ndcX, ndcY)
    this._raycaster.setFromCamera(this._pointer, camera)
    const objects = this.pickables.map((n) => this.nodes.get(n)).filter(Boolean)
    const hits = this._raycaster.intersectObjects(objects, true)
    if (!hits.length) return null
    let o = hits[0].object
    while (o && !this.pickables.includes(o.name)) o = o.parent
    return o ? o.name : null
  }

  cycle(dir = 1) {
    if (!this.pickables.length) return null
    this.focusIndex = (this.focusIndex + dir + this.pickables.length) % this.pickables.length
    return this.pickables[this.focusIndex]
  }

  focused() {
    return this.focusIndex >= 0 ? this.pickables[this.focusIndex] : null
  }

  // 名称浮层锚点：零件包围盒顶部中心
  anchor(name, out) {
    const g = this.nodes.get(name)
    if (!g || !g.visible) return null
    const box = new THREE.Box3().setFromObject(g)
    if (box.isEmpty()) return null
    out.set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)
    return out
  }
}
