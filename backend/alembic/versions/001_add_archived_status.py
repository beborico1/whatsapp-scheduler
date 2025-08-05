"""Add archived status to scheduled messages

Revision ID: 001
Revises: 
Create Date: 2024-08-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add archived status to scheduled_messages
    # Since the status column already exists and just needs to accept 'archived' as a value,
    # we don't need to alter the column structure (it's already VARCHAR(50))
    # But we should update any check constraints if they exist
    
    # First, let's check if there's a check constraint and drop it if exists
    op.execute("""
        DO $$ 
        BEGIN
            ALTER TABLE scheduled_messages 
            DROP CONSTRAINT IF EXISTS scheduled_messages_status_check;
        EXCEPTION
            WHEN undefined_object THEN
                NULL;
        END $$;
    """)
    
    # Add a new check constraint that includes 'archived'
    op.execute("""
        ALTER TABLE scheduled_messages 
        ADD CONSTRAINT scheduled_messages_status_check 
        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'archived'))
    """)


def downgrade():
    # Remove the check constraint
    op.execute("""
        ALTER TABLE scheduled_messages 
        DROP CONSTRAINT IF EXISTS scheduled_messages_status_check
    """)
    
    # Add back the old check constraint without 'archived'
    op.execute("""
        ALTER TABLE scheduled_messages 
        ADD CONSTRAINT scheduled_messages_status_check 
        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
    """)
    
    # Update any archived messages to cancelled
    op.execute("""
        UPDATE scheduled_messages 
        SET status = 'cancelled' 
        WHERE status = 'archived'
    """)