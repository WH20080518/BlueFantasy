import * as THREE from 'three'

// 每个 beat 的相机目标位。键名对应 beats.js 的 stage.camera。
export const CAMERAS = {
  wide: { position: [88, 34, 108], target: [0, -2, 0], fov: 42 },
  joint: { position: [26, 14, 34], target: [0, 0, 0], fov: 40 },
  seam: { position: [2, 6, 46], target: [0, -1, 0], fov: 40 },
  cutaway: { position: [64, 44, 88], target: [0, -3, 0], fov: 44 },
  flood: { position: [16, 14, 118], target: [0, -4, 0], fov: 44 },
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
  update(beatKey, nextKey, blend) {
    const a = CAMERAS[beatKey] || CAMERAS.wide
    const b = (nextKey && CAMERAS[nextKey]) || a
    const t = smoothstep(blend)
    this.desired.position.fromArray(a.position).lerp(new THREE.Vector3().fromArray(b.position), t)
    this.desired.target.fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target), t)
    this.desired.fov = a.fov + (b.fov - a.fov) * t

    if (this.reducedMotion()) {
      this.current.position.copy(this.desired.position)
      this.current.target.copy(this.desired.target)
      this.current.fov = this.desired.fov
    } else {
      // 阻尼：current += (target - current) * 0.08
      this.current.position.lerp(this.desired.position, 0.08)
      this.current.target.lerp(this.desired.target, 0.08)
      this.current.fov += (this.desired.fov - this.current.fov) * 0.08
    }

    this.camera.position.copy(this.current.position)
    this.camera.lookAt(this.current.target)
    if (Math.abs(this.camera.fov - this.current.fov) > 0.01) {
      this.camera.fov = this.current.fov
      this.camera.updateProjectionMatrix()
    }
  }
}
