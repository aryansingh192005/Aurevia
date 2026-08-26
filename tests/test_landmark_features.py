import math

from ai.features.landmark_features import (
    calculate_joint_angle,
    extract_joint_angles,
)


class FakeLandmark:
    def __init__(self, x, y, z=0.0):
        self.x = x
        self.y = y
        self.z = z


def create_landmarks():
    """
    Create 33 fake landmarks so we can test
    the feature-extraction layer independently.
    """

    return [
        FakeLandmark(0.0, 0.0, 0.0)
        for _ in range(33)
    ]


def test_calculate_joint_angle():

    landmarks = create_landmarks()

    # Create a 90-degree angle at landmark 13.
    landmarks[11] = FakeLandmark(1.0, 0.0, 0.0)
    landmarks[13] = FakeLandmark(0.0, 0.0, 0.0)
    landmarks[15] = FakeLandmark(0.0, 1.0, 0.0)

    angle = calculate_joint_angle(
        landmarks,
        11,
        13,
        15,
    )

    assert math.isclose(
        angle,
        90.0,
        abs_tol=1e-6,
    )


def test_extract_joint_angles_returns_expected_features():

    landmarks = create_landmarks()

    features = extract_joint_angles(landmarks)

    expected_features = {
        "left_elbow_angle",
        "right_elbow_angle",
        "left_shoulder_angle",
        "right_shoulder_angle",
        "left_hip_angle",
        "right_hip_angle",
        "left_knee_angle",
        "right_knee_angle",
    }

    assert set(features.keys()) == expected_features


def test_missing_landmarks_return_nan():

    landmarks = None

    features = extract_joint_angles(landmarks)

    for value in features.values():
        assert math.isnan(value)