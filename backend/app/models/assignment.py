from datetime import datetime, timezone

from app.extensions import db


class ExerciseAssignment(db.Model):
    __tablename__ = "exercise_assignments"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    therapist_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    exercise_id = db.Column(
        db.Integer,
        db.ForeignKey("exercises.id"),
        nullable=False,
        index=True,
    )

    target_sets = db.Column(
        db.Integer,
        nullable=True,
    )

    target_reps = db.Column(
        db.Integer,
        nullable=True,
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="active",
    )

    assigned_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = db.relationship(
        "User",
        foreign_keys=[patient_id],
        back_populates="assigned_exercises",
    )

    therapist = db.relationship(
        "User",
        foreign_keys=[therapist_id],
        back_populates="created_assignments",
    )

    exercise = db.relationship(
        "Exercise",
        back_populates="assignments",
    )