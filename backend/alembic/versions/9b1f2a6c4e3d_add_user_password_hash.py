"""add user password hash

Revision ID: 9b1f2a6c4e3d
Revises: 80ca58652c75
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '9b1f2a6c4e3d'
down_revision: Union[str, None] = '80ca58652c75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=False, server_default=''))
    op.alter_column('users', 'password_hash', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'password_hash')
