import math

from ai.features.pose_features import calculate_angle


def test_right_angle():
    point_a = (1.0, 0.0, 0.0)
    point_b = (0.0, 0.0, 0.0)
    point_c = (0.0, 1.0, 0.0)

    angle = calculate_angle(
        point_a,
        point_b,
        point_c,
    )

    assert math.isclose(
        angle,
        90.0,
        abs_tol=1e-6,
    )


def test_straight_angle():
    point_a = (-1.0, 0.0, 0.0)
    point_b = (0.0, 0.0, 0.0)
    point_c = (1.0, 0.0, 0.0)

    angle = calculate_angle(
        point_a,
        point_b,
        point_c,
    )

    assert math.isclose(
        angle,
        180.0,
        abs_tol=1e-6,
    )


def test_zero_length_vector():
    point_a = (0.0, 0.0, 0.0)
    point_b = (0.0, 0.0, 0.0)
    point_c = (1.0, 0.0, 0.0)

    angle = calculate_angle(
        point_a,
        point_b,
        point_c,
    )

    assert math.isnan(angle)