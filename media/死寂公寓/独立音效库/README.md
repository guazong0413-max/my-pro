# 《死寂公寓》七组独立音效

[播放 1 分 34 秒对听](./七组音效-制作与实录对听.mp3)。每组先放为短片制作的 A 版，短暂停顿后放 B 版实录。目录里的 WAV 都是完整单轨，48 kHz、24 位、双声道。雨和风的制作版各 24 秒，可以首尾循环铺底。

| 声音 | 完整 A | 完整 B | 对听 A → B | 可以留意的细节 |
| --- | --- | --- | --- | --- |
| 雨打窗台 | [制作 24 秒](./A-制作音效/01-雨打窗台.wav) | [实录 24 秒](./B-实录对照/01-雨打窗台.wav) | 00:00 → 00:06 | 远处雨幕连续，近处打在窗沿上的重滴可以一颗颗分辨。 |
| 风过树梢 | [制作 24 秒](./A-制作音效/02-风过树梢.wav) | [实录 24 秒](./B-实录对照/02-风过树梢.wav) | 00:13 → 00:21 | 风起来时先有低处的风声，附近的叶片稍后翻动，阵风退去后还有零散的沙沙声。 |
| 警车驶过 | [制作 9.2 秒](./A-制作音效/03-警车驶过.wav) | [实录 9.2 秒](./B-实录对照/03-警车驶过.wav) | 00:30 → 00:39 | A 的警笛连续上滑、下滑，警车从左边逼近，驶过后音调和响度一起降低。 |
| 救护车驶过 | [制作 12 秒](./A-制作音效/04-救护车驶过.wav) | [实录 12 秒](./B-实录对照/04-救护车驶过.wav) | 00:49 → 01:00 | A 从右侧驶来。两组簧片交替响，近处能分辨簧片轻微的拍动，车走远后高频先淡。 |
| 受惊短呼 | [制作 1.35 秒](./A-制作音效/05-受惊短呼.wav) | [实录 1.35 秒](./B-实录对照/05-受惊短呼.wav) | 01:12 → 01:14 | A 是陈默吸半口气、漏出一声短促的“啊”就收住。B 是真人表演的受惊抽气。 |
| 床头电子闹铃 | [制作 6 秒](./A-制作音效/06-床头电子闹铃.wav) | [实录 6 秒](./B-实录对照/06-床头电子闹铃.wav) | 01:17 → 01:21 | 一响一停。留意每次停响时钟壳残留的一点尾音。 |
| 手机贴木桌震动 | [制作 3.72 秒](./A-制作音效/07-手机贴木桌震动.wav) | [实录 3.72 秒](./B-实录对照/07-手机贴木桌震动.wav) | 01:26 → 01:30 | 马达启动后外壳才开始嗒嗒碰桌，最后一次震得稍长。 |

## 实录出处与授权

B 全部取自录音者在 Freesound 发布的高质量 MP3 试听，截取后转为 WAV，片头片尾加 15 毫秒淡化，再做等量增益调整。单声道来源在成品双声道中居中。对听总带单独配平每一对截取片段，保留录音内部的远近和起伏。

| 声音 | 原作署名与录制内容 | 取用的原始时间（秒） | 授权 |
| --- | --- | --- | --- |
| 雨 | Erbsland-Music 在窗边用 Zoom H4n 录到雨打金属窗沿及玻璃。[Rain on Metal Window Ledge](https://freesound.org/people/Erbsland-Music/sounds/428605/) | 16.00–40.00 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 风 | Anya_Media 用 BP4025 和 Zoom F8 录到近处叶片、远处树冠在阵风中摇动。[Forest, close up of trees rustling in the wind.wav](https://freesound.org/people/Anya_Media/sounds/523389/) | 33.00–57.00 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 警车 | JW_Audio 在英国伯明翰市中心用 Zoom H6 Studio 录到一辆警车经过。[VEHSirn_Police Car, Siren, _JW Audio](https://freesound.org/people/JW_Audio/sounds/853022/) | 0.12–9.32 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| 救护车 | Breviceps 用手机实录德国救护车鸣笛经过。[German Ambulance #2](https://freesound.org/people/Breviceps/sounds/541595/) | 0.80–12.80 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 惊呼 | esperar 为动画录制了一组成年男性受惊抽气，这里取其中一次。[surprise_gasps.wav](https://freesound.org/people/esperar/sounds/171942/) | 3.48–4.83 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 闹铃 | bcginn 录下的实物闹钟铃声。[Alarm Clock.wav](https://freesound.org/people/bcginn/sounds/185708/) | 1.00–7.00 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| 震动 | steeltowngaming 把 iPhone SE 放在木桌上，用 Sennheiser 416 和 Sound Devices 633 录制马达和桌面的接触声。[iPhone Vibrate on Wood Table](https://freesound.org/people/steeltowngaming/sounds/537738/) | 0.73–4.45 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

## 制作与复现

A 的雨滴、阵风、轮胎、发动机、警笛、电子闹铃和桌面接触声由代码生成。车辆以运动声源计算声音到达双耳和街边墙面的时间。惊呼使用本地千问 Qwen3-TTS 的 Dylan 声线，保留选中干声，再合成吸气和近房间反射。A 和 B 各用独立声源。

在本目录运行以下命令。Python 需要 NumPy、SciPy 和 SoundFile，FFmpeg 需要支持 `loudnorm` 和 `libmp3lame`。重建时按清单校验七份公开试听的 SHA-256。

```sh
python build.py --ffmpeg ffmpeg
```

设计参数在 [synth.py](./synth.py)。录音来源、截取位置、试听时间和惊呼表演提示在 [sounds.json](./sounds.json)。库里保留了[惊呼干声](./制作素材/gasp.wav)。需要重演时，可在装有 Qwen3-TTS 的环境运行本系列的配音脚本。

```sh
python ../门前的面粉/generate_voice.py --plan sounds.json --voice-dir 制作素材 --only gasp
```
