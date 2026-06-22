# Architecture

## Core idea

仓库当前不是训练框架，而是一个静态实验工作台：

- `datasets/` 负责保存训练输入与来源摘要
- `scripts/` 负责准备数据和生成前端展示资源
- `web/` 负责本地试听、说明展示和 benchmark 结果承载

## Single entry

当前只维护一个正式页面入口：`web/index.html`

页面内部包含三个功能区：

1. 原始样本试听
2. 数据集说明
3. benchmark 结果占位

这样可以避免过去的几类冗余：

- 多入口页面并行演化
- 多份 JS 各自硬编码数据
- 多份 CSS 各自维护视觉层
- `results.json` 与 `test-cases.json` 的重复维护

## Frontend data sources

前端只读取三份 JSON：

- `web/data/raw-samples.json`
- `web/data/dataset-overview.json`
- `web/data/benchmark-results.json`

目标是让页面层不再维护自己的“私有真相”。

## Media layout

所有可展示媒体统一落在：

- `web/media/audio/`
- `web/media/spectrograms/`

其中：

- `raw/` 用于原始样本试听
- `cosyvoice/` 与 `vits/` 预留给真实模型结果回填

## Script alignment

`scripts/generate_sample_spectrograms.py` 的默认输出路径已经对齐到 `web/media/...`，这样生成脚本和页面引用使用同一套路径约定。
