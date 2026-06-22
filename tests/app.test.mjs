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

function createEnvironment(protocol = "file:", fetchImpl = null) {
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
      location: { protocol },
    },
    document: {
      querySelector(selector) {
        return elements.get(selector) ?? null;
      },
    },
    console: {
      warn: () => {},
    },
    fetch: fetchImpl ?? (async () => {
      throw new Error("fetch should not be called in file mode");
    }),
    setTimeout,
    clearTimeout,
  };

  return { context, elements };
}

async function runApp(protocol = "file:", fetchImpl = null) {
  const appPath = path.resolve("web", "app.js");
  const source = fs.readFileSync(appPath, "utf8");
  const { context, elements } = createEnvironment(protocol, fetchImpl);

  vm.runInNewContext(source, context, { filename: appPath });
  await new Promise((resolve) => setImmediate(resolve));

  return elements;
}

async function main() {
  const fileModeElements = await runApp("file:");
  const fileModeDetail = fileModeElements.get("#sampleDetail").innerHTML;
  const fileModeBrief = fileModeElements.get("#datasetBrief").innerHTML;
  const fileModeModelArea = fileModeElements.get("#modelPlaceholders").innerHTML;

  assert.notEqual(fileModeElements.get("#sampleCount").textContent, "0 条样本");
  assert.match(fileModeDetail, /audio controls/);
  assert.match(fileModeDetail, /说话人/);
  assert.match(fileModeDetail, /时长/);
  assert.doesNotMatch(fileModeDetail, /音频路径/);
  assert.doesNotMatch(fileModeDetail, /频谱图路径/);
  assert.match(fileModeElements.get("#spectrogramPanel").innerHTML, /\.\/assets\/spectrograms\/.+\.png/);
  assert.match(fileModeBrief, /条样本/);
  assert.equal(fileModeModelArea, "");

  let fetchCallCount = 0;
  const httpModeElements = await runApp("http:", async () => {
    fetchCallCount += 1;
    return {
      ok: true,
      async json() {
        return {
          dataset: {
            name: "demo",
            speakerId: "speaker_a",
            sourceSpeakerId: "SSB0005",
            sampleCount: 1,
          },
          samples: [
            {
              uttId: "demo_001",
              text: "sample one",
              audioPath: "./audio/raw/demo_001.wav",
              spectrogramPath: "./assets/spectrograms/demo_001.png",
              speakerId: "speaker_a",
              language: "zh",
              durationSec: 1.234,
            },
          ],
        };
      },
    };
  });

  assert.equal(fetchCallCount, 1);
  assert.equal(httpModeElements.get("#sampleCount").textContent, "1 条样本");
  assert.match(httpModeElements.get("#sampleDetail").innerHTML, /demo_001/);
  assert.doesNotMatch(httpModeElements.get("#sampleDetail").innerHTML, /audioPath/);
  assert.match(httpModeElements.get("#spectrogramPanel").innerHTML, /demo_001\.png/);
}

await main();
