from datetime import datetime, timezone

from app.extensions import db


class SessionResult(db.Model):
    __tablename__ = "session_results"

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

    result_type = db.Column(
        db.String(100),
        nullable=False,
    )

    result_data = db.Column(
        db.JSON,
        nullable=False,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = db.relationship(
        "RehabilitationSession",
        back_populates="results",
    )