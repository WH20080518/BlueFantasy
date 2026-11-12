// 第 7 屏「三问」的内容。与 beats.js 一样，文案不写进组件。
// 题目对应正文里的三个知识点：钉、水密隔舱、术语翻译。

export const quizCopy = {
  title: { zh: '三问', en: 'Three questions' },
  lead: {
    zh: '七屏看完了。用三题确认一下：这艘船到底靠什么连接。',
    en: 'Seven screens in. Three questions to check what actually holds the ship together.',
  },
  progress: { zh: '第 {n} / 3 题', en: 'Question {n} / 3' },
  right: { zh: '对了', en: 'Right' },
  wrong: { zh: '不对', en: 'Not quite' },
  next: { zh: '下一题', en: 'Next question' },
  finish: { zh: '看结果', en: 'See result' },
  score: { zh: '答对 {n} / 3 题', en: '{n} / 3 correct' },
  again: { zh: '再答一次', en: 'Try again' },
  done: {
    zh: '三题全对。你记住的不是「古船不用钉」，而是它怎么被连接起来的。',
    en: 'All three. What you keep is not “no nails” — it is how the ship is held together.',
  },
}

export const questions = [
  {
    q: {
      zh: '「中国古船不用一根钉」——这句话对吗？',
      en: '“Chinese ships used no nails.” Is that right?',
    },
    options: [
      { zh: '对，全靠榫卯咬合', en: 'Yes — joinery alone' },
      {
        zh: '不对：榫卯定位，铁钉或木钉加固，再用桐油灰拌麻丝捻缝',
        en: 'No: joinery locates, nails lock, putty and hemp caulk the seam',
      },
      { zh: '只有内河船用钉，海船不用', en: 'Only river boats used nails' },
    ],
    answer: 1,
    why: {
      zh: '这是全篇最重要的一次纠正：榫、钉、捻缝不是三选一，而是叠加使用的三道工。',
      en: 'The key correction: joinery, nails and caulking are not alternatives — they are three layers working together.',
    },
  },
  {
    q: {
      zh: '水密隔舱真正的作用是什么？',
      en: 'What do watertight bulkheads actually do?',
    },
    options: [
      { zh: '把货物分开放，方便装卸', en: 'Separate cargo holds for easier loading' },
      {
        zh: '把船体分成互不连通的舱，一舱进水时其余舱仍提供浮力',
        en: 'Split the hull into sealed compartments so a breach stays local',
      },
      { zh: '加固船体，让船能撞礁', en: 'Reinforce the hull so it can hit reefs' },
    ],
    answer: 1,
    why: {
      zh: '所以第 5 屏里「一个舱破了，船还在」：水被隔在一舱，浮力只少一点。抽掉隔舱板，水就一路漫过去。',
      en: 'That is why one flooded compartment still floats: the water is kept local. Remove the bulkheads and it runs the length of the hull.',
    },
  },
  {
    q: {
      zh: '把「榫卯」译成英文，最接近的是哪个？',
      en: 'Which is closest to an English rendering of 榫卯?',
    },
    options: [
      { zh: 'sunmao（直接音译）', en: 'sunmao (transliteration)' },
      { zh: 'mortise-and-tenon joint', en: 'mortise-and-tenon joint' },
      { zh: 'wood lock', en: 'wood lock' },
    ],
    answer: 1,
    why: {
      zh: '英文里没有对应的单词，只能用 mortise-and-tenon joint 这样的解释性说法——翻译本身也是一次榫合。',
      en: 'English has no single word for it, so the closest is an explained phrase. Translation is joinery too.',
    },
  },
]
