const modelDefinitions = [
  {
    name: "CosyVoice",
    stage: "待接入",
    description: "模型结果区保留为空状态。接入真实生成音频后，再补充试听与对比入口。"
  },
  {
    name: "VITS",
    stage: "待接入",
    description: "当前首页不展示伪结果。等 VITS 样本准备好后，再回到这里接入模型面板。"
  }
];

const embeddedSampleData = {
  dataset: {
    name: "AISHELL-3 mixed speaker random sample",
    sourceDataset: "AISHELL-3",
    speakerId: "",
    speakerCount: 10,
    sourceSpeakerId: "",
    sampleCount: 10,
    samplingMode: "embedded_fallback",
    split: "train",
    seed: null
  },
  samples: [
    {
      uttId: "SSB02410161",
      text: "娱乐反斗星",
      audioPath: "./audio/raw/SSB02410161.wav",
      spectrogramPath: "./assets/spectrograms/SSB02410161.png",
      speakerId: "SSB0241",
      language: "zh",
      durationSec: 2.326,
      split: "train"
    },
    {
      uttId: "SSB03410265",
      text: "意味着中管金融企业在依照",
      audioPath: "./audio/raw/SSB03410265.wav",
      spectrogramPath: "./assets/spectrograms/SSB03410265.png",
      speakerId: "SSB0341",
      language: "zh",
      durationSec: 3.41,
      split: "train"
    },
    {
      uttId: "SSB06710128",
      text: "更加坐实了两人的恋情",
      audioPath: "./audio/raw/SSB06710128.wav",
      spectrogramPath: "./assets/spectrograms/SSB06710128.png",
      speakerId: "SSB0671",
      language: "zh",
      durationSec: 3.046,
      split: "train"
    },
    {
      uttId: "SSB09130033",
      text: "难逃细则不细怪圈在郝荣福看来",
      audioPath: "./audio/raw/SSB09130033.wav",
      spectrogramPath: "./assets/spectrograms/SSB09130033.png",
      speakerId: "SSB0913",
      language: "zh",
      durationSec: 4.401,
      split: "train"
    },
    {
      uttId: "SSB10560454",
      text: "基地里严重渗水",
      audioPath: "./audio/raw/SSB10560454.wav",
      spectrogramPath: "./assets/spectrograms/SSB10560454.png",
      speakerId: "SSB1056",
      language: "zh",
      durationSec: 2.266,
      split: "train"
    },
    {
      uttId: "SSB15670405",
      text: "五是监督加强信息化建设",
      audioPath: "./audio/raw/SSB15670405.wav",
      spectrogramPath: "./assets/spectrograms/SSB15670405.png",
      speakerId: "SSB1567",
      language: "zh",
      durationSec: 3.299,
      split: "train"
    },
    {
      uttId: "SSB15750377",
      text: "这些游击队员威胁要杀死人质",
      audioPath: "./audio/raw/SSB15750377.wav",
      spectrogramPath: "./assets/spectrograms/SSB15750377.png",
      speakerId: "SSB1575",
      language: "zh",
      durationSec: 3.158,
      split: "train"
    },
    {
      uttId: "SSB16070259",
      text: "刘行喆澎湃资料腰斩的除了手里的股票",
      audioPath: "./audio/raw/SSB16070259.wav",
      spectrogramPath: "./assets/spectrograms/SSB16070259.png",
      speakerId: "SSB1607",
      language: "zh",
      durationSec: 5.15,
      split: "train"
    },
    {
      uttId: "SSB17110468",
      text: "放开具备竞争条件的商品和服务价格",
      audioPath: "./audio/raw/SSB17110468.wav",
      spectrogramPath: "./assets/spectrograms/SSB17110468.png",
      speakerId: "SSB1711",
      language: "zh",
      durationSec: 5.462,
      split: "train"
    },
    {
      uttId: "SSB19560155",
      text: "彭泽县种子公司供种点",
      audioPath: "./audio/raw/SSB19560155.wav",
      spectrogramPath: "./assets/spectrograms/SSB19560155.png",
      speakerId: "SSB1956",
      language: "zh",
      durationSec: 5.225,
      split: "train"
    }
  ]
};

const initialState = {
  dataset: null,
  samples: [],
  selectedSampleId: null,
  loadMessage: ""
};

let state = { ...initialState };

const datasetBrief = document.querySelector("#datasetBrief");
const modelPlaceholders = document.querySelector("#modelPlaceholders");
const sampleDetail = document.querySelector("#sampleDetail");
const spectrogramPanel = document.querySelector("#spectrogramPanel");
const sampleList = document.querySelector("#sampleList");
const sampleCount = document.querySelector("#sampleCount");
const loadNote = document.querySelector("#loadNote");

function normalizeData(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("raw-samples.json 必须是对象。");
  }

  if (!payload.dataset || !Array.isArray(payload.samples)) {
    throw new Error("raw-samples.json 需要包含 dataset 和 samples。");
  }

  return {
    dataset: {
      name: payload.dataset.name || "未命名",
      sourceDataset: payload.dataset.sourceDataset || "",
      speakerId: payload.dataset.speakerId || "",
      speakerCount: Number.isFinite(payload.dataset.speakerCount)
        ? payload.dataset.speakerCount
        : null,
      sourceSpeakerId: payload.dataset.sourceSpeakerId || "",
      sampleCount: Number.isFinite(payload.dataset.sampleCount)
        ? payload.dataset.sampleCount
        : null,
      samplingMode: payload.dataset.samplingMode || "",
      split: payload.dataset.split || "",
      seed: Number.isInteger(payload.dataset.seed) ? payload.dataset.seed : null
    },
    samples: payload.samples.map((sample) => ({
      uttId: sample.uttId || "",
      text: sample.text || "",
      audioPath: sample.audioPath || "",
      spectrogramPath: sample.spectrogramPath || "",
      speakerId: sample.speakerId || "",
      language: sample.language || "unknown",
      durationSec: Number.isFinite(sample.durationSec) ? sample.durationSec : null,
      split: sample.split || ""
    }))
  };
}

function getSelectedSample() {
  return state.samples.find((sample) => sample.uttId === state.selectedSampleId) || null;
}

function formatDuration(value) {
  return typeof value === "number" ? `${value.toFixed(2)} 秒` : "未提供";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDatasetBrief() {
  if (!state.dataset) {
    datasetBrief.innerHTML = '<p class="empty-copy">等待加载原始样本数据。</p>';
    return;
  }

  const dataset = state.dataset;
  const items = [["名称", dataset.name || "未命名"]];

  if (dataset.sourceDataset) {
    items.push(["来源数据集", dataset.sourceDataset]);
  }

  if (dataset.speakerCount && dataset.speakerCount > 1) {
    items.push(["说话人数", `${dataset.speakerCount}`]);
  } else {
    items.push(["说话人", dataset.speakerId || "未提供"]);
  }

  if (dataset.sourceSpeakerId) {
    items.push(["来源 ID", dataset.sourceSpeakerId]);
  }

  if (dataset.split) {
    items.push(["数据切分", dataset.split]);
  }

  if (dataset.samplingMode) {
    items.push(["抽样方式", dataset.samplingMode]);
  }

  items.push(["样本数", `${dataset.sampleCount ?? state.samples.length}`]);

  datasetBrief.innerHTML = `
    <div class="brief-grid">
      ${items.map(([label, value]) => `
        <div class="brief-item">
          <span class="brief-label">${escapeHtml(label)}</span>
          <span class="brief-value">${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderModelPlaceholders() {
  modelPlaceholders.innerHTML = modelDefinitions.map((model) => `
    <article class="model-placeholder">
      <h3>${escapeHtml(model.name)}</h3>
      <p class="model-status">${escapeHtml(model.stage)}</p>
      <p class="detail-copy">${escapeHtml(model.description)}</p>
    </article>
  `).join("");
}

function renderSampleDetail() {
  const sample = getSelectedSample();

  if (!sample) {
    sampleDetail.innerHTML = `
      <div class="empty-state">
        <p class="empty-copy">当前没有可展示的原始样本。加载成功后会在这里显示文本、音频和基础元信息。</p>
      </div>
    `;
    return;
  }

  const audioMarkup = sample.audioPath
    ? `
      <div class="audio-shell">
        <audio controls preload="metadata" src="${escapeHtml(sample.audioPath)}"></audio>
      </div>
    `
    : `
      <div class="empty-state">
        <p class="empty-copy">这个样本还没有音频路径，请检查 <code>raw-samples.json</code> 中的 <code>audioPath</code>。</p>
      </div>
    `;

  sampleDetail.innerHTML = `
    <div class="sample-head">
      <div>
        <p class="eyebrow">Utterance</p>
        <h3 class="sample-title">${escapeHtml(sample.uttId)}</h3>
      </div>
      <span class="sample-tag">${escapeHtml(sample.language)}</span>
    </div>
    <p class="sample-text">${escapeHtml(sample.text || "未提供文本")}</p>
    <div class="meta-grid">
      <div class="meta-pill">
        <span class="meta-label">说话人</span>
        <span class="meta-value">${escapeHtml(sample.speakerId || "未提供")}</span>
      </div>
      <div class="meta-pill">
        <span class="meta-label">数据切分</span>
        <span class="meta-value">${escapeHtml(sample.split || "未提供")}</span>
      </div>
      <div class="meta-pill">
        <span class="meta-label">时长</span>
        <span class="meta-value">${escapeHtml(formatDuration(sample.durationSec))}</span>
      </div>
      <div class="meta-pill">
        <span class="meta-label">音频路径</span>
        <span class="meta-value">${escapeHtml(sample.audioPath || "未提供")}</span>
      </div>
      <div class="meta-pill">
        <span class="meta-label">频谱图路径</span>
        <span class="meta-value">${escapeHtml(sample.spectrogramPath || "未提供")}</span>
      </div>
    </div>
    ${audioMarkup}
  `;
}

function renderSpectrogram() {
  const sample = getSelectedSample();

  if (!sample || !sample.spectrogramPath) {
    spectrogramPanel.innerHTML = `
      <div class="empty-state">
        <p class="empty-copy">当前没有频谱图可显示。加载成功并选择样本后，会在这里展示对应图片。</p>
      </div>
    `;
    return;
  }

  spectrogramPanel.innerHTML = `
    <div class="spectrogram-shell">
      <img class="spectrogram-image" src="${escapeHtml(sample.spectrogramPath)}" alt="${escapeHtml(sample.uttId)} 的频谱图">
      <p class="spectrogram-caption">${escapeHtml(sample.uttId)} 的频谱图，用于快速检查能量分布与停顿结构。</p>
    </div>
  `;
}

function renderSampleList() {
  sampleCount.textContent = `${state.samples.length} 条样本`;

  if (!state.samples.length) {
    sampleList.innerHTML = `
      <div class="empty-state">
        <p class="empty-copy">当前没有样本列表。请通过本地静态服务访问页面，或确认 <code>web/data/raw-samples.json</code> 可用。</p>
      </div>
    `;
    return;
  }

  sampleList.innerHTML = state.samples.map((sample) => {
    const isActive = sample.uttId === state.selectedSampleId;
    const preview = sample.text.length > 42 ? `${sample.text.slice(0, 42)}…` : sample.text;

    return `
      <button
        class="sample-card${isActive ? " is-active" : ""}"
        type="button"
        data-utt-id="${escapeHtml(sample.uttId)}"
        role="option"
        aria-selected="${isActive ? "true" : "false"}"
      >
        <div class="sample-card-head">
          <div>
            <h4>${escapeHtml(sample.uttId)}</h4>
            <p class="sample-subtitle">${escapeHtml(sample.speakerId || "未提供说话人")} · ${escapeHtml(formatDuration(sample.durationSec))}</p>
          </div>
          <span class="sample-tag">${escapeHtml(sample.language)}</span>
        </div>
        <p class="sample-preview">${escapeHtml(preview || "未提供文本")}</p>
      </button>
    `;
  }).join("");
}

function renderLoadNote() {
  const hasMessage = Boolean(state.loadMessage);
  loadNote.textContent = state.loadMessage;
  loadNote.classList.toggle("is-hidden", !hasMessage);
}

function render() {
  renderDatasetBrief();
  renderModelPlaceholders();
  renderSampleDetail();
  renderSpectrogram();
  renderSampleList();
  renderLoadNote();
}

function selectSample(sampleId) {
  if (!state.samples.some((sample) => sample.uttId === sampleId)) {
    return;
  }

  state.selectedSampleId = sampleId;
  renderSampleDetail();
  renderSpectrogram();
  renderSampleList();
}

function applySamples(payload, loadMessage) {
  state.dataset = payload.dataset;
  state.samples = payload.samples;
  state.selectedSampleId = payload.samples[0]?.uttId || null;
  state.loadMessage = loadMessage;
}

async function loadInitialData() {
  render();

  if (window.location.protocol === "file:") {
    applySamples(
      normalizeData(embeddedSampleData),
      "当前通过 file:// 打开，已回退到内置样本数据，可直接试听和查看频谱图。HTTP 模式下会优先加载离线抽样结果。"
    );
    render();
    return;
  }

  try {
    const response = await fetch("./data/raw-samples.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = normalizeData(await response.json());
    applySamples(
      payload,
      payload.samples.length
        ? "离线抽样结果已加载，可直接试听和查看频谱图。"
        : "raw-samples.json 已加载，但当前没有样本。"
    );
  } catch (error) {
    console.warn("加载 raw-samples.json 失败", error);
    applySamples(
      normalizeData(embeddedSampleData),
      "无法加载 web/data/raw-samples.json，已回退到内置样本数据。请检查本地服务和 JSON 路径。"
    );
  }

  render();
}

sampleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-utt-id]");
  if (!button) {
    return;
  }

  selectSample(button.dataset.uttId);
});

loadInitialData();
