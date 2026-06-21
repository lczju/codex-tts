# Raw Audio Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static TTS workbench homepage that shows real `speaker_a` raw audio samples, linked spectrogram images, dataset summary, and empty model placeholders, while keeping dataset details on a child page.

**Architecture:** Keep the existing static `web/` app, but split data responsibilities cleanly. A Python asset-generation script produces `web/audio/raw/*.wav`, `web/assets/spectrograms/*.png`, and `web/data/raw-samples.json`; the frontend consumes `raw-samples.json` for raw-audio browsing and keeps `results.json` only for future model comparison data.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Python 3, `numpy`, `scipy`, `matplotlib`

---

## File Structure

- Create: `D:/codex/project0/scripts/generate_sample_spectrograms.py`
- Create: `D:/codex/project0/web/data/raw-samples.json`
- Create: `D:/codex/project0/web/audio/raw/.gitkeep`
- Create: `D:/codex/project0/web/assets/spectrograms/.gitkeep`
- Create: `D:/codex/project0/tests/test_generate_sample_spectrograms.py`
- Modify: `D:/codex/project0/web/index.html`
- Modify: `D:/codex/project0/web/styles.css`
- Modify: `D:/codex/project0/web/app.js`
- Modify: `D:/codex/project0/web/dataset.html`
- Modify: `D:/codex/project0/web/dataset.js`
- Modify: `D:/codex/project0/web/data/results.json`
- Modify: `D:/codex/project0/README.md`

## Task 1: Add a failing test for raw sample asset generation

**Files:**
- Create: `D:/codex/project0/tests/test_generate_sample_spectrograms.py`
- Test: `D:/codex/project0/tests/test_generate_sample_spectrograms.py`

- [ ] **Step 1: Write the failing test**

```python
from pathlib import Path
import csv
import wave
import struct
import importlib.util


def load_module():
    script_path = Path("scripts/generate_sample_spectrograms.py")
    spec = importlib.util.spec_from_file_location("generate_sample_spectrograms", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def write_test_wav(path: Path, frames: int = 1600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(16000)
        values = [int(12000 * ((i % 40) / 40.0 - 0.5)) for i in range(frames)]
        handle.writeframes(b"".join(struct.pack("<h", value) for value in values))


def test_generate_assets_creates_json_audio_and_spectrograms(tmp_path: Path):
    module = load_module()

    metadata_path = tmp_path / "metadata.csv"
    wavs_dir = tmp_path / "wavs"
    with metadata_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["utt_id", "wav_path", "text", "speaker_id", "language"])
        writer.writeheader()
        writer.writerow({
            "utt_id": "demo_001",
            "wav_path": "wavs/demo_001.wav",
            "text": "第一条测试样本",
            "speaker_id": "speaker_a",
            "language": "zh",
        })

    write_test_wav(wavs_dir / "demo_001.wav")

    output_audio_dir = tmp_path / "web" / "audio" / "raw"
    output_spectrogram_dir = tmp_path / "web" / "assets" / "spectrograms"
    output_json_path = tmp_path / "web" / "data" / "raw-samples.json"

    module.generate_assets(
        metadata_path=metadata_path,
        dataset_name="AISHELL-3 speaker_a subset",
        source_speaker_id="SSB0005",
        source_wavs_dir=wavs_dir,
        output_audio_dir=output_audio_dir,
        output_spectrogram_dir=output_spectrogram_dir,
        output_json_path=output_json_path,
        sample_limit=1,
    )

    assert (output_audio_dir / "demo_001.wav").exists()
    assert (output_spectrogram_dir / "demo_001.png").exists()
    assert output_json_path.exists()
    payload = output_json_path.read_text(encoding="utf-8")
    assert '"uttId": "demo_001"' in payload
    assert '"audioPath": "./audio/raw/demo_001.wav"' in payload
    assert '"spectrogramPath": "./assets/spectrograms/demo_001.png"' in payload
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pytest tests/test_generate_sample_spectrograms.py -v
```

Expected: `FAIL` because `scripts/generate_sample_spectrograms.py` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
from pathlib import Path
import csv
import json
import shutil
import wave

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram


def compute_duration_sec(wav_path: Path) -> float:
    with wave.open(str(wav_path), "rb") as handle:
        frames = handle.getnframes()
        rate = handle.getframerate()
        return round(frames / rate, 3)


def generate_spectrogram_png(wav_path: Path, output_path: Path) -> None:
    with wave.open(str(wav_path), "rb") as handle:
        rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())
    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
    _, _, power = spectrogram(samples, fs=rate, nperseg=256, noverlap=192)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.imshow(10 * np.log10(power + 1e-10), origin="lower", aspect="auto", cmap="magma")
    ax.set_xticks([])
    ax.set_yticks([])
    fig.tight_layout(pad=0)
    fig.savefig(output_path, dpi=120)
    plt.close(fig)


def generate_assets(
    metadata_path: Path,
    dataset_name: str,
    source_speaker_id: str,
    source_wavs_dir: Path,
    output_audio_dir: Path,
    output_spectrogram_dir: Path,
    output_json_path: Path,
    sample_limit: int = 10,
) -> None:
    output_audio_dir.mkdir(parents=True, exist_ok=True)
    output_spectrogram_dir.mkdir(parents=True, exist_ok=True)
    output_json_path.parent.mkdir(parents=True, exist_ok=True)

    samples = []
    with metadata_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows[:sample_limit]:
        utt_id = row["utt_id"]
        wav_path = source_wavs_dir / f"{utt_id}.wav"
        copied_wav_path = output_audio_dir / f"{utt_id}.wav"
        shutil.copy2(wav_path, copied_wav_path)
        spectrogram_path = output_spectrogram_dir / f"{utt_id}.png"
        generate_spectrogram_png(copied_wav_path, spectrogram_path)
        samples.append({
            "uttId": utt_id,
            "text": row["text"],
            "audioPath": f"./audio/raw/{utt_id}.wav",
            "spectrogramPath": f"./assets/spectrograms/{utt_id}.png",
            "speakerId": row["speaker_id"],
            "language": row["language"],
            "durationSec": compute_duration_sec(copied_wav_path),
        })

    payload = {
        "dataset": {
            "name": dataset_name,
            "speakerId": "speaker_a",
            "sourceSpeakerId": source_speaker_id,
            "sampleCount": len(samples),
        },
        "samples": samples,
    }
    output_json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pytest tests/test_generate_sample_spectrograms.py -v
```

Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add tests/test_generate_sample_spectrograms.py scripts/generate_sample_spectrograms.py
git commit -m "feat: add raw sample spectrogram generator"
```

## Task 2: Add CLI entrypoint and real output generation

**Files:**
- Modify: `D:/codex/project0/scripts/generate_sample_spectrograms.py`
- Create: `D:/codex/project0/web/audio/raw/.gitkeep`
- Create: `D:/codex/project0/web/assets/spectrograms/.gitkeep`
- Create: `D:/codex/project0/web/data/raw-samples.json`
- Test: `D:/codex/project0/tests/test_generate_sample_spectrograms.py`

- [ ] **Step 1: Write the failing test for CLI defaults**

```python
def test_build_default_paths_points_to_project_directories():
    module = load_module()

    paths = module.build_default_paths(Path("D:/codex/project0"))

    assert paths["metadata_path"] == Path("D:/codex/project0/datasets/raw/speaker_a/metadata.csv")
    assert paths["source_wavs_dir"] == Path("D:/codex/project0/datasets/raw/speaker_a/wavs")
    assert paths["output_audio_dir"] == Path("D:/codex/project0/web/audio/raw")
    assert paths["output_spectrogram_dir"] == Path("D:/codex/project0/web/assets/spectrograms")
    assert paths["output_json_path"] == Path("D:/codex/project0/web/data/raw-samples.json")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
pytest tests/test_generate_sample_spectrograms.py -v
```

Expected: `FAIL` because `build_default_paths` is not defined yet.

- [ ] **Step 3: Write minimal implementation**

```python
import argparse


def build_default_paths(project_root: Path) -> dict[str, Path]:
    return {
        "metadata_path": project_root / "datasets" / "raw" / "speaker_a" / "metadata.csv",
        "source_wavs_dir": project_root / "datasets" / "raw" / "speaker_a" / "wavs",
        "output_audio_dir": project_root / "web" / "audio" / "raw",
        "output_spectrogram_dir": project_root / "web" / "assets" / "spectrograms",
        "output_json_path": project_root / "web" / "data" / "raw-samples.json",
    }


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    defaults = build_default_paths(project_root)
    parser = argparse.ArgumentParser(description="Generate raw-audio sample assets for the web workbench.")
    parser.add_argument("--sample-limit", type=int, default=10)
    parser.add_argument("--dataset-name", default="AISHELL-3 speaker_a subset")
    parser.add_argument("--source-speaker-id", default="SSB0005")
    parser.add_argument("--metadata-path", type=Path, default=defaults["metadata_path"])
    parser.add_argument("--source-wavs-dir", type=Path, default=defaults["source_wavs_dir"])
    parser.add_argument("--output-audio-dir", type=Path, default=defaults["output_audio_dir"])
    parser.add_argument("--output-spectrogram-dir", type=Path, default=defaults["output_spectrogram_dir"])
    parser.add_argument("--output-json-path", type=Path, default=defaults["output_json_path"])
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    generate_assets(
        metadata_path=args.metadata_path,
        dataset_name=args.dataset_name,
        source_speaker_id=args.source_speaker_id,
        source_wavs_dir=args.source_wavs_dir,
        output_audio_dir=args.output_audio_dir,
        output_spectrogram_dir=args.output_spectrogram_dir,
        output_json_path=args.output_json_path,
        sample_limit=args.sample_limit,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
pytest tests/test_generate_sample_spectrograms.py -v
```

Expected: `PASS`

- [ ] **Step 5: Run the generator for real assets**

Run:

```powershell
python scripts/generate_sample_spectrograms.py
```

Expected:
- `web/audio/raw/*.wav` contains about `10` copied sample wav files
- `web/assets/spectrograms/*.png` contains about `10` spectrogram images
- `web/data/raw-samples.json` exists with matching sample entries

- [ ] **Step 6: Commit**

```powershell
git add scripts/generate_sample_spectrograms.py web/audio/raw web/assets/spectrograms web/data/raw-samples.json
git commit -m "feat: generate raw audio sample assets"
```

## Task 3: Restructure the homepage HTML for raw-audio browsing

**Files:**
- Modify: `D:/codex/project0/web/index.html`
- Test: browser/manual verification

- [ ] **Step 1: Write the failing UI expectation as a checklist test**

Create this temporary acceptance checklist in your working notes and verify current page fails it:

```text
Homepage must show:
1. Raw audio sample list container
2. Current sample detail panel
3. Spectrogram image panel
4. Dataset summary card with dataset page link
5. Empty model placeholder cards for CosyVoice and VITS
```

- [ ] **Step 2: Run manual verification to confirm current page fails**

Run:

```powershell
Start-Process "D:/codex/project0/web/index.html"
```

Expected: current page lacks raw sample list and spectrogram sections.

- [ ] **Step 3: Write minimal HTML implementation**

Replace the current main body structure with sections that expose stable DOM hooks:

```html
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">TTS</span>
        <div>
          <h1>模型效果对比工作台</h1>
          <p>当前阶段先展示原始语音，模型结果后续补充。</p>
        </div>
      </div>

      <nav class="page-nav">
        <a href="./dataset.html">查看数据集详情</a>
      </nav>

      <section class="dataset-brief" id="datasetBrief"></section>

      <section class="model-placeholder-list">
        <article class="placeholder-card">
          <h2>CosyVoice</h2>
          <p>待接入真实推理结果。</p>
        </article>
        <article class="placeholder-card">
          <h2>VITS</h2>
          <p>待接入真实微调结果。</p>
        </article>
      </section>
    </aside>

    <main class="main">
      <section class="sample-detail" id="sampleDetail"></section>
      <section class="spectrogram-panel" id="spectrogramPanel"></section>
      <section class="sample-list-panel">
        <div class="section-head">
          <h2>原始语音样本</h2>
          <p>当前展示 speaker_a 的真实语音与频谱样例。</p>
        </div>
        <div class="sample-list" id="sampleList"></div>
      </section>
    </main>
  </div>
  <script src="app.js"></script>
</body>
```

- [ ] **Step 4: Verify the new structure renders**

Run:

```powershell
Start-Process "D:/codex/project0/web/index.html"
```

Expected: static sections appear, though data-driven content is still empty until `app.js` is updated.

- [ ] **Step 5: Commit**

```powershell
git add web/index.html
git commit -m "feat: restructure homepage layout"
```

## Task 4: Implement homepage data loading and raw-sample interactions

**Files:**
- Modify: `D:/codex/project0/web/app.js`
- Modify: `D:/codex/project0/web/data/results.json`
- Test: browser/manual verification

- [ ] **Step 1: Write the failing interaction test as expected behavior**

Use this expected behavior to confirm current JS fails:

```text
When raw-samples.json loads:
1. Dataset brief shows dataset name and sample count
2. Sample list renders clickable rows
3. First sample is selected by default
4. Sample detail shows text, audio, and metadata
5. Spectrogram panel shows current sample image
6. Missing file cases render user-facing empty states
```

- [ ] **Step 2: Verify the current script fails the behavior**

Run:

```powershell
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/web/index.html
```

Expected: page still only renders old model-oriented UI or breaks against the new DOM.

- [ ] **Step 3: Write minimal implementation**

Implement `app.js` around a new state model:

```javascript
const state = {
  rawSamples: [],
  dataset: null,
  selectedSampleId: null,
};

const datasetBrief = document.querySelector("#datasetBrief");
const sampleList = document.querySelector("#sampleList");
const sampleDetail = document.querySelector("#sampleDetail");
const spectrogramPanel = document.querySelector("#spectrogramPanel");

function getSelectedSample() {
  return state.rawSamples.find((item) => item.uttId === state.selectedSampleId) || null;
}

function renderDatasetBrief() {
  if (!state.dataset) {
    datasetBrief.innerHTML = '<div class="empty-state">数据集摘要暂不可用。</div>';
    return;
  }
  datasetBrief.innerHTML = `
    <span class="eyebrow">Dataset</span>
    <h2>${state.dataset.name}</h2>
    <p>来源说话人：${state.dataset.sourceSpeakerId}</p>
    <p>当前展示样本：${state.dataset.sampleCount} 条</p>
  `;
}

function renderSampleList() {
  if (!state.rawSamples.length) {
    sampleList.innerHTML = '<div class="empty-state">原始语音样本尚未生成。</div>';
    return;
  }
  sampleList.innerHTML = state.rawSamples.map((item) => `
    <button class="sample-row${item.uttId === state.selectedSampleId ? " is-active" : ""}" data-sample-id="${item.uttId}" type="button">
      <strong>${item.uttId}</strong>
      <span>${item.text}</span>
      <small>${item.durationSec ?? "-"} s</small>
    </button>
  `).join("");
}

function renderSampleDetail() {
  const sample = getSelectedSample();
  if (!sample) {
    sampleDetail.innerHTML = '<div class="empty-state">请选择一个原始语音样本。</div>';
    return;
  }
  const audioMarkup = sample.audioPath
    ? `<audio controls preload="metadata" src="${sample.audioPath}"></audio>`
    : '<div class="missing-audio">音频未生成。</div>';
  sampleDetail.innerHTML = `
    <span class="eyebrow">Current Sample</span>
    <h2>${sample.uttId}</h2>
    <p class="sample-text">${sample.text}</p>
    <div class="meta-list">
      <span>说话人：${sample.speakerId}</span>
      <span>语言：${sample.language}</span>
      <span>时长：${sample.durationSec ?? "-"} s</span>
    </div>
    ${audioMarkup}
  `;
}

function renderSpectrogram() {
  const sample = getSelectedSample();
  if (!sample) {
    spectrogramPanel.innerHTML = '<div class="empty-state">频谱暂不可用。</div>';
    return;
  }
  spectrogramPanel.innerHTML = sample.spectrogramPath
    ? `<img src="${sample.spectrogramPath}" alt="${sample.uttId} 频谱图">`
    : '<div class="empty-state">频谱未生成。</div>';
}

function render() {
  renderDatasetBrief();
  renderSampleList();
  renderSampleDetail();
  renderSpectrogram();
}

async function loadRawSamples() {
  try {
    const response = await fetch("./data/raw-samples.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.dataset = payload.dataset || null;
    state.rawSamples = Array.isArray(payload.samples) ? payload.samples : [];
    state.selectedSampleId = state.rawSamples[0]?.uttId || null;
  } catch (error) {
    console.warn("加载原始语音样本失败。", error);
    state.dataset = null;
    state.rawSamples = [];
    state.selectedSampleId = null;
  }
  render();
}

sampleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sample-id]");
  if (!button) return;
  state.selectedSampleId = button.dataset.sampleId;
  render();
});

loadRawSamples();
```

Also replace `web/data/results.json` with valid UTF-8 Chinese placeholder text so the future model data file is no longer garbled.

- [ ] **Step 4: Verify the interaction works**

Run:

```powershell
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/web/index.html
```

Expected:
- first sample auto-selected
- list is scrollable
- clicking rows updates detail and spectrogram
- no broken Chinese text

- [ ] **Step 5: Commit**

```powershell
git add web/app.js web/data/results.json
git commit -m "feat: load raw samples on homepage"
```

## Task 5: Add homepage styling for the new workbench layout

**Files:**
- Modify: `D:/codex/project0/web/styles.css`
- Test: browser/manual verification

- [ ] **Step 1: Write the failing visual checklist**

```text
Styles must provide:
1. Three-zone layout that remains readable on desktop
2. Scrollable sample list
3. Clear active state for selected sample
4. Readable empty states and placeholder cards
5. Spectrogram image fits the panel without distortion
6. Mobile fallback stacks content vertically
```

- [ ] **Step 2: Verify current CSS fails**

Run the homepage in the browser and confirm the new HTML is not laid out correctly yet.

- [ ] **Step 3: Write minimal CSS implementation**

Add styles along these lines:

```css
.main {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  grid-template-areas:
    "detail spectrogram"
    "list spectrogram";
  gap: 24px;
}

.sample-detail { grid-area: detail; }
.spectrogram-panel { grid-area: spectrogram; }
.sample-list-panel { grid-area: list; min-height: 0; }

.sample-list {
  display: grid;
  gap: 12px;
  max-height: 460px;
  overflow: auto;
}

.sample-row {
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 14px;
  text-align: left;
  background: var(--panel-bg);
}

.sample-row.is-active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(202, 123, 58, 0.15);
}

.spectrogram-panel img {
  width: 100%;
  height: auto;
  border-radius: 18px;
  display: block;
}

.placeholder-card,
.dataset-brief,
.sample-detail,
.spectrogram-panel,
.sample-list-panel {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(36, 30, 18, 0.08);
  border-radius: 24px;
  padding: 20px;
}

@media (max-width: 960px) {
  .app-shell,
  .main {
    display: flex;
    flex-direction: column;
  }

  .sample-list {
    max-height: none;
  }
}
```

- [ ] **Step 4: Verify styling works**

Run:

```powershell
python -m http.server 8000
```

Open the homepage and confirm desktop and narrow-width layouts are readable.

- [ ] **Step 5: Commit**

```powershell
git add web/styles.css
git commit -m "feat: style raw audio workbench layout"
```

## Task 6: Refresh the dataset page content and navigation

**Files:**
- Modify: `D:/codex/project0/web/dataset.html`
- Modify: `D:/codex/project0/web/dataset.js`
- Test: browser/manual verification

- [ ] **Step 1: Write the failing content checklist**

```text
Dataset page must:
1. Show readable Chinese text
2. Reflect speaker_a / SSB0005 extracted subset
3. Link back to homepage
4. Keep current dataset overview structure
```

- [ ] **Step 2: Verify the current page fails**

Run:

```powershell
Start-Process "D:/codex/project0/web/dataset.html"
```

Expected: page contains garbled Chinese text and lacks the new homepage navigation.

- [ ] **Step 3: Write minimal implementation**

In `web/dataset.html`, add a simple back link:

```html
<a class="back-link" href="./index.html">返回工作台</a>
```

In `web/dataset.js`, replace garbled strings with valid UTF-8 Chinese and keep values aligned with current extracted data:

```javascript
const datasetOverview = {
  name: "AISHELL-3",
  summary: "AISHELL-3 是一个适合中文 TTS 实验的多说话人数据集。本页面重点展示当前已抽取的 speaker_a 子集，方便和主页面的原始语音试听联动。",
  tags: ["中文", "多说话人", "TTS", "speaker_a", "44.1kHz", "PCM WAV"],
  subset: [
    { term: "当前抽取说话人", detail: "SSB0005" },
    { term: "映射名称", detail: "speaker_a" },
    { term: "样本条数", detail: "467 条训练音频" },
    { term: "总时长", detail: "约 0.673 小时" },
    { term: "本地目录", detail: "datasets/raw/speaker_a/" }
  ]
};
```

- [ ] **Step 4: Verify the dataset page**

Run:

```powershell
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/web/dataset.html
```

Expected: page text is readable and navigation back to homepage works.

- [ ] **Step 5: Commit**

```powershell
git add web/dataset.html web/dataset.js
git commit -m "feat: refresh dataset detail page"
```

## Task 7: Update repository documentation and verify end-to-end behavior

**Files:**
- Modify: `D:/codex/project0/README.md`
- Test: manual verification

- [ ] **Step 1: Write the failing documentation checklist**

```text
README must explain:
1. Homepage now shows raw audio samples and spectrograms
2. Dataset page is a child page
3. How to regenerate sample assets
4. That model results are still placeholders
```

- [ ] **Step 2: Verify current README fails**

Open the README and confirm it does not document the new raw-audio workbench flow clearly.

- [ ] **Step 3: Write minimal implementation**

Add a short section like:

```markdown
## 当前页面结构

- `web/index.html`
  - 主工作台，当前展示 `speaker_a` 的原始语音样本、播放器和频谱图
  - `CosyVoice` / `VITS` 区域暂为占位，等待真实结果接入
- `web/dataset.html`
  - 数据集详情子页面

## 重新生成样本频谱

运行：

```powershell
python scripts/generate_sample_spectrograms.py
```

脚本会更新：

- `web/audio/raw/`
- `web/assets/spectrograms/`
- `web/data/raw-samples.json`
```

- [ ] **Step 4: Run end-to-end verification**

Run:

```powershell
pytest tests/test_generate_sample_spectrograms.py -v
python scripts/generate_sample_spectrograms.py
python -m http.server 8000
```

Then verify in the browser:
- `http://127.0.0.1:8000/web/index.html`
- `http://127.0.0.1:8000/web/dataset.html`

Expected:
- tests pass
- generator runs cleanly
- homepage shows raw samples, playable audio, dataset brief, spectrogram, placeholders
- dataset page is readable

- [ ] **Step 5: Commit**

```powershell
git add README.md
git commit -m "docs: document raw audio workbench flow"
```

## Self-Review

- Spec coverage:
  - Homepage raw-audio list: Task 3, Task 4, Task 5
  - Offline STFT script and retained Python source: Task 1, Task 2
  - Dataset child page: Task 6
  - UTF-8 cleanup for touched UI/data/docs: Task 4, Task 6, Task 7
  - Verification and regeneration workflow: Task 7
- Placeholder scan:
  - No `TODO`, `TBD`, or “handle appropriately” placeholders remain
  - Every code-changing task includes concrete code and commands
- Type consistency:
  - Raw sample schema uses `uttId`, `text`, `audioPath`, `spectrogramPath`, `speakerId`, `language`, `durationSec` consistently across script and frontend
