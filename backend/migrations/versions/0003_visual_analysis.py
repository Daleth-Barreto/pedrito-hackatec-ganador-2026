"""Per-record visual consent and experimental segmentation results."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "visual_consents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("accepted", sa.Boolean(), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_visual_consents_record_id", "visual_consents", ["record_id"])
    op.create_table(
        "visual_analyses",
        sa.Column(
            "record_id",
            sa.String(36),
            sa.ForeignKey("records.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "consent_id",
            sa.String(36),
            sa.ForeignKey("visual_consents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("result", sa.JSON(), nullable=False),
    )


def downgrade():
    op.drop_table("visual_analyses")
    op.drop_table("visual_consents")
