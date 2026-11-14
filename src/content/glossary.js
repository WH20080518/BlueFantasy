// 术语词条：docs/09-glossary.md。先标译法类型，再给译名。
// type 取值见 09 第 0 节：直译 / 解释译 / 音译 / 待核（页面上只出现前两类的完整词条）。

export const glossary = [
  {
    id: 'sunmao',
    zh: '榫卯',
    en: 'mortise-and-tenon joint',
    type: '解释译',
    note: {
      zh: '英文无单词对应；不要译成 tenon。',
      en: 'No single English word; the closest established phrase.',
    },
  },
  {
    id: 'sunhe-dingjie',
    zh: '榫合钉接',
    en: 'mortise-and-tenon joinery with nail fastening',
    type: '解释译',
    note: {
      zh: '全文核心概念：榫卯定位，钉加固。',
      en: 'The core method: tenons locate, nails fasten.',
    },
  },
  { id: 'tenon', zh: '榫头', en: 'tenon', type: '直译' },
  { id: 'mortise', zh: '卯眼', en: 'mortise', type: '直译' },
  { id: 'keel', zh: '龙骨', en: 'keel', type: '直译' },
  { id: 'stem', zh: '艏柱', en: 'stem', type: '直译' },
  { id: 'sternpost', zh: '艉柱', en: 'sternpost', type: '直译' },
  {
    id: 'bulkhead',
    zh: '隔舱板',
    en: 'bulkhead',
    type: '直译',
    note: { zh: '水密语境下写 watertight bulkhead。', en: 'Watertight bulkhead in the watertight sense.' },
  },
  {
    id: 'watertight-compartment',
    zh: '水密隔舱',
    en: 'watertight compartment',
    type: '直译',
  },
  { id: 'plank-seam', zh: '船板接缝', en: 'plank seam', type: '直译' },
  { id: 'hull-plank', zh: '船壳板', en: 'hull plank', type: '直译' },
  { id: 'iron-nail', zh: '铁钉', en: 'iron nail', type: '直译' },
  {
    id: 'treenail',
    zh: '木钉',
    en: 'treenail',
    type: '直译',
    note: { zh: '造船语境优先 treenail。', en: 'Also wooden peg; treenail preferred in shipbuilding.' },
  },
  { id: 'caulking', zh: '捻缝', en: 'caulking', type: '直译' },
  {
    id: 'tung-oil-putty',
    zh: '桐油灰',
    en: 'tung-oil putty',
    type: '解释译',
  },
  { id: 'hemp-fiber', zh: '麻丝', en: 'hemp fiber', type: '直译' },
  {
    id: 'ship-deck',
    zh: '甲板',
    en: 'deck',
    type: '直译',
    note: { zh: '指上层连续铺板，不写 deck board。', en: 'The continuous upper platform; not "deck board".' },
  },
]

// beat 6 术语墙展示的词条（顺序即呈现顺序）
export const termWall = ['sunmao', 'sunhe-dingjie', 'tenon', 'mortise', 'bulkhead', 'watertight-compartment', 'caulking']

// 3D 节点名 → 词条 id（parts.js 用）
export const nodeTerms = {
  joint_tenon: 'tenon',
  joint_mortise: 'mortise',
  keel: 'keel',
  stem: 'stem',
  sternpost: 'sternpost',
  bulkhead_01: 'bulkhead',
  bulkhead_02: 'bulkhead',
  bulkhead_03: 'bulkhead',
  plank_seam: 'plank-seam',
  nail_set: 'iron-nail',
  caulk_layer: 'caulking',
  hull_shell: 'hull-plank',
}

// 节点家族：parts.json 白名单里有 bulkhead_01..12 这类带编号的节点，
// 也有 iron_nail / caulking_seam / ship_deck 这种下划线写法，
// 术语只存一份，编号在界面上补。
const NODE_FAMILIES = [
  [/^bulkhead_(\d{2})$/, 'bulkhead'],
  [/^ship_deck$/, 'ship-deck'],
  [/^iron_nail$/, 'iron-nail'],
  [/^caulking_seam$/, 'caulking'],
  [/^treenail$/, 'treenail'],
]

function seqOf(name) {
  const m = name.match(/_(\d{2})$/)
  return m ? m[1] : null
}

// 节点名 → { term, seq }。先查显式映射，再走家族正则，都不中就返回 null。
export function resolveNode(name) {
  if (!name) return null
  const direct = nodeTerms[name]
  if (direct) {
    const term = termById(direct)
    if (term) return { term, seq: seqOf(name) }
  }
  for (const [re, id] of NODE_FAMILIES) {
    const m = name.match(re)
    if (!m) continue
    const term = termById(id)
    if (term) return { term, seq: m[1] || null }
  }
  return null
}

// 浮层里的第四类文字：一句解释。字数上限见 docs/17-node-terms.md。
// 与 note 分开：note 是译法提醒（给评审看），gloss 是这个词是什么（给读者看）。
export const termGloss = {
  'hull-plank': { zh: '船体的外皮，一条条船板拼成', en: 'The outer skin, built up from strakes' },
  keel: { zh: '船底中央的纵向大梁', en: 'The central timber along the bottom' },
  stem: { zh: '船头那道向上的立木', en: 'The upright timber at the bow' },
  sternpost: { zh: '船尾那道立木', en: 'The upright timber at the stern' },
  bulkhead: { zh: '横着隔断船体的木板', en: 'A transverse wall across the hull' },
  'watertight-compartment': { zh: '隔舱板围出的独立舱室', en: 'A sealed space between bulkheads' },
  'plank-seam': { zh: '两块船板相接的那道缝', en: 'The seam where two planks meet' },
  'iron-nail': { zh: '钉入船板加固的铁钉', en: 'An iron fastener driven through planking' },
  treenail: { zh: '木制的钉，用来代替铁钉', en: 'A wooden peg used instead of iron' },
  caulking: { zh: '把麻丝与桐油灰压进缝里', en: 'Hemp and putty worked into the seam' },
  'ship-deck': { zh: '船身上部的连续铺板', en: 'The continuous upper platform' },
  tenon: { zh: '一块木头伸出的凸头', en: 'The tongue left standing on one timber' },
  mortise: { zh: '另一块木头凿出的凹口', en: 'The socket cut into the mating timber' },
}

export function termById(id) {
  return glossary.find((t) => t.id === id) || null
}
