# 整体架构

> 状态：提案稿。选题方向确定后再细化，但分层与边界先固定，避免后期返工。

## 1. 目标与非目标

**目标**

- 一个可在公网访问、手机可用的单页交互叙事作品
- 中英（可扩展第三语种）内容与交互同步切换
- 叙事、视觉、3D 三层解耦，任何一层可替换
- 离线构建产物可直接部署到静态托管
- 评审期稳定，不依赖后端服务

**非目标**

- 不做用户系统、评论、数据库
- 不做需要登录才能看的内容
- 不把 3D 作为唯一信息载体；无 WebGL 时仍能读完故事

## 2. 技术选型

| 层 | 方案 | 理由 |
|---|---|---|
| 构建 | Vite | 启动快、静态产物简单、生态成熟 |
| 语言 | 原生 JavaScript（ES Module） | 页面规模不需要框架；减少运行时与包体 |
| 样式 | 原生 CSS + CSS 变量 | 设计令牌集中管理，便于统一视觉 |
| 叙事 | 自研滚动控制器 + IntersectionObserver | 可控、可降级，不引入重型滚动库 |
| 2D 视觉 | DOM + SVG + CSS 动画 | 清晰、可访问、体积小 |
| 3D（可选） | Three.js | 按需动态 import，独立 chunk |
| 多语种 | JSON 文案包 + 运行时切换 | 文案与代码分离，便于翻译审校 |
| 部署 | GitHub Pages / Cloudflare Pages | 静态、免费、链接稳定 |

**不选 React / R3F 的原因**：单页叙事不需要组件树与状态管理；原生方案包体更小、调试路径更短，评委本地打开也更稳。若后续 3D 交互复杂到需要 R3F，再单独评估，不在第一版引入。

## 3. 分层架构

```
┌─────────────────────────────────────────────┐
│  Presentation                               │
│  index.html + CSS + UI 组件（导航/字幕/控件） │
├─────────────────────────────────────────────┤
│  Story Engine                               │
│  beat 定义 / 滚动进度 / 场景切换 / 降级策略   │
├─────────────────────────────────────────────┤
│  Scene Layer                                │
│  A. DOM/SVG 场景   B. Three.js 场景（可选）   │
├─────────────────────────────────────────────┤
│  Content & i18n                             │
│  story.<lang>.json / 术语表 / 字幕            │
├─────────────────────────────────────────────┤
│  Platform                                   │
│  静态资源 / 构建 / 部署 / 性能与可访问性      │
└─────────────────────────────────────────────┘
```

**依赖方向**：Presentation → Story Engine → Scene Layer → Content。禁止反向依赖，禁止场景层直接读取 DOM 文案。

## 4. 叙事引擎

### 4.1 数据结构

每个 beat 是一个对象，文案与场景分离：

```json
{
  "id": "harbor-dawn",
  "index": 1,
  "scrollWeight": 1.2,
  "scene": "harbor",
  "motion": "dawn-rise",
  "eyebrow": { "zh": "起锚", "en": "Weigh Anchor" },
  "headline": { "zh": "……", "en": "……" },
  "body": { "zh": "……", "en": "……" },
  "evidence": ["source-id"],
  "media": { "image": "public/textures/harbor.webp" },
  "a11y": { "label": "……" }
}
```

### 4.2 控制器职责

- 维护当前 beat 索引与滚动进度
- 进入/离开 beat 时触发场景过渡
- 语言切换时只替换文案，不重置场景与滚动位置
- 处理 `prefers-reduced-motion`
- 处理无 WebGL / 低性能设备时的降级
- 暴露 `goTo(beatId)` 供导航与演示使用

### 4.3 滚动策略

- 保留浏览器原生滚动，不劫持滚轮
- 用 `IntersectionObserver` 检测 beat 进入
- 用 `requestAnimationFrame` 读取进度，避免 scroll 事件里做重活
- 每个 beat 的 `scrollWeight` 控制停留长度，总长度控制在 6—9 屏
- 支持反向滚动、快速滑动，不在 seam 处跳变

## 5. 场景层

### 5.1 DOM/SVG 场景（默认）

- 首屏与文字为主的 beat 一律用 DOM/SVG
- 动画只改 `transform`、`opacity`、`filter`
- 复杂插画用内联 SVG，便于换色与响应式
- 所有装饰性图形 `aria-hidden="true"`

### 5.2 Three.js 场景（可选）

接入条件：

- 3D 承担叙事功能，不是装饰
- 优化后模型 ≤ 10 MB，纹理 ≤ 4 MB
- 首屏不加载；进入对应 beat 前预加载
- 独立 chunk，`import()` 动态加载
- 加载失败或无 WebGL 时回退到静态图/SVG

性能预算：

- 桌面 60fps，移动端 ≥ 30fps
- draw call ≤ 100
- 像素比上限 `Math.min(devicePixelRatio, 2)`
- 页面隐藏时暂停渲染循环

## 6. 多语种架构

```
content/
├─ story.zh.json      # 中文，源语言
├─ story.en.json      # 英文
├─ story.ru.json      # 俄语（可选）
├─ glossary.json      # 术语表：专名统一译法
└─ sources.json       # 事实与素材来源
```

规则：

- 中文为源文本，其他语种独立成文，不做逐字直译
- 术语表约束地名、非遗名称、民俗术语
- 语言切换写入 `localStorage`，刷新后保持
- `<html lang>` 随语言切换更新
- 外语版字幕/正文避免中文标点

## 7. 目录结构

```
BlueFantasy/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ models/
│  ├─ textures/
│  ├─ audio/
│  └─ fonts/
├─ src/
│  ├─ main.js
│  ├─ story/
│  │  ├─ engine.js
│  │  ├─ beats.js
│  │  └─ scroll.js
│  ├─ scene/
│  │  ├─ dom-scenes.js
│  │  └─ three-scene.js
│  ├─ i18n/
│  │  ├─ index.js
│  │  └─ glossary.js
│  ├─ ui/
│  │  ├─ nav.js
│  │  ├─ captions.js
│  │  └─ controls.js
│  └─ styles/
│     ├─ tokens.css
│     ├─ base.css
│     └─ scenes.css
├─ content/
├─ docs/
└─ submission/          # 不提交
```

## 8. 部署

主站 GitHub Pages，备用 Cloudflare Pages。

### 8.1 GitHub Pages（主）

- 仓库必须为 **Public**；免费 Pages 不支持私有库（私有库需 GitHub Pro）
- Settings → Pages → Source 选 **GitHub Actions**
- 推送到 `main` 触发 `.github/workflows/deploy.yml`：安装依赖 → 构建 → 发布 `dist`
- 项目页地址：`https://wh20080518.github.io/BlueFantasy/`
- Vite 必须设置 `base: '/BlueFantasy/'`，否则 JS/CSS 404
- 绑定自定义域名到根路径后，`base` 改回 `'/'`

### 8.2 Cloudflare Pages（备）

- 同一仓库接入，构建命令 `npm run build`，输出目录 `dist`
- 免费，支持私有仓库
- 地址形如 `https://bluefantasy.pages.dev`
- 提交材料同时写主站与备用链接

### 8.3 验收

- 校园网、手机 4G/5G、家庭宽带各测一次
- 主站打不开时备用链接可用
- 评审期链接保持可访问
- 大陆访问存在波动风险，不以“本地能开”代替真实网络测试

## 9. 性能与可访问性预算

- 首屏 HTML+CSS+关键字体 ≤ 300 KB（压缩后）
- 首屏图片 ≤ 500 KB，优先 WebP/AVIF
- 3D chunk 单独加载，不阻塞首屏
- 所有图片有 `alt`，装饰图 `alt=""`
- 键盘可完成语言切换与 beat 导航
- 焦点样式可见，不用 `outline: none`
- 对比度 ≥ 4.5:1
- `prefers-reduced-motion: reduce` 时关闭位移动画，保留淡入

## 10. 待定决策（ADR）

| 编号 | 决策 | 状态 |
|---|---|---|
| ADR-001 | 选题：岚山号子 / 海草房 / 登州古港 | 待团队讨论 |
| ADR-002 | 是否使用 3D | 待定，倾向“局部使用” |
| ADR-003 | 语种组合：中英 / 中英俄 / 中英法 | 待定 |
| ADR-004 | 部署平台：GitHub Pages / Cloudflare Pages | 待定 |
| ADR-005 | 是否使用音频 | 待定，取决于选题 |

每项决策确定后，在 `docs/adr/` 下补一份简短记录：背景、选项、结论、影响。
