# 演示脚本（60–90 秒）

> 版本：v2 · 2026-11-18
> 用途：录屏演示 / 现场答辩开场。**先写脚本，再删 beat。**
> 原则：一个动作说一句话；不说话的时候就让画面动。术语与页面 `src/content/beats.js`、`docs/09-glossary.md` 严格一致。

## 0. 两个版本

| 版本 | 时长 | 用途 |
|---|---|---|
| A · 完整版 | 90 s | 提交视频、答辩开场 |
| B · 极简版 | 45 s | 社交媒体、群里转发 |

两版共用素材，B 版删掉 beat 4 和 beat 6 的口播。

## 1. A 版分镜（90 秒）

> 英文朗读节奏实测预算：总词数 142 词，按 2.2 词/秒约 65 秒净语速，留足每屏转场与交互停顿，90 秒内从容念完。

| 时间 | 画面 | 操作 | 旁白（中） | 旁白（英） |
|---|---|---|---|---|
| 0–8 s | 开场页 → 点「开始探索」→ 整船剪影淡入，缓慢自转 | 点击「开始探索」 | 「都说中国古船不用一根钉。」 | “They say Chinese ships used no nails at all.” |
| 8–16 s | 标题「古船不用一根钉？」停留 | 轻微下滚 | 「这句话很浪漫。但它只说对了一半。」 | “It is a romantic idea — and only half true.” |
| 16–30 s | 镜头推近 b2，榫头与卯眼分离 | 点击榫头，浮现术语 | 「榫头插进卯眼，木头靠形状互相咬住——这是真的。」 | “A tenon fits into a mortise, and wood holds wood by shape alone. That part is real.” |
| 30–44 s | b3 接缝剖面分层出现 | 依次点「榫卯 → 铁钉 → 捻缝」 | 「但船要下水。所以还要钉，还要用桐油灰拌麻丝把缝捻死。」 | “But a ship goes to sea. So builders drive iron or wooden nails, then caulk the seam shut with tung-oil putty and hemp.” |
| 44–52 s | b4 船体剖切，十二道隔舱板亮起 | 点击第 2 道隔舱板 | 「船身被十二道隔舱板分成互不相通的舱。」 | “Twelve transverse bulkheads divide the hull into watertight compartments.” |
| 52–72 s | b5 漏水实验：单舱进水后稳住，再切「无隔舱」漫水下沉 | 切「有水密隔舱」→「无隔舱」 | 「一个舱破了，船还浮着。抽掉隔舱板，同样的破口，水就一路漫过去。」 | “One compartment floods, and the ship stays afloat. Take the bulkheads out, and the same breach runs the length of the hull.” |
| 72–82 s | b6 术语迁移视图（原词 → 直译 → 解释译 → 丢掉了什么）+ `中 / EN` 切换 | 切换词条并点 `EN` | 「英文里没有『榫卯』这个词。最接近的说法是 mortise-and-tenon joint。」 | “English has no single word for it. The closest is mortise-and-tenon joint — translation is joinery too.” |
| 82–90 s | b7 整船缓缓远去，收束字幕与三问 | 静止停格 | 「木头咬住木头，钉子咬住木头，语言咬住语言。」 | “Wood holds wood. Nails hold wood. Words hold words.” |

**字幕**：中文口播配双语字幕（与下方 §2.5 一致，不做逐字直译）。

## 2. B 版分镜（45 秒）

| 时间 | 画面 | 旁白（中） | 旁白（英） |
|---|---|---|---|
| 0–6 s | 船体剪影 | 「都说中国古船不用一根钉。」 | “They say Chinese ships used no nails.” |
| 6–18 s | 榫卯爆炸 → 接缝剖面 | 「榫卯是真的，钉和捻缝也是真的。」 | “The joinery is real — and so are the nails and caulking.” |
| 18–34 s | 漏水实验切换 | 「一个舱进水，船不沉。这就是水密隔舱。」 | “One compartment floods, and the hull stays afloat. That is the watertight bulkhead system.” |
| 34–45 s | 术语对照 → 收束 | 「翻译也是一次榫合。」 | “Translation is joinery too.” |

## 2.5 中英双语字幕（SRT 时间轴 · A 版 90 秒）

```srt
1
00:00:00,000 --> 00:00:08,000
都说中国古船不用一根钉。
They say Chinese ships used no nails at all.

2
00:00:08,000 --> 00:00:16,000
这句话很浪漫。但它只说对了一半。
It is a romantic idea — and only half true.

3
00:00:16,000 --> 00:00:30,000
榫头插进卯眼，木头靠形状互相咬住——这是真的。
A tenon fits into a mortise, and wood holds wood by shape alone. That part is real.

4
00:00:30,000 --> 00:00:44,000
但船要下水。所以还要钉，还要用桐油灰拌麻丝把缝捻死。
But a ship goes to sea: iron or wooden nails lock it, and tung-oil putty with hemp caulks the seam shut.

5
00:00:44,000 --> 00:00:52,000
船身被十二道隔舱板分成互不相通的舱。
Twelve transverse bulkheads divide the hull into watertight compartments.

6
00:00:52,000 --> 00:01:12,000
一个舱破了，船还浮着。抽掉隔舱板，同样的破口，水就一路漫过去。
One compartment floods, and the ship stays afloat. Remove the bulkheads, and the breach runs the length of the hull.

7
00:01:12,000 --> 00:01:22,000
英文里没有「榫卯」这个词。最接近的说法是 mortise-and-tenon joint。
English has no single word for 榫卯. The closest is mortise-and-tenon joint.

8
00:01:22,000 --> 00:01:30,000
木头咬住木头，钉子咬住木头，语言咬住语言。
Wood holds wood. Nails hold wood. Words hold words.
```

## 3. 录屏执行清单

- [ ] 分辨率 1920×1080，浏览器缩放 100%，窗口无书签栏
- [ ] 关掉所有通知；关闭鼠标指针高亮（除非讲解需要）
- [ ] 用 `?no3d=0` 正常模式录；另录一条 `?no3d=1` 作为备份片段
- [ ] 滚动速度：每屏 1.5–2 秒，漏水实验停留 3 秒
- [ ] 录音单独录，不要用系统内录 + 现场讲话混音
- [ ] 导出 H.264，码率 ≥ 8 Mbps；同时导出一版 1080×1920 竖版用于手机

## 4. 现场答辩备用动作

如果现场网络或机器撑不住 WebGL：

1. 直接打开 `?no3d=1`，画面是 SVG，文案完整。
2. 口播不变，漏水实验改用手动切图（两张 SVG）。
3. 提前把 90 秒视频存在本地，随时可放。

## 5. 已定结论

- [x] **背景音**：不加常驻环境音与配乐（避免与外语旁白干扰，也避免额外音频授权风险；已同步至 `03-architecture.md` ADR-005）。
- [x] **旁白语种**：提供中文口播 + 双语字幕，另备独立英文口播稿（见 §1）供外籍评审或英文演示使用。
- [x] **结尾展示**：片尾静止画面保留主站（`wh20080518.github.io/Joinery/`）、备用镜像（`bluefantasy.pages.dev`）与仓库链接/二维码。
