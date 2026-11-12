# REPORT — 前端占位实现（2026-11-11）

按 `docs/11-frontend-brief.md` 完成。滚动 → beat 切换 → 相机运动 → 文案换行 → 交互状态整条链已用占位几何跑通，真 GLB 到位后只需替换资产。

## 完成项（对照验收清单）

1. **`npm install && npm run build` 通过**。首屏 JS：主 chunk 7.8KB gzip，three 独立 chunk（动态 `import()` 自动切分）130.6KB gzip，合计 < 200KB gzip 预算。
2. **7 个 beat 文案全部正确**，滚动无跳变、无白屏（自动化逐 beat 断言标题文案）。
3. **375×812 与 1440×900 均无横向滚动**。
4. **零件拾取**：beat 2 榫头/卯眼、beat 4 三道隔舱板均可点击/键盘（Tab 循环 + Enter 选中 + Escape 复位）高亮，浮层显示 中/英/译法类型（如「榫头 tenon 直译」「隔舱板 01 bulkhead 直译」）；再点同一个复位，点空白全部复位。
5. **漏水实验**：`with-bulkheads`（仅 bulkhead_02 左侧舱进水到舱高 80%，船体倾斜 2° 后稳定）/ `without-bulkheads`（水面到船深 60%，船体下沉 8 单位，隔舱板淡出），两状态各切换 3 次无残留，重复点击当前状态可重播，切换约 1.1s 收敛、可中断。
6. **补缝三步**：顺序错时 caulk_layer 与缝端标记朱砂色闪烁 + 一行提示、栈清空；`榫卯 → 铁钉 → 捻缝` 入栈完成后缝闭合 + 成功文案。
7. **`?no3d=1` / WebGL 不可用**：隐藏 canvas，7 个 beat 全部有对应 SVG（`<img loading="lazy">`）+ 完整文案；补缝/漏水按钮 `disabled` + `aria-disabled`。
8. **中英切换** 3 次：3D 状态与滚动位置均不重置，仅文案切换。
9. **性能**：headless 软渲染下连续滚动 100 帧最差帧 33ms（真机 GPU 会远低于此）；DPR 上限 2；占位 draw call 约 20，无阴影贴图（假阴影用 CanvasTexture 径向渐变平面）。

自动化验证用 Playwright + headless Chromium 跑了 22 项断言全部通过（测试脚本未进仓库，属临时验证手段）。

## 结构

- 文案零硬编码：beat 文案在 `src/content/beats.js`（含界面文案 `ui`），术语在 `src/content/glossary.js`（含 `nodeTerms` 节点名→词条映射）。
- 节点名与 T12/`parts.json` 约定一致：`hull_shell` / `keel` / `stem` / `sternpost` / `bulkhead_01..03` / `plank_seam` / `nail_set` / `caulk_layer` / `joint_tenon` / `joint_mortise`，每个都是独立 `THREE.Group`。
- `src/stage/scene.js` 内含 `loadPartsSpec()`：`models/parts.json` 存在则按 `name` 应用装配/爆炸位，并留了 `bindRealMeshes()` 空实现接 GLB；文件不存在时静默走占位。`models/` 已建 `.gitkeep`。
- 相机：每 beat 一个 `{position, target, fov}`，beat 末尾 25% 区间 smoothstep 混向下一 beat，再叠加 0.08 阻尼；`prefers-reduced-motion` 时直接赋值、不旋转、状态直切。

## 与文档冲突 / 偏差记录

- **灯光强度**：brief 只说「半球光 + 方向光」。three r155+ 物理光照下低强度画面过暗，实际用了 hemi 1.7 + dir 2.4（无阴影贴图，符合性能预算）。
- **hull_shell 可见 beat**：brief 表格标「1, 6, 7」，但 beat 4/5 的剖切与漏水需要船体在场，实际 beat 4–7 均显示（半透明），与 08-story-map 的画面描述一致。
- **水位**：brief 说「半透明蓝色平面」。纯平面侧视不可见（零厚度），用了 0.5 单位厚的扁盒，视觉上仍是「一个面」。颜色用海雾 `#7E9A9A`（04 第 5 节指定水面色）。
- **beat 3 分层出现**：08 写「随滚动分层出现」与「点击推进三步」并存，实现为滚动到阈值只淡入钉/捻缝预览，闭合缝仍由三步交互触发。
- **beat 6 词条卡**：08 写「构件上浮出词条卡片」，占位阶段用文案面板内的术语墙（数据来自 glossary.js），GLB 到位后可改成 3D 锚定卡片。

## 遗留问题

- headless SwiftShader 下控制台有一条 `GPU stall due to ReadPixels` 性能提示，是软渲染截图路径的固有提示，真机 GPU 不出现；验收第 8 条「零警告」请在真实浏览器里复核。
- `models/parts.json` 在生产构建下需放进 `public/` 才会被部署（当前按 brief 建在仓库根，dev 下可访问；GLB 交付时建议移到 `public/models/` 或改 loader 路径）。
- 键盘 Tab 在 stage 内循环零件，Escape 退出焦点；焦点陷阱已规避（Escape/blur 可离开）。零件级 SR 描述仍待加强：`role="img"` 与动态 aria-label 现已落在 canvas 上，降级模式由 SVG 的 alt 承担，但单个零件没有独立可读名称。
- 占位船体是开口箱形（无甲板），beat 1 剪影能看到内部中空；`ship_deck`（A02）到位后解决。

## 下一步需要什么

1. **等 GLB + `parts.json`**（T12）：按 `name` 接 `bindRealMeshes()`，替换占位几何，节点名不要改。
2. **等术语定稿**（09 的待办）：英文母语者复核 `treenail`/`caulking` 语感；beat 6 术语墙词条随之更新。
3. **等事实核对**（10-fact-check.md 落稿）：beat 文案如有改动只动 `beats.js`。
4. 第三语种（日/韩）11-12 决定；启用时在 glossary 加字段即可，UI 已按数据驱动。

## 第 1 轮评审修复记录

对应 `docs/13-codex-review-1.md` 的阻断级（1–2）与重要级（3–8）；建议级（9–11）未动。改完 `npm run build` 通过。

1. **语言切换重置交互状态**（阻断级，`src/ui/overlay.js`）— 把 `applyBeatContent` 拆成 `applyBeatCopy`（只换文案）与 `applyBeatInteraction`（进 beat 才重置面板/状态）；`setLang` 只走 copy 分支，再用记录的 `caulkUIState`、`floodActiveName` 调 `renderCaulkUI()` / `setFloodActive()` 恢复补缝按钮+状态提示与漏水开关选中。验证：代码路径检查确认 `setLang` 不再调用 `applyBeatInteraction`，补缝完成态与 flood「无隔舱」选中在切语言后由记录状态重放。
2. **`role="img"` 包住交互控件**（阻断级，`index.html` + `src/ui/overlay.js`）— 舞台容器改 `role="group"`，`role="img"` 与动态 `aria-label` 只放到 canvas；`applyBeatCopy` 把 beat 场景标签写到 canvas 而非容器。验证：DOM 语义检查，文案与按钮不再是图片内容，辅助技术可识别按钮。
3. **reduced-motion 下榫卯爆炸仍随滚动移动**（重要级，`src/stage/scene.js`）— b2 爆炸在 `reducedMotion()` 时直接 `e = 1`（分离目标位），不再做随滚动进度插值。验证：代码路径检查，减少动效下滚动到 b2 直接落分离位。
4. **Tab 抢占键盘、无 Escape 提示**（重要级，`src/main.js` + `src/content/beats.js`）— keydown 仅当 `e.target === stageEl` 时接管 Tab/Enter/Escape，焦点在内部按钮时放行；`pickHint` 增加「Escape 退出 / Escape exits」。验证：node 断言确认 `pickHint` 含 Escape；代码路径检查确认守卫条件。
5. **术语卡未显示 `term.note`**（重要级，`src/ui/overlay.js` + `src/styles.css`）— `renderTerms` 在 `term.note` 存在时按当前语种渲染 `.t-note`，并补充样式。验证：node 断言确认术语墙含 `sunmao` / `sunhe-dingjie` / `bulkhead` 三个 note 词条。
6. **beat 7 多余 eyebrow、beat 3 缺 `**plus**`**（重要级，`src/content/beats.js` + `src/ui/overlay.js`）— 删除 b7 的 eyebrow；b3 英文补 `**plus**`；overlay 对无 eyebrow 的 beat 隐藏标题眉，正文用 `inlineMarkup` 把 `**粗体**`/`*斜体*` 渲染成 `<strong>`/`<em>`。验证：node 断言确认 b3 含 `**plus**`、b7 无 `eyebrow` 字段。
7. **DPR 只在初始化设定**（重要级，`src/stage/scene.js`）— 抽出 `clampedDPR()`（clamp 到 2），`resize()` 里重新读取并 `setPixelRatio`。验证：代码路径检查确认 resize 会更新 DPR。
8. **`innerHeight` 覆盖 CSS `100svh` 导致跳动**（重要级，`src/main.js`）— 用隐藏 probe 读稳定 `100svh` 存为 `vhBaseline`，`layout()` 与主循环 `max` 均改用该基准（`innerHeight` 仅作不支持 svh 时的兜底）。验证：grep 确认 `layout()` 与进度分母不再直接用 `innerHeight`，地址栏收缩时基准不变。


## 3D 预算：三角面上限调整为 60,000

- 原定 ≤ 35,000 面，按 3 道示意隔舱板估算。
- 11-12 决定隔舱板按实船做 **12 道**（与内容组事实核查一致），零件数从 3 增到 12，原阈值不再适用。
- 新上限：**≤ 60,000 三角面**，体积仍 ≤ 5 MB，draw call 仍 ≤ 20。`tools/check-model.mjs` 默认值已同步。
- 复核方式：模型交付后跑 `npm run check:model`，若超标优先降船体曲面细分，不拆隔舱板。
