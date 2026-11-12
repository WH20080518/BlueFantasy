#!/usr/bin/env node
// 校验 models/parts.json：顶层数组、节点名白名单、装配/爆炸位。
//
// 用法：
//   node tools/check-parts.mjs                 # 校验 models/parts.json
//   node tools/check-parts.mjs some.json       # 校验指定文件
//   node tools/check-parts.mjs --sync          # 校验并同步到 public/models/parts.json
//
// 失败时逐条打印原因并以 1 退出，可直接进 CI / pre-push。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// 节点名白名单：必须与 src/stage/placeholder.js 及 GLB 导出名一致。
// 隔舱板按实船 12 道（与 D 的事实核查对齐）；占位几何目前只建了 3 道，
// 多出来的名字允许出现在 parts.json 里，不会被占位场景使用。
const ALLOWED = new Set([
  'hull_shell',
  'ship_deck',
  'keel',
  'stem',
  'sternpost',
  ...Array.from({ length: 12 }, (_, i) => `bulkhead_${String(i + 1).padStart(2, '0')}`),
  'plank_seam',
  'nail_set',
  'caulk_layer',
  'treenail',
  'iron_nail',
  'caulking_seam',
  'joint_tenon',
  'joint_mortise',
])

const argv = process.argv.slice(2)
const sync = argv.includes('--sync')
const positional = argv.filter((a) => !a.startsWith('-'))
const file = positional[0] ?? 'models/parts.json'

function isVec3(v) {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n))
  )
}

let raw
try {
  raw = readFileSync(file, 'utf8')
} catch (err) {
  const why = err.code === 'ENOENT' ? '文件不存在' : err.message
  console.error(`✗ 读不到 ${file}：${why}`)
  process.exit(1)
}

let data
try {
  data = JSON.parse(raw)
} catch (err) {
  console.error(`✗ ${file} 不是合法 JSON：${err.message}`)
  process.exit(1)
}

const errors = []
const UNIT_OK = ['m', 'cm', 'mm']
let unit = null
let list = data

if (Array.isArray(data)) {
  unit = null
} else if (data && typeof data === 'object' && Array.isArray(data.parts)) {
  unit = data.unit ?? null
  list = data.parts
  if (unit !== null && UNIT_OK.indexOf(unit) === -1) {
    errors.push('unit 必须是 m / cm / mm 之一，收到 ' + unit)
  }
} else {
  errors.push('顶层必须是数组，或 { unit, parts } 对象')
}

if (errors.length === 0) {
  const seen = new Set()
  list.forEach((part, i) => {
    const at = `第 ${i + 1} 项`
    if (!part || typeof part !== 'object' || Array.isArray(part)) {
      errors.push(`${at}：必须是对象`)
      return
    }
    if (typeof part.name !== 'string' || part.name.trim() === '') {
      errors.push(`${at}：name 必须是非空字符串`)
    } else if (seen.has(part.name)) {
      errors.push(`${at}：name "${part.name}" 重复`)
    } else {
      seen.add(part.name)
      if (!ALLOWED.has(part.name)) {
        errors.push(`${at}：未知节点名 "${part.name}"（不在白名单）`)
      }
    }
    if (!isVec3(part.assembled)) errors.push(`${at}：assembled 必须是 3 个有限数字`)
    if (!isVec3(part.exploded)) errors.push(`${at}：exploded 必须是 3 个有限数字`)
    if (part.label !== undefined && typeof part.label !== 'string') {
      errors.push(`${at}：label 若存在必须是字符串`)
    }
  })
}

if (errors.length > 0) {
  console.error(`✗ ${file} 校验失败，共 ${errors.length} 处：`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`✓ ${file} OK：${list.length} 个零件` + (unit ? `，unit=${unit}` : ''))

if (sync) {
  const out = resolve('public/models/parts.json')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(unit ? { unit, parts: list } : list, null, 2) + '\n')
  console.log(`→ 已同步到 ${out}`)
}
