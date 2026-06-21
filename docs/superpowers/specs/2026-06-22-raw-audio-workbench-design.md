# 原始语音工作台设计

**日期：** 2026-06-22

## 目标

在保留“模型效果对比工作台”主定位的前提下，先把主页面升级为一个可展示真实数据的静态工作台：当前阶段主页面展示 `speaker_a` 的原始语音样本、文本、基础元数据和对应频谱图；模型结果区域保留为空状态；数据集详情继续由独立子页面承载。

## 背景与现状

- 当前主页面 [web/index.html](/D:/codex/project0/web/index.html) 主要围绕 `results.json` 渲染模型结果。
- 当前数据集详情页 [web/dataset.html](/D:/codex/project0/web/dataset.html) 已能展示 AISHELL-3 子集说明，但内容仍是硬编码前端数据。
- 仓库已经具备 `speaker_a` 的真实原始语音数据：
  - [datasets/raw/speaker_a/metadata.csv](/D:/codex/project0/datasets/raw/speaker_a/metadata.csv)
  - [datasets/raw/speaker_a/wavs](/D:/codex/project0/datasets/raw/speaker_a/wavs)
- 仓库尚未接入 CosyVoice / VITS 的真实推理结果，因此主页面不能假装已有模型对比。

## 用户确认的约束

- 主页面仍然是“模型效果对比”的入口页面。
- 当前没有模型结果时，主页面应优先展示原始语音。
- 数据集详情保留为子页面。
- 样例频谱由本地 Python 脚本离线生成，脚本必须保留在仓库中。
- 主页面的原始语音区域采用可滚动列表，而不是只显示单条样本。

## 推荐方案

采用“静态资产 + JSON 驱动”的实现方式：

- Python 脚本读取 `speaker_a` 的 metadata 和 wav 文件。
- 脚本离线生成一批可展示样本的 STFT 频谱 PNG。
- 脚本同时生成主页面消费的样本清单 JSON。
- 前端静态页面只负责读取 JSON 和切换展示，不在浏览器内做频谱计算。

这样可以保持项目当前“纯静态页面 + 本地脚本”的低复杂度特点，也便于后续替换为模型生成结果。

## 页面信息架构

### 1. 主页面

主页面继续使用 [web/index.html](/D:/codex/project0/web/index.html)，但结构调整为三块：

- 左侧或上方导航区
  - 页面标题
  - 页面说明
  - 跳转到数据集详情页的入口
  - 当前阶段说明：原始语音已接入，模型结果待补充
- 主内容区
  - 原始语音样本滚动列表，默认展示约 `10` 条 `speaker_a` 样本
  - 每条样本可看到：
    - `utt_id`
    - 文本
    - 音频播放器
    - 简短元数据，如时长、语言、说话人
- 侧栏区
  - 当前选中样本的大图频谱
  - 数据集摘要卡片
  - 模型结果占位卡片：
    - `CosyVoice`：待接入
    - `VITS`：待接入

### 2. 数据集详情子页面

继续使用 [web/dataset.html](/D:/codex/project0/web/dataset.html)。

本次只做两类调整：

- 修正文案编码与展示质量
- 使数据集摘要与实际 `speaker_a` 提取结果保持一致

不在这一轮引入复杂交互；它仍然是说明页，而不是分析工作台。

## 数据模型设计

### 1. 保留现有 `results.json`

[web/data/results.json](/D:/codex/project0/web/data/results.json) 继续只服务“测试用例 + 模型结果”这条链路，不把原始语音样本硬塞进去。

原因：

- 原始语音和模型结果是两类不同实体。
- 强行复用会让字段语义混乱，例如 `caseId`、`checkpoint`、评分字段都不适合原始语音。
- 后续真正接入模型结果时，保留边界更利于维护。

### 2. 新增原始样本 JSON

新增文件：

- [web/data/raw-samples.json](/D:/codex/project0/web/data/raw-samples.json)

建议结构：

```json
{
  "dataset": {
    "name": "AISHELL-3 speaker_a subset",
    "speakerId": "speaker_a",
    "sourceSpeakerId": "SSB0005",
    "sampleCount": 10
  },
  "samples": [
    {
      "uttId": "SSB00050001",
      "text": "广州女大学生登山失联四天警方找到疑似女尸",
      "audioPath": "./audio/raw/SSB00050001.wav",
      "spectrogramPath": "./assets/spectrograms/SSB00050001.png",
      "speakerId": "speaker_a",
      "language": "zh",
      "durationSec": 4.72
    }
  ]
}
```

其中：

- `audioPath` 指向网页可访问路径
- `spectrogramPath` 指向预生成 PNG
- `durationSec` 便于页面做轻量展示

## 目录与文件职责

### 新增

- `web/data/raw-samples.json`
  - 主页面展示原始语音样本的数据源
- `web/assets/spectrograms/`
  - 存放频谱图 PNG
- `web/audio/raw/`
  - 存放复制后的原始语音展示样本
- `scripts/generate_sample_spectrograms.py`
  - 从 `speaker_a` 元数据中挑选展示样本、复制音频、生成频谱、输出 JSON

### 修改

- `web/index.html`
  - 调整布局，加入原始语音列表、频谱展示、数据集摘要、模型空态
- `web/styles.css`
  - 新布局和状态样式
- `web/app.js`
  - 从“只认模型结果”扩展为“原始语音 + 模型结果空态”的双区渲染
- `web/dataset.html`
  - 修正导航或入口文案
- `web/dataset.js`
  - 修正文案，并与真实 `speaker_a` 数据对齐

## Python 频谱脚本设计

### 目标

脚本负责离线准备静态展示素材，而不是做通用训练预处理。

### 输入

- [datasets/raw/speaker_a/metadata.csv](/D:/codex/project0/datasets/raw/speaker_a/metadata.csv)
- [datasets/raw/speaker_a/wavs](/D:/codex/project0/datasets/raw/speaker_a/wavs)

### 输出

- `web/audio/raw/*.wav`
- `web/assets/spectrograms/*.png`
- `web/data/raw-samples.json`

### 选择策略

第一轮只选 `10` 条样本，保证主页面密度适中。选择策略尽量简单稳定：

- 按 metadata 顺序取前 `10` 条
- 后续若需要更具代表性的覆盖，再扩展为按文本长度、数字句、长句等规则抽样

### 依赖

优先采用本地常见 Python 方案：

- `numpy`
- `matplotlib`
- `scipy`

若环境中缺少其中某个包，脚本应给出明确报错说明。当前阶段不引入复杂音频分析框架。

### 频谱形式

使用 STFT 生成标准时频图：

- 横轴：时间
- 纵轴：频率
- 颜色：幅度或对数能量

图像风格以清晰可读为优先，不追求研究级可调参数。

## 错误处理

### 脚本侧

- metadata 缺失时直接报错退出
- 某条 wav 缺失时跳过该条并打印警告
- 频谱生成失败时打印样本 ID，继续处理其他样本

### 前端侧

- `raw-samples.json` 加载失败时显示空状态说明
- 某条音频缺失时显示“音频未生成”
- 某条频谱缺失时显示“频谱未生成”
- 模型结果区统一显示“待接入”空态，不误导为已有结果

## 编码与内容质量

本次必须一并处理现有中文乱码问题，至少覆盖以下文件：

- [README.md](/D:/codex/project0/README.md)
- [web/index.html](/D:/codex/project0/web/index.html)
- [web/app.js](/D:/codex/project0/web/app.js)
- [web/dataset.html](/D:/codex/project0/web/dataset.html)
- [web/dataset.js](/D:/codex/project0/web/dataset.js)
- [web/data/results.json](/D:/codex/project0/web/data/results.json)

目标不是全面润色所有文档，而是确保本轮涉及的前端页面和数据文件在浏览器中是稳定可展示的正常中文。

## 验收标准

满足以下条件即可视为本轮完成：

1. 主页面可以展示约 `10` 条原始语音样本。
2. 每条样本可直接试听。
3. 切换当前样本时，文本、音频、频谱同步更新。
4. 主页面能看到数据集摘要和模型空态卡片。
5. 子页面继续能查看 AISHELL-3 / `speaker_a` 的数据集说明。
6. 频谱生成脚本可重复执行，并重新产出 JSON 与 PNG。
7. 页面中的中文不再出现明显乱码。

## 不在本轮范围内

- 接入真实 CosyVoice 推理结果
- 接入真实 VITS 微调结果
- 加入后端服务或数据库
- 在浏览器内实时计算频谱
- 加入主观评分持久化或复杂筛选器

## 后续演进路径

完成本轮后，下一步可以自然扩展为：

1. 把 `CosyVoice` 结果接入 `results.json`
2. 在原始语音和模型结果之间建立同文本或同类型映射
3. 再接入 `VITS` 小规模微调结果
4. 最后恢复主页面真正的“对比工作台”定位
