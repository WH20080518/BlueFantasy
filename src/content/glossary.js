// 术语词条：docs/09-glossary.md。先标译法类型，再给译名。
// type 取值见 09 第 0 节：直译 / 解释译 / 音译 / 待核（页面上只出现前两类的完整词条）。
// migration 是 b6 迁移视图的可选数据，规格见 docs/16-term-beat-spec.md。
// 只有 termWall 里会展示、且能说清「丢了什么」的词条才写这个字段。

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
    migration: {
      origin: {
        zh: '中文里「榫」与「卯」是一对：一个凸出的头，一个凹进的眼。',
        en: 'In Chinese the two halves are named as a pair: a head that projects, an eye that receives.',
      },
      literal: {
        text: 'tenon-mortise',
        note: {
          zh: '英文里没有这个并列词，读者会当成两个零件的堆叠。',
          en: 'No such compound in English; it reads as two parts listed side by side.',
        },
      },
      explained: {
        text: 'mortise-and-tenon joint',
        note: {
          zh: '作定语时写 mortise-and-tenon。',
          en: 'Hyphenated before a noun: mortise-and-tenon.',
        },
      },
      lost: {
        zh: '成对的拟人。「一处连接」变成了「两个零件的清单」。',
        en: 'The pair. One joint becomes two parts on a list.',
      },
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
    migration: {
      origin: {
        zh: '四个字是一个方法名：榫定位、钉加固，合起来算一种做法。',
        en: 'Four characters name one method: tenons locate, nails fasten.',
      },
      literal: {
        text: 'tenon-joint-nail-join',
        note: {
          zh: '中文能四字压缩，英文照搬不成句。',
          en: 'Chinese compresses to four characters; stacked the same way it is not a phrase.',
        },
      },
      explained: {
        text: 'mortise-and-tenon joinery with nail fastening',
        note: {
          zh: '首次出现用全称，之后可用 joinery plus fastening。',
          en: 'Full form on first use; joinery plus fastening after that.',
        },
      },
      lost: {
        zh: '命名的紧凑感。中文是术语，英文是说明书。',
        en: 'The compression. In Chinese it is a term; in English it is a description.',
      },
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
  {
    id: 'caulking',
    zh: '捻缝',
    en: 'caulking',
    type: '直译',
    migration: {
      origin: {
        zh: '「捻」是手上的动作：把麻丝搓进缝里。',
        en: 'The verb is a hand action: hemp fiber twisted into the seam.',
      },
      literal: {
        text: 'twist-seam',
        note: {
          zh: '读者会以为是拧绳子。',
          en: 'Reads as twisting a rope, not filling a gap.',
        },
      },
      explained: {
        text: 'caulking',
        note: { zh: '动词写 to caulk。', en: 'Verb form: to caulk.' },
      },
      lost: {
        zh: '手。英文保留了结果（填缝），丢了那个搓的动作。',
        en: 'The hand. English keeps the result, filling a gap, and drops the twisting.',
      },
    },
  },
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
