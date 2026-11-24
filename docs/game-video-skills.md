# 游戏学习资料、影像制作与通用工具

记录日期为 2026-11-24，安装环境为 Apple Silicon Mac。表中的 Skill 链接均固定到实际安装的源码版本。

14 个目录均已安装到当前用户的 `~/.codex/skills/`，逐文件 SHA-256 与上游固定提交相符。下一条 Codex 消息即可按名称调用，例如“用 `rpg` 解释装备属性怎样叠加”。

## 游戏开发学习资料（10 个 Skill）

| Skill | 方向 | 可以用来做什么 | 安装来源 |
| --- | --- | --- | --- |
| `platformer` | 平台跳跃 | 实现起跳、落地、跳跃容错、平台碰撞和检查点。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/platformer/SKILL.md) |
| `roguelike` | Roguelike / 肉鸽 | 设计随机遭遇、掉落、单局成长和局外解锁。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/roguelike/SKILL.md) |
| `rpg` | 角色扮演 | 建立角色属性、升级曲线、装备、战斗结算和任务系统。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/rpg/SKILL.md) |
| `fps-shooter` | 第一人称射击游戏 | 在游戏引擎中实现瞄准操作、虚拟命中反馈和镜头手感。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/fps-shooter/SKILL.md) |
| `tower-defense` | 塔防 | 安排敌人波次、路径选择、炮塔优先级和资源消耗。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/tower-defense/SKILL.md) |
| `card-game` | 卡牌与卡组构筑 | 管理牌库、手牌、弃牌区、费用和效果触发顺序。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/card-game/SKILL.md) |
| `visual-novel` | 视觉小说 / 互动叙事 | 设计分支对话、选择条件、多结局和读档回溯。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/visual-novel/SKILL.md) |
| `survival-crafting` | 生存建造 | 串联采集、背包、合成配方、基地建造和生存需求。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/survival-crafting/SKILL.md) |
| `puzzle` | 解谜 / 益智 | 实现谜题规则、撤销、解法验证和关卡难度递进。 | [SKILL.md](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/puzzle/SKILL.md) |
| `pixelfx` | 像素特效 | 选择和调整像素粒子、颜色、时间与发光层，导出游戏可用的透明图集。 | [SKILL.md](https://github.com/patch-gg/pixelfx/blob/5294518ce7c72e48b6100a744596e0acf57f2826/skills/pixelfx/SKILL.md) |

## 影像与 3D 制作（4 个 Skill）

| Skill | 方向 | 可以用来做什么 | 安装来源 |
| --- | --- | --- | --- |
| `3d-asset-generation` | 3D 资产 | 从参考图或文字规划网格、贴图与重建，记录资产来源并检查导入效果。 | [SKILL.md](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/.agents/skills/3d-asset-generation/SKILL.md) |
| `seedance-2-5` | Seedance 视频 | 把镜头动作、角色参考图和声音约束整理为生成请求，控制镜头间的连续性。 | [SKILL.md](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/.agents/skills/seedance-2-5/SKILL.md) |
| `kling-official` | 可灵官方接口 | 按可灵工作流组织图片、视频、配音、数字人与口型同步请求。 | [SKILL.md](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/.agents/skills/kling-official/SKILL.md) |
| `video-edit` | 本地剪辑 | 用 FFmpeg 与 ffprobe 剪切、拼接、裁剪、换音轨、压缩并核对导出参数。 | [SKILL.md](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/.agents/skills/video-edit/SKILL.md) |

## 两个游戏美术学习工具

| 工具 | 功能与适用环节 | 项目与安装入口 |
| --- | --- | --- |
| 像素造物台 Pixel Atelier | 用现有角色做像素动作、调帧、设置锚点和导出。工作台内生成新动作使用支持生图的 Codex CLI。 | [源码与工作台说明](https://github.com/jinxingtaire/pixel-atelier/tree/15d199f68e6657af0873b3c950525c4bf28eed6f) |
| pixelfx | 游戏像素特效库与渲染工具。效果可在引擎中实时代码绘制，也可导出 PNG 图集、动画参数、GIF 或 MP4。 | [源码与示例](https://github.com/patch-gg/pixelfx/tree/5294518ce7c72e48b6100a744596e0acf57f2826) |

## 影像制作工具

| 工具 | 功能与适用环节 | 项目与安装入口 |
| --- | --- | --- |
| OpenMontage | 用剧本、分镜板和素材编排视频，连接模型供应商，使用 Remotion 或 FFmpeg 渲染。 | [源码与中文说明](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/README_zh-CN.md) |

OpenMontage 另附一份适合写梗概、节拍和镜头叙事的创作指南，作为剧本参考资料使用。[Storytelling 指南](https://github.com/OpenMontageInc/OpenMontage/blob/2e003e65fa99a0f329478a2c1cdcf26bc481933a/skills/creative/storytelling.md)

## 通用开发与桌面工具

| 工具 | 功能与适用环节 | 项目与安装入口 |
| --- | --- | --- |
| T3 Code | 在桌面管理 AI 编码会话、项目和并行开发任务，用于查看代码改动。 | [项目](https://github.com/pingdotgg/t3code) · [macOS 版本](https://github.com/pingdotgg/t3code/releases/tag/v0.1.11) |
| OpenMausBot | 在虚拟办公室组织有不同职责的智能体。外部办公应用、云端虚拟机与模型按所选功能单独接入。 | [项目](https://github.com/milind-soni/OpenMausBot) · [官方下载](https://www.openmausbot.com/download) |
| ThinkRail | JetBrains 的 AI 开发环境，把需求拆为任务，在隔离的 Git 工作区实施并审查。 | [项目](https://github.com/JetBrains/thinkrail) · [macOS 版本](https://github.com/JetBrains/thinkrail/releases/tag/v0.4.0) |
| Vorssaint | macOS 菜单栏工具，可按需启用窗口管理、剪贴板和文件暂存等功能。 | [项目](https://github.com/vorssaint/vorssaint-utils) · [macOS 版本](https://github.com/vorssaint/vorssaint-utils/releases/tag/v3.4.4) |

## 本机入口

| 操作 | 入口 |
| --- | --- |
| 打开像素造物台 | 终端运行 `pixel-atelier`，浏览器打开 `http://127.0.0.1:8898/`。 |
| 导出透明篝火特效 | 在素材目录运行 `pixelfx fire/campfire --sheet --out ./fx`。 |
| 打开 OpenMontage 分镜板 | 终端运行 `openmontage-board`，浏览器打开 `http://127.0.0.1:4750/`。 |
| 列出 OpenMontage 示例 | 运行 `openmontage-demos --list`。 |
| 打开桌面工具 | 在访达中用“前往文件夹”打开 `~/Applications`，选择对应应用。 |

三个创作工具的源码与各自运行环境位于 `~/.codex/skill-tools/creative/`。本地命令入口位于 `~/.local/bin/`。若终端没有识别命令，可直接运行 `~/.local/bin/pixel-atelier` 等完整路径。

## 使用模型时

Seedance、可灵和云端 3D 生成需要相应供应商的账号、权限与可用额度。安装 Skill 提供调用说明。要验证一次出片或建模，还需用实际提供商完成任务。像素造物台可直接处理自有素材，OpenMontage 分镜板和 FFmpeg 本地剪辑也可先用。

## 安装与验证记录

| 工具 | 在本机完成的验证 |
| --- | --- |
| Codex Skills | 逐文件比对 14 个 Skill 目录，共 28 个文件。 |
| 像素造物台 | 工作台在本机回环地址返回就绪，校准素材的构建和复查均通过，41 项上游测试通过。Codex CLI 0.172.0 已安装，已用本机 CLI 生成 app-server 接口定义。云端生成新角色尚未实测。 |
| pixelfx | 从效果索引读取到 244 项。实际渲染篝火，得到 90 帧动画、1280 × 1152 的 RGBA 图集及 JSON，检查到透明和不透明像素。 |
| OpenMontage | 已安装隔离的 Python 依赖、项目所需的 Node 24.22.3、Remotion 与 Piper，离线可调用 HyperFrames 0.9.88。Backlot 健康检查通过，能列出 5 个免密钥示例。试渲染 `code-to-screen` 后，又完整渲染了上游 `animated-reel-20s` 示例，实际视频轨为 21.00 秒、630 帧、960 × 540，编码为 H.264。 |
| 本地剪辑 | FFmpeg 和 ffprobe 可从终端调用。从上游示例截取 1 秒，重编码为 H.264 / AAC 立体声，并完整解码验证。 |
| T3 Code (Beta).app | 安装版本 0.1.11，包含 Apple Silicon 可执行文件。安装包通过 Homebrew Cask 的 SHA-256 校验，应用的开发者代码签名也已验证。[对应安装包](https://github.com/pingdotgg/t3code/releases/download/v0.1.11/T3-Code-0.1.11-arm64.dmg) |
| OpenMausBot.app | 安装版本 0.1.178，包含 Apple Silicon 可执行文件。安装包通过发布者的 SHA-512 校验，应用的开发者代码签名也已验证。[对应安装包](https://github.com/milind-soni/OpenMausBot/releases/download/v0.1.178/OpenMausBot.dmg) |
| ThinkRail.app | 安装版本 0.4.0，包含 Apple Silicon 可执行文件。安装包通过 Homebrew Cask 的 SHA-256 校验，应用的开发者代码签名也已验证。[对应安装包](https://github.com/JetBrains/thinkrail/releases/download/v0.4.0/thinkrail-desktop-darwin-arm64.dmg) |
| Vorssaint.app | 安装版本 3.4.4，包含 Apple Silicon 可执行文件。安装包通过 Homebrew Cask 的 SHA-256 校验，应用的开发者代码签名也已验证。[对应安装包](https://github.com/vorssaint/vorssaint-utils/releases/download/v3.4.4/Vorssaint-3.4.4.dmg) |

本次功能测试使用本地素材。桌面应用已安装并核对签名。需要账号的云端办公、Seedance、可灵和云端 3D 生成功能仍需使用者自己的授权与额度。

## 在另一台机器复用 Skill

下面三条命令使用 Codex 自带的安装器，须在具备 Python 3 和该安装器的终端里运行。独立应用的安装入口见上表。

```sh
installer="${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py"
python3 "$installer" --repo gamedev-skills/awesome-gamedev-agent-skills --ref c6ca6c41c839b68319ffc08430b99ab768debc32 --path skills/genres/platformer skills/genres/roguelike skills/genres/rpg skills/genres/fps-shooter skills/genres/tower-defense skills/genres/card-game skills/genres/visual-novel skills/genres/survival-crafting skills/genres/puzzle
python3 "$installer" --repo patch-gg/pixelfx --ref 5294518ce7c72e48b6100a744596e0acf57f2826 --path skills/pixelfx
python3 "$installer" --repo OpenMontageInc/OpenMontage --ref 2e003e65fa99a0f329478a2c1cdcf26bc481933a --path .agents/skills/3d-asset-generation .agents/skills/seedance-2-5 .agents/skills/kling-official .agents/skills/video-edit
```
