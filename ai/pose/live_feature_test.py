from pathlib import Path

import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from ai.features.landmark_features import extract_joint_angles


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "pose_landmarker"
    / "pose_landmarker_lite.task"
)


def draw_landmarks(frame, pose_landmarks):
    """Draw the MediaPipe pose skeleton."""

    height, width = frame.shape[:2]

    connections = vision.PoseLandmarksConnections.POSE_LANDMARKS

    for connection in connections:
        start = pose_landmarks[connection.start]
        end = pose_landmarks[connection.end]

        start_point = (
            int(start.x * width),
            int(start.y * height),
        )

        end_point = (
            int(end.x * width),
            int(end.y * height),
        )

        cv2.line(
            frame,
            start_point,
            end_point,
            (0, 255, 0),
            2,
        )

    for landmark in pose_landmarks:
        point = (
            int(landmark.x * width),
            int(landmark.y * height),
        )

        cv2.circle(
            frame,
            point,
            4,
            (0, 0, 255),
            -1,
        )


def draw_features(frame, features):
    """Display extracted joint-angle features."""

    x = 20
    y = 40

    cv2.putText(
        frame,
        "AUREVIA - LIVE FEATURES",
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
    )

    y += 35

    display_order = [
        ("left_knee_angle", "Left Knee"),
        ("right_knee_angle", "Right Knee"),
        ("left_hip_angle", "Left Hip"),
        ("right_hip_angle", "Right Hip"),
        ("left_elbow_angle", "Left Elbow"),
        ("right_elbow_angle", "Right Elbow"),
        ("left_shoulder_angle", "Left Shoulder"),
        ("right_shoulder_angle", "Right Shoulder"),
    ]

    for key, label in display_order:

        value = features.get(key)

        if value is None:
            text = f"{label}: --"
        elif value != value:
            # NaN check.
            text = f"{label}: --"
        else:
            text = f"{label}: {value:6.1f} deg"

        cv2.putText(
            frame,
            text,
            (x, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            2,
        )

        y += 28


def main():
    print("Starting Aurevia Live Feature Test...")

    if not MODEL_PATH.exists():
        print("ERROR: Pose Landmarker model not found.")
        print(f"Expected: {MODEL_PATH}")
        return

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
        print("ERROR: Could not open the camera.")
        landmarker.close()
        return

    print("Camera opened successfully.")
    print("Press 'q' to exit.")

    frame_index = 0

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

                draw_landmarks(
                    frame,
                    pose_landmarks,
                )

                features = extract_joint_angles(
                    pose_landmarks
                )

                draw_features(
                    frame,
                    features,
                )

            else:
                cv2.putText(
                    frame,
                    "No pose detected",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2,
                )

            cv2.imshow(
                "Aurevia - Live Feature Test",
                frame,
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        camera.release()
        landmarker.close()
        cv2.destroyAllWindows()

    print("Aurevia Live Feature Test completed.")


if __name__ == "__main__":
    main()