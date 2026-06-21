from __future__ import annotations

import atexit
import csv
import gc
import importlib.util
import json
import math
import shutil
import struct
import subprocess
import sys
import uuid
import wave
from pathlib import Path

sys.dont_write_bytecode = True

TESTS_DIR = Path("tests")
TEMP_ROOT = TESTS_DIR / ".tmp"


def load_module():
    script_path = Path("scripts/generate_sample_spectrograms.py")
    spec = importlib.util.spec_from_file_location("generate_sample_spectrograms", script_path)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def write_test_wav(path: Path, frames: int = 1600, channels: int = 1, sample_width: int = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(channels)
        handle.setsampwidth(sample_width)
        handle.setframerate(16000)
        samples = [
            int(12000 * math.sin((2.0 * math.pi * 440.0 * index) / 16000.0))
            for index in range(frames)
        ]
        if sample_width == 2:
            handle.writeframes(
                b"".join(
                    struct.pack("<" + ("h" * channels), *([sample] * channels))
                    for sample in samples
                )
            )
            return

        handle.writeframes(bytes([64]) * frames * channels * sample_width)


def cleanup_test_workspace(tmp_path: Path, temp_root: Path) -> None:
    gc.collect()
    shutil.rmtree(tmp_path, ignore_errors=True)
    pycache_path = TESTS_DIR / "__pycache__"
    if pycache_path.exists():
        shutil.rmtree(pycache_path, ignore_errors=True)
    if temp_root.exists() and not any(temp_root.iterdir()):
        temp_root.rmdir()


def cleanup_test_artifacts() -> None:
    gc.collect()
    cleanup_script = (
        f"Start-Sleep -Milliseconds 200; "
        f"Remove-Item -LiteralPath '{TEMP_ROOT.resolve()}' -Recurse -Force -ErrorAction SilentlyContinue; "
        f"Remove-Item -LiteralPath '{(TESTS_DIR / '__pycache__').resolve()}' -Recurse -Force -ErrorAction SilentlyContinue"
    )
    subprocess.Popen(
        [
            "powershell",
            "-NoProfile",
            "-WindowStyle",
            "Hidden",
            "-Command",
            cleanup_script,
        ]
    )


atexit.register(cleanup_test_artifacts)


def test_generate_assets_preserves_relative_wav_paths_and_derives_dataset_speaker():
    module = load_module()
    temp_root = TEMP_ROOT
    temp_root.mkdir(parents=True, exist_ok=True)
    tmp_path = temp_root / uuid.uuid4().hex
    tmp_path.mkdir(parents=True, exist_ok=False)

    try:
        metadata_path = tmp_path / "metadata.csv"
        wavs_dir = tmp_path / "wavs"
        with metadata_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["utt_id", "wav_path", "text", "speaker_id", "language"],
            )
            writer.writeheader()
            writer.writerow(
                {
                    "utt_id": "demo_001",
                    "wav_path": "nested/demo_001.wav",
                    "text": "第一条测试样本",
                    "speaker_id": "speaker_b",
                    "language": "zh",
                }
            )

            writer.writerow(
                {
                    "utt_id": "demo_002",
                    "wav_path": "other/demo_002.wav",
                    "text": "sample two",
                    "speaker_id": "speaker_a",
                    "language": "en",
                }
            )

        write_test_wav(wavs_dir / "nested" / "demo_001.wav")
        write_test_wav(wavs_dir / "other" / "demo_002.wav")

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

        audio_output_path = output_audio_dir / "nested" / "demo_001.wav"
        spectrogram_output_path = output_spectrogram_dir / "nested" / "demo_001.png"

        assert audio_output_path.exists()
        assert spectrogram_output_path.exists()
        assert output_json_path.exists()

        payload = json.loads(output_json_path.read_text(encoding="utf-8"))
        assert payload["dataset"]["name"] == "AISHELL-3 speaker_a subset"
        assert payload["dataset"]["speakerId"] == "speaker_b"
        assert payload["dataset"]["sourceSpeakerId"] == "SSB0005"
        assert payload["dataset"]["sampleCount"] == 1
        assert payload["samples"] == [
            {
                "uttId": "demo_001",
                "text": "第一条测试样本",
                "audioPath": "./audio/raw/nested/demo_001.wav",
                "spectrogramPath": "./assets/spectrograms/nested/demo_001.png",
                "speakerId": "speaker_b",
                "language": "zh",
                "durationSec": 0.1,
            }
        ]
    finally:
        cleanup_test_workspace(tmp_path, temp_root)


def test_generate_assets_rejects_wav_paths_outside_source_root():
    module = load_module()
    temp_root = TEMP_ROOT
    temp_root.mkdir(parents=True, exist_ok=True)
    tmp_path = temp_root / uuid.uuid4().hex
    tmp_path.mkdir(parents=True, exist_ok=False)

    try:
        metadata_path = tmp_path / "metadata.csv"
        wavs_dir = tmp_path / "wavs"
        with metadata_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["utt_id", "wav_path", "text", "speaker_id", "language"],
            )
            writer.writeheader()
            writer.writerow(
                {
                    "utt_id": "demo_001",
                    "wav_path": "../escape.wav",
                    "text": "sample one",
                    "speaker_id": "speaker_a",
                    "language": "zh",
                }
            )

        write_test_wav(tmp_path / "escape.wav")

        try:
            module.generate_assets(
                metadata_path=metadata_path,
                dataset_name="AISHELL-3 speaker_a subset",
                source_speaker_id="SSB0005",
                source_wavs_dir=wavs_dir,
                output_audio_dir=tmp_path / "web" / "audio" / "raw",
                output_spectrogram_dir=tmp_path / "web" / "assets" / "spectrograms",
                output_json_path=tmp_path / "web" / "data" / "raw-samples.json",
                sample_limit=1,
            )
        except ValueError as error:
            assert "wav_path" in str(error)
        else:
            raise AssertionError("Expected ValueError for invalid wav_path")
    finally:
        cleanup_test_workspace(tmp_path, temp_root)


def test_generate_spectrogram_png_rejects_unsupported_wav_shape():
    module = load_module()
    temp_root = TEMP_ROOT
    temp_root.mkdir(parents=True, exist_ok=True)
    tmp_path = temp_root / uuid.uuid4().hex
    tmp_path.mkdir(parents=True, exist_ok=False)

    try:
        wav_path = tmp_path / "stereo.wav"
        output_path = tmp_path / "spectrogram.png"
        write_test_wav(wav_path, channels=2)

        try:
            module.generate_spectrogram_png(wav_path, output_path)
        except ValueError as error:
            assert "channel" in str(error).lower()
        else:
            raise AssertionError("Expected ValueError for unsupported WAV shape")
    finally:
        cleanup_test_workspace(tmp_path, temp_root)
