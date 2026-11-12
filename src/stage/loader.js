import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// GLB 加载：Draco 解码器走本地 public/draco/（不引 CDN），默认 8 秒超时。
// 失败或超时返回 null，并通过 onError(reason) 区分原因，调用方据此决定降级策略：
//   'missing' 文件不存在（模型还没交付）→ 保留占位几何
//   'timeout' 超时 → 保留占位几何
//   'error'   文件存在但解析失败 → 由上层决定是否落 SVG

const DEFAULT_TIMEOUT = 8000

export function createGltfLoader(base = '/') {
  const draco = new DRACOLoader()
  draco.setDecoderPath(`${base}draco/`)

  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  return { loader, draco }
}

function classify(err) {
  const msg = String(err?.message ?? err ?? '')
  if (/timeout/i.test(msg)) return 'timeout'
  if (/404|not found|Failed to fetch|NetworkError/i.test(msg)) return 'missing'
  return 'error'
}

// 兼容两种调用：loadShip(url, onProgress) 与 loadShip(url, { base, timeoutMs, onProgress, onError })
export async function loadShip(url, options = {}) {
  const opts = typeof options === 'function' ? { onProgress: options } : options
  const { base = '/', timeoutMs = DEFAULT_TIMEOUT, onProgress, onError } = opts

  const { loader, draco } = createGltfLoader(base)

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
    const reason = classify(err)
    console.warn(`[stage] GLB 加载失败（${reason}），保留占位几何：`, err?.message ?? err)
    if (onError) onError(reason, err)
    return null
  } finally {
    clearTimeout(timer)
    // 解析完成后释放解码 worker，避免常驻内存。
    draco.dispose()
  }
}
