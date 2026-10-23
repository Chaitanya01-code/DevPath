"""Add domains, domain selection, and separate admins.

Revision ID: 0002_domains_and_admins
Revises: 0001_create_users
Create Date: 2026-10-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_domains_and_admins"
down_revision: Union[str, None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DOMAIN_NAMES = (
    "Web Development",
    "Data Structures & Algorithms",
    "AI / Machine Learning",
    "Data Science",
    "Cybersecurity",
    "App Development",
    "DevOps & Cloud",
    "UI/UX Design",
    "Game Development",
    "Not decided yet",
)


def upgrade() -> None:
    op.create_table(
        "domains",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    domains_table = sa.table(
        "domains",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
        sa.column("description", sa.Text()),
        sa.column("is_active", sa.Boolean()),
        sa.column("display_order", sa.Integer()),
    )
    op.bulk_insert(
        domains_table,
        [
            {
                "id": index,
                "name": name,
                "slug": name.lower().replace(" & ", "-").replace(" / ", "-").replace("/", "-").replace(" ", "-").replace("&", ""),
                "description": "",
                "is_active": True,
                "display_order": index,
            }
            for index, name in enumerate(DOMAIN_NAMES, start=1)
        ],
    )
    op.execute(
        sa.text(
            "SELECT setval(pg_get_serial_sequence('domains', 'id'), "
            "(SELECT MAX(id) FROM domains))"
        )
    )

    op.alter_column("users", "full_name", new_column_name="name", existing_type=sa.String(120))
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_column("users", "role")
    op.add_column("users", sa.Column("domain_id", sa.Integer(), nullable=True))
    op.execute("UPDATE users SET domain_id = 10")
    op.alter_column(
        "users",
        "domain_id",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="10",
    )
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.create_foreign_key(
        "fk_users_domain_id_domains",
        "users",
        "domains",
        ["domain_id"],
        ["id"],
    )

    op.create_table(
        "admins",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(length=120), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_table(
        "roadmaps",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("domain_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("difficulty", sa.String(length=30), server_default="beginner", nullable=False),
        sa.Column("estimated_hours", sa.Float(), server_default="0", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_archived", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("domain_id", "slug", name="uq_roadmaps_domain_slug"),
    )
    op.create_index("ix_roadmaps_domain_id", "roadmaps", ["domain_id"])
    op.create_table(
        "roadmap_steps",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("roadmap_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("instructions", sa.Text(), server_default="", nullable=False),
        sa.Column("learning_objectives", sa.JSON(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["roadmap_id"], ["roadmaps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("roadmap_id", "position", name="uq_roadmap_steps_position"),
    )
    op.create_index("ix_roadmap_steps_roadmap_id", "roadmap_steps", ["roadmap_id"])
    op.create_table(
        "step_resources",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("step_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("resource_type", sa.String(length=30), nullable=False),
        sa.Column("is_recommended", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["step_id"], ["roadmap_steps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_step_resources_step_id", "step_resources", ["step_id"])
    op.create_table(
        "user_step_progress",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("step_id", sa.Integer(), nullable=False),
        sa.Column("is_completed", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["step_id"], ["roadmap_steps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "step_id", name="uq_user_step_progress_user_step"),
    )
    op.create_index("ix_user_step_progress_user_id", "user_step_progress", ["user_id"])
    op.create_index("ix_user_step_progress_step_id", "user_step_progress", ["step_id"])


def downgrade() -> None:
    op.drop_index("ix_user_step_progress_step_id", table_name="user_step_progress")
    op.drop_index("ix_user_step_progress_user_id", table_name="user_step_progress")
    op.drop_table("user_step_progress")
    op.drop_index("ix_step_resources_step_id", table_name="step_resources")
    op.drop_table("step_resources")
    op.drop_index("ix_roadmap_steps_roadmap_id", table_name="roadmap_steps")
    op.drop_table("roadmap_steps")
    op.drop_index("ix_roadmaps_domain_id", table_name="roadmaps")
    op.drop_table("roadmaps")
    op.drop_table("admins")
    op.drop_constraint("fk_users_domain_id_domains", "users", type_="foreignkey")
    op.drop_column("users", "domain_id")
    op.drop_column("users", "is_active")
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), server_default="student", nullable=False),
    )
    op.create_check_constraint("ck_users_role", "users", "role IN ('student', 'admin')")
    op.alter_column("users", "name", new_column_name="full_name", existing_type=sa.String(120))
    op.drop_table("domains")
