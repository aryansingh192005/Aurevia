"""Ensure each rehabilitation session has at most one result.

Revision ID: a14b9f6c2d31
Revises: e71f4a2c9b10
Create Date: 2026-10-19
"""

from alembic import op
import sqlalchemy as sa


revision = "a14b9f6c2d31"
down_revision = "e71f4a2c9b10"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    duplicate = connection.execute(sa.text(
        "SELECT session_id, COUNT(*) AS result_count "
        "FROM session_results GROUP BY session_id "
        "HAVING COUNT(*) > 1 LIMIT 1"
    )).first()
    if duplicate:
        raise RuntimeError(
            "Cannot enforce one result per session: session "
            f"{duplicate.session_id} already has {duplicate.result_count} results. "
            "Review and reconcile duplicate results before retrying this migration."
        )

    with op.batch_alter_table("session_results") as batch_op:
        batch_op.drop_index("ix_session_results_session_id")
        batch_op.create_unique_constraint(
            "uq_session_results_session_id",
            ["session_id"],
        )


def downgrade():
    with op.batch_alter_table("session_results") as batch_op:
        batch_op.drop_constraint(
            "uq_session_results_session_id",
            type_="unique",
        )
        batch_op.create_index(
            "ix_session_results_session_id",
            ["session_id"],
            unique=False,
        )
