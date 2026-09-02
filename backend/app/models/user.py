from datetime import datetime, timezone

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    name = db.Column(
        db.String(120),
        nullable=False,
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False,
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="patient",
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
        back_populates="user",
        cascade="all, delete-orphan",
    )

    progress_records = db.relationship(
        "ProgressRecord",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    assigned_exercises = db.relationship(
    "ExerciseAssignment",
    foreign_keys="ExerciseAssignment.patient_id",
    back_populates="patient",
    cascade="all, delete-orphan",
)

    created_assignments = db.relationship(
    "ExerciseAssignment",
    foreign_keys="ExerciseAssignment.therapist_id",
    back_populates="therapist",
    cascade="all, delete-orphan",
)