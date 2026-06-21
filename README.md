# codex-tts

一个面向中文 TTS 实验的轻量项目，用来低成本地对比不同语音合成方案的效果，并把结果整理成可试听、可记录、可扩展的本地网页工作台。

当前项目重点围绕这些事情展开：

- 使用统一测试文本，对比 `CosyVoice`、`VITS`，并为后续接入 `VALL-E` 类方法预留结构
- 在云端 GPU 上做推理或小规模 fine-tuning，在本地 Windows 环境中整理数据、管理结果和试听对比
- 用 `web/` 下的静态页面展示测试用例、音频结果、主观评分和备注

## 项目结构

```text
project0/
  web/                   本地对比页面
    index.html
    styles.css
    app.js
    data/
      test-cases.json    测试文本
      results.json       模型结果与评分占位
  datasets/              数据集目录
    raw/                 原始数据
    processed/           处理后数据
  server-notes/          云端环境和连接笔记
  TTS_BENCHMARK_PLAN.md  整体实验计划
  DATASET_PLAN.md        数据准备计划
  PUBLIC_DATASET_OPTIONS.md
  PROJECT_RULES.md
```

## 当前工作流

1. 在本地整理测试文本、数据目录和结果 JSON。
2. 在云端 GPU 环境中运行 TTS 推理或微调实验。
3. 把生成的音频下载回本地，放入 `web/audio/` 对应目录。
4. 用本地网页统一试听、打分和记录备注。

## 本地使用

直接用浏览器打开 [web/index.html](/D:/codex/project0/web/index.html) 即可查看当前对比页面。

如果后续补充了真实音频文件，只需要同步更新 `web/data/results.json` 中的 `audioPath`、评分和备注，就可以继续复用同一套页面做对比。

## 当前状态

- 已准备测试用例和结果占位数据
- 已建立原始数据、处理数据和网页展示的基础目录
- 已整理云端 GPU、MobaXterm 和数据准备相关笔记

这个仓库当前更偏向实验基建与流程整理，后续可以继续补充真实音频样例、训练脚本、自动化评测和更完整的实验记录。
