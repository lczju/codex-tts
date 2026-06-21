# Raw Audio Workbench Checklist

## Asset checks

- `web/data/raw-samples.json` loads and contains samples.
- `web/audio/raw/` contains the referenced wav files.
- `web/assets/spectrograms/` contains the referenced png files.
- Dataset metadata reads as `AISHELL-3 speaker_a subset` / `SSB0005` / `speaker_a`.

## Homepage checks

- The sample list renders.
- The first sample is selected by default.
- Clicking another sample updates text, player, and spectrogram together.
- The dataset summary is visible.
- `CosyVoice` and `VITS` still render as empty placeholders.

## Dataset page checks

- Chinese text renders correctly.
- The page explains AISHELL-3 -> `SSB0005` -> `speaker_a`.
- The back link to the homepage works.

## Guardrails

- Do not fake model outputs.
- Do not merge homepage raw-sample data into `results.json`.
- Do not rely on `file://` for JSON-based verification.
