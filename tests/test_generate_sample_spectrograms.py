from __future__ import annotations

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


def make_test_workspace() -> Path:
    scratch_root = Path.cwd() / ".tmp-tests"
    scratch_root.mkdir(parents=True, exist_ok=True)
    workspace = scratch_root / f"generate-sample-spectrograms-tests-{uuid.uuid4().hex}"
    workspace.mkdir(parents=True, exist_ok=False)
    return workspace


def cleanup_path(path: Path) -> None:
    gc.collect()
    shutil.rmtree(path, ignore_errors=True)
    if path.exists():
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"Remove-Item -LiteralPath '{path.resolve()}' -Recurse -Force -ErrorAction SilentlyContinue",
            ],
            check=False,
        )


def cleanup_test_workspace(workspace: Path) -> None:
    cleanup_path(workspace)
    scratch_root = Path.cwd() / ".tmp-tests"
    if scratch_root.exists() and not any(scratch_root.iterdir()):
        scratch_root.rmdir()
    pycache_path = TESTS_DIR / "__pycache__"
    if pycache_path.exists():
        cleanup_path(pycache_path)


def test_make_test_workspace_creates_temp_dir_under_repo_scratch_space():
    workspace = make_test_workspace()
    repo_root = Path.cwd().resolve()

    try:
        assert workspace.exists()
        assert workspace.is_dir()
        workspace.resolve().relative_to((repo_root / ".tmp-tests").resolve())

        try:
            workspace.resolve().relative_to(TESTS_DIR.resolve())
        except ValueError:
            pass
        else:
            raise AssertionError("Expected temp workspace outside tests directory")
    finally:
        cleanup_test_workspace(workspace)


def test_build_default_paths_returns_project_relative_locations():
    module = load_module()
    project_root = Path("D:/codex/project0")

    paths = module.build_default_paths(project_root)

    assert paths["metadata_path"] == project_root / "datasets" / "raw" / "speaker_a" / "metadata.csv"
    assert paths["source_wavs_dir"] == project_root / "datasets" / "raw" / "speaker_a" / "wavs"
    assert paths["manifest_path"] == project_root / "datasets" / "raw" / "public" / "aishell3" / "manifest.csv"
    assert paths["archive_path"] == project_root / "datasets" / "downloads" / "data_aishell3.tgz"
    assert paths["output_audio_dir"] == project_root / "web" / "media" / "audio" / "raw"
    assert paths["output_spectrogram_dir"] == project_root / "web" / "media" / "spectrograms"
    assert paths["output_json_path"] == project_root / "web" / "data" / "raw-samples.json"


def test_parse_args_uses_project_relative_defaults():
    module = load_module()

    args = module.parse_args([])

    assert args.project_root == Path.cwd()
    assert args.metadata_path == Path.cwd() / "datasets" / "raw" / "speaker_a" / "metadata.csv"
    assert args.source_wavs_dir == Path.cwd() / "datasets" / "raw" / "speaker_a" / "wavs"
    assert args.output_audio_dir == Path.cwd() / "web" / "media" / "audio" / "raw"
    assert args.output_spectrogram_dir == Path.cwd() / "web" / "media" / "spectrograms"
    assert args.output_json_path == Path.cwd() / "web" / "data" / "raw-samples.json"
    assert args.sample_limit == 10
    assert args.dataset_name == "AISHELL-3 speaker_a subset"
    assert args.source_speaker_id == "SSB0005"


def test_main_generates_assets_from_cli_arguments():
    module = load_module()
    workspace = make_test_workspace()

    try:
        metadata_path = workspace / "datasets" / "raw" / "speaker_a" / "metadata.csv"
        wavs_dir = workspace / "datasets" / "raw" / "speaker_a" / "wavs"
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        with metadata_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["utt_id", "wav_path", "text", "speaker_id", "language"],
            )
            writer.writeheader()
            writer.writerow(
                {
                    "utt_id": "demo_001",
                    "wav_path": "demo_001.wav",
                    "text": "sample one",
                    "speaker_id": "speaker_a",
                    "language": "zh",
                }
            )

        write_test_wav(wavs_dir / "demo_001.wav")

        exit_code = module.main(
            [
                "--project-root",
                str(workspace),
                "--dataset-name",
                "workspace samples",
                "--source-speaker-id",
                "speaker_a",
                "--sample-limit",
                "1",
            ]
        )

        assert exit_code == 0

        output_audio_path = workspace / "web" / "media" / "audio" / "raw" / "demo_001.wav"
        output_spectrogram_path = workspace / "web" / "media" / "spectrograms" / "demo_001.png"
        output_json_path = workspace / "web" / "data" / "raw-samples.json"

        assert output_audio_path.exists()
        assert output_spectrogram_path.exists()
        payload = json.loads(output_json_path.read_text(encoding="utf-8"))
        assert payload["dataset"] == {
            "name": "workspace samples",
            "speakerId": "speaker_a",
            "sourceSpeakerId": "speaker_a",
            "sampleCount": 1,
        }
        assert payload["samples"][0]["audioPath"] == "./media/audio/raw/demo_001.wav"
        assert payload["samples"][0]["spectrogramPath"] == "./media/spectrograms/demo_001.png"
    finally:
        cleanup_test_workspace(workspace)


def test_generate_assets_preserves_relative_paths_and_derives_web_paths():
    module = load_module()
    workspace = make_test_workspace()

    try:
        metadata_path = workspace / "metadata.csv"
        wavs_dir = workspace / "source" / "clips"
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
                    "speaker_id": "speaker_a",
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

        output_audio_dir = workspace / "web" / "media" / "raw-audio"
        output_spectrogram_dir = workspace / "web" / "images" / "spectrograms"
        output_json_path = workspace / "web" / "data" / "generated" / "raw-samples.json"

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
        assert payload["dataset"] == {
            "name": "AISHELL-3 speaker_a subset",
            "speakerId": "speaker_a",
            "sourceSpeakerId": "SSB0005",
            "sampleCount": 1,
        }
        assert payload["samples"] == [
            {
                "uttId": "demo_001",
                "text": "第一条测试样本",
                "audioPath": "./media/raw-audio/nested/demo_001.wav",
                "spectrogramPath": "./images/spectrograms/nested/demo_001.png",
                "speakerId": "speaker_a",
                "language": "zh",
                "durationSec": 0.1,
            }
        ]
    finally:
        cleanup_test_workspace(workspace)


def test_generate_assets_rejects_mixed_speaker_metadata():
    module = load_module()
    workspace = make_test_workspace()

    try:
        metadata_path = workspace / "metadata.csv"
        wavs_dir = workspace / "source" / "clips"
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
                    "text": "sample one",
                    "speaker_id": "speaker_a",
                    "language": "zh",
                }
            )
            writer.writerow(
                {
                    "utt_id": "demo_002",
                    "wav_path": "nested/demo_002.wav",
                    "text": "sample two",
                    "speaker_id": "speaker_b",
                    "language": "zh",
                }
            )

        write_test_wav(wavs_dir / "nested" / "demo_001.wav")
        write_test_wav(wavs_dir / "nested" / "demo_002.wav")

        try:
            module.generate_assets(
                metadata_path=metadata_path,
                dataset_name="AISHELL-3 speaker_a subset",
                source_speaker_id="SSB0005",
                source_wavs_dir=wavs_dir,
                output_audio_dir=workspace / "web" / "media" / "raw-audio",
                output_spectrogram_dir=workspace / "web" / "images" / "spectrograms",
                output_json_path=workspace / "web" / "data" / "generated" / "raw-samples.json",
                sample_limit=2,
            )
        except ValueError as error:
            message = str(error)
            assert "speaker_id" in message
            assert "single-speaker" in message
        else:
            raise AssertionError("Expected ValueError for mixed-speaker metadata")
    finally:
        cleanup_test_workspace(workspace)


def test_generate_assets_rejects_wav_paths_outside_source_root():
    module = load_module()
    workspace = make_test_workspace()

    try:
        metadata_path = workspace / "metadata.csv"
        wavs_dir = workspace / "wavs"
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

        write_test_wav(workspace / "escape.wav")

        try:
            module.generate_assets(
                metadata_path=metadata_path,
                dataset_name="AISHELL-3 speaker_a subset",
                source_speaker_id="SSB0005",
                source_wavs_dir=wavs_dir,
                output_audio_dir=workspace / "web" / "media" / "audio" / "raw",
                output_spectrogram_dir=workspace / "web" / "media" / "spectrograms",
                output_json_path=workspace / "web" / "data" / "raw-samples.json",
                sample_limit=1,
            )
        except ValueError as error:
            assert "wav_path" in str(error)
        else:
            raise AssertionError("Expected ValueError for invalid wav_path")
    finally:
        cleanup_test_workspace(workspace)


def test_generate_assets_accepts_metadata_paths_prefixed_with_source_dir_name():
    module = load_module()
    workspace = make_test_workspace()

    try:
        metadata_path = workspace / "metadata.csv"
        wavs_dir = workspace / "speaker_a" / "wavs"
        with metadata_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["utt_id", "wav_path", "text", "speaker_id", "language"],
            )
            writer.writeheader()
            writer.writerow(
                {
                    "utt_id": "demo_001",
                    "wav_path": "wavs/demo_001.wav",
                    "text": "sample one",
                    "speaker_id": "speaker_a",
                    "language": "zh",
                }
            )

        write_test_wav(wavs_dir / "demo_001.wav")

        module.generate_assets(
            metadata_path=metadata_path,
            dataset_name="AISHELL-3 speaker_a subset",
            source_speaker_id="SSB0005",
            source_wavs_dir=wavs_dir,
            output_audio_dir=workspace / "web" / "media" / "audio" / "raw",
            output_spectrogram_dir=workspace / "web" / "media" / "spectrograms",
            output_json_path=workspace / "web" / "data" / "raw-samples.json",
            sample_limit=1,
        )

        assert (workspace / "web" / "media" / "audio" / "raw" / "demo_001.wav").exists()
        assert (workspace / "web" / "media" / "spectrograms" / "demo_001.png").exists()
    finally:
        cleanup_test_workspace(workspace)


def test_generate_spectrogram_png_rejects_unsupported_wav_shape():
    module = load_module()
    workspace = make_test_workspace()

    try:
        wav_path = workspace / "stereo.wav"
        output_path = workspace / "spectrogram.png"
        write_test_wav(wav_path, channels=2)

        try:
            module.generate_spectrogram_png(wav_path, output_path)
        except ValueError as error:
            assert "channel" in str(error).lower()
        else:
            raise AssertionError("Expected ValueError for unsupported WAV shape")
    finally:
        cleanup_test_workspace(workspace)


def test_generate_spectrogram_png_handles_short_clips():
    module = load_module()
    workspace = make_test_workspace()

    try:
        wav_path = workspace / "short.wav"
        output_path = workspace / "spectrogram.png"
        write_test_wav(wav_path, frames=32)

        module.generate_spectrogram_png(wav_path, output_path)

        assert output_path.exists()
    finally:
        cleanup_test_workspace(workspace)
