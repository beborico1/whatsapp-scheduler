# WhatsApp Scheduler - Complete Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Docker)](#quick-start-docker)
4. [Manual Setup](#manual-setup)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Docker Commands Reference](#docker-commands-reference)
7. [Development Tips](#development-tips)
8. [Project Structure](#project-structure)

## Overview

WhatsApp Scheduler is a full-stack application for scheduling and automating WhatsApp messages. It consists of:
- **Backend**: FastAPI (Python) with PostgreSQL database and Redis for task queuing
- **Frontend**: React with TypeScript
- **Task Queue**: Celery with Redis for scheduled message processing

## Prerequisites

### For Docker Setup (Recommended)
- **Docker Desktop** (includes Docker and Docker Compose)
- **Git**
- **2GB free RAM**
- **10GB free disk space**

### For Manual Setup
- **Python 3.11** (Python 3.13 has compatibility issues)
- **Node.js** (v16 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v7 or higher)
- **Git**

## Quick Start (Docker)

### The 2-Minute Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd whatsapp-scheduler
```

2. **Run the setup script**
```bash
./docker-setup.sh
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Alternative: Using Make

```bash
make setup    # First time setup
make dev      # Start in development mode
make help     # Show all available commands
```

### Alternative: Direct Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Manual Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd whatsapp-scheduler
```

### Step 2: Install System Dependencies

#### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Redis
brew install redis
brew services start redis

# Install Python 3.11
brew install python@3.11
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install Redis
sudo apt install redis-server
sudo systemctl start redis

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3.11-dev
```

### Step 3: Database Setup
```bash
# Create database
createdb -U $USER whatsapp_scheduler
```

### Step 4: Backend Setup
```bash
cd backend

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment files
cp .env.example .env
cp alembic.ini.example alembic.ini

# Edit .env file with your database credentials
# Make sure to update WHATSAPP_* variables with your API credentials
```

### Step 5: Initialize Database
```bash
# Run migrations
alembic upgrade head

# Or create tables directly if migrations fail
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

### Step 6: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Build production version
npm run build
```

### Step 7: Start All Services

You'll need 4 terminal windows:

**Terminal 1 - Backend API**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Celery Worker**
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info
```

**Terminal 3 - Celery Beat**
```bash
cd backend
source venv/bin/activate
celery -A app.celery_app beat --loglevel=info
```

**Terminal 4 - Frontend**
```bash
cd frontend
npm run dev
```

## Common Issues & Solutions

### Docker Issues

#### Build Timeout
**Problem**: Docker build takes forever or times out
**Solutions**:
- Use pre-built images: `docker-compose pull`
- Enable BuildKit: `export COMPOSE_DOCKER_CLI_BUILD=1`
- For Apple Silicon: Ensure Rosetta is enabled in Docker Desktop

#### Port Conflicts
**Problem**: "Port already in use"
**Solution**:
```bash
# Find what's using the port
lsof -i :8000  # or :3000, :5432, :6379

# Change ports in docker-compose.yml or stop the conflicting service
```

#### Docker Daemon Not Running
**Problem**: Cannot connect to Docker daemon
**Solution**: Start Docker Desktop or run `sudo systemctl start docker` on Linux

### Manual Setup Issues

#### Python Version Issues
**Problem**: Package installation fails with Python 3.13
**Solution**: Use Python 3.11 specifically:
```bash
python3.11 -m venv venv
source venv/bin/activate
```

#### PostgreSQL Connection Failed
**Problem**: Cannot connect to database
**Solution**:
```bash
# Create the database
createdb -U $USER whatsapp_scheduler

# Check PostgreSQL is running
pg_isready
```

#### Missing pg_config
**Problem**: pg_config executable not found
**Solution**:
```bash
# macOS
brew install postgresql

# Linux
sudo apt install libpq-dev
```

## Docker Commands Reference

### Basic Commands
```bash
# Start all services
make up
# or
docker-compose up -d

# Stop all services
make down
# or
docker-compose down

# View logs
make logs
# or
docker-compose logs -f

# Restart a service
make restart service=backend
# or
docker-compose restart backend
```

### Development Commands
```bash
# Start with development tools (Adminer, Redis Commander)
make dev-tools
# or
docker-compose --profile dev-tools up -d

# Open shell in container
make shell service=backend
# or
docker-compose exec backend bash

# Run tests
make test

# Run linters
make lint

# Format code
make format
```

### Database Commands
```bash
# Run migrations
make migrate
# or
docker-compose exec backend alembic upgrade head

# Create new migration
make migrate-create name="add_new_field"

# Open PostgreSQL shell
make db-shell
# or
docker-compose exec postgres psql -U user -d whatsapp_scheduler

# Backup database
make backup

# Restore database
make restore file=backups/backup_20240101_120000.sql.gz
```

### Troubleshooting Commands
```bash
# Check service health
make health

# View service status
make status

# Clean everything (including volumes)
make clean

# Rebuild services
make rebuild
```

## Development Tips

### 1. Use Docker Compose Override
The `docker-compose.override.yml` file automatically applies development settings:
- Hot reload enabled
- Debug logging
- Development tools available

### 2. Environment Variables
Create a `.env` file in the backend directory:
```env
# For Docker, use service names as hosts
DATABASE_URL=postgresql://user:password@postgres/whatsapp_scheduler
REDIS_URL=redis://redis:6379/0

# Your WhatsApp API credentials
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_APP_ID=your-app-id
# ... other variables
```

### 3. Development Tools
When running with `--dev-tools` or `make dev-tools`:
- **Adminer** (Database UI): http://localhost:8080
- **Redis Commander**: http://localhost:8081
- **MailHog** (Email testing): http://localhost:8025

### 4. Quick Iteration
```bash
# Make changes to backend code
# The backend auto-reloads with changes

# Make changes to frontend code
# The frontend auto-reloads with changes

# If you change dependencies:
make install-deps
```

### 5. Using VS Code
The project works great with VS Code Dev Containers:
1. Install the "Dev Containers" extension
2. Open the project in VS Code
3. Click "Reopen in Container" when prompted

## Project Structure

```
whatsapp-scheduler/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── tasks/        # Celery tasks
│   ├── alembic/          # Database migrations
│   ├── main.py           # FastAPI app entry point
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # Backend container definition
│   └── .dockerignore     # Files to exclude from Docker
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   └── App.tsx       # Main React app
│   ├── package.json      # Node dependencies
│   ├── Dockerfile        # Frontend container definition
│   └── .dockerignore     # Files to exclude from Docker
├── docker-compose.yml    # Main Docker configuration
├── docker-compose.override.yml  # Development overrides
├── docker-setup.sh       # One-click setup script
├── Makefile             # Common commands
└── docs/
    ├── SETUP_GUIDE.md   # This file
    └── TECH_DIVE.md     # Technical documentation
```

## Best Practices

### 1. Always Use .env Files
Never commit sensitive data. Use `.env` files and keep them in `.gitignore`.

### 2. Regular Backups
```bash
# Backup your database regularly
make backup

# Backups are stored in ./backups/
```

### 3. Monitor Resources
```bash
# Check Docker resource usage
docker stats

# Check logs for errors
make logs | grep ERROR
```

### 4. Development Workflow
1. Use `make dev` for development
2. Make changes (hot reload works automatically)
3. Run `make test` before committing
4. Use `make lint` to check code style
5. Run `make format` to fix formatting

### 5. Production Deployment
For production, use:
```bash
# Start in production mode
make prod

# Or with docker-compose
docker-compose -f docker-compose.yml up -d
```

## Conclusion

The Docker setup makes running WhatsApp Scheduler much easier:

**Quick Start**: Just run `./docker-setup.sh` or `make setup`

**Benefits**:
- No need to install PostgreSQL, Redis, or Python locally
- Consistent environment across all machines
- Easy cleanup with `docker-compose down -v`
- Development tools included

**Tips**:
- Use the Makefile for common tasks
- Check `make help` for all available commands
- Use `docker-compose logs -f` to debug issues
- The setup script handles everything automatically

For any issues, check the logs first:
```bash
docker-compose logs -f [service-name]
```

Happy scheduling!