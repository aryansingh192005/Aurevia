from datetime import datetime, timezone

from app.extensions import db


class ProgressRecord(db.Model):
    __tablename__ = "progress_records"

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

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("rehabilitation_sessions.id"),
        nullable=True,
        index=True,
    )

    metric_name = db.Column(
        db.String(100),
        nullable=False,
    )

    metric_value = db.Column(
        db.Float,
        nullable=False,
    )

    recorded_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship(
        "User",
        back_populates="progress_records",
    )

    session = db.relationship(
        "RehabilitationSession",
        back_populates="progress_records",
    )