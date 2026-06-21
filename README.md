# codex-tts

一个面向中文主线 TTS 实验的轻量仓库。当前重点不是训练系统工程化，而是先把“数据整理 -> 原始样本检查 -> 模型结果回填 -> 本地试听展示”这条闭环跑通。

## 当前进度

截至 `2026-06-22`，项目已经进入“静态展示工作台可用，中文 baseline 数据已落地，等待真实模型结果接入”的阶段。

已完成：

- 首页工作台已切到原始样本模式：`web/index.html`
- 数据集说明子页已可用：`web/dataset.html`
- 项目介绍 deck 已产出：`outputs/tts-project-deck/index.html`
- 已固定 `15` 条测试文本，并保留未来模型对比用的 `web/data/results.json`
- 已从 AISHELL-3 抽取单说话人子集 `speaker_a`
- 当前本地已有 `467` 条训练音频、`metadata.csv` 和 `source_summary.json`
- 已加入 `scripts/prepare_aishell3.py` 做数据准备
- 已加入 `scripts/generate_sample_spectrograms.py` 做离线 STFT 频谱生成
- 已生成首页展示用的原始 wav、频谱图和 `web/data/raw-samples.json`

未完成：

- `CosyVoice` 真实推理结果尚未回填
- `VITS` baseline 真实结果尚未回填
- 实验日志模板还没建好
- 自动化评测脚本还没开始

## 当前可展示页面

- `web/index.html`
  当前展示 `speaker_a` 的真实原始语音、文本、频谱图、数据集摘要，以及 `CosyVoice` / `VITS` 的空状态占位。
- `web/dataset.html`
  当前展示 AISHELL-3 -> `SSB0005` -> `speaker_a` 这条子集的说明信息。
- `outputs/tts-project-deck/index.html`
  对外演示用网页 deck。

如果只统计 `web/` 内正式页面，当前有 `2` 个可直接展示的页面。

## 关键目录

```text
project0/
  web/
    index.html
    dataset.html
    app.js
    dataset.js
    styles.css
    dataset.css
    data/
      results.json
      raw-samples.json
    audio/
      raw/
      cosyvoice/
      vits/
    assets/
      spectrograms/
  datasets/
    raw/
      speaker_a/
        metadata.csv
        source_summary.json
        wavs/
    processed/
  scripts/
    prepare_aishell3.py
    generate_sample_spectrograms.py
  skills/
    tts-raw-audio-workbench/
```

## 当前页面职责

- `web/index.html`
  主页仍然是未来“模型效果对比”的入口，但当前阶段只展示真实原始语音，不伪造模型结果。
- `web/dataset.html`
  数据集说明子页，负责讲清当前子集来源、规模和用途。
- `web/data/results.json`
  只保留给未来模型对比结果使用。
- `web/data/raw-samples.json`
  只服务首页原始样本浏览。

## 当前工作流

1. 用 `scripts/prepare_aishell3.py` 整理单说话人子集。
2. 用 `scripts/generate_sample_spectrograms.py` 生成首页展示资产。
3. 在首页检查原始语音、文本和频谱图。
4. 在云端 GPU 环境中跑 `CosyVoice` 推理或 `VITS` baseline。
5. 把生成的 wav 下载到本地 `web/audio/<model>/`。
6. 更新 `web/data/results.json`，接入真实模型结果。
7. 继续在同一个前端入口里做试听、备注和后续对比展示。

## 重新生成原始样本与频谱

先在仓库根目录运行：

```powershell
python scripts/generate_sample_spectrograms.py
```

默认会更新：

- `web/audio/raw/`
- `web/assets/spectrograms/`
- `web/data/raw-samples.json`

页面验证建议通过本地 HTTP 打开，而不是直接双击 `file://`：

```powershell
python -m http.server 8000
```

然后访问：

- `http://127.0.0.1:8000/web/index.html`
- `http://127.0.0.1:8000/web/dataset.html`

## 仓库内 Skill

这次已经把“原始样本工作台刷新流程”整理成仓库内 skill：

- `.codex/skills/tts-raw-audio-workbench/SKILL.md`

这个 skill 适合在以下场景复用：

- 需要刷新首页原始样本
- 需要重生成频谱图
- 需要维护 `raw-samples.json`
- 需要继续保持“主页展示原始音频，模型结果先空着”的产品约束

## 下一步

建议按这个顺序继续：

1. 完成一轮 `CosyVoice` 最小闭环推理并回填页面
2. 补实验日志模板
3. 基于现有 `speaker_a` 跑一轮 `VITS` baseline
4. 再决定是否扩到更多语言或更多模型
