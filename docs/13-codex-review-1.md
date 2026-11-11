# Codex 评审 · 第 1 轮

> 评审模型：gpt-6-luna（reasoning: high），只读静态审查
> 结论：**不建议提交**，先修复阻断级问题

## 阻断级（必须改）

1. `src/ui/overlay.js:121` — 切换语言会重新执行 `applyBeatContent()`，清空补缝提示与已完成按钮样式；漏水 beat 还会把「有隔舱」标为选中，即使 3D 状态仍是「无隔舱」。违反「只换文案、不重置状态」。修法：文案更新与交互状态渲染分离，或在重绘后从 `caulk.stack`、`flood.active` 恢复按钮与状态提示。
2. `index.html:27` — `role="img"` 包住整块舞台文案与按钮，屏幕阅读器会把交互控件当作图片内容。修法：图像语义只给 canvas/SVG，舞台容器改成分组语义，确保按钮仍可被辅助技术识别。

## 重要级（应改）

3. `src/stage/scene.js:129` — `prefers-reduced-motion` 下榫卯爆炸仍随滚动移动。应直接设装配/分离目标位置，不做位移插值。
4. `src/main.js:133` — 可拾取 beat 中每次 Tab 都 `preventDefault()`，键盘无法继续到面板按钮，且未提示 Escape 退出。应允许焦点离开，或明确提示退出键。
5. `src/ui/overlay.js:81` — 术语卡未显示 `term.note`；`09-glossary.md` 要求解释译给一句解释。应显示对应语种说明。
6. `src/content/beats.js:139` — beat 7 多出 Story Map 没有的 eyebrow「收束 / Coda」；beat 3 英文正文丢失 `**plus**` 强调。按 `08-story-map.md` 修正。
7. `src/stage/scene.js:34` — DPR 只在初始化设定，resize 不更新。应在 resize 重新读取并 clamp 到 2。
8. `src/main.js:35` — 用 `window.innerHeight` 覆盖 CSS `100svh`，移动端地址栏收缩会重算进度导致跳动。应使用稳定 svh 基准或单独处理动态视口。

## 建议级（可选）

9. `src/stage/parts.js:73` / `scene.js:167` — 每次拾取重建可拾取数组、逐帧新建包围盒；接真实模型后缓存。
10. `src/stage/scene.js:32` — 无 `dispose()`；初始化失败路径未清理 renderer/几何/材质。
11. `src/styles.css:34` — `overflow-x: hidden` 只是遮住溢出，需确认窄屏控件与长术语真的收缩换行。

## 文案核对结论

- 正文无丢句、无改写。
- 明确偏差：beat 7 多余 eyebrow；beat 3 英文缺 `**plus**` 强调。
- 降级路径与四张 SVG 映射存在，`?no3d` 下控件禁用，静态检查未发现断路。

## 要求

修完阻断级与重要级后，重新 `npm run build`，并在 `REPORT.md` 追加「第 1 轮评审修复记录」：每条对应改了哪个文件、怎么验证。
