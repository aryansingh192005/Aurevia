import math
from typing import Sequence


def calculate_angle(
    point_a: Sequence[float],
    point_b: Sequence[float],
    point_c: Sequence[float],
) -> float:
    """
    Calculate the angle ABC in degrees.

    point_b is the vertex of the angle.
    """

    vector_ba = (
        point_a[0] - point_b[0],
        point_a[1] - point_b[1],
        point_a[2] - point_b[2],
    )

    vector_bc = (
        point_c[0] - point_b[0],
        point_c[1] - point_b[1],
        point_c[2] - point_b[2],
    )

    magnitude_ba = math.sqrt(
        sum(component ** 2 for component in vector_ba)
    )

    magnitude_bc = math.sqrt(
        sum(component ** 2 for component in vector_bc)
    )

    if magnitude_ba == 0 or magnitude_bc == 0:
        return float("nan")

    dot_product = sum(
        vector_ba[i] * vector_bc[i]
        for i in range(3)
    )

    cosine_angle = dot_product / (
        magnitude_ba * magnitude_bc
    )

    # Floating-point calculations can occasionally
    # produce values just outside [-1, 1].
    cosine_angle = max(-1.0, min(1.0, cosine_angle))

    angle = math.degrees(
        math.acos(cosine_angle)
    )

    return angle


def landmark_to_xyz(landmark) -> tuple[float, float, float]:
    """Convert a MediaPipe landmark into an XYZ tuple."""

    return (
        landmark.x,
        landmark.y,
        landmark.z,
    )