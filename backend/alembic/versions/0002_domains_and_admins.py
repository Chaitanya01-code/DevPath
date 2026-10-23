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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    domains_table = sa.table(
        "domains",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
    )
    op.bulk_insert(
        domains_table,
        [{"id": index, "name": name} for index, name in enumerate(DOMAIN_NAMES, start=1)],
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


def downgrade() -> None:
    op.drop_table("admins")
    op.drop_constraint("fk_users_domain_id_domains", "users", type_="foreignkey")
    op.drop_column("users", "domain_id")
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), server_default="student", nullable=False),
    )
    op.create_check_constraint("ck_users_role", "users", "role IN ('student', 'admin')")
    op.alter_column("users", "name", new_column_name="full_name", existing_type=sa.String(120))
    op.drop_table("domains")
