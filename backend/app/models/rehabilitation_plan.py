from datetime import datetime, timezone

from app.extensions import db


class RehabilitationPlan(db.Model):
    __tablename__ = "rehabilitation_plans"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    therapist_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(140), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    days_per_week = db.Column(db.Integer, nullable=False, default=3)
    status = db.Column(db.String(20), nullable=False, default="active")
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    patient = db.relationship("User", foreign_keys=[patient_id])
    therapist = db.relationship("User", foreign_keys=[therapist_id])
    items = db.relationship("PlanExercise", back_populates="plan", cascade="all, delete-orphan", order_by="PlanExercise.position")


class PlanExercise(db.Model):
    __tablename__ = "plan_exercises"

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("rehabilitation_plans.id"), nullable=False, index=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id"), nullable=False, index=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("exercise_assignments.id"), nullable=False, unique=True)
    position = db.Column(db.Integer, nullable=False, default=0)
    sets = db.Column(db.Integer, nullable=False, default=3)
    reps = db.Column(db.Integer, nullable=False, default=10)
    rest_seconds = db.Column(db.Integer, nullable=False, default=30)
    days_per_week = db.Column(db.Integer, nullable=False, default=3)
    instructions = db.Column(db.Text, nullable=True)

    plan = db.relationship("RehabilitationPlan", back_populates="items")
    exercise = db.relationship("Exercise")
    assignment = db.relationship("ExerciseAssignment")
