# b6 交互规格：一个词的三步迁移（术语出海）

> 版本：v1 · 2026-11-13
> 负责人：D 方向
> 上游：`04-design-direction.md` §4.2 D、`09-glossary.md`（术语口径与译法类型）
> 下游：`src/ui/overlay.js` 的 `renderTerms()`、`src/content/glossary.js`
> 状态：**规格与数据先行，实现留到 11-14 / 11-16**。本文写给前端照着做，不需要再回来问。

## 1. 现在是什么，要变成什么

现在 b6 是**术语清单**：`renderTerms()` 把 `termWall` 的 7 个词条平铺成两列，每条一行"中文 + 类型 + 英文 + 注"。它是一个列表，读者扫一眼就过。

要变成**一次迁移的演示**：选中一个词，看它从中文原词出发，先撞上"字面直译"的墙，再换成通行的解释译，最后明确告诉你这一步丢掉了什么。

差别在于：清单回答"这个词英文怎么写"，迁移回答"翻译为什么要在两害之间选一个"。后者才是翻译学院的主场，也是这一屏存在的理由。

## 2. 信息结构

三行，纵向，有先后。不是并排卡片，也不是四个等重方块——内容本身是序列，所以用序列的形式。

```
┌ 选择条 ─────────────────────────────────────────────┐
│  榫卯      榫合钉接      捻缝                       │
└─────────────────────────────────────────────────────┘

  原词        榫卯
              中文里"榫"与"卯"是一对：一个凸出的头，一个凹进的眼。

              ↓  字面直译

  直译        tenon-mortise          ✗ 英文没有这个并列词
              读者会把它当成两个零件的堆叠，而不是一处连接。

              ↓  改用解释

  解释译      mortise-and-tenon joint   ✓
              以连字符连接，作定语时用 mortise-and-tenon。

  ─────────────────────────────────────────────────────
  丢掉了什么   成对的拟人："头"与"眼"。英文把两端摆成并列成分，
              一处连接变成了两个零件的清单。
```

## 3. 数据模型

`src/content/glossary.js` 每条词条新增一个**可选**字段 `migration`。没有这个词条的字段就不存在，页面自动退回现在的清单样式。

```js
{
  id: 'sunmao',
  zh: '榫卯',
  en: 'mortise-and-tenon joint',
  type: '解释译',
  note: { zh: '…', en: '…' },        // 现有字段，不动
  migration: {
    origin:    { zh: '…', en: '…' },  // 原词自带什么，一句
    literal:   { text: 'tenon-mortise', note: { zh: '…', en: '…' } },
    explained: { text: 'mortise-and-tenon joint', note: { zh: '…', en: '…' } },
    lost:      { zh: '…', en: '…' },  // 迁移丢掉了什么，一句
  },
}
```

约束：

- **全部字符串双语**。`zh` / `en` 都要有，缺一个视为数据错误。
- `literal.text` 与 `explained.text` 是**英文写法**（这是翻译演示，落点是英文），中文侧只用 `note`。
- `lost` 是必填；写不出来说明这个词不适合做迁移演示，`migration` 整个不要写。
- 不做嵌套数组、不做多版本译名。要加第三种译法，先改本文。
- `migration` 只加在 `termWall` 会展示的词条上，其余词条不动。
- `type` 与 `migration` 是两件事：`type` 决定词条卡上标什么（`09` 规定直译只给译名），`migration` 决定 b6 的迁移视图怎么演示。所以直译词也可以有迁移——`捻缝 caulking` 就是标准对译，但「捻」那个手部动作在英文里丢了，这恰恰是最值得演示的一条，不算违反 `09` 的呈现规则。

本期只写 3 条：`sunmao`、`sunhe-dingjie`、`caulking`。其余 13 条保持现状（点开只有 `note`）。

## 4. DOM 与状态

沿用现有容器，不新增 HTML 顶层节点：`#terms-ui` / `#terms-title` / `#terms-list`。

建议结构（`renderTerms()` 内部重建）：

```html
<ul class="terms-list" role="tablist" aria-label="术语">
  <li role="presentation">
    <button type="button" role="tab" id="term-tab-sunmao"
            aria-selected="true" aria-controls="term-panel-sunmao"
            tabindex="0">榫卯</button>
  </li>
  …
</ul>
<div class="term-panel" id="term-panel-sunmao" role="tabpanel"
     aria-labelledby="term-tab-sunmao">
  <ol class="migration">
    <li class="m-step is-origin">   <span class="m-label">原词</span>   … </li>
    <li class="m-step is-literal">  <span class="m-label">直译</span>   … <span class="m-mark">✗</span></li>
    <li class="m-step is-explained"><span class="m-label">解释译</span> … <span class="m-mark">✓</span></li>
  </ol>
  <p class="m-lost"><span class="m-label">丢掉了什么</span> …</p>
</div>
```

规则：

- 用 `<ol>`，因为三步有先后；编号由 CSS 计数器出，不写死数字。
- `✗` / `✓` 只是视觉标记，必须配一段可读文本（"英文没有这个并列词"），不能只靠符号或颜色传达对错。
- 选择条只在 `termWall` 里**有 `migration` 的词条**上出现；一个都没有时整块退回清单。
- 面板一次只显示一个词条（`hidden` 控制），不折叠、不手风琴。
- 选中状态存在 `overlay.js` 的 `selectedTermId`，**语言切换时保留**。

## 5. 交互

| 动作 | 行为 |
|---|---|
| 进入 b6 | 默认选中 `termWall` 里第一个有 `migration` 的词（榫卯） |
| 点击词条 | 切换面板，焦点留在被点的 tab 上 |
| `←` / `→` | 在选择条内切换，焦点跟随，自动选中 |
| `Home` / `End` | 跳到首/末个词条 |
| `Enter` / `Space` | 同点击 |
| `Esc` | 收起面板，焦点回到当前 tab |

不带拖拽，不做轮播，不自动播放。

## 6. 动效

只做两件事，其余不动：

- 词条切换：面板 `opacity` 0→1 + `translateY(4px)`→0，**160ms**，`cubic-bezier(0.23, 1, 0.32, 1)`。
- 迁移线画出：`clip-path: inset(0 0 100% 0)` → `inset(0)`，**240ms**，同曲线，只在进入时播一次。

不做：打字机逐字、图钉弹跳、循环旋转、随滚动进度变化的位移。`prefers-reduced-motion: reduce` 时两处都直切，保留 opacity 变化。

## 7. 可访问性与移动端

- tablist / tab / tabpanel 语义齐全，`aria-selected` 与 `tabindex` 同步维护（当前 tab `0`，其余 `-1`）。
- 迁移路径是 `<ol>`，屏幕阅读器读得出"三步"。
- `✗` 与 `✓` 所在元素 textContent 要能读出判断结论。
- 面板内容在 375 px 宽下单列，不横向滚动；选择条可横向滚动但不撑破容器。
- 文字对比度按 `docs/contrast.md` 的既有标准，不新造灰色。

## 8. 降级与 3D 联动

- `?no3d=1`：迁移面板照常可用（纯 DOM），只是没有 3D 高亮联动。
- 3D 联动**本期不做**。留一个空实现占位：`onTermSelect(id)`，前端在切换词条时调用，`main.js` 里留空函数，11-16 再决定要不要高亮对应零件。
- 语言切换不重置：选中的词条、3D 状态、滚动位置三者都不变。

## 9. 验收（前端自查）

1. `termById` 覆盖 16 个 id，`termWall` 7 个，`nodeTerms` 12 个，三者数量与改前一致。
2. 三个有 `migration` 的词显示三步迁移；其余四个词条显示现有清单样式，不报错。
3. 键盘全流程可走：Tab 进入 → ←/→ 切换 → Enter 展开 → Esc 收起，焦点不丢。
4. 中英切换 3 次：选中词条不变，`lost` 段随语言切换，滚动位置与 3D 状态不变。
5. `prefers-reduced-motion` 下无位移，只有透明度变化。
6. 375 / 768 / 1440 三个宽度无横向滚动，`✗`/`✓` 不被挤掉。
7. `?no3d=1` 下迁移面板完整可用。
8. 不新增任何依赖，不引外部字体。

## 10. 本期不做

- 3D 零件高亮联动（留 `onTermSelect` 空实现）
- 第三语种（09 第 4 节已决定不启用）
- 母语者复核这些译注（11-15）
- 其余 13 个词条的迁移文案（词条先补全，见 11-14）

## 11. 三条样板数据（已写入 `glossary.js`）

> 这些是**译注**，不是史料。`榫头/卯眼`的头与眼、`捻`的手部动作都是构词观察，不涉及年代与尺寸，但仍需 11-15 由母语者看一遍语感。

**榫卯 / sunmao**

- 原词：中文里"榫"与"卯"是一对：一个凸出的头，一个凹进的眼。
- 直译：`tenon-mortise` ✗ 英文没有这个并列词，读者会当成两个零件的堆叠。
- 解释译：`mortise-and-tenon joint` ✓ 作定语时写 `mortise-and-tenon`。
- 丢掉：成对的拟人。"一处连接"变成了"两个零件的清单"。

**榫合钉接 / sunhe-dingjie**

- 原词：四个字是一个方法名：榫定位、钉加固，合起来算一种做法。
- 直译：`tenon-joint-nail-join` ✗ 中文能四字压缩，英文照搬不成句。
- 解释译：`mortise-and-tenon joinery with nail fastening` ✓
- 丢掉：命名的紧凑感。中文是术语，英文是说明书。

**捻缝 / caulking**

- 原词："捻"是手上的动作：把麻丝搓进缝里。
- 直译：`twist-seam` ✗ 读者会以为是拧绳子。
- 解释译：`caulking`（动词 `to caulk`）✓
- 丢掉：手。英文保留了结果（填缝），丢了那个搓的动作。
