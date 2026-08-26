from datetime import datetime, timezone

from app.extensions import db


class RehabilitationSession(db.Model):
    __tablename__ = "rehabilitation_sessions"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
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

    started_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    completed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="created",
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship(
        "User",
        back_populates="sessions",
    )

    exercise = db.relationship(
        "Exercise",
        back_populates="sessions",
    )

    results = db.relationship(
        "SessionResult",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    progress_records = db.relationship(
        "ProgressRecord",
        back_populates="session",
    )