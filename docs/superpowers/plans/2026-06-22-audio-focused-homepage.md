# Audio-Focused Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把首页改成更聚焦音频试听的页面，减少面向维护者的技术信息暴露。

**Architecture:** 保留现有静态页面和 `app.js` 的数据加载方式，收敛首页 DOM 结构，只突出文本、播放器、频谱图和样本切换。渲染逻辑改为输出简短摘要与必要元信息，删除模型占位和路径展示。

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js test runner (`.mjs`)

---

### Task 1: 锁定首页新信息层级

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `tests/app.file-mode.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
assert.doesNotMatch(sampleDetail, /音频路径/);
assert.doesNotMatch(sampleDetail, /频谱图路径/);
assert.doesNotMatch(modelArea, /CosyVoice|VITS/);
assert.match(datasetBrief, /条样本/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/app.test.mjs`
Expected: FAIL，因为当前页面仍然渲染路径和模型占位信息

- [ ] **Step 3: Write minimal implementation**

```js
// 在 app.js 中删除模型占位渲染，改写 datasetBrief 和 sampleDetail 的输出内容
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/app.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/app.test.mjs tests/app.file-mode.test.mjs web/app.js web/index.html web/styles.css
git commit -m "feat: focus homepage on audio playback"
```

### Task 2: 重排首页结构与样式

**Files:**
- Modify: `web/index.html`
- Modify: `web/styles.css`

- [ ] **Step 1: Write the failing test**

```js
assert.match(sampleDetail, /audio controls/);
assert.match(sampleDetail, /说话人/);
assert.match(sampleDetail, /时长/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/app.file-mode.test.mjs`
Expected: FAIL，如果新结构没有稳定输出必要信息

- [ ] **Step 3: Write minimal implementation**

```html
<section class="hero-panel">
  <div id="sampleDetail" class="hero-detail"></div>
  <div id="spectrogramPanel" class="spectrogram-panel"></div>
</section>
```

```css
.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 320px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/app.file-mode.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/index.html web/styles.css tests/app.file-mode.test.mjs
git commit -m "style: streamline raw audio homepage"
```
