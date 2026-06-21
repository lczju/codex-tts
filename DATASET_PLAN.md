# 数据集准备计划

## 1. 当前状态更新

截至 `2026-06-22`，数据准备已经从模板阶段进入“可直接支撑首页展示和 VITS baseline 启动”的阶段。

当前已完成：

- 已加入 AISHELL-3 数据准备脚本：`scripts/prepare_aishell3.py`
- 已生成公开数据清单与说话人汇总
- 已从 AISHELL-3 抽取单说话人子集 `speaker_a`
- `datasets/raw/speaker_a/metadata.csv` 已生成
- `datasets/raw/speaker_a/wavs/` 当前已有 `467` 条 wav
- `datasets/raw/speaker_a/source_summary.json` 已记录来源和抽取结果
- 已加入 `scripts/generate_sample_spectrograms.py`
- 已生成 `web/audio/raw/`、`web/assets/spectrograms/` 和 `web/data/raw-samples.json`

当前 `speaker_a` 摘要：

- 来源：AISHELL-3
- 选中说话人：`SSB0005`
- 仓库内映射：`speaker_a`
- 抽取条数：`467`
- 时长：约 `0.673` 小时
- 用途：作为首页原始样本来源，以及第一轮 `VITS` baseline 的单说话人训练子集

## 2. 当前磁盘与目录策略

项目路径：

```text
D:\codex\project0
```

继续保持以下原则：

- 所有数据、模型缓存、下载包优先放在 `D:` 盘
- 训练原始数据放在 `datasets/raw/`
- 预处理结果放在 `datasets/processed/`
- 展示音频放在 `web/audio/`
- 频谱图放在 `web/assets/spectrograms/`

推荐目录：

```text
datasets/downloads/
datasets/raw/public/aishell3/
datasets/raw/speaker_a/
datasets/processed/speaker_a/
web/audio/raw/
web/audio/cosyvoice/
web/audio/vits/
web/assets/spectrograms/
```

## 3. 当前数据工作流

当前实际采用两条用途不同的数据链路：

- 训练链路
  `datasets/raw/speaker_a/` -> 未来 `datasets/processed/speaker_a/` -> VITS baseline
- 展示链路
  `datasets/raw/speaker_a/` -> `scripts/generate_sample_spectrograms.py` -> `web/audio/raw/` + `web/assets/spectrograms/` + `web/data/raw-samples.json`

这样可以保证首页展示和模型训练解耦。

## 4. 现在是否还需要继续下载大数据集

当前不建议再立即扩充新的大数据集。

原因：

- 第一轮 `VITS` baseline 已经有可用子集
- 首页原始样本展示已经跑通
- 当前真正的瓶颈不在“缺数据”，而在“缺真实模型结果闭环”

## 5. 当前数据量判断

以第一轮 baseline 来看，当前 `0.673` 小时的单说话人数据：

- 足够用于跑通 VITS 训练链路
- 足够用于验证元数据格式和目录组织
- 足够支撑首页抽样展示

但也要明确：

- 这还不算稳定高质量训练规模
- 如果后续想明显提升音色稳定性和发音表现，建议扩到 `1` 到 `2` 小时

## 6. 当前数据格式

`datasets/raw/speaker_a/metadata.csv` 当前字段：

```text
utt_id,wav_path,text,speaker_id,language
```

说明：

- `wav_path` 使用相对路径，便于迁移
- `speaker_id` 当前统一写为 `speaker_a`
- `language` 当前为 `zh`

首页展示数据 `web/data/raw-samples.json` 当前字段：

```text
dataset.name
dataset.speakerId
dataset.sourceSpeakerId
dataset.sampleCount
samples[].uttId
samples[].text
samples[].audioPath
samples[].spectrogramPath
samples[].speakerId
samples[].language
samples[].durationSec
```

## 7. 当前缺口

数据层还缺这些内容：

- `datasets/processed/speaker_a/` 还没有真正生成
- 还没有针对目标 VITS 仓库的格式转换脚本
- 还没有音频质量筛查记录
- 还没有训练 / 验证切分约定
- 首页原始样本和未来模型结果之间还没有正式映射规则

## 8. 下一步建议

建议按下面顺序继续：

1. 先别继续找新数据集
2. 先用当前 `speaker_a` 跑通一个 `CosyVoice` 结果闭环
3. 再用当前子集跑一个 `VITS` baseline
4. 在实验记录里写清楚实际使用条目、清洗情况和训练切分
5. 如果 baseline 明显受限，再考虑扩到 `1` 到 `2` 小时
