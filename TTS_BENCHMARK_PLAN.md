# TTS 微调与效果对比计划

## 1. 项目目标

搭建一套低学习成本、低经济成本的 TTS 实验流程，用来对比 VITS、CosyVoice，以及后续可能加入的 VALL-E 类方法。

这个项目要支持：

- 在云端 GPU 服务器上进行模型推理或小规模微调。
- 使用同一批测试文本生成标准化音频样例。
- 把云端生成的音频下载到本地 Windows 电脑。
- 用本地网页展示不同模型的合成效果。
- 记录主观评分、备注和后续可扩展的客观指标。

## 2. 当前实现条件

- 本地电脑是 Windows。
- 本地没有 NVIDIA 显卡。
- 本地电脑主要负责：
  - 整理数据集。
  - 编辑文本和元数据。
  - 开发网页展示页面。
  - 浏览和对比生成结果。
- 模型训练、微调和较重的推理任务放到云端 GPU 机器上。
- 本地和服务器通讯使用 MobaXterm，主要用到：
  - SSH 终端。
  - SFTP 文件传输。
  - SSH tunnel，用于访问远程 Gradio、FastAPI、Jupyter 等网页服务。

## 3. 低成本平台策略

### 起步推荐

第一阶段优先使用按小时计费的 GPU 租赁平台，例如 AutoDL、恒源云、趋动云或类似服务。

原因：

- 学习成本比直接管理阿里云 GPU ECS 低。
- 通常有现成的 PyTorch/CUDA 镜像。
- 开机、关机、上传文件、下载结果更直接。
- 更适合短时间实验、小数据微调和快速试错。

### 什么时候再考虑阿里云 ECS

阿里云 GPU ECS 更适合后续阶段，例如：

- 需要长期运行公网服务。
- 需要稳定域名或固定公网访问。
- 需要多人协作。
- 需要更接近生产环境的部署方式。

第一阶段不建议直接上阿里云 GPU ECS，因为会额外增加驱动、CUDA、安全组、磁盘、网络和费用管理的复杂度。

## 4. 推荐 GPU 配置

起步优先考虑：

- RTX 3090 24GB
- RTX 4090 24GB
- NVIDIA A10 24GB

第一阶段不建议租 A100/H100，成本太高，容易把预算花在环境配置和试错上。

T4 16GB 可以用于轻量推理，但做微调会比较吃紧。

## 5. 总体工作流

```text
Windows 本地电脑
  |
  | MobaXterm SSH / SFTP
  v
云端 GPU 服务器
  - 配置环境
  - 跑预训练模型推理
  - 跑小规模微调
  - 导出 wav 音频
  |
  | SFTP 下载结果
  v
Windows 本地网页对比页面
```

核心原则是：**本地做轻任务，云端只做真正需要 GPU 的任务。**

## 6. 阶段计划

### 第 1 周：本地音频对比网页

目标：先做一个本地静态网页，用来对比不同 TTS 方法生成的音频。

任务：

- 固化项目计划文档。
- 创建一个本地网页对比界面。
- 支持切换测试用例。
- 支持按模型筛选。
- 展示测试文本、模型名称、音频播放器、备注和评分。
- 定义统一的结果目录和 JSON 数据格式。

交付物：

- 一个可以直接用浏览器打开的本地 HTML 页面。

### 第 2 周：CosyVoice 预训练模型推理

目标：先在云端 GPU 上跑通 CosyVoice 预训练推理，不急着微调。

任务：

- 按小时租一台 GPU 机器。
- 使用 MobaXterm 连接服务器。
- 准备 Python/PyTorch/CUDA 环境。
- 跑通 CosyVoice 预训练推理。
- 使用固定测试文本生成音频。
- 下载生成的 wav 文件。
- 把 CosyVoice 结果加入本地对比网页。

交付物：

- 一组 CosyVoice 生成音频。
- 网页中可以试听这些结果。

### 第 3 周：VITS 小数据微调

目标：用小规模单说话人数据微调一个 VITS baseline。

任务：

- 准备 30 分钟到 2 小时的干净单说话人音频。
- 统一音频格式。
- 准备 metadata。
- 跑 VITS 预处理。
- 启动小规模微调实验。
- 使用同一批测试文本生成结果。
- 下载生成音频。
- 把 VITS 结果加入本地对比网页。

交付物：

- 一组 VITS 微调后的生成音频。
- 可以和 CosyVoice 在同一网页中横向对比。

### 第 4 周：统一评价和结果格式

目标：让实验结果可以重复、可追踪、方便扩展。

任务：

- 固化结果 JSON 格式。
- 增加主观评分字段：
  - 自然度。
  - 音色相似度。
  - 发音准确度。
- 增加基础客观元数据：
  - 生成耗时。
  - 音频时长。
  - 使用的 checkpoint。
  - 备注。
- 固定一批测试用例。

交付物：

- 稳定的本地 benchmark 目录结构。
- 后续新增模型时，只需要补充音频和 JSON 结果。

## 7. 暂缓内容

VALL-E 类模型先不要放在第一阶段。

原因：

- 模型和依赖链通常更复杂。
- 涉及 codec、tokenizer、语言模型等更多环节。
- 作为第一个实验对象不利于控制学习成本。

后续可考虑的方向：

- VALL-E 开源变体。
- Amphion 相关 recipe。
- VoiceCraft。
- F5-TTS / E2-TTS 类方法。

## 8. 标准目录结构

```text
project0/
  DATASET_PLAN.md
  PROJECT_RULES.md
  PUBLIC_DATASET_OPTIONS.md
  TTS_BENCHMARK_PLAN.md
  web/
    index.html
    styles.css
    app.js
    data/
      test-cases.json
      results.json
    audio/
      cosyvoice/
      vits/
      valle/
  datasets/
    raw/
    processed/
  server-notes/
    mobaxterm.md
    gpu-setup.md
```

## 9. 结果数据格式

每条生成音频结果建议使用下面的结构描述：

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

- `caseId`：测试用例 ID。
- `model`：模型名称。
- `audioPath`：网页中使用的本地音频路径。
- `speaker`：说话人标识。
- `checkpoint`：使用的预训练模型或微调 checkpoint。
- `generationTimeSec`：生成耗时，单位为秒。
- `naturalness`：自然度评分。
- `similarity`：音色相似度评分。
- `pronunciation`：发音准确度评分。
- `notes`：主观备注或错误记录。

## 10. 成本控制规则

- 第一阶段使用按小时计费的 GPU 租赁平台。
- 不要一开始就租包月 GPU 服务器。
- 先跑预训练推理，再做微调。
- 第一批数据集保持小规模。
- 每次实验结束后及时关闭 GPU 机器。
- 删除云端机器前，先下载 checkpoint、日志和生成音频。
- 本地网页开发不依赖 GPU，尽量在 Windows 本地完成。

## 11. 数据集策略

详细数据准备计划见 `DATASET_PLAN.md`，公开数据集对比见 `PUBLIC_DATASET_OPTIONS.md`。

第一阶段不自己录制，优先使用公开中文单说话人 TTS 数据集。默认优先尝试标贝中文标准女声音库，先抽取 1 到 2 小时做 VITS fine-tuning。CosyVoice 起步仍然先做 pretrained inference。
