# 印章字体（seal.woff2）

页面右下角钤印用的字体，不参与正文排版。

| 项 | 内容 |
|---|---|
| 文件 | `seal.woff2`（9.2 KB） |
| 来源 | [JFZSKSealScript](https://github.com/SuperMate-Ai/JFZSKSealScript)，作者 Jingfeng Liu |
| 授权 | **SIL Open Font License 1.1**，全文见同目录 [`OFL.txt`](./OFL.txt) |
| 版权 | Copyright (c) 2025, Jingfeng Liu（保留字体名 JFZSKSealScript） |
| 处理 | 用 `fontTools.subset` 裁成 10 字子集（榫合卯固木隔水密渡海），删除 DSIG/GSUB/GPOS/BASE 表与 hinting |

## OFL 要求

- 再分发时必须保留 `OFL.txt` 与上述版权声明（本文件即为此用途）
- 不得单独售卖字体
- 子集属于「修改版」，仍受同一许可证约束

## 重新生成子集

```bash
python -m fontTools.subset <原始字体>.otf \
  --text=榫合卯固木隔水密渡海 \
  --flavor=woff2 \
  --output-file=seal.woff2 \
  --layout-features= --no-hinting \
  --drop-tables+=DSIG,GSUB,GPOS,BASE
```
