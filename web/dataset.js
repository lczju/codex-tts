const datasetOverview = {
  name: "AISHELL-3 / speaker_a",
  summary: "这个页面说明当前中文 baseline 使用的数据来源：原始库是 AISHELL-3，多说话人语料中已抽取 SSB0005，并在仓库内整理为单说话人子集 speaker_a，供首页原始样本检查和后续 VITS baseline 复用。",
  tags: ["中文", "单说话人子集", "AISHELL-3", "speaker_a", "44.1kHz", "PCM WAV"],
  stats: [
    { label: "来源数据集", value: "AISHELL-3", note: "当前中文主线 baseline 的公开来源" },
    { label: "抽取说话人", value: "SSB0005", note: "已在本地整理为 speaker_a" },
    { label: "已落盘条数", value: "467", note: "datasets/raw/speaker_a/wavs/" },
    { label: "总时长", value: "0.673 h", note: "约 40.4 分钟，可先跑通 baseline" },
    { label: "metadata 字段", value: "5", note: "utt_id, wav_path, text, speaker_id, language" },
    { label: "当前用途", value: "Raw + VITS", note: "首页试听检查 + 后续训练输入" }
  ],
  formats: [
    { term: "音频格式", detail: "抽取后的子集继续保留 AISHELL-3 的 PCM WAV 形式，当前页面按仓库里实际落盘的 wav 文件理解。"},
    { term: "文本标注", detail: "训练文本来自 AISHELL-3 的内容清单，已整理进 metadata.csv，便于后续脚本直接消费。"},
    { term: "说话人映射", detail: "源说话人 ID 是 SSB0005；为了项目内统一管理，metadata.csv 中的 speaker_id 当前统一写作 speaker_a。"},
    { term: "当前切分", detail: "本地子集只保留当前实验需要的训练音频，不在这个页面展开原始库全部 train/test 结构。"}
  ],
  structure: [
    "datasets/",
    "├─ raw/",
    "│  ├─ public/aishell3/",
    "│  │  ├─ manifest.csv",
    "│  │  └─ speaker_summary.csv",
    "│  └─ speaker_a/",
    "│     ├─ metadata.csv",
    "│     ├─ source_summary.json",
    "│     └─ wavs/*.wav",
    "└─ processed/",
    "   └─ speaker_a/  (待生成)"
  ].join("\n"),
  fields: [
    { term: "utt_id", detail: "语句 ID，保留原始说话人前缀，例如 SSB00050001。"},
    { term: "wav_path", detail: "相对音频路径，当前写法如 wavs/SSB00050001.wav，方便后续迁移到训练目录。"},
    { term: "text", detail: "中文训练文本，已经从源数据中整理出来，可直接进入训练前的数据转换步骤。"},
    { term: "speaker_id", detail: "项目内统一说话人名，当前固定为 speaker_a，用来屏蔽源数据的多说话人复杂度。"},
    { term: "language", detail: "语言字段，当前子集统一为 zh，便于后续接更多语言时保持格式一致。"}
  ],
  subset: [
    { term: "当前抽取说话人", detail: "SSB0005，来自 AISHELL-3 公开说话人集合。"},
    { term: "仓库内名称", detail: "speaker_a，用于首页展示、元数据管理和后续训练转换。"},
    { term: "子集规模", detail: "467 条训练音频，已写入 metadata.csv 并同步抽取 wav 文件。"},
    { term: "人物属性", detail: "B 组、女声、北方口音，信息来自 source_summary.json。"},
    { term: "本地路径", detail: "datasets/raw/speaker_a/metadata.csv、datasets/raw/speaker_a/source_summary.json、datasets/raw/speaker_a/wavs/。"}
  ],
  speakers: [
    { speakerId: "SSB0005", utteranceCount: 467, durationHours: 0.673, gender: "女", accent: "北方" },
    { speakerId: "SSB0609", utteranceCount: 451, durationHours: 0.61, gender: "男", accent: "北方" },
    { speakerId: "SSB0149", utteranceCount: 436, durationHours: 0.594, gender: "女", accent: "南方" },
    { speakerId: "SSB0415", utteranceCount: 450, durationHours: 0.587, gender: "女", accent: "北方" },
    { speakerId: "SSB0631", utteranceCount: 440, durationHours: 0.575, gender: "男", accent: "南方" },
    { speakerId: "SSB0786", utteranceCount: 462, durationHours: 0.557, gender: "女", accent: "北方" },
    { speakerId: "SSB0629", utteranceCount: 441, durationHours: 0.552, gender: "男", accent: "北方" },
    { speakerId: "SSB0273", utteranceCount: 460, durationHours: 0.55, gender: "男", accent: "北方" }
  ]
};

function renderDefinitionList(items) {
  return items.map((item) => `
    <div class="definition-item">
      <span class="definition-term">${item.term}</span>
      <p class="definition-detail">${item.detail}</p>
    </div>
  `).join("");
}

function render() {
  document.querySelector("#datasetName").textContent = datasetOverview.name;
  document.querySelector("#datasetSummary").textContent = datasetOverview.summary;
  document.querySelector("#datasetTags").innerHTML = datasetOverview.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  document.querySelector("#statsGrid").innerHTML = datasetOverview.stats
    .map((item) => `
      <article class="stat-card">
        <span class="stat-label">${item.label}</span>
        <strong class="stat-value">${item.value}</strong>
        <span class="stat-note">${item.note}</span>
      </article>
    `)
    .join("");

  document.querySelector("#formatList").innerHTML = renderDefinitionList(datasetOverview.formats);
  document.querySelector("#fieldList").innerHTML = renderDefinitionList(datasetOverview.fields);
  document.querySelector("#subsetList").innerHTML = renderDefinitionList(datasetOverview.subset);
  document.querySelector("#structureBlock").textContent = datasetOverview.structure;
  document.querySelector("#speakerTableBody").innerHTML = datasetOverview.speakers
    .map((speaker) => `
      <tr>
        <td>${speaker.speakerId}</td>
        <td>${speaker.utteranceCount}</td>
        <td>${speaker.durationHours.toFixed(3)} h</td>
        <td>${speaker.gender}</td>
        <td>${speaker.accent}</td>
      </tr>
    `)
    .join("");
}

render();
