# 英文审校记录（D 方向 11-15）

> 版本：v1 · 2026-11-15
> 范围：全站英文文案（`beats.js`、`intro.js`、`quiz.js`、`glossary.js`、`beats.js` 里的界面文案）
> 依据：`09-glossary.md` 0.1 用词对照表 + 0.2 文体约定
> **重要：这一轮是我（D 方向）做的自审，不是母语者审校。** 母语复核仍是未完成项，第 4 节是给复核人的清单。

## 1. 这轮改了三处

改的都是与自己的规矩打架的地方，不是润色。

| 位置 | 原文 | 改为 | 为什么 |
|---|---|---|---|
| `beats.js` b5 正文 | Water fills a single **hold**. | Water fills a single **compartment**. | `09` 0.1 定「装货用 hold，讲分隔用 compartment，同一段内不要混用」。b5 讲的是隔舱与进水，标题已经是 compartment，正文却写 hold，同屏自相矛盾 |
| `quiz.js` 第一题正确项 | putty and hemp caulk the seam | **tung-oil** putty and hemp caulk the seam | `09` 规定桐油灰固定写 `tung-oil putty`；单写 putty 在英文里泛指腻子，读者会丢掉「桐油」这个材料信息 |
| `quiz.js` 引导句 | Seven **screens** in. | Seven **passages** in. | 开场页写的是 `Seven passages · about three minutes`，同一件事两个词，统一到 passages |

改动都只动英文，中文一字未改。

## 2. 逐项检查，通过的

| 检查项 | 规则 | 结果 |
|---|---|---|
| 连字符 | `mortise-and-tenon` 作定语必须带连字符 | 通过：全站 3 处全部 `mortise-and-tenon` |
| 禁用变体 | 不写 `mortise and tenon` / `tenon joint` 单独指代 | 通过：0 处 |
| 英美拼写 | 统一用英美哪一种 | 通过：全站无 `fibre / colour / harbour`，统一美式 |
| 舱的两种说法 | hold 与 compartment 不混用 | **发现 1 处，已改**（见上表） |
| 引流词 | 不写 `the world's first` / `unique to China` / `leading the West` | 通过：0 处 |
| 营销语 | 不写 `ancient wisdom` / `mysterious East` / `timeless` | 通过：0 处 |
| 句首副词 | 不用 `So,` / `Interestingly,` / `Importantly` 开头 | 通过：0 处 |
| 引号 | 英文引文用弯引号 “ ” | 通过：`quiz.js` 2 处一致，其余无引文 |
| 术语一致 | 同一概念全站同一写法 | 通过：`bulkhead` / `watertight bulkhead` / `treenail` / `caulking` 各只有一种写法 |
| 标题句号 | 标题不用句号 | 例外：b5 标题是两个短句（`One compartment floods. The ship stays afloat.`），有意保留句号，因为它是两句对照，不是短语标题 |

## 3. 没改但存疑的

这几条我自己拿不准，留着不动，进第 4 节清单。

1. **`treenail` 的自然度。** 造船史文献里确实用 treenail，但普通英文读者可能不认；`wooden peg` 更好懂但不够专业。现在首次出现写 `treenail (wooden peg)`（`09` 已有此规定），只在术语卡上单独出现 `treenail`。术语卡那一处是否要补括号，想要母语者意见。
2. **`caulking` 作名词还是 `caulk` 作动词。** 正文用 `caulks the seam shut`（动词），术语卡用 `caulking`（名词）。两处都对，但同一页里动名混用会不会读起来跳。
3. **`joinery plus fastening` 这个缩略。** 术语表全称是 `mortise-and-tenon joinery with nail fastening`，正文用短版。短版更顺，但首次出现就用短版是否显得偷懒。
4. **`stays afloat`。** 比原来的 `stays up` 准确，但对「一舱进水船还浮着」这个画面，`stays afloat` 会不会太技术、少一点人的惊讶感。
5. **`保寿孔` 的英译。** 目前 `09` 里写 `longevity hole`（待核）。这个译法我没有来源，只是直译；如果要上海报或英文来源区，必须有出处或改成描述性说法（如 `the "seven stars and a full moon" coin holes`）。
6. **`watertight bulkhead system` 与 `watertight compartment` 的分工。** 规则写了讲制度用 system、讲舱室用 compartment，但英文里 `bulkhead system` 不如 `compartment` 常见，读者未必分得清。

## 4. 给母语复核人的清单

**目标**：只解决「读起来是不是英文」这一个问题，不讨论事实与术语对错（那些已经由 `10-fact-check.md` 和 `09` 定死）。

**怎么读**：把页面切到 EN，从开场页滚到第 7 屏，再点开两个零件浮层。10 分钟内可完成。逐条回答，不必写长文。

| # | 要确认的 | 现在写成 | 你可以回答 |
|---|---|---|---|
| 1 | `treenail` 会不会让普通读者停住 | treenail (wooden peg) | 停 / 不停 / 建议改为 |
| 2 | 术语卡上单独出现 `treenail` 要不要补括号 | treenail | 补 / 不补 |
| 3 | `caulks the seam shut` 与名词 `caulking` 混用是否别扭 | 正文动词、卡片名词 | 别扭 / 可以 |
| 4 | `joinery plus fastening` 首次出现能否接受 | 短版 | 可以 / 应先用全称 |
| 5 | `stays afloat` 的语气 | One compartment floods. The ship stays afloat. | 保留 / 换成 |
| 6 | `保寿孔` 该怎么写 | longevity hole（未上线） | 建议写法 |
| 7 | 第 6 屏「翻译也是榫合」的英文是否成立 | Translation is joinery too: the two sides never match exactly, and they still have to hold. | 成立 / 不成立 / 改写为 |
| 8 | 三问的题干与选项有没有读不懂的 | `quiz.js` | 具体哪一条 |

**记录方式**：在本文件追加一节「母语复核（日期 / 复核人）」，每条写「原文 → 建议 → 是否采纳」，改完在 `REPORT.md` 记一条。

**截止**：11-17 之前，因为 11-17 要录英文旁白、11-18 要写作品说明。晚于 11-17 就只能改字幕不能改录屏。

**找不到母语者的退路**（写进 AI 创作说明）：

1. 用两个不同模型各独立改一遍，取两者一致的部分采纳；
2. 不一致的部分由队友人工判断，判断理由记进本文件；
3. 全程标注「未经母语者复核」，不宣称 native-checked。

## 5. 与事实核查的联动

`10-fact-check.md` v2 有两处结论会影响英文写法，改文案时别踩：

- 不写 `right-angle butt joint`（「直角同口」查无出处），要写龙骨接头就写 `scarf joint`（对应「斜直角法榫合」）。
- 不写 `fish-scale / clinker planking` 描述后渚船（那是法石古船），要写就写 `butt and lap joints combined`。

## 6. 结论

英文在本轮之前已经是可用状态，这轮修的是**自相矛盾**而不是文采。真正剩下的风险集中在「专业词的自然度」上，那部分只能由母语者拍板，我这里的判断不足以替代。
