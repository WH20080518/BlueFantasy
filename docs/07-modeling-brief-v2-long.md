# 《榫合》3D 建模任务书 v2

> 给模型负责人直接执行。本文把“建一艘船”拆成 13 个可验收任务，每个任务都有输入、步骤、交付文件、验收标准和参考链接。
>
> 项目仓库：https://github.com/WH20080518/BlueFantasy
> 在线页面：https://wh20080518.github.io/BlueFantasy/
> 备用镜像：https://bluefantasy.pages.dev/
> 旧版 brief（供对照）：https://github.com/WH20080518/BlueFantasy/blob/main/docs/07-modeling-brief.md

---

## 0. 先看这三件事

1. **只做 3 类资产**：剖切船体、一个榫卯节点、一段船壳板接缝。不要建整船高模、内舱、索具、人物。
2. **预算是硬约束**：总三角面 ≤ 60,000，GLB ≤ 5 MB，draw call ≤ 20。
3. **11-15 是死线**：如果当天还交不出可用 GLB，项目切换到 SVG 等距图，建模任务立即降级为“参考图 + 节点图”。

---

## 1. 交付范围

### 1.1 MVP（必须先完成）

| 任务 | 内容 | 最晚 |
|---|---|---|
| T01 | 参考图与比例锁定 | 11-11 |
| T02 | 船体 blockout | 11-12 |
| T03 | 外壳与剖切 | 11-13 |
| T05 | 3 道隔舱板 | 11-13 |
| T07 | 榫卯节点 | 11-14 |
| T09 | Rhino 网格化 | 11-15 |
| T11 | GLB 导出 | 11-15 |

### 1.2 可选（时间够再做）

T04 龙骨/艏艉柱、T06 船壳板段、T08 钉与捻缝、T10 Blender 清理/UV/AO、T12 JSON 与截图、T13 打包。

> 如果只有一个人做 3D，先保证 MVP。T04/T06/T08 可以用简化几何代替。

---

## 2. 资产表

| 编号 | 资产 | 节点名 | 三角面预算 | 文件 |
|---|---|---|---:|---|
| A01 | 船体外壳（剖切） | `ship_hull` | 9,000 | `02_hull_cutaway.3dm` |
| A02 | 甲板 | `ship_deck` | 2,500 | 同上 |
| A03 | 龙骨 | `keel` | 1,500 | `03_structure.3dm` |
| A04 | 艏柱 | `stem` | 800 | 同上 |
| A05 | 艉柱 | `sternpost` | 800 | 同上 |
| A06 | 隔舱板 01 | `bulkhead_01` | 1,200 | `04_bulkheads.3dm` |
| A07 | 隔舱板 02 | `bulkhead_02` | 1,200 | 同上 |
| A08 | 隔舱板 03 | `bulkhead_03` | 1,200 | 同上 |
| A09 | 船壳板段 | `plank_section` | 2,000 | `05_plank_section.3dm` |
| A10 | 榫头 | `joint_tenon` | 2,000 | `06_joint.3dm` |
| A11 | 卯眼构件 | `joint_mortise` | 2,000 | 同上 |
| A12 | 木钉 | `fastener_peg` | 300 | `07_fasteners.3dm` |
| A13 | 铁钉 | `fastener_nail` | 300 | 同上 |
| A14 | 捻缝 | `caulking_seam` | 800 | `08_caulking.3dm` |
| A15 | 水面（前端做） | `water_plane` | 200 | 不需要建模 |

**合计约 27,800 面，留 7,000 面余量。**

---

## 3. 统一规范

### 3.1 单位与坐标

- Rhino 建模单位：毫米（mm）
- 导出单位：米（m），缩放 `0.001`
- Three.js 场景：1 单位 = 1 米
- 原点：船中、龙骨顶部、中线交点
- Rhino：`+X` 船首，`+Y` 左舷，`+Z` 上
- glTF：Y-up；走 Blender 导出会自动转换

### 3.2 命名

- 对象名 = 节点名，全部英文小写 + 下划线
- 不使用中文名、默认名（`Object01`、`Mesh03`）
- 图层：

```
REF          参考线/参考图（导出前关闭）
SHIP_HULL    外壳、甲板
SHIP_STRUCT  龙骨、艏柱、艉柱、隔舱板
JOINT        榫头、卯眼
FASTENER     木钉、铁钉
CAULKING     捻缝
```

### 3.3 尺寸参考（视觉比例，不是考古实测）

| 项目 | 建议值 |
|---|---|
| 总长 | 25–30 m |
| 型宽 | 8–10 m |
| 型深 | 4–5 m |
| 隔舱位置 | 约 25% / 50% / 75% 船长 |
| 外壳厚度 | 60–100 mm |
| 隔舱板厚度 | 50–80 mm |
| 人孔 | 600 × 800 mm |
| 水孔 | Ø100 mm |
| 铁钉 | Ø12 mm，间距 150–200 mm |
| 捻缝槽 | 10 × 10 mm |

**文案里不要写“精确考古尺寸”。** 这是视觉可信的复原，不是实测数据。

### 3.4 材质

- Rhino 里只分色，不贴图
- 四组颜色：船木深褐、桐油黄、铁灰、灰白
- 颜色最终由 Three.js 覆盖，建模文件只需保留 Base Color
- 不要使用复杂 PBR 节点

---

## 4. 任务分解

### T01 参考图与比例锁定

**目标**：把“船长什么样”固定下来，避免后面反复改比例。

**输入**：项目文档、博物馆参考图。

**操作**：

1. 打开参考链接，各保存 3 张图到 `refs/`：泉州湾宋船、南海I号、华光礁I号。
2. 选定 **泉州湾宋船** 为主参考，南海I号为辅。
3. 在 Rhino 画侧视、俯视、横剖三张线图。
4. 标出总长、型宽、型深、3 道隔舱位置。
5. 写 `refs/03-proportion.md`：每个尺寸的来源与假设。

**交付**：

- `refs/01-reference-board.png`（参考图拼板）
- `refs/02-lines.3dm`（三视图线稿）
- `refs/03-proportion.md`

**验收**：

- [ ] 三视图比例一致
- [ ] 隔舱位置标注
- [ ] 每个关键尺寸有来源或“假设”说明
- [ ] 负责人确认后再进入 T02

**参考**：

- 泉州海外交通史博物馆：https://qzhjg.com/
- 中国国家博物馆：https://www.chnmuseum.cn/
- Wikimedia 中国帆船：https://commons.wikimedia.org/wiki/Category:Chinese_junks
- Wikimedia 中国沉船：https://commons.wikimedia.org/wiki/Category:Shipwrecks_of_China
- Wikipedia 南海I号：https://en.wikipedia.org/wiki/Nanhai_One
- Wikipedia 泉州湾宋船：https://en.wikipedia.org/wiki/Quanzhou_ship

**工时**：0.5 天

---

### T02 船体 blockout

**目标**：用最简单的体块确认船体轮廓与隔舱关系。

**输入**：T01 的三视图。

**操作**：

1. 新建 Rhino，单位 mm，建立第 3 节图层。
2. 画中线、甲板边线、龙骨线、水线。
3. 建外壳曲面（单层、无厚度）、甲板、3 个隔舱体块。
4. 保存侧视、俯视、3/4 三张视口截图。

**交付**：

- `01_blockout.3dm`
- `01_blockout_side.png`
- `01_blockout_top.png`
- `01_blockout_iso.png`

**验收**：

- [ ] 长宽比与三视图一致
- [ ] 艏艉翘度正确
- [ ] 3 道隔舱位置正确
- [ ] 外壳无厚度，便于后续加厚
- [ ] 图层与命名正确

**工时**：1 天

---

### T03 外壳与剖切

**目标**：做出“能看到内部”的剖切船体。

**输入**：T02 blockout。

**操作**：

1. 外壳 `OffsetSrf` 加厚 60–100 mm。
2. 切掉左舷前 1/4（或右舷），保留剖切面。
3. 用 `Cap` 封闭剖切面。
4. 删除内部隐藏面、重复面。
5. 检查法线方向。

**交付**：

- `02_hull_cutaway.3dm`
- `02_hull_cutaway_iso.png`
- `02_hull_cutaway_side.png`

**验收**：

- [ ] 剖切面封闭，无破面
- [ ] 外壳厚度一致
- [ ] 无内部隐藏面
- [ ] 法线朝外
- [ ] 预估面数 ≤ 12,000

**工时**：1 天

---

### T04 龙骨 / 艏柱 / 艉柱

**目标**：补齐船体的“骨架”。

**输入**：T02、T03。

**操作**：

1. 建龙骨，贯穿首尾。
2. 建艏柱、艉柱，与龙骨交接。
3. 与外壳交接处做 5–10 mm 倒角。
4. 三个对象独立，不合并。

**交付**：

- `03_structure.3dm`
- `03_structure_iso.png`

**验收**：

- [ ] 交接无穿模
- [ ] 对象名 `keel`、`stem`、`sternpost`
- [ ] 各自独立，pivot 合理
- [ ] 面数 ≤ 3,100

**工时**：0.5 天

---

### T05 隔舱板 ×3

**目标**：让“水密隔舱”在模型里可见、可讲。

**输入**：T03 剖切船体。

**操作**：

1. 建 3 道隔舱板，厚度 50–80 mm。
2. 每道开 1 个人孔（600 × 800 mm）和 2 个水孔（Ø100 mm）。
3. 与船体内壁相交，不留缝。
4. 三个对象独立命名。

**交付**：

- `04_bulkheads.3dm`
- `04_bulkheads_cutaway.png`

**验收**：

- [ ] 位置在 25% / 50% / 75%
- [ ] 厚度正确
- [ ] 人孔/水孔可见
- [ ] 对象名 `bulkhead_01`–`bulkhead_03`
- [ ] 面数 ≤ 3,600

**工时**：0.5 天

---

### T06 船壳板段与接缝

**目标**：做一段可用于“补缝”交互的船板。

**输入**：T03 外壳。

**操作**：

1. 选 4–6 块船板，做出搭接或平接。
2. 按 150–200 mm 间距打 Ø12 mm 钉孔。
3. 在接缝处做 10 × 10 mm 捻缝槽。
4. 单独成组，命名 `plank_section`。

**交付**：

- `05_plank_section.3dm`
- `05_plank_section_closeup.png`

**验收**：

- [ ] 接缝清晰可见
- [ ] 钉孔位置合理
- [ ] 捻缝槽可单独显隐
- [ ] 可独立导出
- [ ] 面数 ≤ 2,000

**工时**：1 天

---

### T07 榫卯节点

**目标**：做一个能放大、能爆炸、能讲清“榫头如何咬住卯眼”的节点。

**输入**：T01 参考图、T06 船板。

**操作**：

1. 建直榫：榫头 + 卯眼，比例按参考图，不追求考古精确。
2. 加一个木钉孔，Ø20 mm，榫头/卯眼对齐。
3. 节点整体放大 2–3 倍，便于展示。
4. 保存“装配态”和“爆炸态”两个版本。
5. 三个对象独立命名。

**交付**：

- `06_joint.3dm`（装配态）
- `06_joint_exploded.3dm`（爆炸态）
- `06_joint_closeup.png`
- `06_joint_exploded.png`

**验收**：

- [ ] 榫头能插入卯眼
- [ ] 视觉间隙 0.5–1 mm
- [ ] 木钉孔对齐
- [ ] 对象名 `joint_tenon`、`joint_mortise`、`fastener_peg`
- [ ] 面数 ≤ 4,300

**工时**：1 天

---

### T08 钉与捻缝

**目标**：补齐“榫合钉接”的钉与缝。

**输入**：T06、T07。

**操作**：

1. 建铁钉、木钉低模，各一个，后续实例化。
2. 建捻缝条：细长条，带轻微凹凸。
3. 命名并分图层。

**交付**：

- `07_fasteners.3dm`
- `08_caulking.3dm`

**验收**：

- [ ] 铁钉/木钉可复用
- [ ] 捻缝条可单独显隐
- [ ] 面数：钉各 ≤ 300，捻缝 ≤ 800
- [ ] 命名正确

**工时**：0.5 天

---

### T09 Rhino 网格化

**目标**：把 NURBS 转成网页可用的低模网格。

**输入**：T03–T08。

**操作**：

1. 分件 `Mesh`，角度公差 5–10°，不要 1°。
2. 船体用 `QuadRemesh`，目标 8,000–10,000 面。
3. 开放边用 `ShrinkWrap` 封闭。
4. 需要时 `ReduceMesh` 减 30–50%。
5. 检查裸边、破面、重复面。
6. 分件导出 OBJ，单位米。
7. 写 `mesh_report.csv`：对象名、三角面数、文件大小。

**交付**：

- `mesh/*.obj`
- `mesh_report.csv`

**验收**：

- [ ] 总三角面 ≤ 60,000
- [ ] 无裸边、无破面
- [ ] 对象名与资产表一致
- [ ] 单位米，轴向正确
- [ ] `mesh_report.csv` 可核对

**参考**：

- Rhino QuadRemesh：https://docs.mcneel.com/rhino/8/help/en-us/commands/quadremesh.htm
- Rhino ShrinkWrap：https://docs.mcneel.com/rhino/8/help/en-us/commands/shrinkwrap.htm

**工时**：1 天

---

### T10 Blender 清理 / UV / AO

**目标**：把 OBJ 变成干净、可贴图、可导出的网页资产。

**输入**：T09 的 OBJ。

**操作**：

1. 导入 OBJ，检查尺度（船长 25–30 单位），`Apply All Transforms`。
2. `Merge by Distance` 0.001，`Recalculate Normals`，删除松散点。
3. 需要时 `Decimate`，但不破坏榫卯硬边。
4. `Shade Smooth` + `Auto Smooth` 30°，硬边加 `Weighted Normal`。
5. `Smart UV Project`，角度 66°，margin 0.02。
6. 烘 AO 到 1024 贴图（Cycles，64 samples），保存 `ao.png`。
7. 材质只保留基础色，不接复杂节点。

**交付**：

- `ship.blend`
- `ao.png`
- `10_blender_cleanup.png`

**验收**：

- [ ] 无重叠 UV
- [ ] AO 无明显接缝
- [ ] 面数未超预算
- [ ] 法线正确
- [ ] 无多余相机/灯光

**参考**：

- glTF-Blender-IO：https://github.com/KhronosGroup/glTF-Blender-IO
- Blender  manual：https://docs.blender.org/manual/en/latest/

**工时**：1 天

---

### T11 GLB 导出

**目标**：产出前端可直接加载的 `ship.glb`。

**输入**：T10 的 `ship.blend`。

**操作**：

1. `File → Export → glTF 2.0`。
2. 格式选 `glTF Binary (.glb)`。
3. 勾选 `+Y Up`、`Apply Modifiers`、`Selected Objects`。
4. `Draco` 压缩，level 6。
5. 用 `gltf-transform inspect` 检查。

**交付**：

- `ship.glb`
- `11_glb_report.txt`

**验收**：

- [ ] 三角面 ≤ 60,000
- [ ] 文件 ≤ 5 MB
- [ ] 节点名与资产表一致
- [ ] 无相机、灯光、空节点
- [ ] Three.js 能加载（前端验证）

**参考**：

- glTF 规范：https://registry.khronos.org/glTF/
- gltf-transform：https://gltf-transform.dev/
- Draco：https://github.com/google/draco
- Khronos 查看器：https://github.khronos.org/glTF-Sample-Viewer-Release/

**工时**：0.5 天

---

### T12 零件 JSON + 截图

**目标**：让前端知道每个零件叫什么、装配位/爆炸位在哪。

**输入**：T11 的 GLB。

**操作**：

1. 按 `content/ship-parts.json` 模板填写：
   - `name`：节点名
   - `label.zh` / `label.en`
   - `assembled`：装配位置 `[x,y,z]`（米）
   - `exploded`：爆炸位置 `[x,y,z]`（米）
   - `description.zh` / `description.en`
2. 截 3 张图：侧视、剖切、节点爆炸，2000 px 宽。
3. 检查每个节点名都能在 GLB 中找到。

**交付**：

- `ship-parts.json`
- `screenshots/01_side.png`
- `screenshots/02_cutaway.png`
- `screenshots/03_joint.png`

**验收**：

- [ ] JSON 可被 `JSON.parse` 解析
- [ ] 每个 `name` 在 GLB 中存在
- [ ] 坐标单位为米
- [ ] 截图无 UI、背景干净

**工时**：0.5 天

---

### T13 交付包与自检

**目标**：一次性交付，减少来回。

**操作**：

1. 按第 7 节清单打包。
2. 填 `delivery-report.md`：完成项、未完成项、已知问题。
3. 发给前端负责人，附 3 张截图。

**验收**：

- [ ] 压缩包能解压
- [ ] 文件命名正确
- [ ] 报告与实际一致
- [ ] 前端能打开 GLB

**工时**：0.5 天

---

## 5. 参考图与资料

### 5.1 项目链接

- 仓库：https://github.com/WH20080518/BlueFantasy
- 文档目录：https://github.com/WH20080518/BlueFantasy/tree/main/docs
- 设计方向：https://github.com/WH20080518/BlueFantasy/blob/main/docs/04-design-direction.md
- 架构：https://github.com/WH20080518/BlueFantasy/blob/main/docs/03-architecture.md

### 5.2 历史与实物参考

- 泉州海外交通史博物馆：https://qzhjg.com/
- 中国国家博物馆：https://www.chnmuseum.cn/
- Wikimedia 中国帆船：https://commons.wikimedia.org/wiki/Category:Chinese_junks
- Wikimedia 中国沉船：https://commons.wikimedia.org/wiki/Category:Shipwrecks_of_China
- Wikipedia 南海I号：https://en.wikipedia.org/wiki/Nanhai_One
- Wikipedia 泉州湾宋船：https://en.wikipedia.org/wiki/Quanzhou_ship

**搜索关键词**（用于找线图/剖面图）：

- 泉州湾宋代海船 线图
- 南海I号 船体 结构
- Chinese junk midship section
- Chinese ship watertight bulkhead
- mortise and tenon shipbuilding

**版权提醒**：博物馆图片只作参考，不直接用于参赛页面；页面素材需自制、AI 生成或明确授权。

### 5.3 技术文档

- Three.js 文档：https://threejs.org/docs/
- GLTFLoader：https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- DRACOLoader：https://threejs.org/docs/#examples/en/loaders/DRACOLoader
- glTF 规范：https://registry.khronos.org/glTF/
- glTF-Blender-IO：https://github.com/KhronosGroup/glTF-Blender-IO
- Rhino QuadRemesh：https://docs.mcneel.com/rhino/8/help/en-us/commands/quadremesh.htm
- Rhino ShrinkWrap：https://docs.mcneel.com/rhino/8/help/en-us/commands/shrinkwrap.htm
- gltf-transform：https://gltf-transform.dev/
- Draco：https://github.com/google/draco
- Khronos 查看器：https://github.khronos.org/glTF-Sample-Viewer-Release/

---

## 6. 每日同步

- 每天 18:00 前发：一张截图 + 当前三角面数 + 阻塞项
- 阻塞超过 2 小时直接说，不要憋着
- 文件命名不改，方便前端按名查找
- 每次导出 GLB 都跑一遍 `gltf-transform inspect`

---

## 7. 交付包清单

```
delivery/
├─ 01_blockout.3dm
├─ 02_hull_cutaway.3dm
├─ 03_structure.3dm
├─ 04_bulkheads.3dm
├─ 05_plank_section.3dm
├─ 06_joint.3dm
├─ 06_joint_exploded.3dm
├─ 07_fasteners.3dm
├─ 08_caulking.3dm
├─ mesh/
│  ├─ ship_hull.obj
│  ├─ bulkhead_01.obj
│  └─ ...
├─ ship.blend
├─ ship.glb
├─ ship-parts.json
├─ ao.png
├─ screenshots/
│  ├─ 01_side.png
│  ├─ 02_cutaway.png
│  └─ 03_joint.png
├─ mesh_report.csv
└─ delivery-report.md
```

---

## 8. 常见退回原因

- 节点名不对，前端 `getObjectByName` 找不到
- 总面数超 60,000，手机卡顿
- GLB 超 5 MB，首屏加载失败
- 外壳有破面/裸边，渲染漏光
- 剖切面没封口，看到空壳
- 榫头插不进卯眼，爆炸图穿模
- UV 重叠，AO 花
- 导出单位错，船只有 3 厘米长
- 用了未授权模型/贴图

---

## 9. 一句话

**做“结构证据”，不做“整船模型”。一个讲得清的节点，胜过一艘面数很高的船。**
