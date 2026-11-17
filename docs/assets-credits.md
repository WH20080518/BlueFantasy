# 素材与授权登记

`docs/02-delivery-checklist.md` §7 要求提交素材授权说明。本文件登记仓库内随作品分发的全部素材，以及不随作品分发的参考资料。

## 1. 随作品分发的素材

| 素材 | 位置 | 来源 | 授权 |
|---|---|---|---|
| 船体模型 `ship.glb` | `public/models/` | 队内用 Blender 建模，按 `docs/07-modeling-brief.md` 的节点名与面数预算制作 | 自制，随作品提交 |
| 零件装配表 `parts.json` | `models/` | 队内编写 | 自制 |
| 占位几何 | `src/stage/placeholder.js` | 代码生成，仅在 GLB 未加载时使用 | 自制 |
| 背景水纹 `sea-lines.svg` | `src/assets/bg/` | 队内绘制 | 自制 |
| 降级示意图 `svg/*.svg` | `public/svg/` | 队内绘制 | 自制 |
| 印章字体 `seal.woff2`（10 字子集） | `src/assets/fonts/` | [JFZSKSealScript](https://github.com/SuperMate-Ai/JFZSKSealScript)，作者 Jingfeng Liu | **SIL Open Font License 1.1**，版权声明与全文见同目录 `README.md`、`OFL.txt` |

字体是唯一第三方资产。OFL 要求再分发时保留版权声明与许可证全文，两项都随字体目录提交；子集属于修改版，仍受同一许可证约束。

## 2. 不随作品分发的参考资料

以下材料只用于事实核对，**没有**进入页面、仓库或提交包：

- 泉州湾后渚港宋船的机构资料与报道（S1、S2、S6），条目见 `docs/10-fact-check.md` §2
- 马可·波罗文本的二手考据（S3），及其转引的 Moule & Pelliot 1938 校本（S5）
- 泉州海外交通史博物馆、福建省政府网的展陈数据

博物馆照片与展陈图版仅作建模参照，没有裁切、抠图或用进页面。

## 3. AI 参与的素材

- 3D 模型、SVG、水纹为队内制作，未用图像生成模型产出
- 英文文案与术语译法由 AI 出初稿、队员定稿，过程见 `docs/18-english-review.md`
- 前端代码由 Claude Code 按任务书实现、Codex 评审，详见比赛提交的《AI 创作说明》

## 4. 待补

- 若海报、片头、演示录屏里另用了音乐或图库素材，**不在本表覆盖范围**，需要单独登记授权后再提交
