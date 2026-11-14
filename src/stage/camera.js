import * as THREE from 'three'

const _vA = new THREE.Vector3()
const _vB = new THREE.Vector3()
const _tA = new THREE.Vector3()
const _tB = new THREE.Vector3()

// 每个 beat 的相机目标位。键名对应 beats.js 的 stage.camera。
export const CAMERAS = {
  wide: { position: [88, 34, 108], target: [0, -2, 0], fov: 42 },
  joint: { position: [26, 14, 34], target: [0, 0, 0], fov: 40 },
  // 板缝是 40 个单位长的整段：46 的距离只有约 33 个单位视宽，两端必然出画。
  // 拉到 70，视点居中；左右落点靠 detailGroup 的位移，不在机位上拧。
  seam: { position: [0, 7, 70], target: [0, -1, 0], fov: 38 },
  cutaway: { position: [80, 70, 110], target: [0, 0, 0], fov: 44 },
  // 漏水屏：从船艏斜上俯看，破口舱落在画面右半，避开左下角文案
  flood: { position: [44, 32, 82], target: [12, -5, 0], fov: 40 },
  terms: { position: [96, 30, 96], target: [0, 0, 0], fov: 44 },
  away: { position: [150, 64, 170], target: [0, 2, 0], fov: 50 },
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export class CameraRig {
  constructor(camera, reducedMotion) {
    this.camera = camera
    this.reducedMotion = reducedMotion // () => boolean，每帧求值
    this.current = {
      position: new THREE.Vector3().fromArray(CAMERAS.wide.position),
      target: new THREE.Vector3().fromArray(CAMERAS.wide.target),
      fov: CAMERAS.wide.fov,
    }
    this.desired = {
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fov: CAMERAS.wide.fov,
    }
  }

  // beatKey：当前 beat 相机；nextKey：下一 beat 相机（可空）；blend：朝下一 beat 的插值 0..1
  update(beatKey, nextKey, blend, lt = 0, dt = 1 / 60) {
    const a = CAMERAS[beatKey] || CAMERAS.wide
    const b = (nextKey && CAMERAS[nextKey]) || a
    const t = smoothstep(blend)
    _vA.fromArray(a.position).lerp(_vB.fromArray(b.position), t)
    _tA.fromArray(a.target).lerp(_tB.fromArray(b.target), t)
    // beat 内持续推近：滚轮一动画面就有反应，而不是等到边界才动
    const dolly = 1 - 0.10 * Math.min(1, Math.max(0, lt))
    this.desired.position.copy(_tA).lerp(_vA, dolly)
    this.desired.target.copy(_tA)
    this.desired.fov = a.fov + (b.fov - a.fov) * t

    if (this.reducedMotion()) {
      this.current.position.copy(this.desired.position)
      this.current.target.copy(this.desired.target)
      this.current.fov = this.desired.fov
    } else {
      // 帧率无关阻尼：60fps 下等效 0.14，120fps 与 30fps 手感一致
      const k = 1 - Math.pow(1 - 0.14, Math.max(1, dt * 60))
      this.current.position.lerp(this.desired.position, k)
      this.current.target.lerp(this.desired.target, k)
      this.current.fov += (this.desired.fov - this.current.fov) * k
    }

    this.camera.position.copy(this.current.position)
    this.camera.lookAt(this.current.target)
    if (Math.abs(this.camera.fov - this.current.fov) > 0.01) {
      this.camera.fov = this.current.fov
      this.camera.updateProjectionMatrix()
    }
  }
}
