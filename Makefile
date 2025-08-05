# WhatsApp Scheduler Makefile
# Common Docker and development tasks

.PHONY: help up down logs restart clean build shell test lint format setup dev prod status backup restore

# Default target
.DEFAULT_GOAL := help

# Colors
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Docker Compose command detection
DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null || echo "docker compose")

help: ## Show this help message
	@echo "$(GREEN)WhatsApp Scheduler - Make Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make setup      # First time setup"
	@echo "  make dev        # Start in development mode"
	@echo "  make logs       # View all logs"
	@echo "  make shell service=backend  # Open shell in backend container"

setup: ## Initial setup with Docker
	@echo "$(GREEN)Setting up WhatsApp Scheduler...$(NC)"
	@./docker-setup.sh

up: ## Start all services
	@echo "$(GREEN)Starting services...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services started! Access the app at http://localhost:3000$(NC)"

down: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	@$(DOCKER_COMPOSE) down

logs: ## View logs (use service=NAME to filter)
ifdef service
	@$(DOCKER_COMPOSE) logs -f $(service)
else
	@$(DOCKER_COMPOSE) logs -f
endif

restart: ## Restart services (use service=NAME to restart specific service)
ifdef service
	@echo "$(YELLOW)Restarting $(service)...$(NC)"
	@$(DOCKER_COMPOSE) restart $(service)
else
	@echo "$(YELLOW)Restarting all services...$(NC)"
	@$(DOCKER_COMPOSE) restart
endif

clean: ## Clean up containers, volumes, and images
	@echo "$(RED)Cleaning up Docker resources...$(NC)"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)Cleanup complete!$(NC)"

build: ## Build or rebuild services
	@echo "$(GREEN)Building services...$(NC)"
	@COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 $(DOCKER_COMPOSE) build --parallel

shell: ## Open shell in a service (use service=NAME, default: backend)
	@$(DOCKER_COMPOSE) exec $(or $(service),backend) bash

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	@$(DOCKER_COMPOSE) exec backend pytest

lint: ## Run linters
	@echo "$(GREEN)Running linters...$(NC)"
	@$(DOCKER_COMPOSE) exec backend ruff check .
	@$(DOCKER_COMPOSE) exec frontend npm run lint

format: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	@$(DOCKER_COMPOSE) exec backend ruff format .
	@$(DOCKER_COMPOSE) exec frontend npm run format

dev: ## Start in development mode with hot reload
	@echo "$(GREEN)Starting in development mode...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Development server started!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

dev-tools: ## Start with development tools (Adminer, Redis Commander, etc.)
	@echo "$(GREEN)Starting with development tools...$(NC)"
	@COMPOSE_PROFILES=dev-tools $(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Development tools started!$(NC)"
	@echo "  Adminer:         http://localhost:8080"
	@echo "  Redis Commander: http://localhost:8081"
	@echo "  MailHog:         http://localhost:8025"

prod: ## Start in production mode
	@echo "$(GREEN)Starting in production mode...$(NC)"
	@$(DOCKER_COMPOSE) -f docker-compose.yml up -d

status: ## Show status of all services
	@echo "$(GREEN)Service Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

ps: status ## Alias for status

migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	@$(DOCKER_COMPOSE) exec backend alembic upgrade head

migrate-create: ## Create a new migration (use name=MIGRATION_NAME)
ifndef name
	@echo "$(RED)Please provide a migration name: make migrate-create name=your_migration_name$(NC)"
else
	@echo "$(GREEN)Creating migration: $(name)$(NC)"
	@$(DOCKER_COMPOSE) exec backend alembic revision --autogenerate -m "$(name)"
endif

db-shell: ## Open PostgreSQL shell
	@$(DOCKER_COMPOSE) exec postgres psql -U user -d whatsapp_scheduler

redis-cli: ## Open Redis CLI
	@$(DOCKER_COMPOSE) exec redis redis-cli

backup: ## Backup database
	@echo "$(GREEN)Backing up database...$(NC)"
	@mkdir -p backups
	@$(DOCKER_COMPOSE) exec -T postgres pg_dump -U user whatsapp_scheduler | gzip > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)Backup saved to backups/$(NC)"

restore: ## Restore database from backup (use file=BACKUP_FILE)
ifndef file
	@echo "$(RED)Please provide a backup file: make restore file=backups/backup_YYYYMMDD_HHMMSS.sql.gz$(NC)"
else
	@echo "$(YELLOW)Restoring database from $(file)...$(NC)"
	@gunzip -c $(file) | $(DOCKER_COMPOSE) exec -T postgres psql -U user -d whatsapp_scheduler
	@echo "$(GREEN)Database restored!$(NC)"
endif

logs-backend: ## View backend logs
	@$(DOCKER_COMPOSE) logs -f backend

logs-worker: ## View Celery worker logs
	@$(DOCKER_COMPOSE) logs -f celery_worker

logs-beat: ## View Celery beat logs
	@$(DOCKER_COMPOSE) logs -f celery_beat

logs-frontend: ## View frontend logs
	@$(DOCKER_COMPOSE) logs -f frontend

install-deps: ## Install/update dependencies
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	@$(DOCKER_COMPOSE) exec backend pip install -r requirements.txt
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	@$(DOCKER_COMPOSE) exec frontend npm install

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(GREEN)API Health:$(NC)"
	@curl -s http://localhost:8000/health | jq . || echo "$(RED)API not responding$(NC)"

quick-start: setup dev ## Quick start for first-time users

rebuild: ## Rebuild and restart services
	@echo "$(YELLOW)Rebuilding services...$(NC)"
	@$(DOCKER_COMPOSE) down
	@$(DOCKER_COMPOSE) build --no-cache
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services rebuilt and started!$(NC)"

# Advanced targets for specific use cases
debug-backend: ## Start backend with debugger support
	@$(DOCKER_COMPOSE) run --rm -p 8000:8000 -p 5678:5678 backend python -m debugpy --listen 0.0.0.0:5678 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

exec: ## Execute command in service (use service=NAME cmd=COMMAND)
ifndef cmd
	@echo "$(RED)Please provide a command: make exec service=backend cmd='your command'$(NC)"
else
	@$(DOCKER_COMPOSE) exec $(or $(service),backend) $(cmd)
endif

pull: ## Pull latest images
	@echo "$(GREEN)Pulling latest images...$(NC)"
	@$(DOCKER_COMPOSE) pull

push: ## Push images to registry (configure registry first)
	@echo "$(GREEN)Pushing images...$(NC)"
	@$(DOCKER_COMPOSE) push