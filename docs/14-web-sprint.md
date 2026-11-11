# Web 四人分工 · 具体到文件和函数

> 11-11 → 11-15。目标：模型到位前把不依赖 GLB 的事做完；模型一到只换资产，不改结构。
> 当前基线：`main` 已有 7 beat 滚动叙事、占位几何、补缝/漏水、中英切换、SVG 降级，线上可跑。

## 0. 通用约定

- 分支：`feat/a-3d-pipeline` / `feat/b-interactions` / `feat/c-visual` / `feat/d-content`
- 提交信息：`feat(a): ...` `fix(b): ...`，一个 PR 只做一件事
- 文件归属见每节末尾，越界改动先在本 issue 里说
- 每天 21:00 同步：做完什么 / 卡在哪 / 明天要谁配合
- 11-14 18:00 冻结，之后只修 bug

---

## A · 3D 接入与性能

**第一件事（今晚 1 小时内）**：跑 `node -v` 确认 ≥ 20，然后建 `tools/` 目录。

### 11-11 晚
- [ ] `tools/check-parts.mjs`：读 `models/parts.json`，校验是数组、每项有 `name`、`assembled`/`exploded` 为长度 3 的数字数组；节点名必须在白名单内（`hull_shell` `ship_deck` `keel` `stem` `sternpost` `bulkhead_01..03` `plank_seam` `treenail` `iron_nail` `caulking_seam` `joint_tenon` `joint_mortise`）；不通过打印具体哪一项错并 `process.exit(1)`
- [ ] `tools/check-model.mjs`：解析 GLB 二进制头（`glTF` magic + JSON chunk），输出：三角形总数、网格数、材质数、节点名列表、文件字节数；超过 35,000 面或 5 MB 时退出码 1
- [ ] `package.json` 加 `"check:model": "node tools/check-model.mjs"`、`"check:parts": "node tools/check-parts.mjs"`

### 11-12
- [ ] `public/models/.gitkeep`；`public/draco/` 放 Draco 解码器（从 `node_modules/three/examples/jsm/libs/draco/` 拷，**不要用 CDN**）
- [ ] `src/stage/scene.js`：把 `loadPartsSpec(base)` 的路径从 `${base}models/parts.json` 改为 `${base}models/parts.json` 不变，但加 8 秒超时与失败静默返回 null
- [ ] 新增 `src/stage/loader.js`：`GLTFLoader` + `DRACOLoader`，暴露 `loadShip(url, onProgress)`，返回 `{ scene, animations }`
- [ ] 加载失败或超时 → `useFallback()`（`src/main.js` 已有），页面不能白屏
- [ ] 用 Khronos 示例 GLB（`DamagedHelmet.glb` 或 `Box.glb`）走通：文件放 `public/models/ship.glb`，页面能显示

### 11-13
- [ ] `bindRealMeshes(gltfRoot, nodes)`：按 `name` 找节点，`placeholder` 子物体清空后挂上去，**保留 Group 的 position/rotation 与装配/爆炸位**
- [ ] 单位校验：读 `gltfRoot.scale`，若模型按毫米导出则整树 `scale 0.001`
- [ ] 材质：把 GLB 材质替换为项目 4 色（`#6B4B33` `#C08A4A` `#3A3F44` `#E8E4DC`），保证与占位视觉一致
- [ ] `renderer.info.render.calls` 打印一次，超过 20 报警

### 11-14
- [ ] 预算报告写进 `REPORT.md`：面数 / 体积 / 材质数 / draw call
- [ ] 「换模型 5 步」写进 `docs/14`：放文件 → 改 parts.json → `npm run check:model` → `npm run build` → push

**交付**：`tools/check-model.mjs`、`tools/check-parts.mjs`、`src/stage/loader.js`、换模型手册
**验收**：任意 GLB 放进去能显示；删掉自动回占位；预算超标时命令返回非 0
**边界**：`src/stage/`、`public/models/`、`public/draco/`、`tools/`

---

## B · 交互与状态

**第一件事**：`npm run dev`，在 Chrome 里点一遍补缝和漏水，把不顺的地方记成 10 条清单。

### 11-12
- [ ] `src/interactions/caulk.js`：`push()` 返回 `'wrong' | 'step' | 'done'`；错误态 900ms 后自动清除，但按钮 `is-done` 保留
- [ ] 完成后禁用三个按钮，加一个「重来」按钮（发 `reset()`）
- [ ] `src/interactions/flood.js`：`setState()` 加互斥锁，转场中再点排队而非叠加；连点 5 次结果与点 1 次一致
- [ ] 触摸：所有按钮 `min-height: 44px; min-width: 44px`（改 `src/styles.css` 的 `.caulk-step` `.flood-btn`，与 C 打招呼）

### 11-13
- [ ] URL 状态：`src/main.js` 启动时读 `?beat=` `&lang=`；`onBeat()` 里 `history.replaceState` 写回，节流 300ms
- [ ] 语言持久化：`localStorage['bf.lang']`，启动时恢复
- [ ] 读屏：补缝状态与漏水状态元素加 `role="status" aria-live="polite"`；`document.documentElement.lang` 跟随切换
- [ ] Tab 顺序：舞台 → 补缝按钮 → 漏水按钮；`Escape` 从舞台退出，提示已存在

### 11-14
- [ ] 写 `tests/interactions.md`：20 条手工用例（正常 / 连点 / 中途切换 / 切语言 / 刷新 / 降级模式）
- [ ] 逐条跑完打勾，失败项就地修

**交付**：交互修复 PR、20 条用例清单
**验收**：iOS Safari + Android Chrome 真机，补缝与漏水各操作 3 轮无残留
**边界**：`src/ui/`、`src/interactions/`；`styles.css` 只加按钮尺寸，其余归 C

---

## C · 视觉与响应式

**第一件事**：截三张图（375 / 768 / 1440），标出所有你觉得“脏”的地方。

### 11-12
- [ ] 排版定标：标题 `clamp(1.45rem,3vw,2.05rem)/1.25`，正文 `1rem/1.72`，行宽 ≤ 46ch；英文标题手动 `hyphens: none; text-wrap: balance`
- [ ] 对比度实测（用 DevTools 取色）：正文、提示、按钮文字三档 ≥ 4.5:1；不达标就调 `--paper` / `--mist` / `--tung`
- [ ] 滚动节奏：按 `08-story-map.md` 的占比表核对 spacer 高度，滚轮转一格画面要动

### 11-13
- [ ] 五档适配：375×812、390×844、768×1024、1024×768、1440×900；横屏 844×390 也要能读
- [ ] 移动端文案面板：确认 `46svh` 上限与内部滚动可用，键盘弹出时不遮挡按钮
- [ ] `prefers-reduced-motion`：开系统开关，逐条验——不自转、不 dolly、补缝直切、漏水直切
- [ ] 四张 SVG 统一：`viewBox` 都是 1200×675，线宽 1.5/2/2.5 三档，配色用 CSS 变量同值

### 11-14
- [ ] 每个 beat 存一张 1440×900 截图到 `docs/shots/bN.png`（手动截，命名固定）
- [ ] 写 `docs/15-visual-spec.md`：字号表、色板、间距、断点，一页

**交付**：截图基准 7 张、`docs/15-visual-spec.md`、对比度记录
**验收**：五档无横向滚动、无溢出；关动效仍能读完 7 屏
**边界**：`src/styles.css`、`public/svg/`、`docs/shots/`

---

## D · 内容、事实与验收

**第一件事**：读 `10-fact-check.md`，把每条的「待核」改成「已核 / 已改写 / 已删」，今天先改文案。

### 11-12
- [ ] `src/content/beats.js` 按核查结果改：删「领先西方数百年」类说法；隔舱展示处写「此处示意 3 道」，来源区写「该船实为 12 道隔舱板、13 舱」
- [ ] 英文校对 7 段正文 + `ui` 全部字符串：时态统一、术语统一（`treenail` `caulking` `bulkhead` `mortise-and-tenon`）
- [ ] 术语一致性检查：`grep` 全仓库，确认没有 `wooden nail`、`caulk` 当名词乱用、`bow post`

### 11-13
- [ ] 按 `12-demo-script.md` 试录 90 秒：记录每屏实际时长与旁白卡点
- [ ] 跨浏览器：Chrome / Edge / Safari / iOS Safari / Android Chrome，逐项勾（滚动、点击、SVG 降级、中英切换）
- [ ] Lighthouse 跑一次，性能/可访问性 ≥ 90，截图存 `docs/shots/lighthouse.png`

### 11-14
- [ ] 按 `02-delivery-checklist.md` 汇总：线上链接、仓库、二维码、说明文档、演示视频
- [ ] 写 `docs/16-acceptance.md`：一页，逐条对照验收项打勾

**交付**：校对后文案、验收报告、提交材料包
**验收**：评审看 60 秒能说出「榫卯 + 钉 + 捻缝 + 水密隔舱」
**边界**：`src/content/`、`docs/`

---

## 时间线（谁在哪天交什么）

| 日期 | A | B | C | D |
|---|---|---|---|---|
| 11-11 | 校验脚本 | 10 条问题清单 | 三张现状截图 | 开始改文案 |
| 11-12 | GLB 加载链路 | 补缝/漏水边界 | 排版 + 对比度 | 英文一校 |
| 11-13 | bindRealMeshes | URL/持久化/读屏 | 五档适配 | 试录 + 跨浏览器 |
| 11-14 | 预算报告 | 20 条用例 | 截图基准 + 视觉规范 | 验收报告 + 材料包 |
| 11-15 | 接真模型 30 分钟上线 | 回归 | 回归 | 发链接 |
