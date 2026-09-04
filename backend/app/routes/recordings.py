from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Exercise, MovementRecording, RehabilitationSession
from app.services.auth import require_auth, require_role


recordings_bp = Blueprint(
    "recordings",
    __name__,
)


VALID_LABELS = {"correct", "incorrect"}


def recording_to_dict(recording, include_sequence=True):
    data = {
        "id": recording.id,
        "session_id": recording.session_id,
        "exercise_id": recording.exercise_id,
        "exercise_name": recording.exercise.name if recording.exercise else None,
        "rep_index": recording.rep_index,
        "sequence_length": recording.sequence_length,
        "feature_names": list(MovementRecording.FEATURE_NAMES),
        "heuristic_label": recording.heuristic_label,
        "heuristic_confidence": recording.heuristic_confidence,
        "therapist_label": recording.therapist_label,
        "reviewed_by_id": recording.reviewed_by_id,
        "reviewed_at": (
            recording.reviewed_at.isoformat() if recording.reviewed_at else None
        ),
        "created_at": recording.created_at.isoformat(),
    }

    if include_sequence:
        data["sequence"] = recording.sequence

    return data


@recordings_bp.post("/sessions/<int:session_id>/recordings")
@require_auth
@require_role("patient")
def create_recording(user, session_id):
    """Log one completed repetition's joint-angle sequence, captured live
    by the browser's AI pose-tracking pipeline. This is the raw material
    for training a real LSTM exercise-quality model later."""

    rehab_session = db.session.get(RehabilitationSession, session_id)

    if rehab_session is None or rehab_session.user_id != user.id:
        return jsonify({"error": "session not found"}), 404

    payload = request.get_json(silent=True) or {}

    sequence = payload.get("sequence")
    heuristic_label = payload.get("heuristic_label")
    rep_index = payload.get("rep_index")

    if not isinstance(sequence, list) or len(sequence) == 0:
        return jsonify({"error": "sequence is required"}), 400

    for frame in sequence:
        if not isinstance(frame, list) or len(frame) != len(
            MovementRecording.FEATURE_NAMES
        ):
            return jsonify(
                {
                    "error": (
                        f"each frame must have "
                        f"{len(MovementRecording.FEATURE_NAMES)} features"
                    ),
                }
            ), 400

    if heuristic_label not in VALID_LABELS:
        return jsonify({"error": "heuristic_label must be correct or incorrect"}), 400

    if not isinstance(rep_index, int):
        return jsonify({"error": "rep_index is required"}), 400

    recording = MovementRecording(
        session_id=rehab_session.id,
        exercise_id=rehab_session.exercise_id,
        rep_index=rep_index,
        sequence=sequence,
        sequence_length=len(sequence),
        heuristic_label=heuristic_label,
        heuristic_confidence=payload.get("heuristic_confidence"),
    )

    db.session.add(recording)
    db.session.commit()

    return jsonify({"recording": recording_to_dict(recording, include_sequence=False)}), 201


@recordings_bp.get("/recordings")
@require_auth
@require_role("therapist")
def list_recordings(user):
    """List logged repetitions for therapist review. Filter with
    ?status=pending to see only recordings awaiting a therapist label."""

    query = MovementRecording.query

    status = request.args.get("status")

    if status == "pending":
        query = query.filter(MovementRecording.therapist_label.is_(None))
    elif status == "reviewed":
        query = query.filter(MovementRecording.therapist_label.isnot(None))

    recordings = query.order_by(MovementRecording.created_at.desc()).limit(200).all()

    return jsonify(
        {
            "recordings": [
                recording_to_dict(recording, include_sequence=True)
                for recording in recordings
            ],
        }
    ), 200


@recordings_bp.patch("/recordings/<int:recording_id>")
@require_auth
@require_role("therapist")
def review_recording(user, recording_id):
    """A therapist confirms or corrects the automatic label on a logged
    repetition, turning it into a genuine human-verified training label."""

    recording = db.session.get(MovementRecording, recording_id)

    if recording is None:
        return jsonify({"error": "recording not found"}), 404

    payload = request.get_json(silent=True) or {}
    therapist_label = payload.get("therapist_label")

    if therapist_label not in VALID_LABELS:
        return jsonify({"error": "therapist_label must be correct or incorrect"}), 400

    recording.therapist_label = therapist_label
    recording.reviewed_by_id = user.id
    recording.reviewed_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({"recording": recording_to_dict(recording, include_sequence=False)}), 200


@recordings_bp.get("/recordings/export")
@require_auth
@require_role("therapist")
def export_recordings(user):
    """Export all therapist-reviewed recordings as a labeled dataset ready
    for ai/training/train_lstm.py. Only reviewed rows are included, since
    those carry a human-verified label rather than the raw heuristic."""

    recordings = (
        MovementRecording.query
        .filter(MovementRecording.therapist_label.isnot(None))
        .order_by(MovementRecording.id.asc())
        .all()
    )

    exercises = {exercise.id: exercise for exercise in Exercise.query.all()}

    return jsonify(
        {
            "feature_names": list(MovementRecording.FEATURE_NAMES),
            "count": len(recordings),
            "examples": [
                {
                    "id": recording.id,
                    "exercise_id": recording.exercise_id,
                    "exercise_name": (
                        exercises[recording.exercise_id].name
                        if recording.exercise_id in exercises
                        else None
                    ),
                    "sequence": recording.sequence,
                    "label": recording.therapist_label,
                }
                for recording in recordings
            ],
        }
    ), 200
