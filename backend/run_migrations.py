#!/usr/bin/env python3
"""
Standalone script to run Alembic migrations
"""
import os
import sys
from alembic import command
from alembic.config import Config

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_migrations():
    """Run pending database migrations"""
    try:
        # Create Alembic configuration
        alembic_cfg = Config("alembic.ini.example")
        
        # Set database URL from environment
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            # Convert postgres:// to postgresql:// for SQLAlchemy
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql://", 1)
            alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        else:
            print("ERROR: DATABASE_URL environment variable not set!")
            sys.exit(1)
        
        print(f"Running migrations against: {database_url.split('@')[1] if '@' in database_url else 'database'}")
        
        # Run migrations
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Migrations completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()