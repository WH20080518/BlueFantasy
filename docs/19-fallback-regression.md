# 降级与状态保持回归（D 方向 11-16）

> 版本：v1 · 2026-11-16
> 对象：commit `2abc427`（main）构建产物，`npm run build` 后 `npm run preview`
> 方法：CDP 设定视口 → 脚本逐项读 DOM/几何量，不靠肉眼
> 结论：**D 相关项全部通过**；回归中发现并修掉 1 个深链 bug（开场页关闭时覆盖 `?beat=` 定位）

## 1. 降级模式（`?no3d=1`）

逐屏滚过 7 个 beat，每屏检查：标题有文案、`<img>` 有对应 SVG、`alt` 随 beat 更新、交互按钮全部 `disabled`。

| Beat | 标题 | SVG | alt | 补缝/漏水按钮 |
|---|---|---|---|---|
| 1 | 古船不用一根钉？ | `e1-ship-silhouette.svg` | 舞台：一艘中国古船… | disabled |
| 2 | 榫头，卯眼 | `e2-tenon-explode.svg` | 舞台：一处榫卯节点… | disabled |
| 3 | 榫卯之外，还有钉 | `e3-seam-section.svg` | 舞台：一段船壳板接缝的剖面 | disabled |
| 4 | 一艘船，几个房间 | `e4-bulkhead-plan.svg` | 舞台：剖切的船体，露出十二道… | disabled |
| 5 | 一个舱破了，船还在 | `e5-flood.svg` | 舞台：船体侧视，一个舱正在进水 | disabled |
| 6 | 一个词，怎么过海 | `e1-ship-silhouette.svg` | 舞台：整船与术语对照卡片 | disabled |
| 7 | 榫合 | `e1-ship-silhouette.svg` | 舞台：整船缓缓远去 | disabled |

第 6 屏术语在降级模式下完整：`#terms-list` 7 条，标题「术语对照」，词条含中英与译法类型。375 宽下 SVG 不越界（`imgFits: true`）。

## 2. 语言切换 ×3：状态不重置

每项都是「操作 → 连切 3 次语言 → 再读一次」。

| 对象 | 切换前 | 切换 3 次后 | 结论 |
|---|---|---|---|
| 补缝完成态（b3） | 3 个按钮 `is-done`，状态「缝合上了：榫定位，钉加固，捻缝水密。」，重来按钮可见 | 3 个按钮仍 `is-done`，状态变英文「The seam is closed…」，重来按钮仍可见 | 通过 |
| 漏水选中态（b5） | `without-bulkheads: aria-pressed=true`，状态「无隔舱：水沿船体漫过…」 | 仍 `true`，状态变英文，屏幕仍停在 b5 | 通过 |
| 3D 零件选中（b2） | 浮层显示「卯眼 mortise 直译 / 另一块木头凿出的凹口」 | 浮层仍在，文案换语言，读屏文本同步 | 通过 |
| 滚动位置 | b3 `scrollY 1944` / b5 `3240` / b2 `1080` | 三次切换后数值不变 | 通过 |

## 3. 宽度回归

| 视口 | 术语条数 | 术语溢出 | 浮层在视口内 | 横向滚动 |
|---|---|---|---|---|
| 375 × 812（DPR 2） | 7 | 0 | 是 | `scrollWidth 375 = innerWidth 375` |
| 768 × 1024 | 7 | 0 | 是 | `768 = 768` |
| 1440 × 900 | 7 | 0 | 是 | `1425 ≤ 1440` |

英文模式另外测了最长词条：`mortise-and-tenon joinery with nail fastening` 在 375 宽下不溢出（`overflow: 0`）。

三问在第 7 屏：3 个选项，375 宽下无溢出，页面无横向滚动。

## 4. 减少动效

`prefers-reduced-motion: reduce` 下滚到第 6 屏：术语 7 条齐全，文案面板没有残留 `is-swapping` 类，即不做交叉淡入。

## 5. 深链被开场页覆盖（发现并已修）

复现（修复前）：

1. 打开 `?beat=6&lang=en`：正确恢复，指示器 `6 / 7`，`scrollY 4644`，页面英文；
2. 点「开始探索」：滚动被拉回 `0`，指示器变 `1 / 7`，地址栏被改写成 `?beat=1&lang=en`。

`?beat=4` 同样复现。原因：`enterSite()` 里无条件 `window.scrollTo(0, 0)`，而深链定位是在开场页之后才执行的，位置被覆盖。

影响：分享「直接跳到第 6 屏」这类链接会失效，评审点开看到的是第一屏。

修复（`src/main.js`，约 12 行）：

- 新增 `hasDeepLinkBeat()`：`?beat=N` 存在且 `N ≥ 1` 时返回真；
- 开场页关闭时，有深链就**不**回顶部，移除动画结束后重新 `applyInitialLocation()` 对齐一次；
- 没有深链时仍回顶部，但改到移除后下一帧执行（`settleScroll()` 双 rAF），避开开场页占一屏造成的滚动锚定偏移。

修复后实测（同一 URL，聚焦标签页）：

| 链接 | 开场页关闭前 | 关闭后 |
|---|---|---|
| `?beat=6&lang=en` | `6 / 7`，scroll 2549 | `6 / 7`，scroll 2549，术语 7 条，URL 未被改写 |
| `?beat=4` | `4 / 7`，scroll 2835 | `4 / 7`，scroll 2835 |
| 无参数 | `1 / 7`，scroll 0 | `1 / 7`，scroll 0 |

注意：调试时若复用同一个标签页来回跳转，Chrome 会把上一次的滚动位置带回来（本次测到过 `324` 的假象），判断这类问题要用**新标签页**或先 `Page.bringToFront`。

## 6. 本次未覆盖

- 真机（iOS Safari / Android Chrome）的触摸拾取与地址栏收缩（C 的 `mobile-checklist.md` 已列，仍待人工）
- `#lang-toggle` 命中区 26 px（11-14 已记录，待 C 修）
- 无 WebGL 但非 `?no3d=1` 的自动降级路径（探针逻辑未改，未单独触发）
