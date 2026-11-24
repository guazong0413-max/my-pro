# 《死寂公寓》四人表情动画

预览上排为正面，下排为侧面。小宇、小美、小旭和大叔都有平静眨眼、疑惑、警觉、惊讶、担心、难过、克制生气和松口气微笑八组动画。

## 编辑模型

moves.cjs 控制入场、停顿和收势。四个人各有眨眼、抬眉、视线与张嘴的参数。惊讶时眼睛和眉毛先动，嘴和下颌随后打开。疑惑、警觉和轻微生气依靠左右眉形、眼睑和唇线分辨。

face.cjs 计算眉、眼睑、瞳孔、嘴角和下颌轮廓。正面和侧面使用各自的起始坐标。导出的 SVG 里眉、眼、嘴都有独立的分组，转角跟随头部枢轴。keyframes/ 里每人有正面与侧面各八张透明底关键帧。

## 重出预览

在含有 art.cjs、faces.cjs 和 models.cjs 的人物工程根目录运行下列命令。FFmpeg 需包含 libx264。--font 可指定中文字体。

~~~sh
npm install
node expressions/keyframes.cjs expressions/keyframes
node expressions/preview.cjs --ffmpeg ffmpeg --out expression-preview.mp4
~~~
