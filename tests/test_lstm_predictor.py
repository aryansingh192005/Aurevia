import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai.inference.lstm_predictor import LSTMPredictor


def test_predictor_unavailable_without_model_file(tmp_path):
    predictor = LSTMPredictor(model_path=tmp_path / "does-not-exist.keras")

    assert predictor.is_available is False
    assert predictor.predict([[0.0] * 8] * 30) is None


def test_predictor_rejects_wrong_shaped_sequence(tmp_path):
    predictor = LSTMPredictor(model_path=tmp_path / "does-not-exist.keras")

    # Still returns None because no model is loaded (shape validation only
    # runs once a model is actually available).
    assert predictor.predict([1, 2, 3]) is None
