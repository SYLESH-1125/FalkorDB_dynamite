"""add chat thread kind

Revision ID: 4b3f9e2c1a7d
Revises: 32769f059fc5
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4b3f9e2c1a7d'
down_revision: Union[str, None] = '32769f059fc5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('chat_threads', sa.Column('kind', sa.String(), nullable=False, server_default='query'))
    op.alter_column('chat_threads', 'kind', server_default=None)


def downgrade() -> None:
    op.drop_column('chat_threads', 'kind')
