# 提交材料汇编（《榫合 · Joinery》）

> 供导出比赛 Word 提交件（`.docx` 按 `.gitignore` 规则不入源码库）。正文已按 `docs/01-competition-brief.md` §3、`docs/02-delivery-checklist.md` §2–§5 与 `docs/15-owner-plan-D.md` 要求控制字数并统一中英术语口径。

---

## 一、提交命名与链接模板

- **压缩包 / 邮件主题**：`蓝色创想+B赛道+<团队名称>`
- **作品说明文件**：`B赛道＋<队长姓名>＋作品说明.docx`
- **AI 创作说明文件**：`B赛道＋<队长姓名>＋AI创作说明.docx`
- **演示录屏文件**：`B赛道＋<队长姓名>＋演示录屏.mp4`（1080P，H.264）
- **公网主站**：`https://wh20080518.github.io/BlueFantasy/`
- **备用镜像**：`https://bluefantasy.pages.dev`
- **源代码仓库**：`https://github.com/WH20080518/BlueFantasy`

---

## 二、《作品说明》（中文版 · 200–400 字）

<!-- STATEMENT_ZH_START -->
《榫合》（Joinery）是一部中英双语滚动叙事网页，针对「中国古船不用一根钉」的流行误读展开拆解。作品以 1974 年发掘的泉州湾后渚港宋代海船（残长 24.2 米、12 道隔舱板分 13 舱）及 UNESCO 名录「中国水密隔舱福船制造技艺」为依据，串起古船结构与术语翻译七幕体验。

交互按「结构—原理—语言」递进：第二幕点击榫头与卯眼可查看双语术语；第三幕经「榫卯 → 铁钉 → 捻缝」三步补缝，验证榫定位、钉加固、桐油灰拌麻丝水密，错序触发渗水警示；第四、五幕剖切船体露出十二道隔舱板，支持「有水密隔舱 / 无隔舱」漏水对比实验；第六幕呈现「原词 → 直译 → 解释译 → 丢掉了什么」三步术语迁移视图；第七幕三问收束。全站支持中英切换不丢状态，无 WebGL2 时降级为 SVG 图示。

适用场景：海外高校课堂、海事博物馆导览与新媒体传播。
<!-- STATEMENT_ZH_END -->

### *Project Statement* (English Version)

*Joinery* (`榫合`) is a bilingual (Chinese/English) scroll-driven interactive web essay that examines the popular myth that “traditional Chinese ships used not a single nail.” Taking the Song-dynasty ship excavated at Houzhu, Quanzhou Bay in 1974 (24.2 m surviving length, 9.15 m surviving beam, 12 bulkheads forming 13 compartments) and the watertight-bulkhead Fujian junk-building tradition inscribed on the UNESCO Urgent Safeguarding List in 2010 as its anchor, the work takes a ship apart across seven passages.

Its interaction sequence ties engineering to translation: in Passage 2, readers click an exploded tenon and mortise to inspect bilingual terms and translation strategies; in Passage 3, a three-step caulking exercise (joinery → iron nails → caulking) shows how tenons locate, nails lock, and tung-oil putty worked with hemp seals the seam—wrong sequences trigger a leaking-seam warning; in Passages 4–5, a cutaway hull reveals twelve transverse bulkheads and lets readers toggle between “With bulkheads” and “Without bulkheads” to compare localized flooding against full-hull sinking; in Passage 6 (“How a word crosses water”), a dedicated term-migration view traces how *sunmao* (`榫卯`), *sunhe-dingjie*, and *caulking* move from original term through failed literal phrasing to *mortise-and-tenon joint* and what is lost in transit; Passage 7 closes with a three-question check. Language switching preserves scroll position and 3D state, while devices without WebGL2 fall back cleanly to bilingual SVG diagrams.

Intended for overseas university seminars, maritime museum guides, and general social sharing, *Joinery* turns ship carpentry into an accessible lens on cross-cultural translation.

---

## 三、《AI 创作说明》（中文版 · 300–500 字）

<!-- AI_ZH_START -->
本项目开发与译校使用了两类大语言模型辅助工具：Claude Code（代码编写与调试辅助）及 Codex（只读静态审查）。

AI 主要参与两个环节：一是在团队架构下辅助编写 Three.js 场景控制、交互状态机与无障碍代码并开展静态审查；二是辅助起草部分英文文案、术语译注及三步迁移说明初稿。团队明确声明：船体模型、甲板烘焙法线、5 张降级 SVG、背景水纹及印章排版均为手工自制或按开源字体协议引入，未使用任何 AI 图像或 3D 生成工具。

团队人工完成并主导修改的工作包括：设计七幕叙事与视觉规范、完成 23 个零件的 Blender 建模与 UV/法线打磨、制定《术语表》统一英文口径（如定语统一用带连字符的 mortise-and-tenon）、设计第六幕迁移视图交互并打磨全部细节。

核验方面，史料逐条回溯省文物局、泉州海交馆及社科院刊物，剔除无出处的接头俗称与不适用旧说；英文采用双模型独立审校加人工比对，如实标注「未经母语者复核」；工程通过零件校验、模型预算校验及 20 条自动化交互与降级回归测试。
<!-- AI_ZH_END -->

### *AI Disclosure Statement* (English Version)

Two large-language-model tools assisted in creating *Joinery*: Claude Code (for frontend implementation and debugging support) and Codex (for read-only static code review). AI contributed solely to two areas: drafting portions of the Three.js/DOM interaction code and review fixes under team specifications, and generating initial drafts of English passages and term-migration notes. **No AI image or 3D generation models were used:** the `ship.glb` model, baked deck normal map, five fallback SVGs, and wave-line graphics were manually crafted by the team in Blender and vector tools, and the seal typeface is redistributable under SIL OFL 1.1.

The team independently designed the seven-passage narrative, built and refined all 23 3D parts, established the unified glossary (`mortise-and-tenon`, `tung-oil putty`, `treenail`, `caulking`), authored the Passage 6 term-migration framework, and refined every interaction and UI detail. All factual claims were verified against official museum, cultural-heritage bureau, and academic publications (`docs/10-fact-check.md`), removing unverified folk terms. Because an external native-speaker review has not yet been completed, English copy underwent independent dual-model cross-checking and manual reconciliation (`docs/18-english-review.md`), and is candidly marked as not yet native-checked. Code and assets passed `check:parts`, `check:model`, fallback regression, and 20 automated CDP interaction checks.

---

## 四、附录：核心术语中英对照与迁移摘要（评审可查）

| 中文 | 英文规范写法 | 译法类型 | 核心说明 / 迁移要点 |
|---|---|---|---|
| 榫合 | joinery | 解释译 | 作品名用 *Joinery* |
| 榫卯 | mortise-and-tenon joint | 解释译 | 直译 `tenon-mortise` ✗ 不成立；作定语写 `mortise-and-tenon`；丢失了「头/眼」成对拟人 |
| 榫合钉接 | mortise-and-tenon joinery with nail fastening | 解释译 | 直译 `tenon-joint-nail-join` ✗ 不成句；后续可用 `joinery plus fastening`；丢失了四字压缩感 |
| 捻缝 | caulking（动 `to caulk`） | 直译 | 直译 `twist-seam` ✗ 易误解；保留了填缝结果，丢失了「手搓」动作 |
| 榫头 / 卯眼 | tenon / mortise | 直译 | 3D 节点 `joint_tenon` / `joint_mortise` |
| 铁钉 / 木钉 | iron nail / treenail | 直译 | 首次可用 `treenail (wooden peg)`；不写 `wooden nail` |
| 桐油灰 | tung-oil putty | 解释译 | 固定加 `tung-oil`，保留原料信息 |
| 麻丝 | hemp fiber | 直译 | 填缝材料 |
| 龙骨 / 艏柱 / 艉柱 | keel / stem / sternpost | 直译 | 船体主骨架节点 |
| 隔舱板 / 水密隔舱 | bulkhead / watertight compartment | 直译 | 制度层面写 `watertight bulkhead system`；装货语境写 `hold` |
| 船壳板 / 船板接缝 / 甲板 | hull plank / plank seam / deck | 直译 | 整层船壳写 `hull planking` |
