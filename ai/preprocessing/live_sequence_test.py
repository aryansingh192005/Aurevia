from pathlib import Path

import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from ai.features.landmark_features import extract_joint_angles
from ai.preprocessing.sequence_builder import SequenceBuilder


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "pose_landmarker"
    / "pose_landmarker_lite.task"
)

SEQUENCE_LENGTH = 30
FEATURE_COUNT = 8


def main():
    print("Starting Aurevia Live Sequence Test...")

    if not MODEL_PATH.exists():
        print("ERROR: Pose Landmarker model not found.")
        print(f"Expected: {MODEL_PATH}")
        return

    sequence_builder = SequenceBuilder(
        sequence_length=SEQUENCE_LENGTH,
        feature_count=FEATURE_COUNT,
    )

    base_options = python.BaseOptions(
        model_asset_path=str(MODEL_PATH)
    )

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    landmarker = vision.PoseLandmarker.create_from_options(
        options
    )

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Could not open camera.")
        landmarker.close()
        return

    print("Camera opened successfully.")
    print("Move naturally in front of the camera.")
    print("Press 'q' to exit.")

    frame_index = 0
    sequence_count = 0

    try:
        while True:
            success, frame = camera.read()

            if not success:
                print("ERROR: Could not read camera frame.")
                break

            frame = cv2.flip(frame, 1)

            rgb_frame = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame,
            )

            timestamp_ms = frame_index * 33
            frame_index += 1

            result = landmarker.detect_for_video(
                mp_image,
                timestamp_ms,
            )

            if result.pose_landmarks:

                pose_landmarks = result.pose_landmarks[0]

                features = extract_joint_angles(
                    pose_landmarks
                )

                feature_vector = [
                    features["left_elbow_angle"],
                    features["right_elbow_angle"],
                    features["left_shoulder_angle"],
                    features["right_shoulder_angle"],
                    features["left_hip_angle"],
                    features["right_hip_angle"],
                    features["left_knee_angle"],
                    features["right_knee_angle"],
                ]

                try:
                    sequence = sequence_builder.add_frame(
                        feature_vector
                    )

                    if sequence is not None:
                        sequence_count += 1

                        print(
                            f"Sequence #{sequence_count} ready "
                            f"| Shape: {sequence.shape}"
                        )

                except ValueError as error:
                    print(
                        f"Feature error: {error}"
                    )

                cv2.putText(
                    frame,
                    (
                        f"Sequence buffer: "
                        f"{sequence_builder.size}/"
                        f"{SEQUENCE_LENGTH}"
                    ),
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

                if sequence_builder.is_ready:
                    cv2.putText(
                        frame,
                        "SEQUENCE READY",
                        (20, 75),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 255, 0),
                        2,
                    )

            else:
                cv2.putText(
                    frame,
                    "No pose detected",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2,
                )

            cv2.imshow(
                "Aurevia - Live Sequence Test",
                frame,
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        camera.release()
        landmarker.close()
        cv2.destroyAllWindows()

    print()
    print("Aurevia Live Sequence Test completed.")
    print(f"Frames processed: {frame_index}")
    print(f"Sequences generated: {sequence_count}")


if __name__ == "__main__":
    main()