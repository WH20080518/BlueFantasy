# BlueFantasy · 蓝色创想

山东大学翻译学院「蓝色创想·以语为桥」跨文化传播创新实践大赛 **B 赛道（蓝色数字传播）** 交互式网页参赛项目。

> 选题已定：**《榫合》**——拆开一艘中国古船，讲榫、钉、捻缝与水密隔舱，纠正“古船不用一根钉”的误解。

## 项目状态

- 阶段：叙事与建模
- 作品名：榫合 / *Joinery*
- 选题：已定，方案见 [`docs/04-design-direction.md`](docs/04-design-direction.md)
- 技术栈：Vite + 原生 JavaScript + CSS/SVG，Three.js 局部承担船体
- 目标提交：2026-11-19 24:00 前

## 文档

| 文档 | 内容 |
|---|---|
| [`docs/01-competition-brief.md`](docs/01-competition-brief.md) | 赛事规则提炼、B 赛道要求、评分权重 |
| [`docs/02-delivery-checklist.md`](docs/02-delivery-checklist.md) | 提交材料清单、命名规范、AI 说明要求 |
| [`docs/03-architecture.md`](docs/03-architecture.md) | 整体架构、技术选型、目录结构与部署方案 |
| [`docs/04-design-direction.md`](docs/04-design-direction.md) | 选题候选、叙事结构、视觉方向（待讨论） |
| [`docs/05-roadmap.md`](docs/05-roadmap.md) | 11 月 10 日至 19 日的排期与分工 |
| [`docs/06-cloudflare-pages.md`](docs/06-cloudflare-pages.md) | Cloudflare Pages 备用镜像接入与验证 |
| [`docs/07-modeling-brief.md`](docs/07-modeling-brief.md) | 《榫合》船体与榫卯节点建模 brief |

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

## 部署

- 主站：https://wh20080518.github.io/BlueFantasy/ （GitHub Pages）
- 备用：https://bluefantasy.pages.dev （Cloudflare Pages）
- 推 `main` 自动部署；Cloudflare 由 Git 集成构建
- 提交材料同时写主站与备用链接
- 评审期必须保持链接可访问

## 许可

仅用于本次比赛，第三方素材与字体需在 `docs/02-delivery-checklist.md` 中登记来源与授权。
