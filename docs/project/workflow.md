# Workflow

## Current loop

当前推荐工作流：

1. 用 `scripts/prepare_aishell3.py` 准备 `speaker_a` 数据
2. 用 `scripts/generate_sample_spectrograms.py` 生成原始试听资源
3. 在 `web/index.html` 中检查原始音频、文本和频谱图
4. 在云端 GPU 环境运行 `CosyVoice` 或 `VITS`
5. 把生成结果放回 `web/media/audio/<model>/`
6. 更新 `web/data/benchmark-results.json`
7. 回到同一个页面继续试听和比较

## Why this structure

这样做的目的不是“做一个完整产品”，而是：

- 本地只承担轻任务
- GPU 机器只承担真正需要算力的推理或微调
- 先把实验闭环跑通，再考虑复杂工程化

## What not to add yet

当前阶段不建议优先引入：

- 后端服务
- 数据库
- 多用户系统
- 构建工具链
- 复杂部署

## Update rules

每次引入新数据或新结果时，优先更新：

- `web/data/raw-samples.json`
- `web/data/dataset-overview.json`
- `web/data/benchmark-results.json`

如果只是页面布局或展示逻辑变化，优先改：

- `web/index.html`
- `web/assets/css/app.css`
- `web/assets/js/app.js`
