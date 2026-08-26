from collections import deque
from typing import Iterable, Optional

import numpy as np


class SequenceBuilder:
    """
    Build fixed-length temporal sequences from pose feature vectors.

    Each feature vector represents one video frame.
    """

    def __init__(
        self,
        sequence_length: int,
        feature_count: int,
    ):
        if sequence_length <= 0:
            raise ValueError("sequence_length must be greater than 0.")

        if feature_count <= 0:
            raise ValueError("feature_count must be greater than 0.")

        self.sequence_length = sequence_length
        self.feature_count = feature_count

        self._buffer = deque(maxlen=sequence_length)

    @property
    def is_ready(self) -> bool:
        """Return True when a complete sequence is available."""

        return len(self._buffer) == self.sequence_length

    @property
    def size(self) -> int:
        """Return the number of frames currently buffered."""

        return len(self._buffer)

    def reset(self) -> None:
        """Clear the current temporal window."""

        self._buffer.clear()

    def add_frame(
        self,
        features: Iterable[float],
    ) -> Optional[np.ndarray]:
        """
        Add one feature vector to the temporal window.

        Returns:
            A NumPy array of shape
            (sequence_length, feature_count)
            once the window is full.

            Returns None until enough frames have
            been collected.
        """

        vector = np.asarray(
            list(features),
            dtype=np.float32,
        )

        if vector.ndim != 1:
            raise ValueError(
                "Each frame must contain a one-dimensional "
                "feature vector."
            )

        if vector.shape[0] != self.feature_count:
            raise ValueError(
                f"Expected {self.feature_count} features, "
                f"received {vector.shape[0]}."
            )

        if not np.all(np.isfinite(vector)):
            raise ValueError(
                "Feature vector contains NaN or infinite values."
            )

        self._buffer.append(vector)

        if not self.is_ready:
            return None

        return np.stack(self._buffer, axis=0)

    def build_from_frames(
        self,
        frames: Iterable[Iterable[float]],
    ) -> np.ndarray:
        """
        Build a complete sequence from exactly sequence_length frames.
        """

        frame_list = list(frames)

        if len(frame_list) != self.sequence_length:
            raise ValueError(
                f"Expected {self.sequence_length} frames, "
                f"received {len(frame_list)}."
            )

        self.reset()

        for frame in frame_list:
            sequence = self.add_frame(frame)

        if sequence is None:
            raise RuntimeError(
                "Unable to build the requested sequence."
            )

        return sequence