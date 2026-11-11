# 分镜与文案骨架（Story Map）

> 版本：v1 · 2026-11-11
> 上游：`04-design-direction.md` 第 3 节（7 个 beat）
> 下游：前端实现 `src/`、3D 节点命名见 `07-modeling-brief.md` T12
> 原则：文案先定稿，3D 后到位。**每个 beat 在没有模型的情况下也必须能读通。**

## 0. 使用说明

- 本文件是唯一文案来源。前端不要把句子硬编码在 JS 里，统一从 `src/content/beats.js` 读取。
- 每个 beat 标注「依赖资产」：写 `—` 的，纯文案/SVG 即可完成，不等模型。
- 英文字幕不是中文字幕的逐句直译，是按英文读者重写；两句不等长是允许的。
- 所有事实性表述必须能落到 `docs/10-fact-check.md` 的一条来源；落不到的改成疑问句或删掉。

## 1. 整体节奏

| Beat | 名称 | 滚动占比 | 停留 | 情绪 |
|---|---|---|---|---|
| 1 | 一句流行说法 | 12% | 长 | 悬置、疑问 |
| 2 | 榫头与卯眼 | 18% | 中 | 靠近、看清 |
| 3 | 钉与缝 | 15% | 中 | 拆解、意外 |
| 4 | 水密隔舱 | 15% | 中 | 结构感 |
| 5 | 漏水实验 | 20% | 长 | 紧张 → 释然 |
| 6 | 术语出海 | 12% | 中 | 回望、连接 |
| 7 | 收束 | 8% | 短 | 落定 |

移动端每 beat 高度按 `100svh` 基准，文案块不超过 3 行标题 + 4 行正文。

---

## 2. Beat 1 · 一句流行说法

- **滚动**：0% – 12%
- **画面**：整船剪影，外壳 40% 不透明度，缓慢自转；船体内部不可见。海雾背景。
- **交互**：无。只允许第一次滚动触发一次淡入。
- **依赖资产**：`hull_shell`（LOD0）。**无模型时**：SVG 侧视剪影。

**中文**

> **eyebrow** 中国古船
> **标题** 古船不用一根钉？
> **正文** 这句话流传很广。它听上去很浪漫：木头与木头互相咬住，不靠一颗铁钉。
> **正文** 但我们把一艘船拆开之后，看到的东西比这句话复杂。

**English**

> **eyebrow** A Chinese ship
> **h1** Not a single nail?
> **body** The claim is everywhere, and it is romantic: wood holding wood, no iron at all.
> **body** Take a ship apart and the picture gets more interesting.

- **事实边界**：这是「流行说法」，不是我们的结论。**不要**在画面上标注任何出处，避免被理解为学术引用。

---

## 3. Beat 2 · 榫头与卯眼

- **滚动**：12% – 30%
- **画面**：镜头推近到一处节点，两个零件沿轴线分离（爆炸），露出榫头与卯眼。
- **交互**：点击任一零件 → 高亮 + 名称 + 一句话；再次点击复位。Tab 可遍历零件。
- **依赖资产**：`joint_tenon`、`joint_mortise`（T07）。**无模型时**：SVG 爆炸图。

**中文**

> **eyebrow** 连接 · 一
> **标题** 榫头，卯眼
> **正文** 一块木头伸出的部分叫榫头，另一块木头被掏空的部分叫卯眼。
> **正文** 它们不靠胶，也不靠钉，靠的是形状本身互相卡住。

**English**

> **eyebrow** Joint · one
> **h1** Tenon, mortise
> **body** One piece of wood leaves a tongue. The other leaves a matching socket.
> **body** No glue, no nail — the shape itself does the holding.

- **术语弹窗**：`榫头 tenon` / `卯眼 mortise`，标注「可直译」。
- **待核**：本节点为示意结构，不代表某一艘沉船的实测节点。页面上不写「考古实测」。

---

## 4. Beat 3 · 钉与缝

- **滚动**：30% – 45%
- **画面**：船壳板接缝剖面，从左到右分层出现：榫卯 → 铁钉/木钉 → 桐油灰 + 麻丝。
- **交互**：拖动或点击推进「补一道缝」三步；顺序错则渗水提示。
- **依赖资产**：`plank_seam`、`nail_set`、`caulk_layer`（T06/T08）。**无模型时**：SVG 剖面分层。

**中文**

> **eyebrow** 连接 · 二
> **标题** 榫卯之外，还有钉
> **正文** 船不是家具。船要下水，要承浪，要几十年泡在盐里。
> **正文** 所以真正的做法是「榫合钉接」：榫卯定位，铁钉或木钉加固，再用桐油灰拌麻丝把缝捻死。

**English**

> **eyebrow** Joint · two
> **h1** Beyond joinery: nails
> **body** A ship is not a cabinet. It goes into water, takes waves, and stays wet for decades.
> **body** So the real method is mortise-and-tenon **plus** fastening: tenons locate, iron or wooden nails lock, and putty with hemp caulks the seam shut.

- **术语弹窗**：`榫合钉接 mortise-and-tenon joinery with nail fastening`（注明「无对应单词，属解释性翻译」）、`捻缝 caulking`。
- **注意**：这是全篇最重要的一次纠正，画面要给足停留。

---

## 5. Beat 4 · 水密隔舱

- **滚动**：45% – 60%
- **画面**：船体剖切，露出 3 道隔舱板，船体被分成 4 段可见舱室。
- **交互**：点击某道隔舱板 → 该舱高亮，标注舱名/序号。
- **依赖资产**：`bulkhead_01..03`（T05）。**无模型时**：SVG 俯视剖面。

**中文**

> **eyebrow** 结构
> **标题** 一艘船，几个房间
> **正文** 横向的隔舱板把船体分成互不相通的舱室。这道结构叫水密隔舱。
> **正文** 它不只装货，它决定了这艘船进水之后还能不能浮着。

**English**

> **eyebrow** Structure
> **h1** One ship, several rooms
> **body** Transverse bulkheads cut the hull into compartments that do not connect.
> **body** They carry cargo — and they decide whether the ship still floats after it is holed.

- **待核**：隔舱数量在本作品里只展示 3 道，属简化示意。不要写成「这艘船只有 3 个舱」。

---

## 6. Beat 5 · 漏水实验

- **滚动**：60% – 80%
- **画面**：船体侧面剖切，一个舱进水；水面上升。
- **交互**：两个开关「有水密隔舱 / 无隔舱」。切换时水面与船体姿态变化；可重复播放。
- **依赖资产**：`hull_cutaway`、`bulkhead_*`。**无模型时**：两段 SVG 状态图 + CSS 过渡。

**中文**

> **eyebrow** 实验
> **标题** 一个舱破了，船还在
> **正文** 水灌满一个舱，浮力少了一点，船倾斜，然后稳住。
> **正文** 把隔舱板抽掉，同样的破口，水会一路漫过去。

**English**

> **eyebrow** Test
> **h1** One compartment floods. The ship stays up.
> **body** Water fills a single hold. The ship loses some buoyancy, lists, then settles.
> **body** Remove the bulkheads and the same breach runs the length of the hull.

- **动画要求**：这是 60–90 秒演示的高潮，必须可重复播放且无加载等待。

---

## 7. Beat 6 · 术语出海

- **滚动**：80% – 92%
- **画面**：回到整船，构件上浮出词条卡片，中/英对照；可选第三语种。
- **交互**：切换语言不重置 3D 状态与滚动位置。
- **依赖资产**：`hull_shell` + 已标注零件。**无模型时**：纯文字术语墙。

**中文**

> **eyebrow** 翻译
> **标题** 一个词，怎么过海
> **正文** 英文里没有和「榫卯」完全对应的词。最接近的写法是 mortise-and-tenon joint。
> **正文** 翻译也是一次榫合：两边的形状不完全一样，但必须咬得住。

**English**

> **eyebrow** Translation
> **h1** How a word crosses water
> **body** English has no single word for 榫卯. The closest is *mortise-and-tenon joint*.
> **body** Translation is joinery too: the two sides never match exactly, and still have to hold.

- **术语表**：见 `docs/09-glossary.md`。

---

## 8. Beat 7 · 收束

- **滚动**：92% – 100%
- **画面**：整船归位，缓慢远去；底部出现来源与致谢。
- **交互**：无。提供「重新看一遍」按钮回到 0%。

**中文**

> **标题** 榫合
> **正文** 木头咬住木头，钉子咬住木头，语言咬住语言。
> **正文** 一艘船能出海，靠的从来不是一种连接。

**English**

> **h1** Joinery
> **body** Wood holds wood. Nails hold wood. Words hold words.
> **body** No ship ever sailed on a single kind of joint.

---

## 9. 交给前端的接口约定

```js
// src/content/beats.js
export const beats = [
  {
    id: 'b1',
    progress: [0.00, 0.12],
    eyebrow: { zh: '中国古船', en: 'A Chinese ship' },
    title:   { zh: '古船不用一根钉？', en: 'Not a single nail?' },
    body:    { zh: ['…'], en: ['…'] },
    stage:   { nodes: ['hull_shell'], camera: 'wide', motion: 'idle-spin' },
    fallback: 'svg/e1-ship-silhouette.svg',
  },
  // …
];
```

- `stage.nodes` 必须与 T12 的 `parts.json` 节点名完全一致，写完由建模同学对照确认。
- `fallback` 路径在 3D 未加载或 WebGL 不可用时使用。

## 10. 下一步

- [ ] 文案再校一遍事实与语气，落 `docs/10-fact-check.md`
- [ ] 术语表定稿（`09-glossary.md`）
- [ ] 前端按本文件搭空场景，用占位几何跑通滚动 → beat → 相机
- [ ] 第三语种（日/韩）11-12 决定是否启用
