from datetime import datetime, timezone

from app.extensions import db


class SessionFeedback(db.Model):
    __tablename__ = "session_feedback"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("rehabilitation_sessions.id"), nullable=False, index=True)
    therapist_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    session = db.relationship("RehabilitationSession", back_populates="therapist_feedback")
    therapist = db.relationship("User")
