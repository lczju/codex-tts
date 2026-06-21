const datasetOverview = {
  name: "AISHELL-3",
  summary: "AISHELL-3 是一个大规模中文多说话人 TTS 数据集，适合做多说话人语音合成，也适合先抽取单个说话人做第一版 baseline。",
  tags: ["中文", "多说话人", "TTS", "44.1kHz", "16-bit", "PCM WAV"],
  stats: [
    { label: "压缩包大小", value: "17.75 GB", note: "本地文件 data_aishell3.tgz" },
    { label: "总语句数", value: "88,035", note: "train + test" },
    { label: "训练语句", value: "63,262", note: "train/wav" },
    { label: "测试语句", value: "24,773", note: "test/wav" },
    { label: "训练说话人", value: "174", note: "当前包内实际统计" },
    { label: "平均单句时长", value: "3.50 s", note: "中位数 3.21 s" }
  ],
  formats: [
    { term: "音频格式", detail: "单声道 PCM WAV，44.1kHz，16-bit。" },
    { term: "文本标注", detail: "content.txt 每行记录文件名和文本，同时包含逐字拼音。" },
    { term: "说话人元信息", detail: "spk-info.txt 提供年龄段、性别、口音方向等信息。" },
    { term: "数据切分", detail: "原始数据自带 train 和 test 两部分。" }
  ],
  structure: [
    "data_aishell3.tgz",
    "├─ ReadMe.txt",
    "├─ phone_set.txt",
    "├─ spk-info.txt",
    "├─ train/",
    "│  ├─ content.txt",
    "│  └─ wav/<speaker_id>/*.wav",
    "└─ test/",
    "   ├─ content.txt",
    "   └─ wav/<speaker_id>/*.wav"
  ].join("\n"),
  fields: [
    { term: "utt_id", detail: "语句 ID，例如 SSB00050001。" },
    { term: "speaker_id", detail: "说话人 ID，例如 SSB0005。" },
    { term: "text", detail: "从 content.txt 抽出的中文文本，可直接进入训练 metadata。" },
    { term: "pinyin", detail: "逐字拼音信息，适合后续做分析或额外处理。" },
    { term: "duration_sec", detail: "根据 wav 文件大小估算的单句时长。" }
  ],
  subset: [
    { term: "当前抽取说话人", detail: "SSB0005" },
    { term: "子集规模", detail: "467 条训练音频" },
    { term: "总时长", detail: "约 0.673 小时" },
    { term: "属性", detail: "B 组，female，north" },
    { term: "本地落盘", detail: "datasets/raw/speaker_a/metadata.csv 和 datasets/raw/speaker_a/wavs/" }
  ],
  speakers: [
    { speakerId: "SSB0005", utteranceCount: 467, durationHours: 0.673, gender: "female", accent: "north" },
    { speakerId: "SSB0609", utteranceCount: 451, durationHours: 0.61, gender: "male", accent: "north" },
    { speakerId: "SSB0149", utteranceCount: 436, durationHours: 0.594, gender: "female", accent: "south" },
    { speakerId: "SSB0415", utteranceCount: 450, durationHours: 0.587, gender: "female", accent: "north" },
    { speakerId: "SSB0631", utteranceCount: 440, durationHours: 0.575, gender: "male", accent: "south" },
    { speakerId: "SSB0786", utteranceCount: 462, durationHours: 0.557, gender: "female", accent: "north" },
    { speakerId: "SSB0629", utteranceCount: 441, durationHours: 0.552, gender: "male", accent: "north" },
    { speakerId: "SSB0273", utteranceCount: 460, durationHours: 0.55, gender: "male", accent: "north" }
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
