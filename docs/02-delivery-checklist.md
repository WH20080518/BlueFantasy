# 交付清单与命名规范

> 提交前逐项勾选。材料不全会进入补交流程，命名不规范会被要求补正。

## 0. 当前状态（2026-11-19）

- 仓库：[`WH20080518/Joinery`](https://github.com/WH20080518/Joinery)（原名 BlueFantasy，11-19 改名）
- 主站：<https://wh20080518.github.io/Joinery/> ｜ 镜像：<https://bluefantasy.pages.dev>
- 两份 Word 底稿见 [`20-submission-materials.md`](20-submission-materials.md)；`.docx` 按 `.gitignore` 不入库，需本地导出
- 代码侧回归（2D 动效、无 WebGL2 降级、开场/进站、控制台）已全绿；模型预算 38,678 面 / 2.32 MB 通过

## 1. 提交时间

- [ ] 2026-11-19 24:00 前发送
- [ ] 作品、作品说明、AI 创作说明、演示录屏一并提交
- [ ] 报名表：**官方 B 赛道提交要求里没有这一项**（见 `01-competition-brief.md` §3）。若主办方另有通知，以通知为准并在此补记出处

## 2. B 赛道交互类材料

- [ ] 完整演示录屏（建议 1—3 分钟，1080P，MP4/MOV，H.264）——脚本见 [`12-demo-script.md`](12-demo-script.md)
- [x] 可访问的测试链接（评审期内保持可用）
- [x] 源代码（完整仓库或压缩包）
- [x] 作品说明 200—400 字（Word）——底稿已定稿，待填姓名/学院/电话
- [x] AI 创作说明 300—500 字（Word，使用 AI 时必交）——同上

## 3. 文件命名

统一格式：`赛道＋队长姓名＋作品名称`

示例：

- 作品：`B赛道＋张三＋潮生`
- 作品说明：`B赛道＋张三＋作品说明`
- AI 创作说明：`B赛道＋张三＋AI创作说明`
- 演示录屏：`B赛道＋张三＋演示录屏`

## 4. 压缩包与邮件

- 压缩包命名：`蓝色创想+赛道+团队名称`
- 邮件主题：与压缩包一致
- 一封邮件只对应一个作品
- 同一团队多个作品：分别打包、分别发送
- 邮件正文建议附：团队名称、队长联系方式、作品链接

## 5. AI 创作说明必须覆盖的四点

1. 所用 AI 工具的名称与类型
2. AI 参与的具体环节（素材生成、翻译初稿、画面渲染、配音合成等）
3. 团队人工完成与修改的内容
4. 团队对 AI 生成内容的核验方式

> 说明与实际作品明显不符，按材料不全处理，不进入评审。

## 6. 多语种检查

- [x] 至少中英双语（第三语种决定暂不启用，见 `docs/09-glossary.md` §4）
- [ ] 译文经人工审校，不是机翻直出（已完成双模型交叉审校与团队人工定稿，见 `18-english-review.md`；外部母语者复核待补）
- [x] 文化专名有统一译法（如地名、非遗名称、民俗术语）
- [x] 外语版不是中文版的逐字直译，语序与表达符合目标语言习惯
- [x] 页面语言切换不丢失当前叙事位置

## 7. 素材与版权

- [x] 图片、音频、视频、字体、3D 模型均有来源记录（`docs/assets-credits.md`）
- [x] 使用第三方素材时确认授权范围（印章字体 SIL OFL 1.1，同目录保留 `OFL.txt` 与 `README.md`）
- [x] AI 生成素材在 AI 说明中披露（已明确未使用图像/3D 生成模型，文本与代码辅助见 `docs/20-submission-materials.md`）
- [x] 仓库中保留 `docs/assets-credits.md`（已创建）

## 8. 技术自检

- [x] 公网链接可打开，无登录墙（`docs/06-cloudflare-pages.md` 已验双链返回 200；合入本次修复后建议复核）
- [x] 手机端（375px）无横向滚动（`docs/mobile-checklist.md`、`docs/19-fallback-regression.md`）
- [x] 桌面端（1440px）布局正常
- [x] 首屏加载可接受，3D 资源不阻塞文字（three 动态 `import()` 独立 chunk）
- [x] GLB ≤ 5 MB，总三角面 ≤ 60,000（`npm run check:model` 实测 2.32 MB / 38,678 面；28 图元，draw call 阈值按网格数推导见 `REPORT.md`）
- [x] 3D 节点名与 `models/parts.json` 一致，无缺失节点（`npm run check:parts` 通过：23 个零件）
- [x] 无 WebGL / 加载失败时显示 SVG 等距图，文案完整（`docs/19-fallback-regression.md`）
- [x] 漏水实验、补缝、爆炸动画可重复播放（`tests/interactions.md`）
- [x] 键盘可操作，焦点可见
- [x] `prefers-reduced-motion` 生效（`docs/reduced-motion.md` + #45）
- [ ] 控制台无报错（#44/#45 已在本地 preview 验过零报错；合入 PR #43 后请在真实浏览器再复核）
- [ ] 录屏覆盖完整交互路径，不剪切关键动作（需人工录屏后勾选）

## 9. 仓库自检

- [x] `.gitignore` 生效，`node_modules/`、`dist/`、`ship.blend` 未提交
- [x] 未提交 `.env`、密钥、token
- [x] 大模型文件使用 Git LFS 或压到 10 MB 内（`ship.glb` 2.32 MB）
- [x] README 能让他人独立跑起来
- [x] 提交记录清晰，无巨型二进制历史
