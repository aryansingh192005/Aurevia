import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai.features.pose_features import calculate_angle  # noqa: E402
from ai.preprocessing.sequence_builder import SequenceBuilder  # noqa: E402


# EDIT THIS if the actual column order in your download doesn't match.
# Each entry is the 0-based index of that joint's X column in a row (Y and
# Z are assumed to immediately follow, i.e. joint_i -> columns
# [3*i, 3*i+1, 3*i+2]). This follows the standard Microsoft Kinect v2 SDK
# 25-joint order -- verify it against your actual download's readme.txt
# before trusting any trained model.
IRDS_JOINT_INDEX = {
    "left_shoulder": 4,   # ShoulderLeft
    "left_elbow": 5,      # ElbowLeft
    "left_wrist": 6,      # WristLeft
    "right_shoulder": 8,  # ShoulderRight
    "right_elbow": 9,     # ElbowRight
    "right_wrist": 10,    # WristRight
    "left_hip": 12,       # HipLeft
    "left_knee": 13,      # KneeLeft
    "left_ankle": 14,     # AnkleLeft
    "right_hip": 16,      # HipRight
    "right_knee": 17,     # KneeRight
    "right_ankle": 18,    # AnkleRight
}

TOTAL_JOINTS_EXPECTED = 25  # Kinect v2 records 25 joints per frame
RECORDING_SEQUENCE_LENGTH = 30
FEATURE_NAMES = (
    "left_elbow_angle",
    "right_elbow_angle",
    "left_shoulder_angle",
    "right_shoulder_angle",
    "left_hip_angle",
    "right_hip_angle",
    "left_knee_angle",
    "right_knee_angle",
)


def joint_point(row: np.ndarray, joint_name: str) -> tuple[float, float, float]:
    start = IRDS_JOINT_INDEX[joint_name] * 3
    return tuple(row[start : start + 3])


def extract_angles_from_row(row: np.ndarray) -> list:
    """Same 8 angles as ai/features/landmark_features.extract_joint_angles,
    computed from IRDS's joint positions instead of MediaPipe's."""

    j = lambda name: joint_point(row, name)  # noqa: E731

    return [
        calculate_angle(j("left_shoulder"), j("left_elbow"), j("left_wrist")),
        calculate_angle(j("right_shoulder"), j("right_elbow"), j("right_wrist")),
        calculate_angle(j("left_elbow"), j("left_shoulder"), j("left_hip")),
        calculate_angle(j("right_elbow"), j("right_shoulder"), j("right_hip")),
        calculate_angle(j("left_shoulder"), j("left_hip"), j("left_knee")),
        calculate_angle(j("right_shoulder"), j("right_hip"), j("right_knee")),
        calculate_angle(j("left_hip"), j("left_knee"), j("left_ankle")),
        calculate_angle(j("right_hip"), j("right_knee"), j("right_ankle")),
    ]


# def load_skeleton_csv(path: Path) -> np.ndarray:
#     """Loads one IRDS skeleton file as a (frames, joints*3) array.

#     Written defensively on purpose: IRDS's "simplified CSV" files are not
#     documented as having a header row, but if a particular download batch
#     does include one, a plain np.loadtxt() call would crash the whole run.
#     Reading line-by-line and silently skipping any row that isn't purely
#     numeric (a header, a stray blank line, etc.) avoids that failure mode
#     without silently corrupting good data.
#     """

#     rows = []
#     with open(path, "r", newline="") as f:
#         for line in f:
#             line = line.strip()
#             if not line:
#                 continue
#             parts = line.split(",")
#             try:
#                 rows.append([float(p) for p in parts])
#             except ValueError:
#                 continue  # header row or non-numeric line -- skip, don't crash

#     return np.array(rows, dtype=np.float64)

import re

JOINT_PATTERN = re.compile(r"\((.*?)\)")


def load_skeleton_csv(path: Path) -> np.ndarray:
    """
    Load an IntelliRehabDS RawData skeleton file.

    Converts every frame into

        [x1,y1,z1,x2,y2,z2,...,x25,y25,z25]

    so the rest of the pipeline can stay unchanged.
    """

    frames = []

    with open(path, "r") as f:
        for line in f:

            line = line.strip()

            if not line:
                continue

            # Skip header
            if line.startswith("Version"):
                continue

            joints = JOINT_PATTERN.findall(line)

            if len(joints) != TOTAL_JOINTS_EXPECTED:
                continue

            frame = []

            for joint in joints:

                parts = joint.split(",")

                # Expected:
                # Name,TrackingState,X,Y,Z,DepthX,DepthY

                if len(parts) < 7:
                    frame = None
                    break

                try:
                    x = float(parts[2])
                    y = float(parts[3])
                    z = float(parts[4])
                except ValueError:
                    frame = None
                    break

                frame.extend([x, y, z])

            if frame is not None:
                frames.append(frame)

    return np.array(frames, dtype=np.float64)


def resample_to_fixed_length(frames: np.ndarray, length: int) -> np.ndarray:
    n = len(frames)

    if n == length:
        return frames

    positions = np.linspace(0, n - 1, num=length)
    resampled = np.empty((length, frames.shape[1]))

    for col in range(frames.shape[1]):
        resampled[:, col] = np.interp(positions, np.arange(n), frames[:, col])

    return resampled


def infer_label_from_filename(path: Path):
    """IRDS filenames follow:
        SubjectID_DateID_GestureLabel_RepetitionNumber_CorrectLabel_Position
    Position is always last, CorrectLabel is always second-to-last -- reading
    from the end is more robust than assuming SubjectID never contains an
    underscore.

    Returns 1 (correct), 0 (incorrect), or None (ambiguous -- caller should
    skip this file).
    """

    parts = path.stem.split("_")
    if len(parts) < 5:
        raise ValueError(f"Unexpected filename format: {path.name}")

    correct_label_raw = parts[-2]
    try:
        correct_label = int(correct_label_raw)
    except ValueError:
        raise ValueError(
            f"Could not read CorrectLabel from filename: {path.name}"
        )

    if correct_label == 1:
        return 1
    elif correct_label == 2:
        return 0
    elif correct_label == 3:
        return None  # intentionally excluded -- see module docstring
    else:
        raise ValueError(
            f"Unknown CorrectLabel value ({correct_label}) in {path.name}"
        )


def convert(input_dir: Path, output_path: Path) -> None:
    position_files = sorted(input_dir.rglob("*.csv")) + sorted(input_dir.rglob("*.txt"))

    if not position_files:
        print(f"No .csv/.txt files found under {input_dir} -- check the path.")
        return

    builder = SequenceBuilder(
        sequence_length=RECORDING_SEQUENCE_LENGTH,
        feature_count=len(FEATURE_NAMES),
    )

    sequences, labels = [], []
    skipped_ambiguous = 0
    skipped_errors = 0

    for path in position_files:
        try:
            label = infer_label_from_filename(path)
        except ValueError as error:
            print(f"Skipping {path.name}: {error}")
            skipped_errors += 1
            continue

        if label is None:
            skipped_ambiguous += 1
            continue

        try:
            raw = load_skeleton_csv(path)
            
            if raw.size == 0:
                raise ValueError("No frames were parsed from the file.")

            if raw.ndim != 2 or raw.shape[1] != TOTAL_JOINTS_EXPECTED * 3:
                raise ValueError(
                    f"expected {TOTAL_JOINTS_EXPECTED * 3} columns, got {raw.shape}"
                )

            angle_frames = np.array(
                [extract_angles_from_row(row) for row in raw],
                dtype=np.float64,
            )

            resampled = resample_to_fixed_length(
                angle_frames,
                RECORDING_SEQUENCE_LENGTH,
            )

            sequence = builder.build_from_frames(resampled.tolist())
        except Exception as error:  # noqa: BLE001
            print(f"Skipping {path.name}: {error}")
            skipped_errors += 1
            continue

        sequences.append(sequence)
        labels.append(label)

    if not sequences:
        print("Nothing converted -- check IRDS_JOINT_INDEX and the file format.")
        return

    X = np.stack(sequences, axis=0)
    y = np.array(labels, dtype=np.int64)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez(output_path, X=X, y=y, feature_names=np.array(FEATURE_NAMES))

    print(f"Converted {len(sequences)} examples to {output_path}")
    print(f"  shape: X={X.shape}, y={y.shape}")
    print(f"  class balance: {int((y==1).sum())} correct / {int((y==0).sum())} incorrect")
    print(f"  skipped (ambiguous/unusable label): {skipped_ambiguous}")
    if skipped_errors:
        print(f"  skipped (parse/format errors): {skipped_errors}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", required=True, help="Folder with downloaded IRDS files")
    parser.add_argument("--out", default="data/irds_dataset.npz")
    args = parser.parse_args()

    convert(Path(args.input_dir), Path(args.out))
