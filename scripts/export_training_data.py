#!/usr/bin/env python3
"""Export therapist-reviewed movement recordings as a labeled dataset for
training the LSTM exercise-quality model (ai/training/train_lstm.py).

Reads directly from the Aurevia database (same connection the Flask app
uses via AUREVIA_DATABASE_URL), rather than going through the HTTP API,
so this can also be run as an offline/cron job.

Usage:
    python scripts/export_training_data.py [--out data/training_dataset.npz]

Requires numpy. Run from the project root so `ai` and `backend` resolve.
"""

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from app.models import MovementRecording  # noqa: E402

from ai.preprocessing.sequence_builder import SequenceBuilder  # noqa: E402


LABEL_TO_INT = {"incorrect": 0, "correct": 1}


def export_dataset(output_path: Path) -> None:
    app = create_app()

    with app.app_context():
        recordings = (
            MovementRecording.query
            .filter(MovementRecording.therapist_label.isnot(None))
            .order_by(MovementRecording.id.asc())
            .all()
        )

        if not recordings:
            print(
                "No therapist-reviewed recordings found yet. Have a "
                "therapist review some in the app first "
                "(Therapist -> Review AI Data)."
            )
            return

        feature_count = len(MovementRecording.FEATURE_NAMES)
        sequence_length = recordings[0].sequence_length

        builder = SequenceBuilder(
            sequence_length=sequence_length,
            feature_count=feature_count,
        )

        sequences = []
        labels = []
        exercise_ids = []
        skipped = 0

        for recording in recordings:
            if recording.sequence_length != sequence_length:
                # Every recording is resampled client-side to a fixed
                # length, but guard against a mismatched export anyway.
                skipped += 1
                continue

            try:
                sequence = builder.build_from_frames(recording.sequence)
            except ValueError:
                skipped += 1
                continue

            sequences.append(sequence)
            labels.append(LABEL_TO_INT[recording.therapist_label])
            exercise_ids.append(recording.exercise_id)

        X = np.stack(sequences, axis=0)
        y = np.array(labels, dtype=np.int64)
        exercise_ids = np.array(exercise_ids, dtype=np.int64)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        np.savez(
            output_path,
            X=X,
            y=y,
            exercise_ids=exercise_ids,
            feature_names=np.array(MovementRecording.FEATURE_NAMES),
        )

        print(f"Exported {len(sequences)} labeled repetitions to {output_path}")
        print(f"  shape: X={X.shape}, y={y.shape}")
        print(
            f"  class balance: "
            f"{int((y == 1).sum())} correct / {int((y == 0).sum())} incorrect"
        )

        if skipped:
            print(f"  skipped {skipped} malformed recordings")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default="data/training_dataset.npz",
        help="Output .npz path (default: data/training_dataset.npz)",
    )
    args = parser.parse_args()

    export_dataset(Path(args.out))
