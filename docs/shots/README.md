# 视觉基准（docs/shots）

只保留 4 张关键帧，用来对照改版后的首屏、剖舱、漏水实验和收束屏。其余屏需要时按下面的命令重新生成。

## 保留的

| 文件 | 对应 | 看什么 |
|---|---|---|
| `b1.jpg` | 第 1 屏 | 整船轮廓、背景水纹、右下角印章 |
| `b4.jpg` | 第 4 屏 | 剖舱：三道隔舱板、舷缘、舱室分层 |
| `b5.jpg` | 第 5 屏 | 漏水实验：水面与船体姿态 |
| `b7.jpg` | 第 7 屏 | 收束：三问、参考来源、重播按钮 |

## 截图参数（不要改，否则没有可比性）

| 项 | 值 |
|---|---|
| 视口 | 1440 × 900，DPR 1 |
| 浏览器 | Edge 157 headless（`--disable-gpu`，SwiftShader 软渲染） |
| 滚动位置 | b1 3% · b4 52% · b5 70% · b7 97% |
| 每屏等待 | 2.6 秒（等相机阻尼收敛） |
| 开场页 | 截图前点掉「开始探索」 |
| 格式 | JPEG 质量 88（有损，用于视觉对照，不做像素级 diff） |

## 重新生成

```bash
npm run build
npx vite preview --port 4176
# 另开一个终端：
msedge --headless=new --disable-gpu --remote-debugging-port=9222
node tools/shots.mjs
```

## 为什么只有 4 张

全量 7 屏 PNG 是 7.3 MB，每次 clone 都要付一次。压成 JPEG 后仍是 1.8 MB，所以只留关键帧；要看其余屏，本地跑一次 `tools/shots.mjs` 就有（它只生成这 4 张，需要别的位置改一下 `KEYFRAMES` 即可）。

## 已知

- **b5 在软渲染下水面偏弱**：水面只有 0.5 单位厚、透明度 0.5，真机 GPU 会好一些但依然弱。这条记在 `docs/mobile-checklist.md` 的遗留问题里。
- 2D 降级版（`?no3d=1`）不单独留基准图，风格差异看 `docs/contrast.md` 的数值即可。
