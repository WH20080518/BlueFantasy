# 《榫合》3D 建模 · 零件清单

一共 **15 个零件**，做完打包成一个 `.glb` 给我就行。

- **交付时间**：11 月 15 日前
- **格式**：`.glb`，开 Draco 压缩
- **预算**：所有零件加起来 ≤ 60,000 三角面，文件 ≤ 5 MB
- **单位**：米，Y 轴朝上
- **命名**：用下表「导出名」那一列

> 尺寸是视觉比例，不是考古实测，不用去查资料对数字。看着像一艘中国古船就行。

---

## 15 个零件

| # | 零件 | 导出名 | 尺寸（长×宽×高，米） | 长什么样 |
|---|---|---|---|---|
| 1 | 船体外壳（剖切） | `hull_shell` | 28 × 9 × 4.5 | 壳厚 0.08。只做左舷、船底、艏艉；**右舷整片切掉**，让人能看进船里 |
| 2 | 甲板 | `ship_deck` | 24 × 8.6 × 0.08 | 平板，中间开 3 个 0.6×0.8 的人孔 |
| 3 | 龙骨 | `keel` | 26 长，断面 0.42×0.27 | 船底正中一根粗方木，两头略上翘 |
| 4 | 艏柱 | `stem` | 高 4.5，断面 0.3×0.3 | 船头竖木，向前略倾 |
| 5 | 艉柱 | `sternpost` | 高 4.0，断面 0.3×0.3 | 船尾竖木，基本垂直 |
| 6 | 隔舱板 1 | `bulkhead_01` | 8.5 × 3.8 × 0.06 | 横着的一整块板，贴住船体内壁。开 1 个人孔 0.6×0.8，2 个 Ø0.1 水孔 |
| 7 | 隔舱板 2 | `bulkhead_02` | 同上 | 同上，位置在船长 50% |
| 8 | 隔舱板 3 | `bulkhead_03` | 同上 | 同上，位置在船长 75% |
| 9 | 船壳板段 | `plank_seam` | 2.4 × 1.9 × 0.08 | 3 块板叠着，像鱼鳞那样错开搭接（每块错开 0.1），板缝要看得见 |
| 10 | 榫头构件 | `joint_tenon` | 0.6 × 0.3 × 0.3 | 一端伸出一个 0.12×0.08×0.08 的凸头 |
| 11 | 卯眼构件 | `joint_mortise` | 0.6 × 0.3 × 0.3 | 一端挖一个 0.122×0.082×0.082 的槽（比榫头大 2 mm，能插进去） |
| 12 | 木钉 | `treenail` | Ø0.04 × 0.2 | 圆柱，端面稍微倒角 |
| 13 | 铁钉 | `iron_nail` | Ø0.012 × 0.15 | 细圆柱，方头，尖头 |
| 14 | 捻缝 | `caulking_seam` | 0.6 × 0.012 × 0.012 | 一根细长条，填在板缝里，表面粗糙一点 |
| 15 | 水面 | `water_plane` | — | **不用做**，前端会画 |

---

## 风格就一句话

低多边形、硬边、**不做旧、不加贴图**。只有四种颜色：深褐木、桐油黄、铁灰、灰白。

---

## 参考图（不确定的看这里）

**船的外形**

- 泉州湾宋船（我们主要参考这个）：https://commons.wikimedia.org/wiki/File:Song_Dynasty_Ancient_Ship_of_Quanzhou_Bay_20061229.jpg
- 同一艘船另一张：https://commons.wikimedia.org/wiki/File:Ancient_Boat_in_Quanzhou.jpg
- 中国帆船整体外形：https://commons.wikimedia.org/wiki/File:Hong_Kong_China_Junk-in-Victoria-Harbour-01.jpg
- 泉州海外交通史博物馆：https://qzhjg.com/

**榫头 / 卯眼**

- 结构示意图：https://commons.wikimedia.org/wiki/File:Mortise_and_tenon_joint.svg
- 实物照片：https://commons.wikimedia.org/wiki/File:Mortise_and_Tenon_(PSF).png

**木钉（treenail）**

- https://commons.wikimedia.org/wiki/File:AlonnisosTreenails.jpg

**捻缝**

- 工人往板缝里填捻料：https://commons.wikimedia.org/wiki/File:Traditional_Malay_boat_building_-_applying_the_caulking_bark.jpg

**隔舱板**

- 剖面示意：https://commons.wikimedia.org/wiki/File:Bulkhead_PSF.png

---

## 三个问题

1. 这 15 个零件，有哪个你觉得不用单独做、合并一下更省事？直接说。
2. 尺寸如果你觉得比例不对，可以自己调，调完告诉我改了哪几个。
3. 交之前发一张 3/4 视角截图，我看一眼就行，不用等全部做完。
