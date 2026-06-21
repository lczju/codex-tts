---
name: tts-raw-audio-workbench
description: Use when updating this repository's raw-audio homepage, regenerating spectrogram assets, refreshing raw-samples.json, or maintaining the dataset child page before real model outputs are available.
---

# TTS Raw Audio Workbench

## Overview

This skill keeps the repository's current product boundary stable:

- `web/index.html` is the main entry page
- the homepage shows real raw audio only
- `CosyVoice` and `VITS` stay as empty placeholders until real outputs exist
- dataset details stay on `web/dataset.html`

## When to Use

Use this skill when work touches any of these files or flows:

- `scripts/generate_sample_spectrograms.py`
- `web/data/raw-samples.json`
- `web/audio/raw/`
- `web/assets/spectrograms/`
- `web/index.html`
- `web/dataset.html`

Do not use this skill for model training, cloud deployment, or filling fake model results into `web/data/results.json`.

## Current Contract

- `web/data/raw-samples.json` is only for homepage raw-sample browsing.
- `web/data/results.json` is only for future model comparison results.
- The homepage must not pretend `CosyVoice` or `VITS` outputs already exist.
- Spectrograms are generated offline in Python, not inside the browser.
- Browser verification should use local HTTP, not `file://`.

## Workflow

1. If dataset assets changed, run `python scripts/generate_sample_spectrograms.py`.
2. Confirm it refreshes:
   - `web/audio/raw/`
   - `web/assets/spectrograms/`
   - `web/data/raw-samples.json`
3. Keep dataset metadata aligned to the current subset:
   - dataset name: `AISHELL-3 speaker_a subset`
   - source speaker: `SSB0005`
   - repo speaker id: `speaker_a`
4. If homepage copy or structure changes, preserve these sections:
   - dataset summary
   - raw sample list
   - current sample detail
   - spectrogram panel
   - model placeholder cards
5. If dataset page changes, keep it explanatory rather than turning it into another workbench.

## Verification

Run these checks after changes:

```powershell
python -B -m pytest tests/test_generate_sample_spectrograms.py -v
python scripts/generate_sample_spectrograms.py
python -m http.server 8000
```

Then open:

- `http://127.0.0.1:8000/web/index.html`
- `http://127.0.0.1:8000/web/dataset.html`

Use `references/checklist.md` for the page-level acceptance checks.

## Common Mistakes

- Mixing raw-sample data into `results.json`
- Replacing placeholders with invented model outputs
- Testing through `file://` and assuming JSON loading is broken
- Changing dataset labels so `speaker_a`, `SSB0005`, and AISHELL-3 no longer line up
- Generating spectrograms in browser-side JavaScript
