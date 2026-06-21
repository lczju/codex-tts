from __future__ import annotations

import csv
import json
import shutil
import wave
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram


def _resolve_wav_path(root: Path, wav_path_value: str) -> tuple[Path, Path]:
    relative_wav_path = Path(wav_path_value)
    if relative_wav_path.is_absolute():
        raise ValueError(f"Invalid wav_path outside root: {wav_path_value}")

    resolved_root = root.resolve()
    resolved_path = (root / relative_wav_path).resolve()
    try:
        resolved_path.relative_to(resolved_root)
    except ValueError as error:
        raise ValueError(f"Invalid wav_path outside root: {wav_path_value}") from error

    return relative_wav_path, resolved_path


def _read_wav_samples(wav_path: Path) -> tuple[int, np.ndarray]:
    with wave.open(str(wav_path), "rb") as handle:
        channels = handle.getnchannels()
        sample_width = handle.getsampwidth()
        if channels != 1:
            raise ValueError(f"Unsupported channel count for WAV: {channels}")
        if sample_width != 2:
            raise ValueError(f"Unsupported sample width for WAV: {sample_width}")

        sample_rate = handle.getframerate()
        frames = handle.readframes(handle.getnframes())

    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
    return sample_rate, samples


def compute_duration_sec(wav_path: Path) -> float:
    with wave.open(str(wav_path), "rb") as handle:
        frame_count = handle.getnframes()
        sample_rate = handle.getframerate()
    return round(frame_count / sample_rate, 3)


def generate_spectrogram_png(wav_path: Path, output_path: Path) -> None:
    sample_rate, samples = _read_wav_samples(wav_path)
    _, _, power = spectrogram(samples, fs=sample_rate, nperseg=256, noverlap=192)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure, axis = plt.subplots(figsize=(8, 3))
    axis.imshow(
        10 * np.log10(power + 1e-10),
        origin="lower",
        aspect="auto",
        cmap="magma",
    )
    axis.set_xticks([])
    axis.set_yticks([])
    figure.tight_layout(pad=0)
    figure.savefig(output_path, dpi=120)
    plt.close(figure)


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
        reader = csv.DictReader(handle)
        for row in reader:
            if len(samples) >= sample_limit:
                break

            utt_id = row["utt_id"]
            relative_wav_path, source_wav_path = _resolve_wav_path(source_wavs_dir, row["wav_path"])
            _, copied_wav_path = _resolve_wav_path(output_audio_dir, row["wav_path"])
            _, spectrogram_path = _resolve_wav_path(
                output_spectrogram_dir,
                str(relative_wav_path.with_suffix(".png")),
            )

            copied_wav_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_wav_path, copied_wav_path)
            generate_spectrogram_png(copied_wav_path, spectrogram_path)

            samples.append(
                {
                    "uttId": utt_id,
                    "text": row["text"],
                    "audioPath": f"./audio/raw/{relative_wav_path.as_posix()}",
                    "spectrogramPath": f"./assets/spectrograms/{relative_wav_path.with_suffix('.png').as_posix()}",
                    "speakerId": row["speaker_id"],
                    "language": row["language"],
                    "durationSec": compute_duration_sec(copied_wav_path),
                }
            )

    dataset_speaker_id = samples[0]["speakerId"] if samples else ""
    payload = {
        "dataset": {
            "name": dataset_name,
            "speakerId": dataset_speaker_id,
            "sourceSpeakerId": source_speaker_id,
            "sampleCount": len(samples),
        },
        "samples": samples,
    }
    output_json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
