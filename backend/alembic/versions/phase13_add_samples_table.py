"""Add samples table and sample_id to variants

Revision ID: phase13_samples
Revises: 851eb49e4f84
Create Date: 2026-02-28
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "phase13_samples"
down_revision = "851eb49e4f84"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create samples table (if not already created by init_db)
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT FROM information_schema.tables "
            "WHERE table_name = 'samples')"
        )
    )
    samples_exists = result.scalar()

    if not samples_exists:
        op.create_table(
            "samples",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("filename", sa.String(500), nullable=False),
            sa.Column("relationship_type", sa.String(50), nullable=True),
            sa.Column("upload_id", sa.String(100), nullable=False, index=True),
            sa.Column(
                "created_at",
                sa.DateTime,
                nullable=False,
                server_default=sa.func.now(),
            ),
        )

    # Add sample_id column to variants if not exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT FROM information_schema.columns "
            "WHERE table_name = 'variants' AND column_name = 'sample_id')"
        )
    )
    sample_id_exists = result.scalar()

    if not sample_id_exists:
        op.add_column(
            "variants",
            sa.Column(
                "sample_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("samples.id", ondelete="CASCADE"),
                nullable=True,
            ),
        )
        op.create_index("ix_variants_sample_id", "variants", ["sample_id"])

    # Drop old unique constraint on normalized_variant if it exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT FROM pg_indexes "
            "WHERE indexname = 'ix_variants_normalized_variant' "
            "AND tablename = 'variants')"
        )
    )
    old_unique_exists = result.scalar()

    if old_unique_exists:
        op.drop_index("ix_variants_normalized_variant", table_name="variants")
        op.create_index(
            "ix_variants_normalized_variant",
            "variants",
            ["normalized_variant"],
            unique=False,
        )

    # Add new composite unique constraint if not exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT FROM pg_constraint "
            "WHERE conname = 'uq_variant_sample')"
        )
    )
    new_unique_exists = result.scalar()

    if not new_unique_exists:
        op.create_unique_constraint(
            "uq_variant_sample", "variants", ["normalized_variant", "sample_id"]
        )


def downgrade() -> None:
    op.drop_constraint("uq_variant_sample", "variants", type_="unique")
    op.drop_index("ix_variants_sample_id", table_name="variants")
    op.drop_column("variants", "sample_id")
    op.drop_index("ix_variants_normalized_variant", table_name="variants")
    op.create_index(
        "ix_variants_normalized_variant",
        "variants",
        ["normalized_variant"],
        unique=True,
    )
    op.drop_table("samples")
