#!/bin/bash

# Copy alembic.ini.example to alembic.ini if it doesn't exist
if [ ! -f "alembic.ini" ] && [ -f "alembic.ini.example" ]; then
    cp alembic.ini.example alembic.ini
fi

# Run migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

# Start the application
echo "Starting application..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}