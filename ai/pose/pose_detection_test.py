from pathlib import Path

import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "ai"
    / "models"
    / "pose_landmarker"
    / "pose_landmarker_lite.task"
)


def draw_landmarks(frame, pose_landmarks):
    """Draw the MediaPipe pose skeleton on an OpenCV frame."""

    height, width = frame.shape[:2]

    connections = vision.PoseLandmarksConnections.POSE_LANDMARKS

    # Draw connections.
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

    # Draw landmarks.
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


def main():
    print("Starting Aurevia Pose Detection Test...")

    if not MODEL_PATH.exists():
        print("ERROR: Pose Landmarker model was not found.")
        print(f"Expected model: {MODEL_PATH}")
        return

    print(f"Using model: {MODEL_PATH}")

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

    landmarker = vision.PoseLandmarker.create_from_options(options)

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Could not open the camera.")
        landmarker.close()
        return

    print("Camera opened successfully.")
    print("Press 'q' to exit.")

    frame_index = 0
    detected_frames = 0

    try:
        while True:
            success, frame = camera.read()

            if not success:
                print("ERROR: Could not read camera frame.")
                break

            # Mirror the camera feed.
            frame = cv2.flip(frame, 1)

            # MediaPipe expects RGB.
            rgb_frame = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            # Convert OpenCV image to MediaPipe Image.
            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame,
            )

            # Timestamps must increase monotonically.
            timestamp_ms = frame_index * 33
            frame_index += 1

            result = landmarker.detect_for_video(
                mp_image,
                timestamp_ms,
            )

            if result.pose_landmarks:
                detected_frames += 1

                pose_landmarks = result.pose_landmarks[0]

                draw_landmarks(
                    frame,
                    pose_landmarks,
                )

                cv2.putText(
                    frame,
                    f"Landmarks detected: {len(pose_landmarks)}",
                    (20, 40),
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
                    0.8,
                    (0, 0, 255),
                    2,
                )

            cv2.putText(
                frame,
                f"Frames processed: {frame_index}",
                (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )

            cv2.imshow(
                "Aurevia - Pose Detection Test",
                frame,
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        camera.release()
        landmarker.close()
        cv2.destroyAllWindows()

    print()
    print("Aurevia Pose Detection Test completed.")
    print(f"Frames processed: {frame_index}")
    print(f"Frames with detected pose: {detected_frames}")


if __name__ == "__main__":
    main()