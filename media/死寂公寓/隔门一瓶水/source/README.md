# 死寂公寓 · 隔门一瓶水

这是一段 90 秒的二维动画。情节取自长参考的 **1:03:32–1:05:02**。九楼递水、上楼和监听三段连续发生。各幕的取景、角色、动作和道具以新的 Canvas 2D 路径绘制。

## 工程

| 文件 | 用途 |
| --- | --- |
| timeline.json | 按秒列出切镜、对白、脚步、递水、门锁、扶栏和对讲机的事件 |
| draw.cjs · sets.cjs | 二维路径、光斑、字体、布景、道具 |
| character.cjs | 侧面人物、手掌和手指、固定肢长、连贯的袖肘轮廓 |
| film.cjs | 13 个镜头、关键姿势、遮挡、口型和字幕 |
| voice_generate.py · voice/ | 普通话预设音色的生成命令和本片用到的八条对白 |
| sound.py · performance.json | 生成室内底噪和拟音、立体声混音、口型振幅和字幕出点 |
| verify_motion.cjs | 逐帧检查肢长、腕脚到位、已承重脚的稳定性和接瓶时序 |

## 重渲染

需要 Node.js、含 libx264 和 AAC 的 FFmpeg，以及带 NumPy、SciPy 的 Python。中文字幕会使用系统可用的中文字体，也可用 --font 指向字体文件。原样渲染可直接使用包内的对白音频。

~~~sh
npm ci
python -m pip install "numpy>=1.23.4,<3" "scipy>=1.9.3,<2"
python sound.py --ffmpeg ffmpeg --out sound.wav
node verify_motion.cjs
node film.cjs --width 1920 --ffmpeg ffmpeg --out picture.mp4
ffmpeg -i picture.mp4 -i sound.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart master.mp4
~~~

需要预览时可运行 node film.cjs --width 960 --stills 23.2 30.7 31.6 33.3 61.15 73.55。重做对白时，编辑 timeline.json 后使用 edge-tts 7.3.1 运行 voice_generate.py，再运行 sound.py 生成新的口型与字幕数据。
