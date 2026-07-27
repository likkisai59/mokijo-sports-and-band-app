"""add_auth_identity_fields

Adds:
  - artist_profiles.username  — unique, nullable, indexed public handle (3-30 chars, lowercase)
  - venues.venue_number       — unique, system-generated BCV-XXXXXX identifier backed by a
                                PostgreSQL sequence (venue_number_seq starting at 100001).
                                Existing rows are backfilled before the NOT NULL constraint
                                is enforced.

Revision ID: 9f956581e2de
Revises: 480018cab2a6
Create Date: 2026-07-15 15:08:21.498483
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f956581e2de'
down_revision: Union[str, None] = '480018cab2a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Artist username ────────────────────────────────────────────────────
    op.add_column(
        'artist_profiles',
        sa.Column('username', sa.String(length=30), nullable=True)
    )
    op.create_index(
        op.f('ix_artist_profiles_username'),
        'artist_profiles',
        ['username'],
        unique=True
    )

    # ── 2. Venue number sequence + column ─────────────────────────────────────
    # Create the sequence first so backfill can call nextval().
    # IF NOT EXISTS guards against re-runs on partial upgrades.
    op.execute("CREATE SEQUENCE IF NOT EXISTS venue_number_seq START WITH 100001 INCREMENT BY 1 NO CYCLE")

    # Add the column as nullable so existing rows are not rejected immediately.
    op.add_column(
        'venues',
        sa.Column('venue_number', sa.String(length=50), nullable=True)
    )

    # Backfill all existing venues that have no venue_number yet.
    op.execute(
        """
        UPDATE venues
        SET venue_number = 'BCV-' || lpad(nextval('venue_number_seq')::text, 6, '0')
        WHERE venue_number IS NULL
        """
    )

    # Now add the unique index.
    op.create_index(
        op.f('ix_venues_venue_number'),
        'venues',
        ['venue_number'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_venues_venue_number'), table_name='venues')
    op.drop_column('venues', 'venue_number')
    op.execute("DROP SEQUENCE IF EXISTS venue_number_seq")

    op.drop_index(op.f('ix_artist_profiles_username'), table_name='artist_profiles')
    op.drop_column('artist_profiles', 'username')
