from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import (
    Exercise,
    ExerciseAssignment,
    ProgressRecord,
    RehabilitationSession,
    SessionResult,
    User,
)
from app.services.auth import require_auth, require_role


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
        "exercise": {
            "id": session.exercise.id,
            "name": session.exercise.name,
            "target_area": session.exercise.target_area,
            "difficulty": session.exercise.difficulty,
        },
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


def session_result_to_dict(result):
    session = result.session

    return {
        "id": result.id,
        "session_id": result.session_id,
        "result_type": result.result_type,
        "result_data": result.result_data,
        "created_at": result.created_at.isoformat(),
        "patient": {
            "id": session.user.id,
            "name": session.user.name,
            "email": session.user.email,
        },
        "exercise": {
            "id": session.exercise.id,
            "name": session.exercise.name,
            "target_area": session.exercise.target_area,
        },
        "session": {
            "id": session.id,
            "status": session.status,
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
        },
    }


@sessions_bp.get("/sessions")
@require_auth
def get_sessions(user):
    query = RehabilitationSession.query

    if user.role == "patient":
        query = query.filter(
            RehabilitationSession.user_id == user.id
        )

    elif user.role == "therapist":
        query = query.join(
            User,
            RehabilitationSession.user_id == User.id,
        ).filter(
            User.role == "patient"
        )

    else:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    sessions = (
        query
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
    ), 200


@sessions_bp.get("/sessions/<int:session_id>")
@require_auth
def get_session(user, session_id):
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

    if user.role == "patient":
        if session.user_id != user.id:
            return jsonify(
                {
                    "error": "forbidden",
                }
            ), 403

    elif user.role == "therapist":
        if session.user.role != "patient":
            return jsonify(
                {
                    "error": "forbidden",
                }
            ), 403

    else:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    return jsonify(
        {
            "session": session_to_dict(session),
        }
    ), 200


@sessions_bp.post("/sessions")
@require_auth
@require_role("patient")
def create_session(user):
    data = request.get_json(silent=True) or {}

    assignment_id = data.get("assignment_id")

    if not isinstance(assignment_id, int):
        return jsonify(
            {
                "error": "assignment_id is required",
            }
        ), 400

    assignment = db.session.get(
        ExerciseAssignment,
        assignment_id,
    )

    if assignment is None:
        return jsonify(
            {
                "error": "Assignment not found",
            }
        ), 404

    if assignment.patient_id != user.id:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    if assignment.status != "active":
        return jsonify(
            {
                "error": "This exercise assignment is not active",
            }
        ), 400

    session = RehabilitationSession(
        user_id=user.id,
        exercise_id=assignment.exercise_id,
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
@require_auth
def update_session(user, session_id):
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

    if user.role == "patient":
        if session.user_id != user.id:
            return jsonify(
                {
                    "error": "forbidden",
                }
            ), 403

    elif user.role == "therapist":
        return jsonify(
            {
                "error": "therapists cannot update patient sessions",
            }
        ), 403

    else:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

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
        if session.started_at is None:
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
    ), 200


@sessions_bp.post("/sessions/<int:session_id>/results")
@require_auth
@require_role("patient")
def create_session_result(user, session_id):
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

    if session.user_id != user.id:
        return jsonify(
            {
                "error": "forbidden",
            }
        ), 403

    if session.status != "completed":
        return jsonify(
            {
                "error": "Session must be completed before adding results",
            }
        ), 400

    data = request.get_json(silent=True) or {}

    result_type = data.get("result_type")
    result_data = data.get("result_data")

    if not isinstance(result_type, str) or not result_type.strip():
        return jsonify(
            {
                "error": "result_type is required",
            }
        ), 400

    if not isinstance(result_data, dict):
        return jsonify(
            {
                "error": "result_data must be an object",
            }
        ), 400

    result_type = result_type.strip()

    result = SessionResult(
        session_id=session.id,
        result_type=result_type,
        result_data=result_data,
    )

    db.session.add(result)

    progress_metrics = {
        "repetitions": result_data.get("repetitions"),
        "correct_repetitions": result_data.get(
            "correct_repetitions"
        ),
        "incorrect_repetitions": result_data.get(
            "incorrect_repetitions"
        ),
        "accuracy": result_data.get("accuracy"),
    }

    for metric_name, metric_value in progress_metrics.items():
        if isinstance(metric_value, (int, float)):
            db.session.add(
                ProgressRecord(
                    user_id=user.id,
                    session_id=session.id,
                    metric_name=metric_name,
                    metric_value=float(metric_value),
                )
            )

    db.session.commit()

    return jsonify(
        {
            "result": session_result_to_dict(result),
        }
    ), 201


@sessions_bp.get("/session-results")
@require_auth
@require_role("therapist")
def get_session_results(user):
    results = (
        SessionResult.query
        .join(
            RehabilitationSession,
            SessionResult.session_id
            == RehabilitationSession.id,
        )
        .join(
            User,
            RehabilitationSession.user_id == User.id,
        )
        .filter(
            User.role == "patient"
        )
        .order_by(SessionResult.id.desc())
        .all()
    )

    return jsonify(
        {
            "results": [
                session_result_to_dict(result)
                for result in results
            ]
        }
    ), 200