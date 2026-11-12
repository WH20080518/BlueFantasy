# public/models

放置导出的网页用模型：

- `ship.glb` — 主模型（可选）。没有这个文件时，页面使用 `src/stage/placeholder.js` 的占位几何。
- `parts.json` — 由 `npm run parts:sync` 从仓库根 `models/parts.json` 生成，不要手改。

要求：

- GLB（二进制 glTF），允许 Draco 压缩，解码器在 `public/draco/`。
- 节点名必须与 `models/parts.json` 的白名单一致，否则 `npm run check:parts` 会失败，页面也不会绑定该零件。
- 预算：三角形 ≤ 60,000，体积 ≤ 5 MB，可用 `npm run check:model` 检查。

替换流程见 `docs/14-web-sprint.md` 的「换模型 5 步」。
