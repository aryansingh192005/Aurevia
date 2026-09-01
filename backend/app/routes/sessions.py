from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Exercise, RehabilitationSession, User


sessions_bp = Blueprint(
    "sessions",
    __name__,
)


VALID_STATUSES = {
    "created",
    "started",
    "in_progress",
    "completed",
}


def session_to_dict(session):
    return {
        "id": session.id,
        "user_id": session.user_id,
        "exercise_id": session.exercise_id,
        "started_at": (
            session.started_at.isoformat()
            if session.started_at
            else None
        ),
        "completed_at": (
            session.completed_at.isoformat()
            if session.completed_at
            else None
        ),
        "status": session.status,
        "created_at": session.created_at.isoformat(),
    }


@sessions_bp.get("/sessions")
def get_sessions():
    sessions = (
        RehabilitationSession.query
        .order_by(RehabilitationSession.id.desc())
        .all()
    )

    return jsonify(
        {
            "sessions": [
                session_to_dict(session)
                for session in sessions
            ]
        }
    )


@sessions_bp.get("/sessions/<int:session_id>")
def get_session(session_id):
    session = db.session.get(
        RehabilitationSession,
        session_id,
    )

    if session is None:
        return jsonify(
            {
                "error": "Session not found",
            }
        ), 404

    return jsonify(
        {
            "session": session_to_dict(session),
        }
    )


@sessions_bp.post("/sessions")
def create_session():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    exercise_id = data.get("exercise_id")

    if not isinstance(user_id, int):
        return jsonify(
            {
                "error": "user_id is required",
            }
        ), 400

    if not isinstance(exercise_id, int):
        return jsonify(
            {
                "error": "exercise_id is required",
            }
        ), 400

    user = db.session.get(User, user_id)

    if user is None:
        return jsonify(
            {
                "error": "User not found",
            }
        ), 404

    exercise = db.session.get(
        Exercise,
        exercise_id,
    )

    if exercise is None:
        return jsonify(
            {
                "error": "Exercise not found",
            }
        ), 404

    session = RehabilitationSession(
        user_id=user_id,
        exercise_id=exercise_id,
        status="created",
    )

    db.session.add(session)
    db.session.commit()

    return jsonify(
        {
            "session": session_to_dict(session),
        }
    ), 201


@sessions_bp.patch("/sessions/<int:session_id>")
def update_session(session_id):
    session = db.session.get(
        RehabilitationSession,
        session_id,
    )

    if session is None:
        return jsonify(
            {
                "error": "Session not found",
            }
        ), 404

    data = request.get_json(silent=True) or {}

    status = data.get("status")

    if status is None:
        return jsonify(
            {
                "error": "status is required",
            }
        ), 400

    if status not in VALID_STATUSES:
        return jsonify(
            {
                "error": "Invalid session status",
            }
        ), 400

    now = datetime.now(timezone.utc)

    if status == "started":
        session.started_at = now

    if status == "completed":
        if session.started_at is None:
            session.started_at = now

        session.completed_at = now

    session.status = status

    db.session.commit()

    return jsonify(
        {
            "session": session_to_dict(session),
        }
    )