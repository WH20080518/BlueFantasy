# 前端实现任务书（Claude Code 执行）

> 项目：`/mnt/d/Dev/BlueFantasy`（Vite + 原生 JS + three）
> 日期：2026-11-11
> 你的角色：前端开发。你只需要产出可运行的代码，不要 push，不要改 `docs/`。

## 0. 先读这些（按顺序）

1. `docs/08-story-map.md` —— 唯一文案来源，7 个 beat、滚动区间、交互、依赖节点、降级图。
2. `docs/04-design-direction.md` 第 4–5 节 —— 页面结构、四个核心交互、style bible 配色。
3. `docs/09-glossary.md` —— 术语弹窗的中英对照与译法类型。
4. `docs/07-modeling-brief.md` T12 —— `parts.json` 的节点命名约定（下文的节点名必须与之完全一致）。
5. 设计技能文件（**必须读**，写完代码前至少读完 1、2、5）：
   - `.local-skills/frontend-design.md`
   - `.local-skills/animations.md`
   - `.local-skills/3d-web-experience.md`
   - `.local-skills/scroll-world-storytelling.md`
   - `.local-skills/emil-design-eng.md`

冲突时以 `08-story-map.md` 的文案和本文件的验收标准为准；技能文件提供的是做法与品味。

## 1. 目标（这一轮只做这些）

把「滚动 → beat 切换 → 相机运动 → 文案换行 → 交互状态」整条链跑通，**用占位几何代替真模型**。真 GLB 到位后只需替换资产，不改结构。

必须做出来：

- 单页滚动叙事，7 个 beat
- 固定 3D stage（sticky），文案随滚动切换
- 占位船体 + 可拆零件 + 点击高亮 + 名称
- 漏水实验两个状态（有/无隔舱）
- 补缝三步交互
- 中英切换
- 无 WebGL / `?no3d=1` 时走 SVG 降级，文案完整可读
- `npm run build` 通过

**不做**：真实 GLB 加载逻辑的调试（留接口即可）、后端、账号、埋点、第三方 CDN 资源。

## 2. 技术约束

- 依赖只加 `three`（^0.170 及以上）。不引入 React/Vue/GSAP/动画库，滚动用原生 `scroll` + `requestAnimationFrame`。
- 不引外部字体、不引 CDN、不引图标库。字体用系统衬线栈：
  `font-family: "Noto Serif SC","Songti SC","Source Han Serif SC",Georgia,serif;`
- 所有颜色走 CSS 变量，值见 `04-design-direction.md` 第 5 节。
- 文案不得硬编码在 JS/HTML 里，统一放 `src/content/beats.js`，结构见 `08-story-map.md` 第 9 节。
- 移动端优先可用：375px 宽不横向滚动。
- `prefers-reduced-motion: reduce` 时不做位移与相机缓动，直接切状态。

## 3. 目录与文件

```
index.html
src/
  main.js              入口：路由、滚动引擎、语言状态
  styles.css           全部样式（含 CSS 变量、响应式、reduced-motion）
  content/
    beats.js           7 个 beat 的文案与 stage 配置
    glossary.js        术语词条（中/英/类型/说明）
  stage/
    scene.js           three 场景、渲染循环、resize、DPR 上限 2
    placeholder.js     占位几何构建（下文节点表）
    camera.js          每 beat 的相机目标位与缓动
    parts.js           零件注册表：点击拾取、高亮、名称
  interactions/
    flood.js           漏水实验状态机
    caulk.js           补缝三步状态机
  ui/
    overlay.js         文案渲染、进度条、语言切换、beat 指示
    fallback.js        ?no3d=1 / WebGL 不可用 → 切 SVG 图
public/
  svg/                 已就位，不要改
models/                （空目录，留给 GLB，建 .gitkeep）
REPORT.md              你写完后的自述：做了什么、怎么验、留了什么坑
```

## 4. 占位几何（必须与真实资产同节点名）

用 `BoxGeometry`/`ExtrudeGeometry` 拼，尺寸统一按「船长 100 单位、船宽 28、船深 18」，原点在船中水线。**每个部件必须是一个独立 `THREE.Group`，`name` 严格如下**：

| 节点名 | 占位物 | 用于 beat |
|---|---|---|
| `hull_shell` | 侧壁 + 船底，半透明 `MeshStandardMaterial`，opacity 0.55 | 1, 6, 7 |
| `keel` | 底部长条 | 4 |
| `stem` | 艏柱竖直件 | 4 |
| `sternpost` | 艉柱竖直件 | 4 |
| `bulkhead_01` / `_02` / `_03` | 三块横板，板厚 1.2 | 4, 5 |
| `plank_seam` | 一段船壳板 + 可见缝隙 | 3 |
| `nail_set` | 一排 8 根细圆柱 | 3 |
| `caulk_layer` | 缝内填充薄条 | 3 |
| `joint_tenon` | 榫头块 | 2 |
| `joint_mortise` | 卯眼块（布尔不必要，用两块拼出凹口即可） | 2 |

要求：

- `parts.json` 加载器留一个空实现：若 `models/parts.json` 存在则按 `name` 绑定真实网格，否则用占位。**这条路径必须能跑，但不需要真模型。**
- 所有材质用统一 palette：木 `#6B4B33`，深木 `#3A2A1D`，铁灰 `#3A3F44`，灰白 `#E8E4DC`，朱砂 `#B23A2E`（只做强调）。
- 灯光：一盏半球光 + 一盏方向光，不要阴影贴图（性能预算），需要落地感就用一个接触阴影贴图或假阴影平面。

## 5. 滚动与相机

- 页面总高 ≈ 7 × 100vh，stage `position: sticky; top: 0; height: 100vh`。
- 用 `progress = scrollY / (docHeight - viewportHeight)` 归一到 0–1，再映射到 beat 区间（见 08 文件第 1 节表）。
- 相机：每个 beat 一个 `{position, target, fov}`，相邻 beat 用 `smoothstep` 插值，不用库。
- 阻尼：`current += (target - current) * 0.08`，`prefers-reduced-motion` 时直接赋值。
- 滚动节流：只在 `requestAnimationFrame` 里读一次 `scrollY`，不要在 scroll 回调里遍历 DOM。

## 6. 交互

**A. 拆开（beat 2）**
- 点击零件：`Raycaster` 拾取 → `emissive` 高亮 + 名称浮层。
- 再点同一个：复位。点击空白：全部复位。
- 键盘：stage 获得焦点后 `Tab` 循环零件，`Enter` 选中。
- 高亮时对应术语弹窗（来自 `glossary.js`）显示 中/英/类型。

**B. 漏水实验（beat 5）**
- 两个可切换状态：`with-bulkheads` / `without-bulkheads`。
- 有水密隔舱：仅 `bulkhead_02` 左侧舱进水，水面到舱高 80%，船体倾斜 2°，然后稳定。
- 无隔舱：水面升到船深 60%，船体下沉 8 单位，缓慢、可中断。
- 切换要能在 1.2s 内完成，不卡帧；可重复播放。
- 用一个半透明蓝色平面表示水位，不要粒子。

**C. 补缝（beat 3）**
- 顺序为题：`榫卯 → 铁钉 → 捻缝`。
- 三个按钮，点击入栈；顺序错：`caulk_layer` 位置渗水色闪烁 + 一行提示，栈清空。
- 三步入栈完成：缝闭合动画 + 成功态文案。
- 移动端只做点击，不做拖拽。

**D. 语言切换**
- 顶部一个 `中 / EN` 切换。切换只换文案，不重置 3D 状态、不重置滚动位置。

## 7. 降级

- `?no3d=1` 或 `WebGLRenderingContext` 不可用 → 隐藏 canvas，每 beat 显示对应 SVG（`public/svg/`），文案与交互按钮保留（按钮在此模式下禁用并加 `aria-disabled`）。
- 映射：beat1 → `e1-ship-silhouette.svg`，beat2 → `e2-tenon-explode.svg`，beat3 → `e3-seam-section.svg`，beat4/5 → `e4-bulkhead-plan.svg`，beat6/7 → `e1-ship-silhouette.svg`。
- SVG 用 `<img>` 引入并 `loading="lazy"`，不要 inline 进 HTML。

## 8. 可访问性与性能

- 所有交互元素有 `aria-label`；stage 有 `role="img"` 和随 beat 更新的 `aria-label`。
- 文字对比度不低于 4.5:1。
- 首屏 JS ≤ 200KB gzip（three 单独 chunk）；DPR 上限 2；draw call 目标 ≤ 60（占位阶段更少）。
- 不做 `backdrop-filter` 大面积模糊，移动端会掉帧。
- 控制台零报错、零警告（Vite 提示除外）。

## 9. 验收（自查后再交）

1. `npm install && npm run build` 成功，无报错。
2. `npm run preview` 后手动走一遍：7 个 beat 文案都对，滚动不跳、不白屏。
3. 浏览器 375×812 与 1440×900 各走一遍，无横向滚动。
4. 点击 3 个不同零件都能高亮并显示名称；再点复位。
5. 漏水两个状态切换各 3 次，无残留状态。
6. 补缝：故意选错 1 次有提示；选对 1 次有闭合。
7. `?no3d=1` 下 7 个 beat 全部有图有文，按钮禁用。
8. 中英切换 3 次，3D 与滚动位置不重置。
9. DevTools Performance 里滚动时无长任务 > 50ms（占位阶段应轻松通过）。

## 10. 交付

- 代码提交**不要 push**，留在工作区。
- 写 `REPORT.md`：完成项、未完成项、遗留问题、下一步需要什么（例如「等 GLB」「等术语定稿」）。
- 不要修改 `docs/`、`.github/`、`.gitignore`、`package.json` 的 `name`。
- 遇到与本文件冲突的地方：先按本文件做，然后在 `REPORT.md` 里记一条「与文档冲突之处」。
