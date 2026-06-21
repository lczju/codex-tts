#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import tarfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable


BYTES_PER_SECOND_44K_MONO_16BIT = 44_100 * 2


@dataclass
class Transcript:
    split: str
    utt_id: str
    speaker_id: str
    text: str
    pinyin: str


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Prepare AISHELL-3 metadata and extract a single-speaker subset."
    )
    parser.add_argument("--archive", type=Path, default=root / "datasets" / "downloads" / "data_aishell3.tgz")
    parser.add_argument("--public-dir", type=Path, default=root / "datasets" / "raw" / "public" / "aishell3")
    parser.add_argument("--target-dir", type=Path, default=root / "datasets" / "raw" / "speaker_a")
    parser.add_argument("--speaker-id", type=str, default=None)
    parser.add_argument("--include-test", action="store_true")
    return parser.parse_args(namespace=argparse.Namespace(
        archive=root / "datasets" / "downloads" / "data_aishell3.tgz",
        public_dir=root / "datasets" / "raw" / "public" / "aishell3",
        target_dir=root / "datasets" / "raw" / "speaker_a",
        speaker_id=None,
        include_test=False,
    ))


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def parse_transcript_line(split: str, line: str) -> Transcript:
    utt_file, payload = line.rstrip("\n").split("\t", 1)
    utt_id = Path(utt_file).stem
    speaker_id = utt_id[:7]
    tokens = payload.split()
    text_tokens = tokens[0::2]
    pinyin_tokens = tokens[1::2]
    return Transcript(
        split=split,
        utt_id=utt_id,
        speaker_id=speaker_id,
        text="".join(text_tokens),
        pinyin=" ".join(pinyin_tokens),
    )


def load_speaker_info(archive: tarfile.TarFile) -> Dict[str, dict]:
    speaker_info: Dict[str, dict] = {}
    with archive.extractfile("spk-info.txt") as handle:
        assert handle is not None
        for raw in handle:
            line = raw.decode("utf-8").strip()
            if not line or line.startswith("#"):
                continue
            speaker_id, age_group, gender, accent = line.split("\t")
            speaker_info[speaker_id] = {
                "age_group": age_group,
                "gender": gender,
                "accent": accent,
            }
    return speaker_info


def load_transcripts(archive: tarfile.TarFile) -> Dict[str, Transcript]:
    transcripts: Dict[str, Transcript] = {}
    for split in ("train", "test"):
        with archive.extractfile(f"{split}/content.txt") as handle:
            assert handle is not None
            for raw in handle:
                record = parse_transcript_line(split, raw.decode("utf-8"))
                transcripts[record.utt_id] = record
    return transcripts


def write_csv(path: Path, rows: Iterable[dict], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    archive_path: Path = args.archive
    public_dir: Path = args.public_dir
    target_dir: Path = args.target_dir
    target_wavs_dir = target_dir / "wavs"

    ensure_dir(public_dir)
    ensure_dir(target_dir)
    ensure_dir(target_wavs_dir)

    with tarfile.open(archive_path, "r:gz") as archive:
        speaker_info = load_speaker_info(archive)
        transcripts = load_transcripts(archive)
        members = archive.getmembers()

        manifest_rows: list[dict] = []
        speaker_counts: Counter[str] = Counter()
        speaker_bytes: Counter[str] = Counter()

        for member in members:
            if not member.isfile() or not member.name.endswith(".wav"):
                continue
            if not (member.name.startswith("train/wav/") or member.name.startswith("test/wav/")):
                continue

            parts = member.name.split("/")
            split = parts[0]
            speaker_id = parts[2]
            utt_id = Path(parts[-1]).stem
            transcript = transcripts.get(utt_id)
            if transcript is None:
                continue

            duration_sec = round(max(member.size - 44, 0) / BYTES_PER_SECOND_44K_MONO_16BIT, 3)
            info = speaker_info.get(speaker_id, {})
            manifest_rows.append({
                "split": split,
                "speaker_id": speaker_id,
                "utt_id": utt_id,
                "wav_tar_path": member.name,
                "wav_bytes": member.size,
                "duration_sec": duration_sec,
                "text": transcript.text,
                "pinyin": transcript.pinyin,
                "age_group": info.get("age_group", ""),
                "gender": info.get("gender", ""),
                "accent": info.get("accent", ""),
            })

            if split == "train":
                speaker_counts[speaker_id] += 1
                speaker_bytes[speaker_id] += member.size

        manifest_rows.sort(key=lambda row: (row["split"], row["speaker_id"], row["utt_id"]))

        selected_speaker = args.speaker_id or max(
            speaker_bytes,
            key=lambda spk: (speaker_bytes[spk], speaker_counts[spk], spk),
        )

        speaker_rows = []
        for speaker_id, total_bytes in sorted(
            speaker_bytes.items(),
            key=lambda item: (-item[1], -speaker_counts[item[0]], item[0]),
        ):
            info = speaker_info.get(speaker_id, {})
            speaker_rows.append({
                "speaker_id": speaker_id,
                "utterance_count": speaker_counts[speaker_id],
                "duration_hours": round(total_bytes / BYTES_PER_SECOND_44K_MONO_16BIT / 3600, 3),
                "age_group": info.get("age_group", ""),
                "gender": info.get("gender", ""),
                "accent": info.get("accent", ""),
            })

        write_csv(
            public_dir / "manifest.csv",
            manifest_rows,
            [
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
        write_csv(
            public_dir / "speaker_summary.csv",
            speaker_rows,
            [
                "speaker_id",
                "utterance_count",
                "duration_hours",
                "age_group",
                "gender",
                "accent",
            ],
        )

        extracted_rows = [
            row for row in manifest_rows
            if row["speaker_id"] == selected_speaker and (args.include_test or row["split"] == "train")
        ]

        extracted_member_names = {row["wav_tar_path"]: row for row in extracted_rows}
        for member in members:
            row = extracted_member_names.get(member.name)
            if row is None:
                continue
            destination = target_wavs_dir / f"{row['utt_id']}.wav"
            with archive.extractfile(member) as source, destination.open("wb") as target:
                assert source is not None
                target.write(source.read())

        metadata_rows = [
            {
                "utt_id": row["utt_id"],
                "wav_path": f"wavs/{row['utt_id']}.wav",
                "text": row["text"],
                "speaker_id": "speaker_a",
                "language": "zh",
            }
            for row in extracted_rows
        ]
        write_csv(
            target_dir / "metadata.csv",
            metadata_rows,
            ["utt_id", "wav_path", "text", "speaker_id", "language"],
        )

        selected_info = next((row for row in speaker_rows if row["speaker_id"] == selected_speaker), None)
        summary = {
            "archive": str(archive_path),
            "selected_speaker": selected_speaker,
            "selected_speaker_info": selected_info,
            "extracted_utterance_count": len(extracted_rows),
            "include_test": bool(args.include_test),
            "manifest_path": str(public_dir / "manifest.csv"),
            "speaker_summary_path": str(public_dir / "speaker_summary.csv"),
            "metadata_path": str(target_dir / "metadata.csv"),
            "wavs_dir": str(target_wavs_dir),
        }
        with (public_dir / "preparation_summary.json").open("w", encoding="utf-8") as handle:
            json.dump(summary, handle, ensure_ascii=False, indent=2)
        with (target_dir / "source_summary.json").open("w", encoding="utf-8") as handle:
            json.dump(summary, handle, ensure_ascii=False, indent=2)

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
