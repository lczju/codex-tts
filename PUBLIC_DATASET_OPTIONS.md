# 公开数据集选择

## 1. 当前结论

项目当前已经实际采用了 AISHELL-3 的单说话人子集作为第一轮训练数据来源，而不是仍停留在候选阶段。

截至 `2026-06-22`：

- 已使用 AISHELL-3 生成公开清单与说话人汇总
- 已从中抽取 `speaker_a`
- 当前落地 `467` 条 wav，约 `0.673` 小时

因此，当前数据集策略应理解为：

- 项目整体目标是支持多语言 TTS 复现、微调与测评
- 当前第一轮 baseline 仍以中文数据集为主
- `AISHELL-3`：已落地，作为当前中文 baseline 数据来源
- `Biaobei / DataBaker`：保留为后续中文补充或替代路线
- `LJSpeech`：保留为英文 baseline 候选

## 2. 数据集对比

| 数据集 | 语言 | 类型 | 当前角色 | 适合程度 | 备注 |
| --- | --- | --- | --- | --- | --- |
| AISHELL-3 | 中文 | 多说话人 TTS | 已落地并抽取单说话人子集 | 高 | 当前已实际使用 |
| Biaobei / DataBaker | 中文 | 单说话人 TTS | 候选补充路线 | 高 | 更适合稳定单说话人训练 |
| LJSpeech | 英文 | 单说话人 TTS | 英文 baseline 候选 | 中 | 适合后续英文路线 |
| ST-CMDS | 中文 | 多说话人 ASR | 不推荐当前使用 | 低 | 更偏 ASR，不是首选 TTS 微调集 |

## 3. 为什么当前先用 AISHELL-3

原因不是“它理论上最优”，而是“它已经在仓库中实际落地”：

- 已经完成抽取脚本
- 已经生成 `metadata.csv`
- 已经有真实 wav 文件
- 已经能直接支撑第一轮 `VITS` baseline

当前阶段最重要的是跑通闭环，而不是重新换一套数据来源。

## 4. 为什么仍保留 Biaobei / DataBaker

虽然当前已经落地 AISHELL-3，但 Biaobei / DataBaker 依然值得保留，原因是：

- 单说话人路线更直接
- 更适合作为稳定的中文 TTS baseline
- 如果当前 AISHELL-3 子集音色或文本覆盖不理想，可以切换或并行对比

但这一步不应早于第一轮 baseline。

## 5. 当前建议

建议当前不要再重新讨论“先用哪个中文数据集”，而是按下面顺序执行：

1. 先用现有 AISHELL-3 `speaker_a` 跑通 `VITS`
2. 拿到第一轮真实样音后再评估是否需要更换数据来源
3. 只有在效果或格式明显受限时，再引入 Biaobei / DataBaker
4. 中文 baseline 稳定后，再补英文或更多语言的数据集路线

## 6. 落盘位置约定

```text
datasets/downloads/            原始下载包
datasets/raw/public/aishell3/  公开清单和说话人统计
datasets/raw/speaker_a/        当前单说话人子集
datasets/processed/speaker_a/  后续训练预处理结果
```
