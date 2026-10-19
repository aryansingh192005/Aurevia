from datetime import datetime, timezone

from flask import Blueprint, jsonify
from flask import request
from werkzeug.security import check_password_hash

from app.extensions import db
from app.models import ExerciseAssignment, MovementRecording, PlanExercise, ProgressRecord, RehabilitationPlan, RehabilitationSession, SessionFeedback, SessionResult, User
from app.services.auth import logout_user, require_auth, require_role

privacy_bp = Blueprint("privacy", __name__)


@privacy_bp.get("/privacy/export")
@require_auth
@require_role("patient")
def export_my_data(user):
    sessions = RehabilitationSession.query.filter_by(user_id=user.id).order_by(RehabilitationSession.id.asc()).all()
    session_ids = [session.id for session in sessions]
    results = SessionResult.query.filter(SessionResult.session_id.in_(session_ids)).all() if session_ids else []
    feedback = SessionFeedback.query.filter(SessionFeedback.session_id.in_(session_ids)).all() if session_ids else []
    assignments = ExerciseAssignment.query.filter_by(patient_id=user.id).all()
    plans = RehabilitationPlan.query.filter_by(patient_id=user.id).all()
    recordings = MovementRecording.query.filter(MovementRecording.session_id.in_(session_ids)).all() if session_ids else []
    progress = ProgressRecord.query.filter_by(user_id=user.id).all()
    return jsonify({
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "created_at": user.created_at.isoformat()},
        "assignments": [{"id": row.id, "exercise": row.exercise.name, "therapist": row.therapist.name, "target_sets": row.target_sets, "target_reps": row.target_reps, "status": row.status, "assigned_at": row.assigned_at.isoformat()} for row in assignments],
        "care_plans": [{
            "id": row.id,
            "title": row.title,
            "notes": row.notes,
            "status": row.status,
            "start_date": row.start_date.isoformat() if row.start_date else None,
            "end_date": row.end_date.isoformat() if row.end_date else None,
            "days_per_week": row.days_per_week,
            "exercises": [{
                "name": item.exercise.name,
                "sets": item.sets,
                "reps": item.reps,
                "rest_seconds": item.rest_seconds,
                "days_per_week": item.days_per_week,
                "instructions": item.instructions,
            } for item in row.items],
        } for row in plans],
        "sessions": [{"id": row.id, "exercise": row.exercise.name, "status": row.status, "started_at": row.started_at.isoformat() if row.started_at else None, "completed_at": row.completed_at.isoformat() if row.completed_at else None} for row in sessions],
        "session_results": [{"session_id": row.session_id, "type": row.result_type, "data": row.result_data, "created_at": row.created_at.isoformat()} for row in results],
        "therapist_feedback": [{"session_id": row.session_id, "therapist": row.therapist.name, "message": row.message, "created_at": row.created_at.isoformat()} for row in feedback],
        "progress": [{"session_id": row.session_id, "metric": row.metric_name, "value": row.metric_value, "recorded_at": row.recorded_at.isoformat()} for row in progress],
        "saved_joint_angle_repetitions": [{"session_id": row.session_id, "exercise": row.exercise.name, "rep_index": row.rep_index, "sequence": row.sequence, "heuristic_label": row.heuristic_label, "therapist_label": row.therapist_label, "created_at": row.created_at.isoformat()} for row in recordings],
    }), 200


@privacy_bp.delete("/privacy/movement-recordings")
@require_auth
@require_role("patient")
def delete_my_movement_recordings(user):
    session_ids = db.select(RehabilitationSession.id).where(RehabilitationSession.user_id == user.id)
    deleted = MovementRecording.query.filter(MovementRecording.session_id.in_(session_ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"deleted": deleted, "message": "Saved joint-angle repetitions were removed. Session summaries remain in your history."}), 200


@privacy_bp.delete("/privacy/account")
@require_auth
@require_role("patient")
def delete_my_account(user):
    password = (request.get_json(silent=True) or {}).get("password")
    if not isinstance(password, str) or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "current password is incorrect"}), 401

    session_ids = db.select(RehabilitationSession.id).where(RehabilitationSession.user_id == user.id)
    MovementRecording.query.filter(MovementRecording.session_id.in_(session_ids)).delete(synchronize_session=False)
    SessionFeedback.query.filter(SessionFeedback.session_id.in_(session_ids)).delete(synchronize_session=False)
    SessionResult.query.filter(SessionResult.session_id.in_(session_ids)).delete(synchronize_session=False)
    ProgressRecord.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    RehabilitationSession.query.filter_by(user_id=user.id).delete(synchronize_session=False)

    plans = RehabilitationPlan.query.filter_by(patient_id=user.id).all()
    plan_ids = [plan.id for plan in plans]
    if plan_ids:
        PlanExercise.query.filter(PlanExercise.plan_id.in_(plan_ids)).delete(synchronize_session=False)
    ExerciseAssignment.query.filter_by(patient_id=user.id).delete(synchronize_session=False)
    for plan in plans:
        db.session.delete(plan)
    db.session.delete(user)
    db.session.commit()
    logout_user()
    return jsonify({"message": "Your Aurevia patient account and its associated data were permanently deleted."}), 200
