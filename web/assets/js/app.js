const embeddedRawSampleData = {
  dataset: {
    name: "AISHELL-3 mixed speaker random sample",
    sourceDataset: "AISHELL-3",
    speakerId: "",
    speakerCount: 10,
    sourceSpeakerId: "",
    sampleCount: 3,
    samplingMode: "embedded_fallback",
    split: "train",
    seed: null,
  },
  samples: [
    {
      uttId: "SSB02410161",
      text: "娱乐反倒是。",
      audioPath: "./media/audio/raw/SSB02410161.wav",
      spectrogramPath: "./media/spectrograms/SSB02410161.png",
      speakerId: "SSB0241",
      language: "zh",
      durationSec: 2.326,
      split: "train",
    },
    {
      uttId: "SSB03410265",
      text: "意味着中管金融企业在依照。",
      audioPath: "./media/audio/raw/SSB03410265.wav",
      spectrogramPath: "./media/spectrograms/SSB03410265.png",
      speakerId: "SSB0341",
      language: "zh",
      durationSec: 3.41,
      split: "train",
    },
    {
      uttId: "SSB06710128",
      text: "更加坐实了两人的恋情。",
      audioPath: "./media/audio/raw/SSB06710128.wav",
      spectrogramPath: "./media/spectrograms/SSB06710128.png",
      speakerId: "SSB0671",
      language: "zh",
      durationSec: 3.046,
      split: "train",
    },
  ],
};

const embeddedDatasetOverview = {
  name: "AISHELL-3 / speaker_a",
  summary: "当前中文 baseline 使用 AISHELL-3 整理出的单说话人子集 speaker_a，本地页面统一承载试听、数据集说明和后续 benchmark 对比。",
  tags: ["中文", "AISHELL-3", "speaker_a", "单说话人", "44.1kHz", "PCM WAV"],
  stats: [
    { label: "来源数据集", value: "AISHELL-3", note: "当前中文主线 baseline 的公开来源" },
    { label: "抽取说话人", value: "SSB0005", note: "仓库内统一命名为 speaker_a" },
    { label: "训练条数", value: "467", note: "metadata.csv 与 wavs/ 已就位" },
    { label: "总时长", value: "0.673 h", note: "约 40.4 分钟，可先跑最小 baseline" },
  ],
  formats: [
    { term: "音频格式", detail: "提取后的子集保留 WAV 文件，页面直接使用 web 下的静态可访问路径。" },
    { term: "文本标注", detail: "训练文本保存在 metadata.csv，并同步进入原始样本与后续训练流程。" },
  ],
  fields: [
    { term: "utt_id", detail: "语句 ID，例如 SSB00050001。" },
    { term: "wav_path", detail: "相对路径，例如 wavs/SSB00050001.wav。" },
    { term: "text", detail: "中文训练文本。" },
    { term: "speaker_id", detail: "项目内统一为 speaker_a。" },
    { term: "language", detail: "当前固定为 zh。" },
  ],
  subset: [
    { term: "当前子集", detail: "单说话人 speaker_a，用于试听、训练输入和 benchmark 结果回填。" },
    { term: "本地目录", detail: "datasets/raw/speaker_a/metadata.csv、source_summary.json、wavs/。" },
  ],
  structure: [
    "web/",
    "  index.html",
    "  assets/css/app.css",
    "  assets/js/app.js",
    "  data/raw-samples.json",
    "  data/dataset-overview.json",
    "  data/benchmark-results.json",
    "  media/audio/raw/*.wav",
    "  media/spectrograms/*.png",
    "datasets/raw/speaker_a/",
    "  metadata.csv",
    "  source_summary.json",
    "  wavs/*.wav",
  ].join("\n"),
};

const embeddedBenchmarkResults = {
  testCases: [
    {
      id: "case_001",
      text: "今天我们来比较几种语音合成模型的效果。",
      language: "zh",
      category: "基础发音",
    },
    {
      id: "case_002",
      text: "请在明天下午三点半，把实验报告发送到邮箱里。",
      language: "zh",
      category: "数字与时间",
    },
  ],
  results: [
    {
      caseId: "case_001",
      model: "CosyVoice",
      audioPath: "",
      speaker: "speaker_a",
      checkpoint: "pretrained",
      generationTimeSec: null,
      naturalness: null,
      similarity: null,
      pronunciation: null,
      notes: "占位结果：待接入 CosyVoice 音频后补充。"
    },
    {
      caseId: "case_001",
      model: "VITS",
      audioPath: "",
      speaker: "speaker_a",
      checkpoint: "fine-tuned",
      generationTimeSec: null,
      naturalness: null,
      similarity: null,
      pronunciation: null,
      notes: "占位结果：待接入 VITS 音频后补充。"
    },
    {
      caseId: "case_002",
      model: "CosyVoice",
      audioPath: "",
      speaker: "speaker_a",
      checkpoint: "pretrained",
      generationTimeSec: null,
      naturalness: null,
      similarity: null,
      pronunciation: null,
      notes: "占位结果：待接入 CosyVoice 音频后补充。"
    },
  ],
};

const state = {
  rawSamples: { dataset: null, samples: [] },
  datasetOverview: null,
  benchmarkResults: { testCases: [], results: [] },
  selectedSampleId: null,
  loadMessage: "",
};

const datasetBrief = document.querySelector("#datasetBrief");
const sampleDetail = document.querySelector("#sampleDetail");
const spectrogramPanel = document.querySelector("#spectrogramPanel");
const sampleList = document.querySelector("#sampleList");
const sampleCount = document.querySelector("#sampleCount");
const loadNote = document.querySelector("#loadNote");
const datasetOverview = document.querySelector("#datasetOverview");
const benchmarkResults = document.querySelector("#benchmarkResults");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(value) {
  return typeof value === "number" ? `${value.toFixed(2)} 秒` : "未提供";
}

function normalizeRawSamples(payload) {
  if (!payload || typeof payload !== "object" || !payload.dataset || !Array.isArray(payload.samples)) {
    throw new Error("raw-samples.json 必须包含 dataset 和 samples。");
  }

  return {
    dataset: {
      name: payload.dataset.name || "未命名批次",
      sourceDataset: payload.dataset.sourceDataset || "",
      speakerId: payload.dataset.speakerId || "",
      speakerCount: Number.isFinite(payload.dataset.speakerCount) ? payload.dataset.speakerCount : null,
      sourceSpeakerId: payload.dataset.sourceSpeakerId || "",
      sampleCount: Number.isFinite(payload.dataset.sampleCount) ? payload.dataset.sampleCount : null,
      samplingMode: payload.dataset.samplingMode || "",
      split: payload.dataset.split || "",
      seed: Number.isInteger(payload.dataset.seed) ? payload.dataset.seed : null,
    },
    samples: payload.samples.map((sample) => ({
      uttId: sample.uttId || "",
      text: sample.text || "",
      audioPath: sample.audioPath || "",
      spectrogramPath: sample.spectrogramPath || "",
      speakerId: sample.speakerId || "",
      language: sample.language || "unknown",
      durationSec: Number.isFinite(sample.durationSec) ? sample.durationSec : null,
      split: sample.split || "",
    })),
  };
}

function normalizeDatasetOverview(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("dataset-overview.json 必须是对象。");
  }

  return {
    name: payload.name || "未命名数据集",
    summary: payload.summary || "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    stats: Array.isArray(payload.stats) ? payload.stats : [],
    formats: Array.isArray(payload.formats) ? payload.formats : [],
    fields: Array.isArray(payload.fields) ? payload.fields : [],
    subset: Array.isArray(payload.subset) ? payload.subset : [],
    structure: payload.structure || "",
  };
}

function normalizeBenchmarkResults(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("benchmark-results.json 必须是对象。");
  }

  return {
    testCases: Array.isArray(payload.testCases) ? payload.testCases : [],
    results: Array.isArray(payload.results) ? payload.results : [],
  };
}

function getSelectedSample() {
  return state.rawSamples.samples.find((sample) => sample.uttId === state.selectedSampleId) || null;
}

function renderDatasetBrief() {
  const dataset = state.rawSamples.dataset;
  const samples = state.rawSamples.samples;

  if (!dataset) {
    datasetBrief.innerHTML = '<p class="empty-copy">等待加载原始样本数据。</p>';
    sampleCount.textContent = "0 条样本";
    return;
  }

  const total = dataset.sampleCount ?? samples.length;
  const speakerText = dataset.speakerCount && dataset.speakerCount > 1
    ? `${dataset.speakerCount} 位说话人`
    : dataset.speakerId || "单说话人";

  sampleCount.textContent = `${samples.length} 条样本`;
  datasetBrief.innerHTML = `
    <div class="info-card">
      <p class="detail-copy">${escapeHtml(dataset.sourceDataset || dataset.name)}</p>
      <p class="brief-value">${escapeHtml(`${total} 条样本`)}</p>
      <p class="detail-copy">当前批次来源于 ${escapeHtml(speakerText)}，首页聚焦试听与切换。</p>
    </div>
  `;
}

function renderSampleDetail() {
  const sample = getSelectedSample();

  if (!sample) {
    sampleDetail.innerHTML = '<div class="empty-state"><p class="empty-copy">当前没有可展示的样本。</p></div>';
    return;
  }

  const audioMarkup = sample.audioPath
    ? `<div class="audio-shell"><audio controls preload="metadata" src="${escapeHtml(sample.audioPath)}"></audio></div>`
    : '<div class="empty-state"><p class="empty-copy">当前样本没有可试听音频。</p></div>';

  sampleDetail.innerHTML = `
    <div class="hero-body">
      <div class="hero-head">
        <div>
          <p class="eyebrow">Utterance</p>
          <h3 class="sample-title">${escapeHtml(sample.uttId)}</h3>
        </div>
        <span class="sample-tag">${escapeHtml(sample.language)}</span>
      </div>
      <div class="hero-text">
        <p class="eyebrow">Text</p>
        <p class="sample-text">${escapeHtml(sample.text || "未提供文本")}</p>
      </div>
      <div class="meta-row">
        <div class="meta-card">
          <span class="meta-label">说话人</span>
          <span class="meta-value">${escapeHtml(sample.speakerId || "未提供")}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">时长</span>
          <span class="meta-value">${escapeHtml(formatDuration(sample.durationSec))}</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">切分</span>
          <span class="meta-value">${escapeHtml(sample.split || "未提供")}</span>
        </div>
      </div>
      ${audioMarkup}
    </div>
  `;
}

function renderSpectrogram() {
  const sample = getSelectedSample();

  if (!sample || !sample.spectrogramPath) {
    spectrogramPanel.innerHTML = '<div class="empty-state"><p class="empty-copy">当前没有频谱图可显示。</p></div>';
    return;
  }

  spectrogramPanel.innerHTML = `
    <div class="spectrogram-shell">
      <img class="spectrogram-image" src="${escapeHtml(sample.spectrogramPath)}" alt="${escapeHtml(sample.uttId)} 的频谱图">
      <p class="panel-note">频谱图用于快速观察停顿和能量分布。</p>
    </div>
  `;
}

function renderSampleList() {
  const samples = state.rawSamples.samples;

  if (!samples.length) {
    sampleList.innerHTML = '<div class="empty-state"><p class="empty-copy">当前没有样本列表。</p></div>';
    return;
  }

  sampleList.innerHTML = samples.map((sample) => {
    const isActive = sample.uttId === state.selectedSampleId;
    const preview = sample.text.length > 42 ? `${sample.text.slice(0, 42)}...` : sample.text;

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

function renderDefinitionList(items) {
  if (!items.length) {
    return '<p class="empty-copy">当前没有附加说明。</p>';
  }

  return `
    <div class="definition-list">
      ${items.map((item) => `
        <div class="definition-item">
          <span class="definition-term">${escapeHtml(item.term || "")}</span>
          <p class="detail-copy">${escapeHtml(item.detail || "")}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderDatasetOverview() {
  const info = state.datasetOverview;
  if (!info) {
    datasetOverview.innerHTML = '<div class="empty-state"><p class="empty-copy">等待加载数据集说明。</p></div>';
    return;
  }

  const statsMarkup = info.stats.length
    ? `
      <div class="card-grid">
        ${info.stats.map((item) => `
          <article class="meta-card">
            <span class="meta-label">${escapeHtml(item.label || "")}</span>
            <div class="metric-value">${escapeHtml(item.value || "")}</div>
            <p class="detail-copy">${escapeHtml(item.note || "")}</p>
          </article>
        `).join("")}
      </div>
    `
    : "";

  const tagsMarkup = info.tags.length
    ? `<div class="tag-list">${info.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  datasetOverview.innerHTML = `
    <div class="stack-block">
      <div>
        <h3>${escapeHtml(info.name)}</h3>
        <p class="panel-note">${escapeHtml(info.summary)}</p>
      </div>
      ${tagsMarkup}
      ${statsMarkup}
      <div class="card-grid">
        <article class="info-card">
          <p class="eyebrow">Fields</p>
          ${renderDefinitionList(info.fields)}
        </article>
        <article class="info-card">
          <p class="eyebrow">Subset</p>
          ${renderDefinitionList(info.subset)}
        </article>
      </div>
      <div class="card-grid">
        <article class="info-card">
          <p class="eyebrow">Formats</p>
          ${renderDefinitionList(info.formats)}
        </article>
        <article class="info-card">
          <p class="eyebrow">Structure</p>
          <pre class="code-block">${escapeHtml(info.structure || "")}</pre>
        </article>
      </div>
    </div>
  `;
}

function renderBenchmarkResults() {
  const payload = state.benchmarkResults;
  const models = [...new Set(payload.results.map((item) => item.model).filter(Boolean))];
  const cases = payload.testCases;
  const recentResults = payload.results.slice(0, 6);

  benchmarkResults.innerHTML = `
    <div class="stack-block">
      <div class="card-grid">
        <article class="meta-card">
          <span class="meta-label">测试用例</span>
          <div class="metric-value">${escapeHtml(String(cases.length))}</div>
          <p class="detail-copy">当前 benchmark-results.json 中定义的 case 数量。</p>
        </article>
        <article class="meta-card">
          <span class="meta-label">模型集合</span>
          <div class="metric-value">${escapeHtml(String(models.length || 0))}</div>
          <p class="detail-copy">${escapeHtml(models.join(" / ") || "尚未接入")}</p>
        </article>
      </div>
      <div class="info-card">
        <p class="eyebrow">Case Preview</p>
        <div class="definition-list">
          ${cases.slice(0, 4).map((item) => `
            <div class="definition-item">
              <span class="definition-term">${escapeHtml(item.id)}</span>
              <p class="detail-copy">${escapeHtml(item.text || "")}</p>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="card-grid">
        ${recentResults.map((item) => `
          <article class="result-card">
            <p class="eyebrow">${escapeHtml(item.caseId || "")}</p>
            <h4>${escapeHtml(item.model || "Unknown")}</h4>
            <p class="detail-copy">speaker: ${escapeHtml(item.speaker || "N/A")}</p>
            <p class="detail-copy">checkpoint: ${escapeHtml(item.checkpoint || "N/A")}</p>
            <p class="detail-copy">${escapeHtml(item.notes || "待补充")}</p>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLoadNote() {
  const hasMessage = Boolean(state.loadMessage);
  loadNote.textContent = state.loadMessage;
  loadNote.classList.toggle("is-hidden", !hasMessage);
}

function render() {
  renderDatasetBrief();
  renderSampleDetail();
  renderSpectrogram();
  renderSampleList();
  renderDatasetOverview();
  renderBenchmarkResults();
  renderLoadNote();
}

function selectSample(sampleId) {
  if (!state.rawSamples.samples.some((sample) => sample.uttId === sampleId)) {
    return;
  }

  state.selectedSampleId = sampleId;
  renderSampleDetail();
  renderSpectrogram();
  renderSampleList();
}

function applyPayloads(rawSamples, overview, benchmark, loadMessage) {
  state.rawSamples = rawSamples;
  state.datasetOverview = overview;
  state.benchmarkResults = benchmark;
  state.selectedSampleId = rawSamples.samples[0]?.uttId || null;
  state.loadMessage = loadMessage;
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }
  return response.json();
}

async function loadInitialData() {
  render();

  if (window.location.protocol === "file:") {
    applyPayloads(
      normalizeRawSamples(embeddedRawSampleData),
      normalizeDatasetOverview(embeddedDatasetOverview),
      normalizeBenchmarkResults(embeddedBenchmarkResults),
      "当前通过 file:// 打开，已回退到内置样本、数据集说明和 benchmark 占位数据。"
    );
    render();
    return;
  }

  try {
    const [rawPayload, overviewPayload, benchmarkPayload] = await Promise.all([
      fetchJson("./data/raw-samples.json"),
      fetchJson("./data/dataset-overview.json"),
      fetchJson("./data/benchmark-results.json"),
    ]);

    applyPayloads(
      normalizeRawSamples(rawPayload),
      normalizeDatasetOverview(overviewPayload),
      normalizeBenchmarkResults(benchmarkPayload),
      "静态 JSON 已加载，当前单入口页面正在使用统一数据源。"
    );
  } catch (error) {
    console.warn("加载单入口工作台数据失败", error);
    applyPayloads(
      normalizeRawSamples(embeddedRawSampleData),
      normalizeDatasetOverview(embeddedDatasetOverview),
      normalizeBenchmarkResults(embeddedBenchmarkResults),
      "无法加载外部 JSON，已回退到内置数据。请检查本地 HTTP 服务和 data 目录。"
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
