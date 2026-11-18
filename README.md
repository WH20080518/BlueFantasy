# BlueFantasy · 蓝色创想

山东大学翻译学院「蓝色创想·以语为桥」跨文化传播创新实践大赛 **B 赛道（蓝色数字传播）** 交互式网页参赛项目。

> 作品：**《榫合》/ *Joinery***——拆开一艘中国古船，讲榫、钉、捻缝与水密隔舱，纠正“古船不用一根钉”的误解，并用 b6 屏展示“榫卯”一词如何译成英文。

## 项目状态

- 阶段：代码与文档收尾完成，待录屏与最终提交打包
- 技术栈：Vite + 原生 JavaScript + CSS/SVG，Three.js 承担船体（动态 `import()`，独立 chunk）
- 语种：中文 / 英文（第三语种决定不启用，见 [`docs/09-glossary.md`](docs/09-glossary.md) §4）
- 降级：无 WebGL2、3D 加载失败或 `?no3d` 时，每屏显示对应双语 SVG 图示，文案完整
- 提交截止：2026-11-19 24:00

## 在线地址

- 主站：https://wh20080518.github.io/BlueFantasy/ （GitHub Pages）
- 备用：https://bluefantasy.pages.dev （Cloudflare Pages）

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

`dev` / `build` 会先自动把 `models/parts.json` 同步到 `public/models/`。

### URL 参数

| 参数 | 作用 |
|---|---|
| `?beat=N` | 直接定位到第 N 屏（1–7） |
| `?lang=zh` / `?lang=en` | 指定语言（否则读 localStorage，再默认中文） |
| `?no3d`（或 `=1`） | 关闭 3D，使用 SVG 降级；`?no3d=0` 视为正常模式 |
| `?water=static` / `?water=off` | 水面排查开关：冻结动画与反射 / 不画水 |

## 目录结构

```
BlueFantasy/
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
- `vite.config.js` 按环境变量 `CF_PAGES` 切换 `base`（Cloudflare 为 `/`，GitHub Pages 为 `/BlueFantasy/`）
- 评审期内必须保持两个链接可访问

## 许可

仅用于本次比赛。第三方素材（目前仅印章字体，SIL OFL 1.1）登记在 [`docs/assets-credits.md`](docs/assets-credits.md)。
