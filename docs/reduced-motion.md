# 减少动效验证（C · 视觉）

验证时间：2026-11-11 · 对象：当前工作区版本

清单里这条写的是「逐条验证，不能只写在 CSS 里」——这个项目确实在 **JS 里**也有判断，下面按代码 + 运行时两部分记。

## 一、代码层：判断点在哪

全项目共 **6 个文件、11 处**判断，全部走同一个 `reducedMotion()`（`matchMedia('(prefers-reduced-motion: reduce)')`）。

| 文件 | 位置 | 减少动效时的行为 |
|---|---|---|
| `main.js` | `onReplay` | 回到顶部用 `auto`，不平滑滚动 |
| `overlay.js` | `renderBeat` | 文案直接换，不走 200ms 淡出 + 换行 |
| `camera.js` | `CameraRig.update` | 相机位置/target/fov **直接赋值**，不做阻尼 |
| `scene.js` | `update` | 船体自转关闭（`wantSpin = false`） |
| `scene.js` | `update` | 旋转角度一步到位（`lerp` 系数 1） |
| `scene.js` | `update` | 榫卯爆炸 `e = 1`，不随滚动插值 |
| `caulk.js` | `update` | 补缝上下板 **直接跳到目标位**，不做缓动 |
| `flood.js` | `setState` | 水位/姿态/透明度一步赋值，不补间 |
| `styles.css` | `@media` | 文案、按钮、开场层过渡全部 `none` |

**关键点**：如果只改 CSS，相机、榫卯爆炸、补缝、漏水这四处仍然是动画。这是这条验收最容易漏的地方。

## 二、运行时验证

环境：Edge 157 headless，1440×900，`Emulation.setEmulatedMedia({ prefers-reduced-motion: 'reduce' })`。

| 检查项 | 方法 | 结果 |
|---|---|---|
| 媒体查询生效 | `matchMedia('(prefers-reduced-motion: reduce)').matches` | `true` |
| 开场页不淡出 | 点「开始探索」后 80ms 查 `#intro` 是否已移除 | **已移除**（正常模式是 560ms 后） |
| 七屏可读 | 逐屏滚动截图，文案齐全 | 7/7 屏内容完整 |
| 补缝直接闭合 | 连点三步，150ms 后截图 | 缝已填满、上板已到闭合位 |
| 漏水直接切换 | 点「无隔舱」，150ms 后截图 | 水面、船体姿态已到位 |
| 回顶按钮 | 第 7 屏点「重新看一遍」 | `behavior: auto`，瞬间回顶 |

截图存于 `docs/shots/reduced-motion/`（`rm-b1` … `rm-b7`、`rm-caulk`、`rm-flood`）。

## 三、结论

**验收第 8 条通过**：关掉动效后仍能完整读完 7 屏，三个交互（补缝、漏水、回顶）都可用，没有卡在中间状态的元素。

## 四、仍未覆盖

- **真机**：iOS 「减弱动态效果」、Android 「移除动画」在系统层的实现与 `matchMedia` 一致，但滚动惯性、地址栏行为不受此开关影响，仍需真机走一遍。
- **部分动画的元素**：页面里没有 CSS keyframes 动画（只有 transition），所以这条不需要逐个 keyframes 检查。

## 复测

浏览器 DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`，然后走一遍七屏。
