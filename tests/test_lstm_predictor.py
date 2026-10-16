import sys
from types import SimpleNamespace
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


def test_predictor_loads_only_the_30_by_8_model(tmp_path, monkeypatch):
    model_path = tmp_path / "exercise_quality_lstm.keras"
    model_path.touch()
    model = SimpleNamespace(
        input_shape=(None, 30, 8),
        predict=lambda batch, verbose=0: [[0.9]],
    )
    fake_tensorflow = SimpleNamespace(
        keras=SimpleNamespace(
            models=SimpleNamespace(load_model=lambda path: model),
        ),
    )
    monkeypatch.setitem(sys.modules, "tensorflow", fake_tensorflow)

    predictor = LSTMPredictor(model_path=model_path)

    assert predictor.is_available is True
    assert predictor.predict([[0.0] * 8 for _ in range(30)]) == {
        "label": "correct",
        "confidence": 0.9,
    }


def test_predictor_rejects_model_with_wrong_input_contract(tmp_path, monkeypatch):
    model_path = tmp_path / "wrong-shape.keras"
    model_path.touch()
    model = SimpleNamespace(input_shape=(None, 20, 8))
    fake_tensorflow = SimpleNamespace(
        keras=SimpleNamespace(
            models=SimpleNamespace(load_model=lambda path: model),
        ),
    )
    monkeypatch.setitem(sys.modules, "tensorflow", fake_tensorflow)

    predictor = LSTMPredictor(model_path=model_path)

    assert predictor.is_available is False
