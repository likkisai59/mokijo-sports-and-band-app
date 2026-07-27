"""add reviews foundation fields

Revision ID: 6a8201f92e31
Revises: 588015aee28d
Create Date: 2026-07-20 17:56:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '6a8201f92e31'
down_revision = '588015aee28d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('reviews', sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('reviews', sa.Column('reviewer_role', sa.String(length=50), nullable=True))
    op.add_column('reviews', sa.Column('reviewee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('reviews', sa.Column('reviewee_role', sa.String(length=50), nullable=True))
    op.add_column('reviews', sa.Column('review_title', sa.String(length=255), nullable=True))
    op.add_column('reviews', sa.Column('review_text', sa.Text(), nullable=True))
    op.add_column('reviews', sa.Column('is_public', sa.Boolean(), server_default='true', nullable=False))

    op.create_index(op.f('ix_reviews_reviewer_id'), 'reviews', ['reviewer_id'], unique=False)
    op.create_index(op.f('ix_reviews_reviewee_id'), 'reviews', ['reviewee_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_reviews_reviewee_id'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_reviewer_id'), table_name='reviews')

    op.drop_column('reviews', 'is_public')
    op.drop_column('reviews', 'review_text')
    op.drop_column('reviews', 'review_title')
    op.drop_column('reviews', 'reviewee_role')
    op.drop_column('reviews', 'reviewee_id')
    op.drop_column('reviews', 'reviewer_role')
    op.drop_column('reviews', 'reviewer_id')
