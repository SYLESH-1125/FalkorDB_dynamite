"""add report documents and sharing

Revision ID: 6c8e1f4a9b2d
Revises: 4b3f9e2c1a7d
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6c8e1f4a9b2d'
down_revision: Union[str, None] = '4b3f9e2c1a7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('report_templates', sa.Column('file_key', sa.String(), nullable=True))
    op.add_column('report_templates', sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('report_templates', 'file_size_bytes', server_default=None)

    op.add_column('reports', sa.Column('share_token', sa.String(), nullable=True))
    op.add_column('reports', sa.Column('share_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint('uq_reports_share_token', 'reports', ['share_token'])

    op.create_table(
        'report_documents',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('report_id', sa.String(), sa.ForeignKey('reports.id'), nullable=False, unique=True),
        sa.Column('prompt', sa.String(), nullable=False, server_default=''),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('report_documents')
    op.drop_constraint('uq_reports_share_token', 'reports', type_='unique')
    op.drop_column('reports', 'share_expires_at')
    op.drop_column('reports', 'share_token')
    op.drop_column('report_templates', 'file_size_bytes')
    op.drop_column('report_templates', 'file_key')
