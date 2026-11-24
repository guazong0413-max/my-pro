# 《死寂公寓》二维人物模型

小宇、小美、小旭和大叔各有独立绘制的正面、侧面和侧面屈肘图。角色保留原参考里的服装识别线索。头部、肩宽、躯干、腿长与手部的外形都按角色分别绘制。

## 看图与编辑

- overview.png 把四个人放在同一条地线上。下排是放大的正面、侧面头部。
- sheets/ 里每人一张模型表，包含正侧面、肩肘腕屈曲和手部特写。大叔表里也有耳麦。
- models/yu、models/mei、models/xu、models/uncle 各有透明 SVG 和一份 anchors.json。头部、躯干、上臂、前臂、手、大腿、小腿和鞋都有独立分组。
- anchors.json 中的 pivot 是该部件的原始关节坐标，parent 是上一级部件。SVG 坐标中 x 向右、y 向下，转角用度。耳麦是大叔头部下的单独部件。

## 输出姿势

用 Node.js 运行下面的命令可以从独立人物模型输出一个新的二维姿势。参数按 SVG 分组名设置转角。

~~~sh
node pose.cjs mei side xiaomei.svg right-arm-upper=-18 right-arm-fore=-68 right-arm-hand=15
node pose.cjs uncle side uncle-with-headset.svg --headset
~~~

如需重出总览和模型表，执行 npm install，再运行 node review.cjs preview。项目使用 @napi-rs/canvas 1.2.0 栅格化预览图。
