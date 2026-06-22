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
import tarfile
import tempfile
import uuid
import wave
from pathlib import Path

sys.dont_write_bytecode = True


def load_module():
    script_path = Path("scripts/generate_sample_spectrograms.py")
    spec = importlib.util.spec_from_file_location("generate_sample_spectrograms", script_path)
    assert spec is not None
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
        samples = [
            int(12000 * math.sin((2.0 * math.pi * 440.0 * index) / 16000.0))
            for index in range(frames)
        ]
        handle.writeframes(b"".join(struct.pack("<h", sample) for sample in samples))


def make_test_workspace() -> Path:
    scratch_root = Path.cwd() / ".tmp-tests"
    scratch_root.mkdir(parents=True, exist_ok=True)
    workspace = scratch_root / f"generate-mixed-sample-spectrograms-tests-{uuid.uuid4().hex}"
    workspace.mkdir(parents=True, exist_ok=False)
    return workspace


def cleanup_test_workspace(workspace: Path) -> None:
    gc.collect()
    shutil.rmtree(workspace, ignore_errors=True)
    if workspace.exists():
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"Remove-Item -LiteralPath '{workspace.resolve()}' -Recurse -Force -ErrorAction SilentlyContinue",
            ],
            check=False,
        )
    scratch_root = Path.cwd() / ".tmp-tests"
    if scratch_root.exists() and not any(scratch_root.iterdir()):
        scratch_root.rmdir()


def write_manifest(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "split",
                "speaker_id",
                "utt_id",
                "wav_tar_path",
                "wav_bytes",
                "duration_sec",
                "text",
                "pinyin",
                "age_group",
                "gender",
                "accent",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def write_archive(path: Path, entries: dict[str, Path]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(path, "w:gz") as archive:
        for archive_name, source_path in entries.items():
            archive.add(source_path, arcname=archive_name)


def test_generate_assets_supports_mixed_speaker_manifest_sampling():
    module = load_module()
    workspace = make_test_workspace()

    try:
        source_dir = workspace / "source"
        archive_path = workspace / "datasets" / "downloads" / "data_aishell3.tgz"
        manifest_path = workspace / "datasets" / "raw" / "public" / "aishell3" / "manifest.csv"

        archive_entries = {}
        manifest_rows = []
        for index in range(1, 5):
            speaker_id = f"SSB000{index}"
            utt_id = f"{speaker_id}0001"
            source_path = source_dir / f"{utt_id}.wav"
            write_test_wav(source_path, frames=1600 + index * 16)
            archive_name = f"train/wav/{speaker_id}/{utt_id}.wav"
            archive_entries[archive_name] = source_path
            manifest_rows.append(
                {
                    "split": "train",
                    "speaker_id": speaker_id,
                    "utt_id": utt_id,
                    "wav_tar_path": archive_name,
                    "wav_bytes": "3244",
                    "duration_sec": "0.1",
                    "text": f"sample {index}",
                    "pinyin": "",
                    "age_group": "B",
                    "gender": "female",
                    "accent": "north",
                }
            )

        write_archive(archive_path, archive_entries)
        write_manifest(manifest_path, manifest_rows)

        output_json_path = workspace / "web" / "data" / "raw-samples.json"
        module.generate_assets(
            manifest_path=manifest_path,
            archive_path=archive_path,
            dataset_name="AISHELL-3 mixed speaker random sample",
            source_dataset="AISHELL-3",
            output_audio_dir=workspace / "web" / "media" / "audio" / "raw",
            output_spectrogram_dir=workspace / "web" / "media" / "spectrograms",
            output_json_path=output_json_path,
            sample_limit=2,
            split="train",
            seed=11,
        )

        payload = json.loads(output_json_path.read_text(encoding="utf-8"))
        assert payload["dataset"] == {
            "name": "AISHELL-3 mixed speaker random sample",
            "sourceDataset": "AISHELL-3",
            "sampleCount": 2,
            "speakerCount": 2,
            "samplingMode": "random_manifest_rows",
            "split": "train",
            "seed": 11,
        }

        sampled_ids = {sample["uttId"] for sample in payload["samples"]}
        assert len(sampled_ids) == 2
        assert sampled_ids.issubset({row["utt_id"] for row in manifest_rows})
        unselected_ids = {row["utt_id"] for row in manifest_rows} - sampled_ids
        assert len(unselected_ids) == 2
        for utt_id in sampled_ids:
            assert (workspace / "web" / "media" / "audio" / "raw" / f"{utt_id}.wav").exists()
        for utt_id in unselected_ids:
            assert not (workspace / "web" / "media" / "audio" / "raw" / f"{utt_id}.wav").exists()
    finally:
        cleanup_test_workspace(workspace)


def test_parse_args_accepts_manifest_archive_and_seed_options():
    module = load_module()

    args = module.parse_args(
        [
            "--manifest-path",
            "demo/manifest.csv",
            "--archive-path",
            "demo/data_aishell3.tgz",
            "--split",
            "test",
            "--seed",
            "23",
        ]
    )

    assert args.manifest_path == Path("demo/manifest.csv")
    assert args.archive_path == Path("demo/data_aishell3.tgz")
    assert args.split == "test"
    assert args.seed == 23
