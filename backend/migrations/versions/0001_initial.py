"""Initial schema for consent, private records and review."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "assignments",
        sa.Column("clinician_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
    )
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])
    op.create_table(
        "consents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_consents_patient_id", "consents", ["patient_id"])
    op.create_table(
        "records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("consent_id", sa.String(36), sa.ForeignKey("consents.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("questionnaire", sa.JSON(), nullable=False),
        sa.Column("image_key", sa.String(40), nullable=False),
        sa.Column("image_metadata", sa.JSON(), nullable=False),
        sa.Column("inference", sa.JSON(), nullable=False),
        sa.Column("priority", sa.String(16), nullable=True),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("rules_version", sa.String(20), nullable=False),
    )
    for field in ["patient_id", "created_at", "expires_at", "priority"]:
        op.create_index(f"ix_records_{field}", "records", [field])
    op.create_table(
        "reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("clinician_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("assessment", sa.String(30), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
    )


def downgrade():
    for table in ["reviews", "records", "consents", "sessions", "assignments", "users"]:
        op.drop_table(table)
