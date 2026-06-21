# 数据集准备计划

## 1. 当前状态更新

截至 `2026-06-22`，数据准备已经不再停留在模板阶段。

当前已完成：

- 已加入 AISHELL-3 数据准备脚本：`scripts/prepare_aishell3.py`
- 已生成公开数据清单与说话人汇总
- 已从 AISHELL-3 抽取单说话人子集 `speaker_a`
- `datasets/raw/speaker_a/metadata.csv` 已生成
- `datasets/raw/speaker_a/wavs/` 当前已有 `467` 条 wav
- `datasets/raw/speaker_a/source_summary.json` 已记录来源和抽取结果

当前 `speaker_a` 摘要：

- 来源：AISHELL-3
- 选中说话人：`SSB0005`
- 抽取条数：`467`
- 时长：约 `0.673` 小时
- 用途：作为第一轮 `VITS` baseline 的单说话人训练子集

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

推荐目录：

```text
datasets/downloads/
datasets/raw/public/aishell3/
datasets/raw/speaker_a/
datasets/processed/speaker_a/
web/audio/cosyvoice/
web/audio/vits/
```

## 3. 现在是否还需要继续下载大数据集

当前不建议再立即扩充新的大数据集。

原因：

- 第一轮 `VITS` baseline 已经有可用子集
- 当前真正的瓶颈不在“缺数据”，而在“缺实验闭环”
- 真实 `CosyVoice` / `VITS` 结果尚未回填到页面
- 在没有结果闭环之前继续扩数据集，收益不高

## 4. 当前数据量判断

以第一轮 baseline 来看，当前 `0.673` 小时的单说话人数据：

- 足够用于跑通 VITS 训练链路
- 足够用于验证元数据格式和目录组织
- 足够产出第一轮可试听对比结果

但也要明确：

- 这还不算稳定高质量训练规模
- 如果后续想明显提升音色稳定性和发音表现，建议扩到 `1` 到 `2` 小时

## 5. 数据来源优先级更新

当前优先级已从“理论候选”转为“实际已落地 + 后续再扩充”：

1. 现有 AISHELL-3 `speaker_a` 子集，先完成 baseline
2. 如效果不足，再评估补充更多 AISHELL-3 单说话人时长
3. 再考虑是否引入 Biaobei / DataBaker 作为第二条数据路线

这意味着现在不应同时开启多条数据路线。

## 6. 当前数据格式

`datasets/raw/speaker_a/metadata.csv` 当前字段：

```text
utt_id,wav_path,text,speaker_id,language
```

说明：

- `wav_path` 当前使用相对路径，便于迁移
- `speaker_id` 当前统一写为 `speaker_a`
- `language` 当前为 `zh`

这份元数据适合作为项目内部统一中间格式，后续再按具体训练仓库转换。

## 7. 当前缺口

数据层还缺这些内容：

- `datasets/processed/speaker_a/` 还没有真正生成
- 还没有针对目标 VITS 仓库的格式转换脚本
- 还没有音频质量筛查记录
- 还没有训练 / 验证切分约定

## 8. 下一步建议

建议按下面顺序继续：

1. 先别继续找新数据集
2. 先用当前 `speaker_a` 跑通一个 `VITS` baseline
3. 在实验记录里写清楚实际使用了哪些条目、是否做过清洗、训练集如何切分
4. 如果 baseline 明显受限，再考虑扩到 `1` 到 `2` 小时
5. 只有在 AISHELL-3 路线不合适时，再切到 Biaobei / DataBaker
