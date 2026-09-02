"""Add user roles

Revision ID: a257861e9f06
Revises: f63de1f0af26
Create Date: 2026-09-01 10:04:35.662887

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a257861e9f06"
down_revision = "f63de1f0af26"
branch_labels = None
depends_on = None


def upgrade():
    # Add the column with a temporary server-side default so
    # existing users receive the patient role.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "role",
                sa.String(length=20),
                nullable=False,
                server_default="patient",
            )
        )

    # Remove the database-level default after existing rows
    # have been populated. New users are handled by the model.
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "role",
            server_default=None,
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("role")