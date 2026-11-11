# 视觉基准（docs/shots）

每个 beat 一张 1440×900 的定版截图，用来对照后续改动。改样式或船体之后，重新生成一遍和图比，动了哪里一眼能看出来。

## 目录

```
docs/shots/
├─ b1.png … b7.png    3D 版，7 个 beat
├─ 2d/b1.png … 2d/b7.png   降级版（?no3d=1）
└─ overview.png       7 张拼图，快速扫一眼
```

## 截图参数（不要改，否则没有可比性）

| 项 | 值 |
|---|---|
| 视口 | 1440 × 900，DPR 1 |
| 浏览器 | Edge 157 headless（`--disable-gpu`，SwiftShader 软渲染） |
| 滚动位置 | b1 3% · b2 21% · b3 38% · b4 52% · b5 70% · b6 86% · b7 97% |
| 每屏等待 | 2.6 秒（等相机阻尼收敛） |
| 开场页 | 截图前点掉「开始探索」 |
| 格式 | PNG |

## 重新生成

需要先起预览服务和调试端口：

```bash
npm run build
npx vite preview --port 4176
# 另开一个终端：
msedge --headless=new --disable-gpu --remote-debugging-port=9222
node tools/shots.mjs
```

生成完会直接覆盖 `docs/shots/` 下的同名文件。

## 怎么用

改完样式后：

```bash
git diff --stat docs/shots        # 哪些屏被影响了
```

或者直接看 `overview.png`，7 屏一起扫，哪里错位很明显。

## 已知需要留意的

- **b5（漏水实验）在软渲染下水面几乎看不见**：这是当前水面材质的问题（0.5 单位厚、透明度 0.5，被暖光吃掉），真机 GPU 上会好一些，但仍然偏弱。这条记在移动端/视觉问题清单里。
- 2D 那套是纸面主题（浅色），和 3D 的深色是两套视觉，不要混在一起比。
