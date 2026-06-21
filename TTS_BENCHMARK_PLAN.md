# TTS 微调与效果对比计划

## 1. 项目目标

搭建一套面向中文主线、可重复、便于试听对比和对外展示的 TTS 实验流程。当前优先级不是扩展训练系统，而是先把本地展示工作台和云端推理结果回填这条闭环做扎实。

项目当前要支持：

- 在云端 GPU 机器上运行 `CosyVoice` 推理或 `VITS` baseline
- 使用同一批测试文本生成标准化音频样例
- 把结果下载回本地 Windows 环境统一试听和整理
- 用静态网页展示原始样本、模型结果、备注和后续主观对比

## 2. 当前实际状态

截至 `2026-06-22`，项目状态如下：

已完成：

- 首页工作台 `web/index.html` 已重构为原始语音展示入口
- 数据集说明页 `web/dataset.html` 已可用
- 演示 deck `outputs/tts-project-deck/index.html` 已产出
- 已固定 `15` 条测试文本
- `web/data/results.json` 已保留为未来模型对比数据源
- AISHELL-3 单说话人子集 `speaker_a` 已落地，当前有 `467` 条训练音频
- `scripts/prepare_aishell3.py` 已可复用
- `scripts/generate_sample_spectrograms.py` 已可离线生成首页需要的 wav、频谱图和 `raw-samples.json`

仍未完成：

- `CosyVoice` 真实推理结果回填
- `VITS` baseline 回填
- 实验日志模板
- 自动化评测脚本

## 3. 当前页面策略

### 主页面

`web/index.html` 仍然是未来“模型效果对比”的主入口，但当前阶段不伪造模型结果，只展示真实原始样本：

- 原始语音列表
- 当前选中样本详情
- 播放器
- 样例频谱图
- 数据集摘要
- `CosyVoice` / `VITS` 空状态占位

### 子页面

`web/dataset.html` 继续作为数据集说明页，负责解释：

- 数据来自 AISHELL-3
- 当前使用 `SSB0005`
- 仓库内映射为 `speaker_a`
- 当前样本规模和用途

## 4. 当前可展示成果

### 页面层

- `web/index.html`：原始样本工作台
- `web/dataset.html`：数据集说明子页
- `outputs/tts-project-deck/index.html`：项目介绍 deck

### 数据层

- `web/data/raw-samples.json`：首页原始样本数据
- `web/data/results.json`：未来模型结果占位数据
- `datasets/raw/speaker_a/metadata.csv`：当前训练子集元数据
- `datasets/raw/speaker_a/wavs/`：当前 `467` 条真实 wav
- `datasets/raw/speaker_a/source_summary.json`：数据来源摘要

## 5. 阶段计划更新

### 阶段 A：原始样本工作台

状态：已完成当前版本

已完成：

- 首页原始样本浏览
- 频谱图离线生成
- 数据集子页
- 模型占位状态
- 本地静态展示闭环

后续补强：

- 完成首页细节验证
- 继续统一中文编码
- 增加结果更新时间和数据版本提示

### 阶段 B：CosyVoice 最小闭环

状态：下一优先级

目标：

- 在云端 GPU 上对 `15` 条测试文本跑一轮 `CosyVoice` inference
- 下载生成 wav
- 回填到 `web/audio/cosyvoice/`
- 更新 `web/data/results.json`

### 阶段 C：VITS baseline

状态：数据已准备到可启动阶段

当前基础：

- `speaker_a` 数据已落地
- 当前规模约 `467` 条、约 `0.673` 小时

下一步：

- 选定具体 VITS 仓库
- 转换数据格式
- 跑通预处理、训练、推理
- 用相同 `15` 条测试文本生成可对比结果

### 阶段 D：实验记录与多语言扩展

状态：未开始

需要补齐：

- 实验日志模板
- 输出目录约定
- checkpoint 和样音命名规则
- 英文或更多语言测试文本与展示样例

## 6. 当前推荐执行顺序

1. 完成 `CosyVoice` 最小闭环
2. 补实验日志模板
3. 启动 `VITS` baseline
4. 再评估多语言扩展和更多模型接入

## 7. 暂缓内容

当前不建议优先做：

- 后端服务
- 数据库
- 多用户系统
- 长期在线部署
- 一开始就接入多个新模型
- 大规模自动化评测平台
