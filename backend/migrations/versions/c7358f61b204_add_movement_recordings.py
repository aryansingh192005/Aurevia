"""Add movement recordings for per-repetition pose sequences

Revision ID: c7358f61b204
Revises: c45576811ab9
Create Date: 2026-10-15
"""
from alembic import op
import sqlalchemy as sa


revision = "c7358f61b204"
down_revision = "c45576811ab9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "movement_recordings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("rep_index", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.JSON(), nullable=False),
        sa.Column("sequence_length", sa.Integer(), nullable=False),
        sa.Column("heuristic_label", sa.String(length=20), nullable=False),
        sa.Column("heuristic_confidence", sa.Float(), nullable=True),
        sa.Column("therapist_label", sa.String(length=20), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["exercise_id"], ["exercises.id"], name="fk_movement_recordings_exercise_id_exercises"
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"], ["users.id"], name="fk_movement_recordings_reviewed_by_id_users"
        ),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["rehabilitation_sessions.id"],
            name="fk_movement_recordings_session_id_rehabilitation_sessions",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_movement_recordings_exercise_id",
        "movement_recordings",
        ["exercise_id"],
        unique=False,
    )
    op.create_index(
        "ix_movement_recordings_session_id",
        "movement_recordings",
        ["session_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_movement_recordings_session_id", table_name="movement_recordings")
    op.drop_index("ix_movement_recordings_exercise_id", table_name="movement_recordings")
    op.drop_table("movement_recordings")
