// 唯一文案来源：docs/08-story-map.md（不要把句子硬编码到别处）
// 结构约定见 08-story-map.md 第 9 节；stage.nodes 必须与 parts.json 节点名一致。

export const beats = [
  {
    id: 'b1',
    progress: [0.0, 0.12],
    eyebrow: { zh: '中国古船', en: 'A Chinese ship' },
    title: { zh: '古船不用一根钉？', en: 'Not a single nail?' },
    body: {
      zh: [
        '这句话流传很广。它听上去很浪漫：木头与木头互相咬住，不靠一颗铁钉。',
        '但我们把一艘船拆开之后，看到的东西比这句话复杂。',
      ],
      en: [
        'You hear it everywhere, and it is a romantic idea: wood holding wood, with no iron at all.',
        'Take a ship apart, and the picture gets more interesting.',
      ],
    },
    stage: { nodes: ['hull_shell', 'ship_deck'], camera: 'wide', motion: 'idle-spin' },
    fallback: 'svg/e1-ship-silhouette.svg',
    stageLabel: { zh: '舞台：一艘中国古船的剪影，外壳半透明', en: 'Stage: silhouette of a Chinese ship, translucent hull' },
  },
  {
    id: 'b2',
    progress: [0.12, 0.3],
    eyebrow: { zh: '连接 · 一', en: 'Joint · one' },
    title: { zh: '榫头，卯眼', en: 'Tenon, mortise' },
    body: {
      zh: [
        '一块木头伸出的部分叫榫头，另一块木头被掏空的部分叫卯眼。',
        '它们不靠胶，也不靠钉，靠的是形状本身互相卡住。',
      ],
      en: [
        'A tenon is a tongue left on one timber; a mortise is the socket cut to receive it.',
        'No glue, no nails — the shape itself holds.',
      ],
    },
    stage: { nodes: ['joint_tenon', 'joint_mortise'], camera: 'joint', motion: 'explode' },
    pick: ['joint_tenon', 'joint_mortise'],
    fallback: 'svg/e2-tenon-explode.svg',
    stageLabel: { zh: '舞台：一处榫卯节点，榫头与卯眼沿轴线分离', en: 'Stage: a joint pulled apart into tenon and mortise' },
  },
  {
    id: 'b3',
    progress: [0.3, 0.45],
    eyebrow: { zh: '连接 · 二', en: 'Joint · two' },
    title: { zh: '榫卯之外，还有钉', en: 'Beyond joinery: nails' },
    body: {
      zh: [
        '船不是家具。船要下水，要承浪，要几十年泡在盐里。',
        '所以真正的做法是「榫合钉接」：榫卯定位，铁钉或木钉加固，再用桐油灰拌麻丝把缝捻死。',
      ],
      en: [
        'A ship is not a cabinet. It goes into the water, takes waves, and stays wet for decades.',
        'So the real method is joinery **plus** fastening: tenons locate the plank, iron or wooden nails lock it, and tung-oil putty worked with hemp caulks the seam shut.',
      ],
    },
    stage: { nodes: ['plank_seam', 'nail_set', 'caulk_layer', 'treenail'], camera: 'seam', motion: 'layers' },
    interaction: 'caulk',
    fallback: 'svg/e3-seam-section.svg',
    stageLabel: { zh: '舞台：一段船壳板接缝的剖面', en: 'Stage: cross-section of a plank seam' },
  },
  {
    id: 'b4',
    progress: [0.45, 0.6],
    eyebrow: { zh: '结构', en: 'Structure' },
    title: { zh: '一艘船，几个房间', en: 'One ship, several rooms' },
    body: {
      zh: [
        '横向的隔舱板把船体分成互不相通的舱室。这道结构叫水密隔舱。',
        '它不只装货，它决定了这艘船进水之后还能不能浮着。',
      ],
      en: [
        'Transverse bulkheads cut the hull into compartments that do not connect.',
        'They carry cargo, and they decide whether the ship still floats once it is holed.',
      ],
    },
    stage: {
      nodes: ['hull_shell', 'bulkhead_01', 'bulkhead_02', 'bulkhead_03', 'bulkhead_04', 'bulkhead_05', 'bulkhead_06', 'bulkhead_07', 'bulkhead_08', 'bulkhead_09', 'bulkhead_10', 'bulkhead_11', 'bulkhead_12'],
      camera: 'cutaway',
      motion: 'none',
    },
    pick: ['bulkhead_01', 'bulkhead_02', 'bulkhead_03', 'bulkhead_04', 'bulkhead_05', 'bulkhead_06', 'bulkhead_07', 'bulkhead_08', 'bulkhead_09', 'bulkhead_10', 'bulkhead_11', 'bulkhead_12'],
    fallback: 'svg/e4-bulkhead-plan.svg',
    stageLabel: { zh: '舞台：剖切的船体，露出三道横向隔舱板', en: 'Stage: cutaway hull showing three transverse bulkheads' },
  },
  {
    id: 'b5',
    progress: [0.6, 0.8],
    eyebrow: { zh: '实验', en: 'Test' },
    title: { zh: '一个舱破了，船还在', en: 'One compartment floods. The ship stays afloat.' },
    body: {
      zh: [
        '水灌满一个舱，浮力少了一点，船倾斜，然后稳住。',
        '把隔舱板抽掉，同样的破口，水会一路漫过去。',
      ],
      en: [
        'Water fills a single hold. The ship loses some buoyancy, lists, then settles.',
        'Take the bulkheads out and the same breach runs the length of the hull.',
      ],
    },
    stage: {
      nodes: ['hull_shell', 'bulkhead_01', 'bulkhead_02', 'bulkhead_03', 'bulkhead_04', 'bulkhead_05', 'bulkhead_06', 'bulkhead_07', 'bulkhead_08', 'bulkhead_09', 'bulkhead_10', 'bulkhead_11', 'bulkhead_12'],
      camera: 'flood',
      motion: 'none',
    },
    interaction: 'flood',
    fallback: 'svg/e5-flood.svg',
    stageLabel: { zh: '舞台：船体侧视，一个舱正在进水', en: 'Stage: side view of the hull, one compartment flooding' },
  },
  {
    id: 'b6',
    progress: [0.8, 0.92],
    eyebrow: { zh: '翻译', en: 'Translation' },
    title: { zh: '一个词，怎么过海', en: 'How a word crosses water' },
    body: {
      zh: [
        '英文里没有和「榫卯」完全对应的词。最接近的写法是 mortise-and-tenon joint。',
        '翻译也是一次榫合：两边的形状不完全一样，但必须咬得住。',
      ],
      en: [
        'English has no single word for 榫卯. The closest is *mortise-and-tenon joint*.',
        'Translation is joinery too: the two sides never match exactly, and they still have to hold.',
      ],
    },
    stage: {
      nodes: ['hull_shell', 'bulkhead_01', 'bulkhead_02', 'bulkhead_03', 'bulkhead_04', 'bulkhead_05', 'bulkhead_06', 'bulkhead_07', 'bulkhead_08', 'bulkhead_09', 'bulkhead_10', 'bulkhead_11', 'bulkhead_12'],
      camera: 'terms',
      motion: 'none',
    },
    interaction: 'terms',
    fallback: 'svg/e1-ship-silhouette.svg',
    stageLabel: { zh: '舞台：整船与术语对照卡片', en: 'Stage: the whole ship with glossary cards' },
  },
  {
    id: 'b7',
    progress: [0.92, 1.0],
    title: { zh: '榫合', en: 'Joinery' },
    body: {
      zh: [
        '木头咬住木头，钉子咬住木头，语言咬住语言。',
        '一艘船能出海，靠的从来不是一种连接。',
      ],
      en: [
        'Wood holds wood. Nails hold wood. Words hold words.',
        'No ship ever sailed on a single kind of joint.',
      ],
    },
    stage: {
      nodes: ['hull_shell', 'ship_deck', 'bulkhead_01', 'bulkhead_02', 'bulkhead_03', 'bulkhead_04', 'bulkhead_05', 'bulkhead_06', 'bulkhead_07', 'bulkhead_08', 'bulkhead_09', 'bulkhead_10', 'bulkhead_11', 'bulkhead_12'],
      camera: 'away',
      motion: 'none',
    },
    interaction: 'replay',
    fallback: 'svg/e1-ship-silhouette.svg',
    stageLabel: { zh: '舞台：整船缓缓远去', en: 'Stage: the whole ship receding' },
  },
]

// 界面文案（按钮、提示、状态）。与 beat 正文一样，统一走这里，不进组件。
export const ui = {
  siteTitle: { zh: '榫合', en: 'Joinery' },
  langSwitch: { zh: 'EN', en: '中' },
  langSwitchAria: { zh: '切换到英文', en: 'Switch to Chinese' },
  progressAria: { zh: '阅读进度', en: 'Reading progress' },
  pickHint: {
    zh: '点击零件查看名称与术语；再次点击复位。Tab 遍历，Enter 选中，Escape 退出。',
    en: 'Click a part for its name and term; click again to reset. Tab cycles, Enter selects, Escape exits.',
  },
  flood: {
    withBulkheads: { zh: '有水密隔舱', en: 'With bulkheads' },
    withoutBulkheads: { zh: '无隔舱', en: 'Without bulkheads' },
    groupAria: { zh: '漏水实验开关', en: 'Flooding experiment controls' },
  },
  caulk: {
    intro: { zh: '补一道缝：按正确顺序选择三步。', en: 'Close the seam: pick the three steps in the right order.' },
    steps: [
      { zh: '榫卯', en: 'Joinery' },
      { zh: '铁钉', en: 'Iron nails' },
      { zh: '捻缝', en: 'Caulking' },
    ],
    wrongOrder: {
      zh: '顺序不对，缝在渗水。按 榫卯 → 铁钉 → 捻缝 来。',
      en: 'Wrong order — the seam is leaking. Joinery → nails → caulking.',
    },
    done: {
      zh: '缝合上了：榫定位，钉加固，捻缝水密。',
      en: 'The seam is closed: tenons locate, nails lock, caulking seals.',
    },
  },
  termsTitle: { zh: '术语对照', en: 'Glossary' },
  termType: {
    直译: { zh: '直译', en: 'literal' },
    解释译: { zh: '解释译', en: 'explained' },
  },
  replay: { zh: '重新看一遍', en: 'Watch again' },
  credits: {
    zh: '参考：泉州湾宋代海船、南海I号、华光礁I号等考古资料与造船史研究（见项目文档）。',
    en: 'Sources: excavation reports on the Quanzhou and Nanhai I wrecks, and histories of Chinese shipbuilding (see project docs).',
  },
}
