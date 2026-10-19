"""Add care plans, consent, and therapist session feedback.

Revision ID: e71f4a2c9b10
Revises: f2a1c9d84e70
"""
from alembic import op
import sqlalchemy as sa

revision = "e71f4a2c9b10"
down_revision = "f2a1c9d84e70"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rehabilitation_sessions") as batch_op:
        batch_op.add_column(sa.Column("movement_recording_consent", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.create_table(
        "rehabilitation_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("therapist_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=140), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("days_per_week", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["therapist_id"], ["users.id"]),
    )
    op.create_index("ix_rehabilitation_plans_patient_id", "rehabilitation_plans", ["patient_id"])
    op.create_index("ix_rehabilitation_plans_therapist_id", "rehabilitation_plans", ["therapist_id"])

    op.create_table(
        "plan_exercises",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sets", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("reps", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("rest_seconds", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("days_per_week", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["plan_id"], ["rehabilitation_plans.id"]),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
        sa.ForeignKeyConstraint(["assignment_id"], ["exercise_assignments.id"]),
        sa.UniqueConstraint("assignment_id"),
    )
    op.create_index("ix_plan_exercises_plan_id", "plan_exercises", ["plan_id"])
    op.create_index("ix_plan_exercises_exercise_id", "plan_exercises", ["exercise_id"])

    op.create_table(
        "session_feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("therapist_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["rehabilitation_sessions.id"]),
        sa.ForeignKeyConstraint(["therapist_id"], ["users.id"]),
    )
    op.create_index("ix_session_feedback_session_id", "session_feedback", ["session_id"])
    op.create_index("ix_session_feedback_therapist_id", "session_feedback", ["therapist_id"])


def downgrade():
    op.drop_table("session_feedback")
    op.drop_table("plan_exercises")
    op.drop_table("rehabilitation_plans")
    with op.batch_alter_table("rehabilitation_sessions") as batch_op:
        batch_op.drop_column("movement_recording_consent")
