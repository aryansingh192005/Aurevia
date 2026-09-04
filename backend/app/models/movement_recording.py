from datetime import datetime, timezone

from app.extensions import db


class MovementRecording(db.Model):
    """A single repetition's resampled joint-angle sequence, captured live
    by the browser's pose-tracking pipeline. Each row is one training
    example for the future LSTM exercise-quality model: a fixed-length
    sequence of 8-dimensional joint-angle frames, an automatic label from
    the real-time heuristic (RepCounter), and an optional therapist-
    confirmed label once reviewed.

    feature_names is fixed and matches
    ai/features/landmark_features.extract_joint_angles /
    frontend/src/ai/poseAnalysis.js extractJointAngles, in this order:
    left_elbow_angle, right_elbow_angle, left_shoulder_angle,
    right_shoulder_angle, left_hip_angle, right_hip_angle,
    left_knee_angle, right_knee_angle.
    """

    __tablename__ = "movement_recordings"

    FEATURE_NAMES = (
        "left_elbow_angle",
        "right_elbow_angle",
        "left_shoulder_angle",
        "right_shoulder_angle",
        "left_hip_angle",
        "right_hip_angle",
        "left_knee_angle",
        "right_knee_angle",
    )

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("rehabilitation_sessions.id"),
        nullable=False,
        index=True,
    )

    exercise_id = db.Column(
        db.Integer,
        db.ForeignKey("exercises.id"),
        nullable=False,
        index=True,
    )

    rep_index = db.Column(
        db.Integer,
        nullable=False,
    )

    sequence = db.Column(
        db.JSON,
        nullable=False,
    )

    sequence_length = db.Column(
        db.Integer,
        nullable=False,
    )

    heuristic_label = db.Column(
        db.String(20),
        nullable=False,
    )

    heuristic_confidence = db.Column(
        db.Float,
        nullable=True,
    )

    therapist_label = db.Column(
        db.String(20),
        nullable=True,
    )

    reviewed_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
    )

    reviewed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = db.relationship(
        "RehabilitationSession",
    )

    exercise = db.relationship(
        "Exercise",
    )

    reviewed_by = db.relationship(
        "User",
    )
