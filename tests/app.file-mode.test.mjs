import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

class MockElement {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.dataset = {};
    this.listeners = new Map();
    this.classList = {
      toggle: () => {},
    };
  }

  addEventListener(eventName, handler) {
    this.listeners.set(eventName, handler);
  }
}

function createEnvironment() {
  const elements = new Map();
  const selectors = [
    "#datasetBrief",
    "#modelPlaceholders",
    "#sampleDetail",
    "#spectrogramPanel",
    "#sampleList",
    "#sampleCount",
    "#loadNote",
  ];

  for (const selector of selectors) {
    elements.set(selector, new MockElement());
  }

  const context = {
    window: {
      location: { protocol: "file:" },
    },
    document: {
      querySelector(selector) {
        return elements.get(selector) ?? null;
      },
    },
    console: {
      warn: () => {},
    },
    fetch: async () => {
      throw new Error("fetch should not be called in file mode");
    },
    setTimeout,
    clearTimeout,
  };

  return { context, elements };
}

async function main() {
  const appPath = path.resolve("web", "app.js");
  const source = fs.readFileSync(appPath, "utf8");
  const { context, elements } = createEnvironment();

  vm.runInNewContext(source, context, { filename: appPath });
  await new Promise((resolve) => setImmediate(resolve));

  const sampleDetail = elements.get("#sampleDetail").innerHTML;
  const datasetBrief = elements.get("#datasetBrief").innerHTML;

  assert.match(sampleDetail, /SSB\d{4}/);
  assert.match(sampleDetail, /说话人/);
  assert.match(sampleDetail, /时长/);
  assert.doesNotMatch(sampleDetail, /音频路径/);
  assert.match(datasetBrief, /条样本/);
}

await main();
