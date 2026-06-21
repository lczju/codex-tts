# codex-tts

一个面向中文 TTS 实验的轻量仓库，用来以较低成本对比不同语音合成方案的效果，并把结果整理成可试听、可记录、可继续扩展的本地工作台。

当前重点围绕这些事情展开：

- 使用统一测试文本对比 `CosyVoice`、`VITS`，并为后续接入 `VALL-E` 类方法预留结构
- 在云端 GPU 机器上做推理或小规模 fine-tuning
- 在本地 Windows 环境中整理数据、管理结果、试听对比和记录评分
- 用 `web/` 下的静态页面承载测试文本、结果音频和主观评测

## 当前进度

截至 `2026-06-22`，项目已经从“纯文档规划”进入“展示工作台 + 数据准备已跑通”的阶段。

已完成：

- 主试听评分页已可用：`web/index.html`
- 数据集展示页已可用：`web/dataset.html`
- 项目介绍型网页 deck 已产出：`outputs/tts-project-deck/index.html`
- 已固定 `15` 条测试文本，并在 `web/data/results.json` 中生成 `CosyVoice` / `VITS` 占位结果
- 已创建 `web/audio/cosyvoice/`、`web/audio/vits/` 目录
- 已加入 AISHELL-3 单说话人数据准备脚本：`scripts/prepare_aishell3.py`
- 已从 AISHELL-3 抽取 `speaker_a` 数据，当前落地 `467` 条 wav 和对应 `metadata.csv`

未完成：

- 真实 `CosyVoice` 推理结果尚未回填到 `web/audio/cosyvoice/`
- 真实 `VITS` baseline 结果尚未回填到 `web/audio/vits/`
- 仓库内中文存在编码异常，影响文档和页面展示质量
- 还没有实验日志模板、训练脚本或自动化评测脚本

## 当前可展示页面

正式页面入口：

- `web/index.html`：TTS 试听、筛选、评分、导入导出 JSON
- `web/dataset.html`：AISHELL-3 / `speaker_a` 数据集说明页

补充展示页：

- `outputs/tts-project-deck/index.html`：项目介绍型演示 deck

如果只统计 `web/` 内页面，当前有 `2` 个可直接展示的页面。

## 项目结构

```text
project0/
  web/
    index.html              主试听评分页
    styles.css
    app.js
    dataset.html            数据集展示页
    dataset.css
    dataset.js
    data/
      test-cases.json
      results.json
    audio/
      cosyvoice/
      vits/
  datasets/
    raw/
      speaker_a/
        metadata.csv
        source_summary.json
        wavs/
    processed/
  scripts/
    prepare_aishell3.py
  outputs/
    tts-project-deck/
      index.html
  server-notes/
    gpu-setup.md
    mobaxterm.md
  TTS_BENCHMARK_PLAN.md
  DATASET_PLAN.md
  PUBLIC_DATASET_OPTIONS.md
  PROJECT_RULES.md
```

## 当前工作流

1. 在本地维护测试文本、结果 JSON 和展示页面
2. 在云端 GPU 环境中运行 `CosyVoice` 推理或 `VITS` 小规模微调
3. 将生成的 wav 下载回本地并放入 `web/audio/<model>/`
4. 更新 `web/data/results.json` 中的 `audioPath`、耗时、备注和评分
5. 在本地页面里统一试听、打分和对比

## 当前关键缺口

- `results.json` 里的 `audioPath` 目前仍为空，说明前端还没有接到真实实验结果
- 还没有形成“实验日志 -> 结果音频 -> 页面回填”的闭环记录
- 中文编码需要统一到 UTF-8，避免继续出现乱码

## 下一步建议

建议按下面顺序推进：

1. 先统一修正项目中文编码，避免文档和网页继续乱码
2. 先完成一轮 `CosyVoice` 最小闭环推理，把 `15` 条测试文本生成 wav 并回填页面
3. 再基于当前 `speaker_a` 数据做 `VITS` baseline
4. 增加实验日志模板，记录平台、GPU、命令、输入输出路径、耗时和成本
5. 最后再考虑接入更多模型或自动化评测
