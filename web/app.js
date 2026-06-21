const defaultData = {
  testCases: [
    {
      id: "case_001",
      text: "今天我们来比较几种语音合成模型的效果。",
      language: "zh",
      category: "基础发音"
    },
    {
      id: "case_002",
      text: "请在明天下午三点半，把实验报告发送到邮箱里。",
      language: "zh",
      category: "数字与时间"
    },
    {
      id: "case_003",
      text: "This is a short English sentence for cross-language speech synthesis.",
      language: "en",
      category: "英文"
    },
    {
      id: "case_004",
      text: "如果模型在长句中还能保持稳定的停顿、重音和语气，听感通常会更自然。",
      language: "zh",
      category: "长句稳定性"
    },
    {
      id: "case_005",
      text: "2026年6月22日，实验编号是TTS-015，采样率设置为24000赫兹。",
      language: "zh",
      category: "日期与编号"
    },
    {
      id: "case_006",
      text: "请把GPU服务器上的结果下载到D盘，不要放到C盘。",
      language: "zh",
      category: "中英混合"
    },
    {
      id: "case_007",
      text: "OpenAI, PyTorch, CUDA, and MobaXterm are mentioned in this experiment.",
      language: "en",
      category: "英文专名"
    },
    {
      id: "case_008",
      text: "这个声音听起来像同一个人吗？请重点关注音色相似度。",
      language: "zh",
      category: "疑问句"
    },
    {
      id: "case_009",
      text: "太好了！这次合成的语音终于没有明显的机械感了。",
      language: "zh",
      category: "情绪表达"
    },
    {
      id: "case_010",
      text: "我想比较VITS、CosyVoice和VALL-E在同一段文本上的表现。",
      language: "zh",
      category: "模型名称"
    },
    {
      id: "case_011",
      text: "北京、上海、广州和深圳的天气数据会在晚上八点更新。",
      language: "zh",
      category: "地名"
    },
    {
      id: "case_012",
      text: "这句话包含一些轻声、儿化音和连续变调，需要仔细听发音是否自然。",
      language: "zh",
      category: "中文韵律"
    },
    {
      id: "case_013",
      text: "The quick brown fox jumps over the lazy dog near the river bank.",
      language: "en",
      category: "英文韵律"
    },
    {
      id: "case_014",
      text: "请用平静、清晰、稳定的语气读完这句话，不要突然加速。",
      language: "zh",
      category: "语速控制"
    },
    {
      id: "case_015",
      text: "当训练数据只有三十分钟时，模型可能会出现音色漂移或发音不稳。",
      language: "zh",
      category: "实验说明"
    }
  ],
  results: []
};

defaultData.results = defaultData.testCases.flatMap((testCase) => [
  {
    caseId: testCase.id,
    model: "CosyVoice",
    audioPath: "",
    speaker: "speaker_a",
    checkpoint: "pretrained",
    generationTimeSec: null,
    naturalness: null,
    similarity: null,
    pronunciation: null,
    notes: "第二周把云端生成的 wav 放到 web/audio/cosyvoice/ 后填入路径。"
  },
  {
    caseId: testCase.id,
    model: "VITS",
    audioPath: "",
    speaker: "speaker_a",
    checkpoint: "fine-tuned",
    generationTimeSec: null,
    naturalness: null,
    similarity: null,
    pronunciation: null,
    notes: "第三周完成小数据微调后加入结果。"
  }
]);

let state = structuredClone(defaultData);

const caseSelect = document.querySelector("#caseSelect");
const modelFilter = document.querySelector("#modelFilter");
const caseText = document.querySelector("#caseText");
const caseLanguage = document.querySelector("#caseLanguage");
const caseCategory = document.querySelector("#caseCategory");
const resultGrid = document.querySelector("#resultGrid");
const jsonInput = document.querySelector("#jsonInput");
const exportButton = document.querySelector("#exportButton");

function normalizeState(nextState) {
  if (!nextState || !Array.isArray(nextState.testCases) || !Array.isArray(nextState.results)) {
    throw new Error("JSON 需要包含 testCases 和 results 两个数组。");
  }

  return {
    testCases: nextState.testCases,
    results: nextState.results
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function renderControls() {
  const activeCase = caseSelect.value || state.testCases[0]?.id || "";
  const activeModel = modelFilter.value || "all";

  caseSelect.innerHTML = state.testCases
    .map((item) => `<option value="${item.id}">${item.id}</option>`)
    .join("");
  caseSelect.value = state.testCases.some((item) => item.id === activeCase)
    ? activeCase
    : state.testCases[0]?.id || "";

  const models = unique(state.results.map((item) => item.model));
  modelFilter.innerHTML = [
    '<option value="all">全部模型</option>',
    ...models.map((model) => `<option value="${model}">${model}</option>`)
  ].join("");
  modelFilter.value = models.includes(activeModel) ? activeModel : "all";
}

function renderCaseInfo() {
  const selectedCase = getSelectedCase();
  caseText.textContent = selectedCase?.text || "暂无测试文本";
  caseLanguage.textContent = selectedCase?.language || "unknown";
  caseCategory.textContent = selectedCase?.category || "未分类";
}

function getSelectedCase() {
  return state.testCases.find((item) => item.id === caseSelect.value);
}

function getVisibleResults() {
  const selectedCaseId = caseSelect.value;
  const selectedModel = modelFilter.value;
  return state.results.filter((item) => {
    const sameCase = item.caseId === selectedCaseId;
    const sameModel = selectedModel === "all" || item.model === selectedModel;
    return sameCase && sameModel;
  });
}

function renderResults() {
  const rows = getVisibleResults();

  if (!rows.length) {
    resultGrid.innerHTML = '<div class="empty-state">当前测试用例还没有模型结果。</div>';
    return;
  }

  resultGrid.innerHTML = rows.map((item, index) => {
    const audioMarkup = item.audioPath
      ? `<audio controls preload="metadata" src="${item.audioPath}"></audio>`
      : '<div class="missing-audio">还没有绑定音频文件。生成 wav 后，把文件放进 web/audio/ 对应模型目录，并在 JSON 里填写 audioPath。</div>';

    return `
      <article class="result-card" data-index="${index}">
        <div>
          <h3 class="model-title">${item.model}</h3>
          <div class="meta-list">
            <span>说话人：${item.speaker || "-"}</span>
            <span>checkpoint：${item.checkpoint || "-"}</span>
            <span>生成耗时：${item.generationTimeSec ?? "-"} s</span>
          </div>
        </div>
        <div>
          ${audioMarkup}
        </div>
        <div>
          <div class="scores">
            ${scoreInput(item, "naturalness", "自然度")}
            ${scoreInput(item, "similarity", "相似度")}
            ${scoreInput(item, "pronunciation", "发音")}
          </div>
          <textarea data-field="notes" data-result-id="${resultKey(item)}" placeholder="记录主观感受、错误发音、韵律问题等">${item.notes || ""}</textarea>
        </div>
      </article>
    `;
  }).join("");
}

function scoreInput(item, field, label) {
  return `
    <label class="score-field">
      <span>${label}</span>
      <input
        type="number"
        min="1"
        max="5"
        step="0.5"
        value="${item[field] ?? ""}"
        data-field="${field}"
        data-result-id="${resultKey(item)}"
      >
    </label>
  `;
}

function resultKey(item) {
  return `${item.caseId}::${item.model}::${item.speaker || ""}::${item.checkpoint || ""}`;
}

function updateResult(event) {
  const field = event.target.dataset.field;
  const key = event.target.dataset.resultId;
  if (!field || !key) return;

  const result = state.results.find((item) => resultKey(item) === key);
  if (!result) return;

  if (event.target.type === "number") {
    result[field] = event.target.value === "" ? null : Number(event.target.value);
  } else {
    result[field] = event.target.value;
  }
}

function render() {
  renderControls();
  renderCaseInfo();
  renderResults();
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tts-results.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  try {
    state = normalizeState(JSON.parse(text));
    render();
  } catch (error) {
    alert(error instanceof Error ? error.message : "导入 JSON 失败。");
  }
}

async function loadInitialState() {
  if (window.location.protocol === "file:") {
    render();
    return;
  }

  try {
    const response = await fetch("./data/results.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`加载失败：${response.status}`);
    }

    state = normalizeState(await response.json());
  } catch (error) {
    console.warn("加载 web/data/results.json 失败，已回退到内置默认数据。", error);
  }

  render();
}

caseSelect.addEventListener("change", render);
modelFilter.addEventListener("change", render);
resultGrid.addEventListener("input", updateResult);
jsonInput.addEventListener("change", importJson);
exportButton.addEventListener("click", downloadJson);

loadInitialState();
