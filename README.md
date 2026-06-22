# codex-tts

一个面向中文 TTS 实验的轻量仓库。当前重点不是训练系统工程化，而是把“数据整理 -> 原始样本检查 -> 模型结果回填 -> 本地试听对比”这条链路压成一个低摩擦工作台。

## 当前状态

截至 2026-06-22，仓库已经收敛为单入口静态工作台：

- 唯一正式页面入口是 `web/index.html`
- 页面同时承载原始样本试听、数据集说明和 benchmark 结果占位
- 原始样本数据来自 `web/data/raw-samples.json`
- 数据集说明来自 `web/data/dataset-overview.json`
- benchmark 占位结果来自 `web/data/benchmark-results.json`
- 原始音频与频谱图统一落在 `web/media/`

## 精简后的目录结构

```text
project0/
  web/
    index.html
    assets/
      css/app.css
      js/app.js
    data/
      raw-samples.json
      dataset-overview.json
      benchmark-results.json
    media/
      audio/
        raw/
        cosyvoice/
        vits/
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
  tests/
    app.test.mjs
    test_generate_sample_spectrograms.py
  docs/
    project/
      architecture.md
      workflow.md
```

## 哪些目录才是主线

日常只需要重点看下面四块：

- `web/`: 唯一正式页面入口和前端静态资源
- `datasets/`: 数据集输入、公开数据清单和后续预处理落点
- `scripts/`: 数据准备与试听资源生成脚本
- `tests/`: 页面与脚本的回归校验

下面这些内容不是业务主线：

- `docs/project/`: 面向项目本身的结构与流程说明
- `server-notes/`: 云端 GPU 和传输工具使用笔记
- `.github/`: GitHub Pages 自动部署配置

下面这些属于过程产物或一次性输出，已经被视为非核心并默认忽略：

- `outputs/`
- `docs/superpowers/`
- `.tmp/`
- `.tmp-tests/`
- `.pytest_cache/`
- `__pycache__/`

## 页面职责

### `web/index.html`

唯一入口页面，内部包含三块内容：

- 试听工作台
- 数据集说明
- benchmark 结果占位

### `web/data/raw-samples.json`

首页原始样本数据源，字段包括：

- `dataset`
- `samples`

### `web/data/dataset-overview.json`

数据集说明数据源，负责承载：

- 数据集摘要
- 字段说明
- 当前子集说明
- 当前目录结构

### `web/data/benchmark-results.json`

模型 benchmark 占位数据源，当前仍以人工回填为主。

## 脚本

### `scripts/prepare_aishell3.py`

从 AISHELL-3 中整理 `speaker_a` 子集，生成：

- `datasets/raw/speaker_a/metadata.csv`
- `datasets/raw/speaker_a/source_summary.json`
- `datasets/raw/public/aishell3/manifest.csv`
- `datasets/raw/public/aishell3/speaker_summary.csv`

### `scripts/generate_sample_spectrograms.py`

生成首页试听所需的静态资源，默认输出到：

- `web/media/audio/raw/`
- `web/media/spectrograms/`
- `web/data/raw-samples.json`

运行方式：

```powershell
python scripts/generate_sample_spectrograms.py
```

## 本地预览

建议通过本地 HTTP 服务打开，而不是直接双击 `file://`：

```powershell
python -m http.server 8000
```

然后访问：

- `http://127.0.0.1:8000/web/index.html`

如果直接以 `file://` 打开，页面会回退到内置样本数据。

## 后续推荐顺序

1. 跑一轮 `CosyVoice` 最小推理并回填 `benchmark-results.json`
2. 补实验日志模板
3. 基于现有 `speaker_a` 数据跑一轮 `VITS` baseline
4. 再决定是否扩展更多模型或更多数据集

更多结构说明见 [docs/project/architecture.md](docs/project/architecture.md) 和 [docs/project/workflow.md](docs/project/workflow.md)。
