import math
import sys
from pathlib import Path

from flask import Blueprint, jsonify, request

from app.models import RehabilitationSession
from app.services.auth import require_auth

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai.inference.lstm_predictor import is_model_available, predict  # noqa: E402


ai_bp = Blueprint("ai", __name__)
SEQUENCE_LENGTH = 30
FEATURE_COUNT = 8


@ai_bp.get("/ai/status")
@require_auth
def model_status(user):
    return jsonify({"available": is_model_available()}), 200


@ai_bp.post("/sessions/<int:session_id>/predict")
@require_auth
def predict_repetition(user, session_id):
    if user.role != "patient":
        return jsonify({"error": "forbidden"}), 403

    rehab_session = RehabilitationSession.query.filter_by(
        id=session_id, user_id=user.id
    ).first()
    if rehab_session is None:
        return jsonify({"error": "session not found"}), 404
    if rehab_session.status != "started":
        return jsonify({"error": "session must be in progress"}), 400

    sequence = (request.get_json(silent=True) or {}).get("sequence")
    if not isinstance(sequence, list) or len(sequence) != SEQUENCE_LENGTH:
        return jsonify({"error": f"sequence must contain exactly {SEQUENCE_LENGTH} frames"}), 400

    for frame in sequence:
        if not isinstance(frame, list) or len(frame) != FEATURE_COUNT:
            return jsonify({"error": f"each frame must contain exactly {FEATURE_COUNT} features"}), 400
        if any(
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            for value in frame
        ):
            return jsonify({"error": "sequence values must be finite numbers"}), 400

    if not is_model_available():
        return jsonify({"error": "trained LSTM model is not available"}), 503

    result = predict(sequence)
    if result is None:
        return jsonify({"error": "trained LSTM model could not be loaded"}), 503
    return jsonify({"prediction": result}), 200
