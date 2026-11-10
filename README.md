# BlueFantasy · 蓝色创想

山东大学翻译学院「蓝色创想·以语为桥」跨文化传播创新实践大赛 **B 赛道（蓝色数字传播）** 交互式网页参赛项目。

> 选题方向、语种与交互形式尚未最终确定，由团队讨论后更新。当前仓库先固化赛事要求、技术架构与交付标准。

## 项目状态

- 阶段：立项 / 架构设计
- 选题：待定，候选见 [`docs/04-design-direction.md`](docs/04-design-direction.md)
- 技术栈：Vite + 原生 JavaScript + CSS/SVG，3D 按需接入 Three.js
- 目标提交：2026-11-19 24:00 前

## 文档

| 文档 | 内容 |
|---|---|
| [`docs/01-competition-brief.md`](docs/01-competition-brief.md) | 赛事规则提炼、B 赛道要求、评分权重 |
| [`docs/02-delivery-checklist.md`](docs/02-delivery-checklist.md) | 提交材料清单、命名规范、AI 说明要求 |
| [`docs/03-architecture.md`](docs/03-architecture.md) | 整体架构、技术选型、目录结构与部署方案 |
| [`docs/04-design-direction.md`](docs/04-design-direction.md) | 选题候选、叙事结构、视觉方向（待讨论） |
| [`docs/05-roadmap.md`](docs/05-roadmap.md) | 11 月 10 日至 19 日的排期与分工 |

## 目录结构（规划）

```
BlueFantasy/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ models/          # 优化后的 glb / gltf / bin
│  ├─ textures/        # webp / ktx2
│  ├─ audio/           # 压缩后的音频
│  └─ fonts/           # woff2 子集
├─ src/
│  ├─ main.js
│  ├─ story/           # 叙事引擎与 beat 控制
│  ├─ i18n/            # 多语种文案与切换
│  ├─ scene/           # DOM/SVG 与 Three.js 场景
│  ├─ ui/              # 导航、字幕、控件
│  └─ styles/
├─ content/
│  ├─ story.zh.json
│  ├─ story.en.json
│  └─ story.ru.json
├─ docs/
└─ submission/         # 本地交付物，不提交
```

## 本地开发（规划）

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 部署（规划）

- 首选：GitHub Pages（仓库需为 Public，或使用 GitHub Pro）
- 备选：Cloudflare Pages / Netlify
- 评审期必须保持测试链接可访问

## 许可

仅用于本次比赛，第三方素材与字体需在 `docs/02-delivery-checklist.md` 中登记来源与授权。
