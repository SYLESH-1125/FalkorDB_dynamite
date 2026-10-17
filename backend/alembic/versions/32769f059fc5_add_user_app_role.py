"""add user app_role

Revision ID: 32769f059fc5
Revises: 9b1f2a6c4e3d
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '32769f059fc5'
down_revision: Union[str, None] = '9b1f2a6c4e3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('app_role', sa.String(), nullable=False, server_default='domain-officer'))
    op.alter_column('users', 'app_role', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'app_role')
