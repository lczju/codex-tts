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
    "#sampleDetail",
    "#spectrogramPanel",
    "#sampleList",
    "#sampleCount",
    "#loadNote",
    "#datasetOverview",
    "#benchmarkResults",
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
  const appPath = path.resolve("web", "assets", "js", "app.js");
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
  const fileModeOverview = fileModeElements.get("#datasetOverview").innerHTML;
  const fileModeBenchmark = fileModeElements.get("#benchmarkResults").innerHTML;

  assert.notEqual(fileModeElements.get("#sampleCount").textContent, "0 条样本");
  assert.match(fileModeDetail, /audio controls/);
  assert.match(fileModeDetail, /说话人/);
  assert.match(fileModeDetail, /时长/);
  assert.doesNotMatch(fileModeDetail, /audioPath/);
  assert.match(fileModeElements.get("#spectrogramPanel").innerHTML, /\.\/media\/spectrograms\/.+\.png/);
  assert.match(fileModeBrief, /条样本/);
  assert.match(fileModeOverview, /AISHELL-3/);
  assert.match(fileModeBenchmark, /CosyVoice/);

  const fetchCalls = [];
  const httpModeElements = await runApp("http:", async (url) => {
    fetchCalls.push(url);

    if (url === "./data/raw-samples.json") {
      return {
        ok: true,
        async json() {
          return {
            dataset: {
              name: "demo raw samples",
              speakerId: "speaker_a",
              sourceSpeakerId: "SSB0005",
              sampleCount: 1,
            },
            samples: [
              {
                uttId: "demo_001",
                text: "sample one",
                audioPath: "./media/audio/raw/demo_001.wav",
                spectrogramPath: "./media/spectrograms/demo_001.png",
                speakerId: "speaker_a",
                language: "zh",
                durationSec: 1.234,
              },
            ],
          };
        },
      };
    }

    if (url === "./data/dataset-overview.json") {
      return {
        ok: true,
        async json() {
          return {
            name: "AISHELL-3 / speaker_a",
            summary: "Demo dataset summary",
            stats: [
              { label: "训练条数", value: "467", note: "speaker_a" },
            ],
          };
        },
      };
    }

    if (url === "./data/benchmark-results.json") {
      return {
        ok: true,
        async json() {
          return {
            testCases: [
              { id: "case_001", text: "hello", language: "zh", category: "basic" },
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
                notes: "pending",
              },
            ],
          };
        },
      };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });

  assert.deepEqual(fetchCalls, [
    "./data/raw-samples.json",
    "./data/dataset-overview.json",
    "./data/benchmark-results.json",
  ]);
  assert.equal(httpModeElements.get("#sampleCount").textContent, "1 条样本");
  assert.match(httpModeElements.get("#sampleDetail").innerHTML, /demo_001/);
  assert.match(httpModeElements.get("#datasetOverview").innerHTML, /Demo dataset summary/);
  assert.match(httpModeElements.get("#benchmarkResults").innerHTML, /case_001/);
}

await main();
