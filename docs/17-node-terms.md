# 零件术语卡与读屏（D 方向 11-14）

> 版本：v1 · 2026-11-14
> 范围：b2 / b4 的零件拾取浮层、`src/content/glossary.js` 的节点解析、读屏通道
> 关联：`09-glossary.md`（术语口径）、`16-term-beat-spec.md`（b6 迁移视图）
> 结论先说：25 个节点名全部能解析到术语，浮层现在有四类文字，读屏能念出零件名而不是「图像」。

## 1. 节点覆盖

`parts.json` 白名单有 25 个名字，此前 `nodeTerms` 只映射 12 个，`bulkhead_04..12`、`ship_deck`、`iron_nail`、`caulking_seam`、`treenail` 这 13 个点上去没有任何反应。现在加了家族解析（`resolveNode()`）：

| 节点名 | 词条 | 显示名 | 说明 |
|---|---|---|---|
| `hull_shell` | `hull-plank` | 船壳板 | 显式映射 |
| `ship_deck` | `ship-deck` | 甲板 | 新增词条 |
| `keel` / `stem` / `sternpost` | 同名 | 龙骨 / 艏柱 / 艉柱 | 显式映射 |
| `bulkhead_01` … `bulkhead_12` | `bulkhead` | 隔舱板 01 … 12 | 家族规则，编号由节点名末两位补 |
| `plank_seam` | `plank-seam` | 船板接缝 | 显式映射 |
| `nail_set` | `iron-nail` | 铁钉 | 显式映射 |
| `caulk_layer` | `caulking` | 捻缝 | 显式映射 |
| `iron_nail` | `iron-nail` | 铁钉 | 家族规则（下划线写法） |
| `caulking_seam` | `caulking` | 捻缝 | 家族规则 |
| `treenail` | `treenail` | 木钉 | 家族规则 |
| `joint_tenon` / `joint_mortise` | `tenon` / `mortise` | 榫头 / 卯眼 | 显式映射 |

注：占位几何目前只建了 3 道隔舱板，`bulkhead_04..12` 要等真 GLB 到位才会被点到。解析先做好，模型一到不用改代码。

## 2. 浮层四类文字

浮层不是一句话，是四类信息，每类都有上限。超了就在数据层改，不要靠 CSS 收缩。

| 位置 | 内容 | 上限 | 当前最长 |
|---|---|---|---|
| 第一行左 | 中文名（+ 编号） | 6 汉字 | 隔舱板 07（6） |
| 第一行中 | 英文名 | 40 字符 | `mortise-and-tenon joint`（24） |
| 第一行右 | 译法类型 | 3 字 | 解释译 / 直译 |
| 第二行 | 一句解释 `gloss` | 24 汉字 / 12 词 | 把麻丝与桐油灰压进缝里（11）/ The tongue left standing on one timber（7） |

`gloss` 与词条原有的 `note` 分工不同：`note` 是译法提醒（给评审看，比如「英文无单词对应」），`gloss` 是这个词是什么（给读者看）。两者都存在 `glossary.js` 里，`termGloss` 按词条 id 索引。

## 3. 读屏

拾取走的是 canvas 上的 Raycaster，屏幕阅读器本来就到不了零件。做法是**视觉层与朗读层分开**：

- `#part-label` 加强制 `aria-hidden="true"`。它在相机移动时每帧重建，挂 `aria-live` 会被反复朗读。
- 另建常驻 `#part-announce`（`role="status"`、`aria-live="polite"`、`.sr-only`），只在**换成另一个零件**时更新文本。相机移动、重绘不触发。
- 换语言时清空一次记录，让钉住的浮层按新语言重读一遍。
- 隐藏浮层（点空白 / 复位）时清空记录，再次点同一个零件仍会朗读。

朗读文本格式：

| 语言 | 文本 | 实际输出 |
|---|---|---|
| 中文 | `中文名 英文名，类型。解释` | 卯眼 mortise，直译。另一块木头凿出的凹口 |
| 英文 | `English name 编号 — type. gloss` | Mortise — literal. The socket cut into the mating timber |

中文把英文名夹在中间，是因为这一屏的读者是中英双语评审，念出对照关系比念一个孤立的词有用。

## 4. 浮层位置

窄屏和边缘零件会把浮层顶出视口。`positionPartLabel()` 现在按浮层自身尺寸夹回可视区（左右各留 8 px，顶部至少让出 1.15 倍高度给 `translate(-50%, -115%)`）。

实测 375 × 812：浮层左 283 / 右 367，未越界；`scrollWidth` 等于 `innerWidth`。

## 5. 移动端命中区测量

CDP 375 × 812（DPR 2）逐元素量 `getBoundingClientRect().height`：

| 元素 | 高度 | 判定 |
|---|---|---|
| 补缝三步按钮 | 44 px | 通过 |
| 漏水开关 | 44 px | 通过 |
| 语言切换 `#lang-toggle` | **26 px** | 不通过 |
| 3D 零件拾取 | 由几何决定 | 无法保证 44 px |

语言切换按钮 26 px 是既有问题，属 `.lang-toggle` 的样式，不在 D 的改动范围内，**建议交给 C（视觉）** 把命中区补到 44 px（可用 `::after` 扩热区，不改视觉高度）。

3D 拾取无法做到 44 px 命中区——零件在屏幕上的投影随相机变化。兜底是键盘路径：`Tab` 遍历当前 beat 的可拾取零件、`Enter` 选中、`Escape` 复位，选中后由 `#part-announce` 朗读。这条路径已在 `11-frontend-brief.md` 第 6 节约定，本次只补朗读。

## 6. 改动文件

| 文件 | 改了什么 |
|---|---|
| `src/content/glossary.js` | 新增 `ship-deck` 词条；`resolveNode()` 家族解析；`termGloss` 一句解释 |
| `src/ui/overlay.js` | 浮层加解释行、`aria-hidden`、`#part-announce` 朗读通道、位置夹取、换语言重读 |
| `src/styles.css` | `.part-label` 允许换行并限宽、`.gloss` 样式、`.sr-only` |

## 7. 验收

- [x] 25 个白名单节点名全部解析到词条，且都有 `gloss`
- [x] `bulkhead_07` → `bulkhead`，编号 `07`
- [x] `glossary` 17 条 / `termWall` 7 条 / `nodeTerms` 12 条，数量与改前一致（新增 1 条 `ship-deck`）
- [x] 桌面 1440：点零件出现四类文字，朗读文本正确
- [x] 375 × 812：浮层不出视口，无横向滚动
- [x] 中英切换：浮层与朗读文本同步换语言
- [x] `npm run check:parts` 通过（23 个零件，unit=m）
- [x] `npm run build` 通过
- [ ] 真机（iOS / Android）触摸拾取 —— 需人工，headless 只验证了坐标变换
- [ ] 语言切换按钮命中区 —— 未修，已转交 C

## 8. 下一步

- 11-15：这三段 `gloss` 与 `16` 的迁移文案一起过母语者
- 11-16：`?no3d=1` 下浮层不可用时，术语仍可读（已由 SVG 的 alt 承担，待复核）
