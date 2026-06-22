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
    name: "AISHELL-3 speaker_a subset",
    speakerId: "speaker_a",
    sourceSpeakerId: "SSB0005",
    sampleCount: 10
  },
  samples: [
    {
      uttId: "SSB00050001",
      text: "广州女大学生登山失联四天警方找到疑似女尸",
      audioPath: "./audio/raw/SSB00050001.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050001.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 9.444
    },
    {
      uttId: "SSB00050002",
      text: "尊重科学规律的要求",
      audioPath: "./audio/raw/SSB00050002.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050002.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 3.536
    },
    {
      uttId: "SSB00050003",
      text: "七路无人售票",
      audioPath: "./audio/raw/SSB00050003.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050003.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 2.709
    },
    {
      uttId: "SSB00050004",
      text: "黑客宣布只要拨打某一个电话",
      audioPath: "./audio/raw/SSB00050004.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050004.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 4.438
    },
    {
      uttId: "SSB00050005",
      text: "北京万科总经理刘肖的观点极具代表性",
      audioPath: "./audio/raw/SSB00050005.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050005.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 6.486
    },
    {
      uttId: "SSB00050006",
      text: "五百四十五万七千一百二十二",
      audioPath: "./audio/raw/SSB00050006.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050006.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 5.027
    },
    {
      uttId: "SSB00050007",
      text: "广州大学城女尸案嫌疑犯变供称死者为女友",
      audioPath: "./audio/raw/SSB00050007.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050007.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 8.269
    },
    {
      uttId: "SSB00050008",
      text: "搜狐娱乐讯据台湾媒体报道",
      audioPath: "./audio/raw/SSB00050008.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050008.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 4.905
    },
    {
      uttId: "SSB00050009",
      text: "北郊",
      audioPath: "./audio/raw/SSB00050009.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050009.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 1.68
    },
    {
      uttId: "SSB00050010",
      text: "职业联赛该干的让职业联赛干",
      audioPath: "./audio/raw/SSB00050010.wav",
      spectrogramPath: "./assets/spectrograms/SSB00050010.png",
      speakerId: "speaker_a",
      language: "zh",
      durationSec: 5.249
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
    dataset: payload.dataset,
    samples: payload.samples.map((sample) => ({
      uttId: sample.uttId || "",
      text: sample.text || "",
      audioPath: sample.audioPath || "",
      spectrogramPath: sample.spectrogramPath || "",
      speakerId: sample.speakerId || "",
      language: sample.language || "unknown",
      durationSec: Number.isFinite(sample.durationSec) ? sample.durationSec : null
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
  const items = [
    ["名称", dataset.name || "未命名"],
    ["说话人", dataset.speakerId || "未提供"],
    ["来源 ID", dataset.sourceSpeakerId || "未提供"],
    ["样本数", `${dataset.sampleCount ?? state.samples.length}`]
  ];

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
      "当前通过 file:// 打开，已回退到内置样本数据，可直接试听和查看频谱图。"
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
        ? "原始样本数据已加载，可直接试听和查看频谱图。"
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
