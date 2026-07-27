"""add review moderation tables and visibility status

Revision ID: 000d9e8851f0
Revises: 6a8201f92e31
Create Date: 2026-07-21 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '000d9e8851f0'
down_revision = '6a8201f92e31'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('reviews', sa.Column('moderation_status', sa.String(length=50), server_default='public', nullable=False))
    op.create_index(op.f('ix_reviews_moderation_status'), 'reviews', ['moderation_status'], unique=False)

    op.create_table(
        'review_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('reviews.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('reported_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('reason', sa.String(length=100), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=False, index=True),
        sa.Column('assigned_admin_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
    )

    op.create_table(
        'review_moderation_histories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('reviews.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('review_reports.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('action', sa.String(length=50), nullable=False, index=True),
        sa.Column('old_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('moderated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('moderator_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )


def downgrade():
    op.drop_table('review_moderation_histories')
    op.drop_table('review_reports')
    op.drop_index(op.f('ix_reviews_moderation_status'), table_name='reviews')
    op.drop_column('reviews', 'moderation_status')
