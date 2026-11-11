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

export function termById(id) {
  return glossary.find((t) => t.id === id) || null
}
