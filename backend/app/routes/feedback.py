from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import RehabilitationSession, SessionFeedback
from app.services.auth import require_auth, require_role

feedback_bp = Blueprint("feedback", __name__)


def feedback_to_dict(row):
    return {
        "id": row.id,
        "session_id": row.session_id,
        "message": row.message,
        "therapist": {"id": row.therapist.id, "name": row.therapist.name},
        "created_at": row.created_at.isoformat(),
    }


@feedback_bp.get("/sessions/<int:session_id>/feedback")
@require_auth
def list_session_feedback(user, session_id):
    session = db.session.get(RehabilitationSession, session_id)
    if not session:
        return jsonify({"error": "session not found"}), 404
    if user.role == "patient":
        allowed = session.user_id == user.id
    else:
        allowed = bool(session.assignment and session.assignment.therapist_id == user.id)
    if not allowed:
        return jsonify({"error": "forbidden"}), 403
    return jsonify({"feedback": [feedback_to_dict(row) for row in session.therapist_feedback]}), 200


@feedback_bp.post("/sessions/<int:session_id>/feedback")
@require_auth
@require_role("therapist")
def add_session_feedback(user, session_id):
    session = db.session.get(RehabilitationSession, session_id)
    if not session:
        return jsonify({"error": "session not found"}), 404
    if not session.assignment or session.assignment.therapist_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    message = (request.get_json(silent=True) or {}).get("message")
    if not isinstance(message, str) or not message.strip() or len(message.strip()) > 2000:
        return jsonify({"error": "feedback must be between 1 and 2000 characters"}), 400
    row = SessionFeedback(session_id=session.id, therapist_id=user.id, message=message.strip())
    db.session.add(row)
    db.session.commit()
    return jsonify({"feedback": feedback_to_dict(row)}), 201
