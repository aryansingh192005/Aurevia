import numpy as np
import pytest

from ai.preprocessing.sequence_builder import SequenceBuilder


def test_sequence_is_not_ready_until_window_is_full():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=2,
    )

    assert builder.is_ready is False

    assert builder.add_frame([1.0, 2.0]) is None
    assert builder.add_frame([3.0, 4.0]) is None

    assert builder.is_ready is False

    sequence = builder.add_frame([5.0, 6.0])

    assert builder.is_ready is True
    assert sequence.shape == (3, 2)

    np.testing.assert_array_equal(
        sequence,
        np.array(
            [
                [1.0, 2.0],
                [3.0, 4.0],
                [5.0, 6.0],
            ],
            dtype=np.float32,
        ),
    )


def test_sliding_window():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=1,
    )

    builder.add_frame([1.0])
    builder.add_frame([2.0])
    builder.add_frame([3.0])

    sequence = builder.add_frame([4.0])

    np.testing.assert_array_equal(
        sequence,
        np.array(
            [
                [2.0],
                [3.0],
                [4.0],
            ],
            dtype=np.float32,
        ),
    )


def test_reset():
    builder = SequenceBuilder(
        sequence_length=2,
        feature_count=1,
    )

    builder.add_frame([1.0])
    builder.add_frame([2.0])

    assert builder.is_ready is True

    builder.reset()

    assert builder.is_ready is False
    assert builder.size == 0


def test_wrong_feature_count():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=2,
    )

    with pytest.raises(ValueError):
        builder.add_frame([1.0])


def test_nan_features_are_rejected():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=2,
    )

    with pytest.raises(ValueError):
        builder.add_frame([1.0, float("nan")])


def test_infinite_features_are_rejected():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=2,
    )

    with pytest.raises(ValueError):
        builder.add_frame([1.0, float("inf")])


def test_build_from_frames():
    builder = SequenceBuilder(
        sequence_length=3,
        feature_count=2,
    )

    sequence = builder.build_from_frames(
        [
            [1.0, 2.0],
            [3.0, 4.0],
            [5.0, 6.0],
        ]
    )

    assert sequence.shape == (3, 2)

    np.testing.assert_array_equal(
        sequence,
        np.array(
            [
                [1.0, 2.0],
                [3.0, 4.0],
                [5.0, 6.0],
            ],
            dtype=np.float32,
        ),
    )