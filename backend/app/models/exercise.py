from datetime import datetime, timezone

from app.extensions import db


class Exercise(db.Model):
    __tablename__ = "exercises"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    name = db.Column(
        db.String(120),
        nullable=False,
    )

    description = db.Column(
        db.Text,
        nullable=True,
    )

    target_area = db.Column(
        db.String(120),
        nullable=True,
    )

    difficulty = db.Column(
        db.String(50),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sessions = db.relationship(
        "RehabilitationSession",
        back_populates="exercise",
    )

    assignments = db.relationship(
    "ExerciseAssignment",
    back_populates="exercise",
    cascade="all, delete-orphan",
)