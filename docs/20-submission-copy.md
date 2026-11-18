# 提交材料文案（11-18）

> 版本：v1 · 2026-11-18
> 用途：比赛提交的《作品说明》《AI 创作说明》，以及给评审看的术语附录
> 依据：`10-fact-check.md` v2（事实口径）、`09-glossary.md`（术语）、`12-demo-script.md`（演示）
> **【待填】标记的地方必须由团队补齐后再提交**，AI 说明与实际不符会按材料不全处理。

---

## 一、作品说明（中文，300–400 字）

《榫合》是一件关于「连接」的交互式网页。它从一句流传很广的话出发——「中国古船不用一根钉」——把一艘宋代海船拆开，让观众自己看见答案。

页面分七个片段：先立起传闻，再把镜头推到一处榫卯节点，接着露出接缝里的钉与捻缝，然后剖开船体看见十二道隔舱板，用一个漏水实验对比「有隔舱」与「无隔舱」的两种结果，最后让术语穿过多重语言收束。动手的环节有三处：点击零件看它的名称与译法，按正确顺序补一道缝，切换漏水实验的两个状态。

专业依据来自泉州湾后渚港宋船的考古材料：船底二重板、船舷三重板，麻丝、竹茹与桐油灰捣成的艌料配铁钉使用，十二道隔舱板把船身分成十三个舱。这些细节纠正了「全靠榫卯」的浪漫想象，也说明了真正的做法是「榫合钉接」：榫卯定位，钉加固，捻缝保证水密。

语言是第二层结构。英文里没有与「榫卯」完全对等的单词，最接近的是 mortise-and-tenon joint。页面把每个构件的译法类型标出来，让「翻译也是一次榫合」有落点。

技术上使用原生 JavaScript 与 three.js，模型为结构示意；不支持 WebGL 时可切到 SVG 版本，中英切换不丢失阅读位置，手机端可用。

---

## 二、作品说明（English，约 260 词）

*Joinery* is an interactive web piece about connection. It starts from a popular claim — that old Chinese ships used no nails at all — and takes a Song-dynasty ship apart so the visitor can see the answer directly.

The page runs in seven passages: the claim is raised, the camera moves into a single mortise-and-tenon joint, the nails and caulking inside a plank seam appear, the hull is cut open to show twelve bulkheads, a flooding test compares a hull with and without bulkheads, and the glossary closes by letting terms travel between languages. Three moments ask the visitor to act: click a part to read its name and translation type, close a seam in the right order, switch the flooding test between two states.

The evidence comes from the Quanzhou ship excavated at Houzhu in 1974: a double-layer bottom, triple-layer side planking, caulking of hemp, bamboo shavings and tung-oil putty, fixed with iron nails, and twelve bulkheads dividing the hull into thirteen compartments. What survives is not "joinery alone" but joinery plus fastening: tenons locate, nails lock, caulking keeps the water out.

Language is the second structure. English has no single word for 榫卯; the closest is mortise-and-tenon joint. Each part is labelled by translation type, so the line "translation is joinery too" has something to stand on.

Built with plain JavaScript and three.js, the model is a structural diagram rather than an archaeological reconstruction. An SVG version covers devices without WebGL, switching language keeps the reading position, and the page works on a phone.

---

## 三、AI 创作说明（300–500 字）

**一、使用的 AI 工具**

【待填：具体模型与版本，例如「Anthropic Claude（网页版与 Claude Code 编程代理）」「OpenAI GPT 系列」「xAI Grok」】。用途限于文字与代码，不涉及图像生成。【若使用了 AI 语音合成或图像生成，在此补充工具名与用途】

**二、AI 参与的环节**

1. 文档撰写：故事地图、术语表、事实核查表、建模任务书的结构化初稿；
2. 代码：前端脚手架、滚动与相机逻辑、漏水与补缝两个状态机、无障碍标签的初稿，以及多轮代码审查；
3. 文案：中英文初稿、以及英文的逐句改写建议；
4. 资料检索：协助定位考古与造船史的公开材料，供人工核对。

**三、团队人工完成与修改的内容**

选题、叙事结构与全部事实判断由团队完成。团队逐条核对机构与学术来源，并据此删掉了两处看似漂亮但查无出处的说法（「龙骨直角同口」「鱼鳞式搭接」），改用可复引的「斜直角法榫合」与「保寿孔」。模型与材质、录屏与讲解、页面交互的取舍同样由团队完成。文案经人工逐句改写，AI 初稿大多被重写而非直接采用。

**四、核验方式**

事实层：每条表述绑定来源，形成 `10-fact-check.md`，区分「机构/学术来源」与「百科转述」，后者不进页面。术语层：`09-glossary.md` 统一英文写法，逐条标注译法类型。【待填：英文是否完成母语者复核，复核人可署名或写「同校英文专业同学」】。技术层：多轮代码审查与三平台回归（`19-fallback-regression.md`），降级、语言切换、375/768/1440 三档宽度均为实测。

AI 在本项目中承担的是起草与检查，不承担判断。所有史实、译法与最终措辞由团队负责。

---

## 四、术语附录（给评审，可直接附在说明后）

| 中文 | English | 译法 | 一句话 |
|---|---|---|---|
| 榫卯 | mortise-and-tenon joint | 解释译 | 英文无单词对应，最接近的说法 |
| 榫合钉接 | mortise-and-tenon joinery with nail fastening | 解释译 | 榫卯定位、钉加固，本文核心概念 |
| 榫头 | tenon | 直译 | 一块木头伸出的凸头 |
| 卯眼 | mortise | 直译 | 另一块木头凿出的凹口 |
| 龙骨 | keel | 直译 | 船底中央的纵向大梁 |
| 艏柱 / 艉柱 | stem / sternpost | 直译 | 船头与船尾的立木 |
| 船壳板 | hull planking | 直译 | 船体外皮，分底、舷若干层 |
| 隔舱板 | bulkhead | 直译 | 水密语境写 watertight bulkhead |
| 水密隔舱 | watertight compartment | 直译 | 隔舱板围出的独立舱室 |
| 船板接缝 | plank seam | 直译 | 两块船板相接处 |
| 铁钉 / 木钉 | iron nail / treenail | 直译 | 木钉造船语境优先 treenail |
| 捻缝 | caulking | 直译 | 动词 to caulk；材料通称 caulking |
| 桐油灰 | tung-oil putty | 解释译 | 桐油与石灰调成的填料 |
| 麻丝 | hemp fiber | 直译 | 与桐油灰同用，塞进缝里 |
| 斜直角法榫合 | right-angle scarf joint | 解释译 | 主龙骨两端接头的做法 |
| 保寿孔 | longevity hole | 待核 | 主龙骨两端「七星伴月」的孔，英文名待定 |

---

## 五、提交前待填清单

- [ ] 【待填】AI 工具的确切名称与版本（第三节第一段）
- [ ] 【待填】是否使用 AI 语音合成 / 图像生成；若使用，写明用途
- [ ] 【待填】英文是否完成母语者复核；复核人与日期
- [ ] 【待填】作品链接、90 秒视频链接、仓库链接（按 `02-delivery-checklist.md` 命名）
- [ ] 校对说明中的数字与 `10-fact-check.md` 一致（十二道隔舱板 / 十三舱 / 二重底三重舷）
- [ ] 说明与页面实际内容逐条对得上：是否有「直角同口」「鱼鳞式搭接」残留
