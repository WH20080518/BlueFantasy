import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// GLB 加载：Draco 解码器走本地 public/draco/（不引 CDN），默认 8 秒超时。
// 失败或超时返回 null —— 调用方保持占位几何，页面不白屏。

const DEFAULT_TIMEOUT = 8000

export async function loadShip(url, { base = '/', timeoutMs = DEFAULT_TIMEOUT, onProgress } = {}) {
  const draco = new DRACOLoader()
  draco.setDecoderPath(`${base}draco/`)

  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  let timer = 0
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    const gltf = await Promise.race([
      new Promise((resolve, reject) => {
        loader.load(
          url,
          resolve,
          (event) => {
            if (onProgress && event && event.total > 0) onProgress(event.loaded / event.total)
          },
          reject,
        )
      }),
      timeout,
    ])
    return gltf
  } catch (err) {
    console.warn('[stage] GLB 不可用，保留占位几何：', err?.message ?? err)
    return null
  } finally {
    clearTimeout(timer)
    // 解析完成后释放解码 worker，避免常驻内存。
    draco.dispose()
  }
}
