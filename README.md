# Joinery · 《榫合》

山东大学「蓝色创想·以语为桥」跨文化传播创新实践大赛 **B 赛道（蓝色数字传播）** 交互式网页参赛作品。

> 拆开一艘中国古船：榫头与卯眼、铁钉与捻缝、水密隔舱，以及「榫卯」这个词如何穿过语言。
> Take a Chinese ship apart, and see what actually holds it together.

---

## 在线访问

| 用途 | 地址 |
|---|---|
| 主站（GitHub Pages） | https://wh20080518.github.io/Joinery/ |
| 备用镜像（Cloudflare Pages） | https://bluefantasy.pages.dev |
| 源代码仓库 | https://github.com/WH20080518/Joinery |

评审期内两个链接都需要保持可访问。

## 作品是什么

一个中英双语的滚动叙事网页，七幕讲完一艘古船怎么拼起来。针对「古船不用一根钉」这句流行说法拆解：榫卯负责定位，铁钉或木钉负责加固，桐油灰拌麻丝把缝捻死——三种连接叠加使用，不是三选一。

史实依据：泉州湾后渚港宋代海船（1974 年发掘，残长 24.2 米，12 道隔舱板分隔成 13 个舱）；「中国水密隔舱福船制造技艺」2010 年列入 UNESCO 急需保护名录。逐条出处见 [`docs/10-fact-check.md`](docs/10-fact-check.md)。

七幕结构：① 古船剪影与那句俗话 → ② 榫头 / 卯眼爆炸图（可点击） → ③ 船板接缝：榫卯 → 铁钉 → 捻缝三步补缝 → ④ 剖切船体，十二道隔舱 → ⑤ 漏水对比实验（有 / 无隔舱） → ⑥ 「一个词怎么过海」术语迁移视图 → ⑦ 三问收束。

## 交互方式

- **滚动**推进镜头与分镜，不要求用户学操作
- **点击零件**查看中英名称与一句解释（键盘：Tab 遍历、Enter 选中、Escape 退出）
- **补缝三步**：顺序错会渗水提示，正确顺序闭合缝隙
- **漏水实验**：切换「有水密隔舱 / 无隔舱」，同一破口对比船的姿态
- **语言切换**：中英互切，镜头、滚动位置与交互状态都不重置

## 技术栈与降级

- Vite 6 + 原生 JavaScript + CSS/SVG；Three.js 0.170 负责船体（动态 `import()`，独立 chunk）
- 船体模型 23 个节点 / 38,678 三角面 / 2.32 MB，预算 60,000 面 / 5 MB
- **降级**：浏览器没有 WebGL2、three 加载失败，或加 `?no3d` 时，整站切到纸面主题，每屏显示对应双语 SVG 图示，文案与交互说明不丢
- 无障碍：键盘可达、`aria-live` 播报、`prefers-reduced-motion` 降低动效

### URL 参数

| 参数 | 作用 |
|---|---|
| `?beat=N` | 直接定位到第 N 屏（1–7） |
| `?lang=zh` / `?lang=en` | 指定语言（否则读 localStorage，再默认中文） |
| `?no3d`（或 `=1`） | 关闭 3D，使用 SVG 降级；`?no3d=0` 视为正常模式 |
| `?water=static` / `?water=off` | 水面排查开关：冻结动画与反射 / 不画水 |

## 本地运行

需要 Node 22+。

```bash
npm ci              # 首次；node_modules 与平台绑定，换系统（如 WSL ↔ Windows）后要重装
npm run dev         # 开发服务器
npm run build       # 产物在 dist/
npm run preview     # 预览构建产物
npm run check:parts # 校验 models/parts.json 与节点命名
npm run check:model # 校验 ship.glb 预算（体积、三角面、材质、节点、纹理）
```

`dev` / `build` 会自动把 `models/parts.json` 同步到 `public/models/`。

## 交付清单

对照 [`docs/02-delivery-checklist.md`](docs/02-delivery-checklist.md)：

| 项 | 状态 |
|---|---|
| 可访问测试链接（主站 + 镜像） | ✅ |
| 源代码 | ✅ 本仓库 |
| 作品说明 200–400 字（Word） | ✅ 底稿在 [`docs/20`](docs/20-submission-materials.md)，docx 按 `.gitignore` 不入库 |
| AI 创作说明 300–500 字（Word） | ✅ 同上 |
| 演示录屏 1–3 分钟 1080P | ⬜ 待录制，脚本与字幕见 [`docs/12`](docs/12-demo-script.md) |
| 报名表 | ⬜ 官方通知未列出该项，待与主办方确认 |

## 目录结构

```
Joinery/
├─ index.html
├─ vite.config.js
├─ models/            # parts.json（零件装配表）与 schema，构建时同步到 public/models/
├─ public/
│  ├─ models/         # ship.glb、parts.json
│  ├─ draco/          # 本地 Draco 解码器（不走 CDN）
│  └─ svg/            # 2D 降级示意图（e1–e5）
├─ src/
│  ├─ main.js         # 入口：滚动引擎、语言/URL 状态、3D 与降级路由
│  ├─ content/        # 文案、术语、测验、开场、印章（唯一文案来源）
│  ├─ stage/          # Three.js 场景：scene / camera / parts / loader / water / fluid
│  ├─ interactions/   # 补缝（caulk）、漏水实验（flood）
│  ├─ ui/             # 文案面板 overlay、双缓冲降级 fallback、三问测验 quiz
│  └─ assets/         # 印章字体（SIL OFL 1.1）、海纹背景
├─ tools/             # check-model / check-parts / shots
├─ tests/             # 交互用例清单与 CDP 跑批脚本
└─ docs/              # 设计、事实核查、演示字幕、提交材料汇编、验收与素材登记
```

## 文档

| 文档 | 内容 |
|---|---|
| [`01`](docs/01-competition-brief.md) / [`02`](docs/02-delivery-checklist.md) | 赛事规则 / 交付清单与命名规范 |
| [`03`](docs/03-architecture.md) / [`04`](docs/04-design-direction.md) / [`05`](docs/05-roadmap.md) | 架构 / 设计方向 / 排期 |
| [`06`](docs/06-cloudflare-pages.md) | Cloudflare Pages 备用镜像 |
| [`07`](docs/07-modeling-brief.md) | 船体与节点建模 brief |
| [`08`](docs/08-story-map.md) / [`09`](docs/09-glossary.md) / [`10`](docs/10-fact-check.md) | 叙事 / 术语表 / 事实核查 |
| [`11`](docs/11-frontend-brief.md) / [`14`](docs/14-web-sprint.md) / [`15`](docs/15-owner-plan-D.md) | 前端任务书 / 分工 / 内容方向计划 |
| [`12`](docs/12-demo-script.md) | 演示录屏脚本与双语 SRT 字幕 |
| [`16`](docs/16-term-beat-spec.md) / [`17`](docs/17-node-terms.md) / [`18`](docs/18-english-review.md) / [`19`](docs/19-fallback-regression.md) | 术语迁移视图 / 节点术语 / 英文自审 / 降级回归 |
| [`20`](docs/20-submission-materials.md) | 作品说明、AI 创作说明与术语表附录（Word 交付底稿） |
| [`assets-credits.md`](docs/assets-credits.md) | 素材与授权登记 |
| [`contrast.md`](docs/contrast.md) / [`mobile-checklist.md`](docs/mobile-checklist.md) / [`reduced-motion.md`](docs/reduced-motion.md) | 对比度 / 移动端 / 减少动效 |
| [`REPORT.md`](REPORT.md) | 前端实现报告与各轮评审修复记录 |

## 部署

- 推 `main`：GitHub Actions 构建并发布到 GitHub Pages；Cloudflare 由 Git 集成构建
- `vite.config.js` 按环境变量 `CF_PAGES` 切换 `base`（Cloudflare 为 `/`，GitHub Pages 为 `/Joinery/`）

## 许可

仅用于本次比赛。第三方素材（目前仅印章字体，SIL OFL 1.1）登记在 [`docs/assets-credits.md`](docs/assets-credits.md)。
