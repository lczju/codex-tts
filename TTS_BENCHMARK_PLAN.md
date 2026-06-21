# TTS 微调与效果对比计划

## 1. 项目目标

搭建一套低成本、可重复、便于试听对比的中文 TTS 实验流程，用来对比 `CosyVoice`、`VITS`，并为后续可能加入的 `VALL-E` 类方案预留位置。

这个项目要支持：

- 在云端 GPU 机器上运行推理或小规模微调
- 使用同一批测试文本生成标准化音频样例
- 将结果下载回本地 Windows 环境统一试听与记录
- 用静态网页展示测试文本、音频、备注和主观评分

## 2. 当前实际状态

截至 `2026-06-22`，项目状态如下：

- 已完成主试听评分页 `web/index.html`
- 已完成数据集展示页 `web/dataset.html`
- 已产出一个演示 deck：`outputs/tts-project-deck/index.html`
- 已固定 `15` 条测试文本，覆盖基础发音、数字时间、中英混合、英文、情绪、长句稳定性等场景
- 已生成 `CosyVoice` / `VITS` 占位结果 JSON
- 已完成 AISHELL-3 单说话人子集抽取，当前 `speaker_a` 有 `467` 条训练音频
- 已加入可复用的数据准备脚本 `scripts/prepare_aishell3.py`

仍未完成：

- 真实 `CosyVoice` 推理结果回填
- 真实 `VITS` baseline 回填
- 实验日志模板
- 自动化评测脚本
- 中文编码统一修复

## 3. 当前工作原则

- 本地只做轻任务：数据整理、页面展示、试听和评分
- 云端只做真正需要 GPU 的任务：推理、微调、批量导出音频
- 先跑通最小闭环，再扩模型、扩流程、扩工程复杂度

## 4. 当前可展示成果

### 页面层

- `web/index.html`：主工作台，已支持 case 切换、模型筛选、评分、备注、导入导出 JSON
- `web/dataset.html`：数据集说明页，展示 AISHELL-3 和当前抽取子集信息
- `outputs/tts-project-deck/index.html`：对外演示用网页 deck

### 数据层

- `web/data/results.json`：`15` 个测试用例，对应 `30` 条占位结果
- `datasets/raw/speaker_a/metadata.csv`：当前训练子集元数据
- `datasets/raw/speaker_a/wavs/`：已抽取 `467` 条真实 wav
- `datasets/raw/speaker_a/source_summary.json`：数据来源摘要

## 5. 阶段计划更新

### 阶段 A：展示工作台

状态：已完成基础版

已完成：

- 固定测试文本
- 建立结果 JSON 结构
- 实现主观评分字段
- 实现本地导入导出

后续补强：

- 修复编码
- 增加“当前数据版本 / 最后更新时间”提示
- 增加结果统计摘要

### 阶段 B：CosyVoice 最小闭环

状态：下一优先级

目标：

- 在云端 GPU 上对 `15` 条测试文本运行一轮 `CosyVoice` pretrained inference
- 下载生成的 wav
- 回填到 `web/audio/cosyvoice/`
- 更新 `web/data/results.json`

交付物：

- 一组真实 `CosyVoice` 样音
- 页面中可直接播放和评分的 `CosyVoice` 结果

### 阶段 C：VITS baseline

状态：数据已准备到可启动阶段

当前基础：

- `speaker_a` 数据已落地
- 当前规模约 `467` 条、约 `0.673` 小时

下一步：

- 确定 VITS 使用的具体代码仓库与预处理格式
- 将 `metadata.csv` 转为目标仓库需要的格式
- 跑通预处理、训练、推理
- 用相同 `15` 条测试文本生成对比结果

交付物：

- 一组真实 `VITS` baseline 样音
- 页面中可直接横向对比 `CosyVoice` / `VITS`

### 阶段 D：实验记录与扩展

状态：未开始

需要补齐：

- 实验日志模板
- 输出目录约定
- checkpoint 与样音命名规则
- 后续新增模型接入规则

## 6. 当前推荐执行顺序

建议严格按这个顺序推进：

1. 统一修正中文编码
2. 完成 `CosyVoice` 真实推理并接入页面
3. 补实验日志模板
4. 启动 `VITS` baseline
5. 评估是否需要接入更多模型或自动化评测

## 7. 暂缓内容

当前不建议优先做：

- 后端服务
- 数据库
- 多用户系统
- 长期在线部署
- 一开始就接入多个新模型
- 大规模自动化评测平台

## 8. 结果数据格式

每条生成音频结果使用如下结构：

```json
{
  "caseId": "case_001",
  "model": "CosyVoice",
  "audioPath": "audio/cosyvoice/case_001.wav",
  "speaker": "speaker_a",
  "checkpoint": "pretrained",
  "generationTimeSec": 1.42,
  "naturalness": null,
  "similarity": null,
  "pronunciation": null,
  "notes": ""
}
```

字段说明：

- `caseId`：测试用例 ID
- `model`：模型名称
- `audioPath`：网页可访问的相对音频路径
- `speaker`：说话人标识
- `checkpoint`：使用的模型版本或 checkpoint
- `generationTimeSec`：生成耗时
- `naturalness`：自然度评分
- `similarity`：音色相似度评分
- `pronunciation`：发音评分
- `notes`：备注
