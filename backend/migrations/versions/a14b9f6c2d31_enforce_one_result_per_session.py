"""Preserve duplicate submissions and enforce one result per session.

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
    results = sa.table(
        "session_results",
        sa.column("id", sa.Integer),
        sa.column("session_id", sa.Integer),
        sa.column("result_type", sa.String(length=100)),
        sa.column("result_data", sa.JSON),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    duplicate_sessions = connection.execute(
        sa.select(results.c.session_id)
        .group_by(results.c.session_id)
        .having(sa.func.count(results.c.id) > 1)
    ).scalars().all()

    for session_id in duplicate_sessions:
        rows = connection.execute(
            sa.select(
                results.c.id,
                results.c.result_type,
                results.c.result_data,
                results.c.created_at,
            )
            .where(results.c.session_id == session_id)
            .order_by(results.c.id.asc())
        ).mappings().all()
        canonical = rows[0]
        canonical_data = dict(canonical["result_data"] or {})
        previous_submissions = list(canonical_data.get("previous_submissions", []))

        for row in rows[1:]:
            previous_submissions.append({
                "id": row["id"],
                "type": row["result_type"],
                "data": row["result_data"],
                "created_at": row["created_at"].isoformat(),
            })

        canonical_data["previous_submissions"] = previous_submissions
        connection.execute(
            results.update()
            .where(results.c.id == canonical["id"])
            .values(result_data=canonical_data)
        )
        connection.execute(
            results.delete().where(
                results.c.id.in_([row["id"] for row in rows[1:]])
            )
        )

    with op.batch_alter_table("session_results") as batch_op:
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
