"""Loads a trained exercise-quality LSTM (produced by
ai/training/train_lstm.py) and scores a single repetition's joint-angle
sequence.

This module degrades gracefully: if no trained model file exists yet
(the common case until enough therapist-reviewed recordings have been
collected and exported), predict() returns None rather than raising, so
callers can fall back to the real-time heuristic in
frontend/src/ai/poseAnalysis.js without special-casing "model not ready
yet" everywhere.
"""

from pathlib import Path
from typing import Optional

import numpy as np


DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parents[1] / "models" / "lstm" / "exercise_quality_lstm.keras"
)


class LSTMPredictor:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self._model = None
        self._load_attempted = False

    def _ensure_loaded(self) -> bool:
        if self._model is not None:
            return True

        if self._load_attempted:
            return False

        self._load_attempted = True

        if not self.model_path.exists():
            return False

        try:
            from tensorflow import keras

            self._model = keras.models.load_model(self.model_path)
            return True
        except Exception:
            # A corrupt/incompatible model file should never crash the
            # request path -- just fall back to "no model available".
            return False

    @property
    def is_available(self) -> bool:
        return self._ensure_loaded()

    def predict(self, sequence) -> Optional[dict]:
        """Score one rep. `sequence` is a (sequence_length, 8) array-like
        of joint angles, in the same feature order as
        ai/features/landmark_features.extract_joint_angles.

        Returns {"label": "correct" | "incorrect", "confidence": float}
        or None if no trained model is available yet.
        """

        if not self._ensure_loaded():
            return None

        array = np.asarray(sequence, dtype=np.float32)

        if array.ndim != 2:
            raise ValueError("sequence must be 2-dimensional (frames, features)")

        batch = array[np.newaxis, ...]
        probability = float(self._model.predict(batch, verbose=0)[0][0])

        return {
            "label": "correct" if probability >= 0.5 else "incorrect",
            "confidence": probability if probability >= 0.5 else 1 - probability,
        }


# Module-level singleton so the (potentially large) model is only loaded
# once per process, not once per request.
_default_predictor = LSTMPredictor()


def predict(sequence) -> Optional[dict]:
    return _default_predictor.predict(sequence)


def is_model_available() -> bool:
    return _default_predictor.is_available
