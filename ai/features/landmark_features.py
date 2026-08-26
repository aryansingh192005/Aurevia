from typing import Optional

from ai.features.pose_features import calculate_angle, landmark_to_xyz


# MediaPipe Pose landmark indices.
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

LEFT_ELBOW = 13
RIGHT_ELBOW = 14

LEFT_WRIST = 15
RIGHT_WRIST = 16

LEFT_HIP = 23
RIGHT_HIP = 24

LEFT_KNEE = 25
RIGHT_KNEE = 26

LEFT_ANKLE = 27
RIGHT_ANKLE = 28


def get_landmark(
    landmarks,
    index: int,
):
    """Safely retrieve a landmark by MediaPipe index."""

    if landmarks is None:
        return None

    if index < 0 or index >= len(landmarks):
        return None

    return landmarks[index]


def get_landmark_xyz(
    landmarks,
    index: int,
) -> Optional[tuple[float, float, float]]:
    """Return the XYZ coordinates of a landmark."""

    landmark = get_landmark(landmarks, index)

    if landmark is None:
        return None

    return landmark_to_xyz(landmark)


def calculate_joint_angle(
    landmarks,
    point_a_index: int,
    point_b_index: int,
    point_c_index: int,
) -> float:
    """
    Calculate an angle from three MediaPipe landmarks.

    point_b is the joint/vertex.
    """

    point_a = get_landmark_xyz(
        landmarks,
        point_a_index,
    )

    point_b = get_landmark_xyz(
        landmarks,
        point_b_index,
    )

    point_c = get_landmark_xyz(
        landmarks,
        point_c_index,
    )

    if point_a is None or point_b is None or point_c is None:
        return float("nan")

    return calculate_angle(
        point_a,
        point_b,
        point_c,
    )


def extract_joint_angles(landmarks) -> dict[str, float]:
    """
    Extract the initial set of joint-angle features
    used by Aurevia's pose-analysis prototype.
    """

    return {
        "left_elbow_angle": calculate_joint_angle(
            landmarks,
            LEFT_SHOULDER,
            LEFT_ELBOW,
            LEFT_WRIST,
        ),
        "right_elbow_angle": calculate_joint_angle(
            landmarks,
            RIGHT_SHOULDER,
            RIGHT_ELBOW,
            RIGHT_WRIST,
        ),
        "left_shoulder_angle": calculate_joint_angle(
            landmarks,
            LEFT_ELBOW,
            LEFT_SHOULDER,
            LEFT_HIP,
        ),
        "right_shoulder_angle": calculate_joint_angle(
            landmarks,
            RIGHT_ELBOW,
            RIGHT_SHOULDER,
            RIGHT_HIP,
        ),
        "left_hip_angle": calculate_joint_angle(
            landmarks,
            LEFT_SHOULDER,
            LEFT_HIP,
            LEFT_KNEE,
        ),
        "right_hip_angle": calculate_joint_angle(
            landmarks,
            RIGHT_SHOULDER,
            RIGHT_HIP,
            RIGHT_KNEE,
        ),
        "left_knee_angle": calculate_joint_angle(
            landmarks,
            LEFT_HIP,
            LEFT_KNEE,
            LEFT_ANKLE,
        ),
        "right_knee_angle": calculate_joint_angle(
            landmarks,
            RIGHT_HIP,
            RIGHT_KNEE,
            RIGHT_ANKLE,
        ),
    }