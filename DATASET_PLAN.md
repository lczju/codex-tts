# 数据集准备计划

## 1. 当前磁盘空间判断

当前项目位于：

```text
D:\codex\project0
```

本机磁盘情况：

```text
C:\  剩余约 8.5GB
D:\  剩余约 376.8GB
```

结论：

- `D:` 盘空间足够支撑第一阶段和第二阶段实验。
- `C:` 盘空间偏紧，不建议把数据集、模型权重、conda 环境、pip 缓存放到 C 盘。
- 后续所有项目数据优先放在 `D:\codex\project0` 下。

## 2. 现在要不要立刻下载数据集

暂时不建议马上下载大数据集。

当前优先级应该是：

1. 先固定测试文本。
2. 先跑通网页对比页面的数据格式。
3. 第 2 周先用 CosyVoice pretrained checkpoint 做 inference。
4. 第 3 周再准备 VITS 小规模 fine-tuning 数据。

原因：

- CosyVoice 起步可以先做 pretrained inference，不需要立刻下载大规模训练集。
- VITS 微调第一版只需要 30 分钟到 2 小时的干净单说话人语音。
- 大数据集会占用下载时间、整理时间和云端上传时间，第一阶段收益不高。

## 3. 第一阶段建议数据量

### 最小可行数据量

用于 VITS 小规模微调：

```text
30 分钟到 1 小时
```

适合目标：

- 跑通数据处理流程。
- 跑通训练脚本。
- 得到可展示的 baseline 结果。

### 更稳妥的数据量

用于初步提升音色稳定性：

```text
1 小时到 2 小时
```

适合目标：

- 单说话人微调。
- 和 CosyVoice pretrained inference 做初步对比。
- 观察发音、韵律、音色相似度。

### 暂不建议的数据量

第一阶段暂不建议下载：

```text
10 小时以上的大数据集
```

原因：

- 数据清洗成本明显增加。
- 上传云端耗时更长。
- GPU 训练成本更高。
- 还没有必要为了第一版网页展示引入这么大规模的数据。

## 4. 音频空间估算

未压缩 wav 的大致体积：

```text
24kHz / 16-bit / mono 约 173MB / 小时
44.1kHz / 16-bit / mono 约 318MB / 小时
48kHz / 16-bit / mono 约 346MB / 小时
```

考虑到还会产生 processed 数据、切片、日志、checkpoint、生成音频，建议按下面的倍数预留：

```text
原始音频体积 x 3 到 x 5
```

示例：

```text
2 小时 24kHz wav 原始音频约 350MB
实际项目预留 2GB 到 3GB 比较舒服
```

所以以当前 `D:` 盘剩余约 376GB 来看，第一阶段完全够用。

## 5. 推荐目录

原始数据：

```text
datasets/raw/speaker_a/
```

处理后的数据：

```text
datasets/processed/speaker_a/
```

本地网页展示音频：

```text
web/audio/cosyvoice/
web/audio/vits/
```

云端下载回来的结果优先放在 `web/audio/`，训练原始数据和中间数据优先放在 `datasets/`。

## 6. 数据来源建议

第一阶段优先级：

1. 使用公开中文单说话人 TTS 数据集。
2. 从公开数据集中抽取 1 到 2 小时作为第一轮实验数据。
3. 暂缓下载大型多说话人数据集。

当前不采用自己录制的方案。

优先候选：

```text
标贝中文标准女声音库（DataBaker / Biaobei）
```

详细公开数据集对比见 `PUBLIC_DATASET_OPTIONS.md`。

如果使用公开数据集，建议：

- 优先选择单说话人。
- 优先选择 TTS 专用数据集，而不是 ASR 数据集。
- 每条音频 3 到 12 秒较合适。
- 文本和音频必须一一对应。
- 注意许可证，尤其区分非商用和可商用。

## 7. 下一步任务

下一步不急着下载大数据集。

已完成：

- 固定 10 到 20 条网页展示用测试文本。
- 在 `web/data/results.json` 中补齐 CosyVoice 和 VITS 的占位结果。
- 准备一个 `datasets/raw/speaker_a/metadata.csv` 模板。

当前状态：

```text
固定测试文本：15 条
占位结果：CosyVoice 15 条，VITS 15 条
metadata 模板：datasets/raw/speaker_a/metadata.csv
原始音频目录：datasets/raw/speaker_a/wavs/
```

继续保持：

- 确认后续所有下载、缓存、模型权重都放到 `D:` 盘。

下一步建议：

- 下载或获取标贝中文标准女声音库。
- 先抽取 `1 到 2 小时` 的单说话人音频。
- 每条音频尽量控制在 `3 到 12 秒`。
- 把抽取后的 wav 文件放到 `datasets/raw/speaker_a/wavs/`。
- 在 `metadata.csv` 里填写每个 wav 对应的文本。
