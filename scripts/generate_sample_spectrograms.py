from __future__ import annotations

import argparse
import csv
import json
import os
import random
import shutil
import sys
import tarfile
import wave
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import spectrogram


LEGACY_DEFAULT_DATASET_NAME = "AISHELL-3 speaker_a subset"
MIXED_DEFAULT_DATASET_NAME = "AISHELL-3 mixed speaker random sample"


def build_default_paths(project_root: Path) -> dict[str, Path]:
    return {
        "metadata_path": project_root / "datasets" / "raw" / "speaker_a" / "metadata.csv",
        "source_wavs_dir": project_root / "datasets" / "raw" / "speaker_a" / "wavs",
        "manifest_path": project_root / "datasets" / "raw" / "public" / "aishell3" / "manifest.csv",
        "archive_path": project_root / "datasets" / "downloads" / "data_aishell3.tgz",
        "output_audio_dir": project_root / "web" / "media" / "audio" / "raw",
        "output_spectrogram_dir": project_root / "web" / "media" / "spectrograms",
        "output_json_path": project_root / "web" / "data" / "raw-samples.json",
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    project_root = Path.cwd()
    default_paths = build_default_paths(project_root)

    parser = argparse.ArgumentParser(
        description="Generate raw sample previews and spectrograms for the web workbench."
    )
    parser.add_argument("--project-root", type=Path, default=project_root)
    parser.add_argument("--input-mode", choices=["auto", "metadata", "manifest"], default="auto")
    parser.add_argument("--metadata-path", type=Path, default=default_paths["metadata_path"])
    parser.add_argument("--source-wavs-dir", type=Path, default=default_paths["source_wavs_dir"])
    parser.add_argument("--manifest-path", type=Path, default=default_paths["manifest_path"])
    parser.add_argument("--archive-path", type=Path, default=default_paths["archive_path"])
    parser.add_argument("--output-audio-dir", type=Path, default=default_paths["output_audio_dir"])
    parser.add_argument(
        "--output-spectrogram-dir",
        type=Path,
        default=default_paths["output_spectrogram_dir"],
    )
    parser.add_argument("--output-json-path", type=Path, default=default_paths["output_json_path"])
    parser.add_argument("--sample-limit", type=int, default=10)
    parser.add_argument("--dataset-name", default=LEGACY_DEFAULT_DATASET_NAME)
    parser.add_argument("--source-speaker-id", default="SSB0005")
    parser.add_argument("--source-dataset", default="AISHELL-3")
    parser.add_argument("--split", choices=["train", "test", "all"], default="train")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args(argv)

    resolved_project_root = args.project_root.resolve()
    resolved_default_paths = build_default_paths(resolved_project_root)

    if args.metadata_path == default_paths["metadata_path"]:
        args.metadata_path = resolved_default_paths["metadata_path"]
    if args.source_wavs_dir == default_paths["source_wavs_dir"]:
        args.source_wavs_dir = resolved_default_paths["source_wavs_dir"]
    if args.manifest_path == default_paths["manifest_path"]:
        args.manifest_path = resolved_default_paths["manifest_path"]
    if args.archive_path == default_paths["archive_path"]:
        args.archive_path = resolved_default_paths["archive_path"]
    if args.output_audio_dir == default_paths["output_audio_dir"]:
        args.output_audio_dir = resolved_default_paths["output_audio_dir"]
    if args.output_spectrogram_dir == default_paths["output_spectrogram_dir"]:
        args.output_spectrogram_dir = resolved_default_paths["output_spectrogram_dir"]
    if args.output_json_path == default_paths["output_json_path"]:
        args.output_json_path = resolved_default_paths["output_json_path"]

    args.project_root = resolved_project_root
    return args


def _infer_web_root(
    output_audio_dir: Path,
    output_spectrogram_dir: Path,
    output_json_path: Path,
) -> Path:
    common_root = Path(
        os.path.commonpath(
            [
                str(output_audio_dir.resolve()),
                str(output_spectrogram_dir.resolve()),
                str(output_json_path.parent.resolve()),
            ]
        )
    )
    return common_root


def _to_web_path(web_root: Path, target_path: Path) -> str:
    resolved_web_root = web_root.resolve()
    resolved_target = target_path.resolve()
    try:
        relative_path = resolved_target.relative_to(resolved_web_root)
    except ValueError as error:
        raise ValueError(f"Output path is outside inferred web root: {target_path}") from error
    return f"./{relative_path.as_posix()}"


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


def _normalize_dataset_wav_path(source_wavs_dir: Path, wav_path_value: str) -> Path:
    relative_wav_path = Path(wav_path_value)
    if relative_wav_path.parts and relative_wav_path.parts[0] == source_wavs_dir.name:
        return Path(*relative_wav_path.parts[1:])
    return relative_wav_path


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
    if samples.size == 0:
        raise ValueError("WAV contains no samples")
    if samples.size < 2:
        raise ValueError("WAV is too short for spectrogram generation")

    nperseg = min(256, int(samples.size))
    noverlap = min(192, nperseg - 1)
    _, _, power = spectrogram(samples, fs=sample_rate, nperseg=nperseg, noverlap=noverlap)

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


def _ensure_positive_sample_limit(sample_limit: int) -> int:
    if sample_limit <= 0:
        raise ValueError("sample_limit must be greater than 0")
    return sample_limit


def _reset_output_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _emit_progress(index: int, total: int, utt_id: str, speaker_id: str) -> None:
    print(f"[{index}/{total}] processed {utt_id} ({speaker_id})", file=sys.stderr)


def _select_manifest_rows(
    manifest_path: Path,
    sample_limit: int,
    split: str,
    seed: int | None,
) -> list[dict[str, str]]:
    rng = random.Random(seed)
    reservoir: list[dict[str, str]] = []
    matched_rows = 0

    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            row_split = row.get("split", "")
            if split != "all" and row_split != split:
                continue

            matched_rows += 1
            row_copy = dict(row)
            if len(reservoir) < sample_limit:
                reservoir.append(row_copy)
                continue

            replacement_index = rng.randrange(matched_rows)
            if replacement_index < sample_limit:
                reservoir[replacement_index] = row_copy

    if not reservoir:
        raise ValueError(f"No manifest rows found for split '{split}'.")

    reservoir.sort(key=lambda row: row["utt_id"])
    return reservoir


def _extract_archive_member(
    archive: tarfile.TarFile,
    member_name: str,
    destination_path: Path,
) -> None:
    try:
        member = archive.getmember(member_name)
    except KeyError as error:
        raise FileNotFoundError(f"Archive member not found: {member_name}") from error

    destination_path.parent.mkdir(parents=True, exist_ok=True)
    with archive.extractfile(member) as source, destination_path.open("wb") as target:
        assert source is not None
        shutil.copyfileobj(source, target)


def _generate_assets_from_manifest(
    manifest_path: Path,
    archive_path: Path,
    dataset_name: str,
    source_dataset: str,
    output_audio_dir: Path,
    output_spectrogram_dir: Path,
    output_json_path: Path,
    sample_limit: int,
    split: str,
    seed: int | None,
) -> None:
    sample_limit = _ensure_positive_sample_limit(sample_limit)
    _reset_output_dir(output_audio_dir)
    _reset_output_dir(output_spectrogram_dir)
    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    web_root = _infer_web_root(output_audio_dir, output_spectrogram_dir, output_json_path)

    selected_rows = _select_manifest_rows(
        manifest_path=manifest_path,
        sample_limit=sample_limit,
        split=split,
        seed=seed,
    )

    samples = []
    with tarfile.open(archive_path, "r:gz") as archive:
        total = len(selected_rows)
        for index, row in enumerate(selected_rows, start=1):
            utt_id = row["utt_id"]
            speaker_id = row["speaker_id"]
            copied_wav_path = output_audio_dir / f"{utt_id}.wav"
            spectrogram_path = output_spectrogram_dir / f"{utt_id}.png"

            _extract_archive_member(archive, row["wav_tar_path"], copied_wav_path)
            generate_spectrogram_png(copied_wav_path, spectrogram_path)
            _emit_progress(index, total, utt_id, speaker_id)

            samples.append(
                {
                    "uttId": utt_id,
                    "text": row.get("text", ""),
                    "audioPath": _to_web_path(web_root, copied_wav_path),
                    "spectrogramPath": _to_web_path(web_root, spectrogram_path),
                    "speakerId": speaker_id,
                    "language": "zh",
                    "durationSec": compute_duration_sec(copied_wav_path),
                    "split": row.get("split", ""),
                }
            )

    payload = {
        "dataset": {
            "name": dataset_name,
            "sourceDataset": source_dataset,
            "sampleCount": len(samples),
            "speakerCount": len({sample["speakerId"] for sample in samples}),
            "samplingMode": "random_manifest_rows",
            "split": split,
            "seed": seed,
        },
        "samples": samples,
    }
    output_json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _generate_assets_from_metadata(
    metadata_path: Path,
    dataset_name: str,
    source_speaker_id: str,
    source_wavs_dir: Path,
    output_audio_dir: Path,
    output_spectrogram_dir: Path,
    output_json_path: Path,
    sample_limit: int,
) -> None:
    sample_limit = _ensure_positive_sample_limit(sample_limit)
    _reset_output_dir(output_audio_dir)
    _reset_output_dir(output_spectrogram_dir)
    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    web_root = _infer_web_root(output_audio_dir, output_spectrogram_dir, output_json_path)

    selected_rows = []
    speaker_ids = set()
    with metadata_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if len(selected_rows) >= sample_limit:
                break
            selected_rows.append(row)
            speaker_ids.add(row["speaker_id"])

    if len(speaker_ids) > 1:
        distinct_speaker_ids = ", ".join(sorted(speaker_ids))
        raise ValueError(
            "Metadata must be single-speaker within the sampled rows; "
            f"found multiple speaker_id values: {distinct_speaker_ids}"
        )

    samples = []
    total = len(selected_rows)
    for index, row in enumerate(selected_rows, start=1):
        utt_id = row["utt_id"]
        normalized_wav_path = _normalize_dataset_wav_path(source_wavs_dir, row["wav_path"])
        relative_wav_path, source_wav_path = _resolve_wav_path(
            source_wavs_dir,
            str(normalized_wav_path),
        )
        _, copied_wav_path = _resolve_wav_path(output_audio_dir, str(normalized_wav_path))
        _, spectrogram_path = _resolve_wav_path(
            output_spectrogram_dir,
            str(relative_wav_path.with_suffix(".png")),
        )

        copied_wav_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_wav_path, copied_wav_path)
        generate_spectrogram_png(copied_wav_path, spectrogram_path)
        _emit_progress(index, total, utt_id, row["speaker_id"])

        samples.append(
            {
                "uttId": utt_id,
                "text": row["text"],
                "audioPath": _to_web_path(web_root, copied_wav_path),
                "spectrogramPath": _to_web_path(web_root, spectrogram_path),
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


def generate_assets(
    metadata_path: Path | None = None,
    dataset_name: str = LEGACY_DEFAULT_DATASET_NAME,
    source_speaker_id: str = "SSB0005",
    source_wavs_dir: Path | None = None,
    output_audio_dir: Path | None = None,
    output_spectrogram_dir: Path | None = None,
    output_json_path: Path | None = None,
    sample_limit: int = 10,
    manifest_path: Path | None = None,
    archive_path: Path | None = None,
    source_dataset: str = "AISHELL-3",
    split: str = "train",
    seed: int | None = None,
) -> None:
    if output_audio_dir is None or output_spectrogram_dir is None or output_json_path is None:
        raise ValueError("Output paths are required.")

    if manifest_path is not None and archive_path is not None:
        _generate_assets_from_manifest(
            manifest_path=manifest_path,
            archive_path=archive_path,
            dataset_name=dataset_name,
            source_dataset=source_dataset,
            output_audio_dir=output_audio_dir,
            output_spectrogram_dir=output_spectrogram_dir,
            output_json_path=output_json_path,
            sample_limit=sample_limit,
            split=split,
            seed=seed,
        )
        return

    if metadata_path is None or source_wavs_dir is None:
        raise ValueError(
            "Provide metadata_path and source_wavs_dir, or manifest_path and archive_path."
        )

    _generate_assets_from_metadata(
        metadata_path=metadata_path,
        dataset_name=dataset_name,
        source_speaker_id=source_speaker_id,
        source_wavs_dir=source_wavs_dir,
        output_audio_dir=output_audio_dir,
        output_spectrogram_dir=output_spectrogram_dir,
        output_json_path=output_json_path,
        sample_limit=sample_limit,
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    use_manifest_mode = args.input_mode == "manifest" or (
        args.input_mode == "auto" and args.manifest_path.exists() and args.archive_path.exists()
    )

    if use_manifest_mode:
        dataset_name = args.dataset_name
        if dataset_name == LEGACY_DEFAULT_DATASET_NAME:
            dataset_name = MIXED_DEFAULT_DATASET_NAME
        generate_assets(
            manifest_path=args.manifest_path,
            archive_path=args.archive_path,
            dataset_name=dataset_name,
            source_dataset=args.source_dataset,
            output_audio_dir=args.output_audio_dir,
            output_spectrogram_dir=args.output_spectrogram_dir,
            output_json_path=args.output_json_path,
            sample_limit=args.sample_limit,
            split=args.split,
            seed=args.seed,
        )
        return 0

    generate_assets(
        metadata_path=args.metadata_path,
        dataset_name=args.dataset_name,
        source_speaker_id=args.source_speaker_id,
        source_wavs_dir=args.source_wavs_dir,
        output_audio_dir=args.output_audio_dir,
        output_spectrogram_dir=args.output_spectrogram_dir,
        output_json_path=args.output_json_path,
        sample_limit=args.sample_limit,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
