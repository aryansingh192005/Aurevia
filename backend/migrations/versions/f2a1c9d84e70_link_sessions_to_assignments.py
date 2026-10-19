"""Link sessions to the specific therapist assignment that created them.

Revision ID: f2a1c9d84e70
Revises: c7358f61b204
Create Date: 2026-10-19
"""

from alembic import op
import sqlalchemy as sa


revision = "f2a1c9d84e70"
down_revision = "c7358f61b204"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rehabilitation_sessions") as batch_op:
        batch_op.add_column(sa.Column("assignment_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_rehabilitation_sessions_assignment_id",
            "exercise_assignments",
            ["assignment_id"],
            ["id"],
        )
        batch_op.create_index(
            "ix_rehabilitation_sessions_assignment_id",
            ["assignment_id"],
            unique=False,
        )

    connection = op.get_bind()
    sessions = sa.table(
        "rehabilitation_sessions",
        sa.column("id", sa.Integer),
        sa.column("user_id", sa.Integer),
        sa.column("exercise_id", sa.Integer),
        sa.column("assignment_id", sa.Integer),
    )
    assignments = sa.table(
        "exercise_assignments",
        sa.column("id", sa.Integer),
        sa.column("patient_id", sa.Integer),
        sa.column("exercise_id", sa.Integer),
    )

    pending_sessions = connection.execute(
        sa.select(sessions.c.id, sessions.c.user_id, sessions.c.exercise_id)
        .where(sessions.c.assignment_id.is_(None))
    ).all()

    for session_id, patient_id, exercise_id in pending_sessions:
        assignment_id = connection.execute(
            sa.select(assignments.c.id)
            .where(
                assignments.c.patient_id == patient_id,
                assignments.c.exercise_id == exercise_id,
            )
            .order_by(assignments.c.id.asc())
            .limit(1)
        ).scalar_one_or_none()

        if assignment_id is not None:
            connection.execute(
                sessions.update()
                .where(sessions.c.id == session_id)
                .values(assignment_id=assignment_id)
            )


def downgrade():
    with op.batch_alter_table("rehabilitation_sessions") as batch_op:
        batch_op.drop_index("ix_rehabilitation_sessions_assignment_id")
        batch_op.drop_constraint(
            "fk_rehabilitation_sessions_assignment_id",
            type_="foreignkey",
        )
        batch_op.drop_column("assignment_id")
