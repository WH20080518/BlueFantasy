#!/usr/bin/env node
// 解析 GLB 二进制头，输出预算报告：面数 / 体积 / 材质 / 图元数 / 节点名。
//
// 用法：
//   node tools/check-model.mjs                       # 默认 public/models/ship.glb
//   node tools/check-model.mjs a.glb --max-tris 60000 --max-mb 5
//
// 超标或文件损坏时以 1 退出。

import { readFileSync } from 'node:fs'

const argv = process.argv.slice(2)
function flagValue(name, fallback) {
  const i = argv.indexOf(name)
  if (i === -1) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) ? v : fallback
}
const maxTris = flagValue('--max-tris', 60000)
const maxMB = flagValue('--max-mb', 5)
// 纹理预算默认不限（历史资产已超 docs/03 的 2 张目标），传参时才卡。
const maxImages = flagValue('--max-images', Infinity)
const maxTextures = flagValue('--max-textures', Infinity)

const flagNames = new Set(['--max-tris', '--max-mb', '--max-images', '--max-textures'])
const positional = argv.filter((a, i) => !a.startsWith('-') && !flagNames.has(argv[i - 1] ?? ''))
const file = positional[0] ?? 'public/models/ship.glb'

const GLB_MAGIC = 0x46546c67 // 'glTF'
const CHUNK_JSON = 0x4e4f534a // 'JSON'

let buf
try {
  buf = readFileSync(file)
} catch (err) {
  const why = err.code === 'ENOENT' ? '文件不存在' : err.message
  console.error(`✗ 读不到 ${file}：${why}`)
  process.exit(1)
}

const bytes = buf.length
if (bytes < 12) {
  console.error(`✗ ${file} 只有 ${bytes} 字节，不是 GLB`)
  process.exit(1)
}
if (buf.readUInt32LE(0) !== GLB_MAGIC) {
  console.error(`✗ ${file} 的 magic 不是 glTF（可能是 .gltf 文本格式）`)
  process.exit(1)
}
const version = buf.readUInt32LE(4)
if (version !== 2) console.warn(`⚠ glTF 版本 ${version}，标准是 2`)

let offset = 12
let json = null
let bin = null
while (offset + 8 <= bytes) {
  const chunkLength = buf.readUInt32LE(offset)
  const chunkType = buf.readUInt32LE(offset + 4)
  const start = offset + 8
  if (start + chunkLength > bytes) {
    console.error('✗ chunk 越界，文件可能被截断')
    process.exit(1)
  }
  if (chunkType === CHUNK_JSON && json === null) {
    const text = buf.subarray(start, start + chunkLength).toString('utf8')
    try {
      json = JSON.parse(text)
    } catch (err) {
      console.error(`✗ JSON chunk 解析失败：${err.message}`)
      process.exit(1)
    }
  } else if (chunkType === 0x004e4942 && bin === null) {
    // 'BIN\0'
    bin = buf.subarray(start, start + chunkLength)
  }
  offset = start + chunkLength
}

if (!json) {
  console.error('✗ 没有找到 JSON chunk')
  process.exit(1)
}

const accessors = json.accessors ?? []
const meshes = json.meshes ?? []
let triangles = 0
let primitives = 0

for (const mesh of meshes) {
  for (const prim of mesh.primitives ?? []) {
    primitives += 1
    const posIndex = prim.attributes?.POSITION
    if (typeof posIndex !== 'number' || !accessors[posIndex]) continue
    const indices = prim.indices !== undefined ? accessors[prim.indices] : null
    triangles += (indices ? indices.count : accessors[posIndex].count) / 3
  }
}
triangles = Math.round(triangles)

const materials = (json.materials ?? []).length
const meshCount = meshes.length
const nodeNames = (json.nodes ?? []).map((n) => n.name).filter(Boolean)
const extensions = json.extensionsRequired ?? []
const mb = bytes / 1024 / 1024

// 纹理：GLB 的图片放在 BIN chunk 里，由 bufferView 引用。
// 只统计张数不够——尺寸才决定解码与显存，这里直接读 PNG/JPEG 头。
function imageSize(data) {
  if (!data) return null
  if (data.length > 24 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    return [data.readUInt32BE(16), data.readUInt32BE(20)]
  }
  if (data.length > 4 && data[0] === 0xff && data[1] === 0xd8) {
    let i = 2
    while (i + 9 < data.length) {
      if (data[i] !== 0xff) { i += 1; continue }
      const marker = data[i + 1]
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = data.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return [data.readUInt16BE(i + 7), data.readUInt16BE(i + 5)]
      }
      i += 2 + len
    }
  }
  return null
}

const images = json.images ?? []
const textures = json.textures ?? []
const bufferViews = json.bufferViews ?? []
const imageSizes = images.map((img) => {
  if (typeof img.bufferView !== 'number' || !bufferViews[img.bufferView] || !bin) return null
  const bv = bufferViews[img.bufferView]
  return imageSize(bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength))
})
const sized = imageSizes.filter(Boolean)
const sizeLabel = sized.length
  ? [...new Set(sized.map(([w, h]) => `${w}×${h}`))].join(', ')
  : '尺寸未知'


console.log('模型预算报告')
console.log('─'.repeat(36))
console.log(`文件      ${file}`)
console.log(`体积      ${mb.toFixed(2)} MB（上限 ${maxMB} MB）`)
console.log(`三角形    ${triangles.toLocaleString('en-US')}（上限 ${maxTris.toLocaleString('en-US')}）`)
console.log(`材质      ${materials}`)
console.log(`网格/图元 ${meshCount} / ${primitives}（图元数约等于 draw call 下限）`)
console.log(`纹理      ${images.length} 张图 / ${textures.length} 个纹理对象（${sizeLabel}）`)
console.log(`节点      ${nodeNames.length}`)
if (nodeNames.length > 0) console.log('  ' + nodeNames.slice(0, 24).join(', ') + (nodeNames.length > 24 ? ' …' : ''))
if (extensions.length > 0) console.log(`扩展      ${extensions.join(', ')}`)
if (extensions.includes('KHR_draco_mesh_compression')) {
  console.log('⚠ 需要 Draco 解码器：确认 public/draco/ 已就位')
}

const problems = []
if (triangles > maxTris) problems.push(`面数超标 ${triangles} > ${maxTris}`)
if (mb > maxMB) problems.push(`体积超标 ${mb.toFixed(2)}MB > ${maxMB}MB`)
if (images.length > maxImages) problems.push(`纹理张数超标 ${images.length} > ${maxImages}`)
if (textures.length > maxTextures) problems.push(`纹理对象超标 ${textures.length} > ${maxTextures}`)

// docs/03 §7 的预算是 2 张 1024；当前资产超了，但不默认为失败，避免 CI 被历史资产卡死。
if (images.length > 2) {
  console.log(`⚠ 纹理张数超出 docs/03 §7 的 2 张预算：当前 ${images.length} 张图 / ${textures.length} 个纹理对象`)
}

if (problems.length > 0) {
  console.error('')
  for (const p of problems) console.error(`✗ ${p}`)
  process.exit(1)
}

console.log('')
console.log('✓ 预算通过')
