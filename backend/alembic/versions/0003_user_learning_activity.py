"""Persist immutable lesson-completion activity events.

Revision ID: 0003_user_learning_activity
Revises: 0002_domains_and_admins
Create Date: 2026-10-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_user_learning_activity"
down_revision: Union[str, None] = "0002_domains_and_admins"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_learning_activity",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("step_id", sa.Integer(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["step_id"], ["roadmap_steps.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "step_id", "occurred_at", name="uq_learning_activity_user_step_time"),
    )
    op.create_index("ix_user_learning_activity_user_id", "user_learning_activity", ["user_id"])
    op.create_index("ix_user_learning_activity_step_id", "user_learning_activity", ["step_id"])
    op.create_index("ix_user_learning_activity_occurred_at", "user_learning_activity", ["occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_user_learning_activity_occurred_at", table_name="user_learning_activity")
    op.drop_index("ix_user_learning_activity_step_id", table_name="user_learning_activity")
    op.drop_index("ix_user_learning_activity_user_id", table_name="user_learning_activity")
    op.drop_table("user_learning_activity")
