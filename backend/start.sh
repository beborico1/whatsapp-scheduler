#!/bin/bash

# Run migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

# Start the application
echo "Starting application..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}