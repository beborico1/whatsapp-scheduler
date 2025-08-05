#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ASCII Art Header
echo -e "${GREEN}"
cat << "EOF"
 _       ____          __       ___                    ____      __             __      __         
| |     / / /_  ____ _/ /______/   |  ____  ____     / __/_____/ /_  ___  ____/ /_  __/ /__  _____
| | /| / / __ \/ __ `/ __/ ___/ /| | / __ \/ __ \   / /_/ ___/ __ \/ _ \/ __  / / / / / _ \/ ___/
| |/ |/ / / / / /_/ / /_(__  ) ___ |/ /_/ / /_/ /  / __/ /__/ / / /  __/ /_/ / /_/ / /  __/ /    
|__/|__/_/ /_/\__,_/\__/____/_/  |_/ .___/ .___/  /_/ /____/_/ /_/\___/\__,_/\__,_/_/\___/_/     
                                  /_/   /_/                                                        

EOF
echo -e "${NC}"

print_info "Starting WhatsApp Scheduler Docker Setup..."

# Check if Docker is installed and running
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is installed and running"
    
    # Check docker-compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    print_info "Using compose command: $COMPOSE_CMD"
}

# Create .env file if it doesn't exist
setup_env() {
    print_info "Setting up environment variables..."
    
    if [ ! -f "backend/.env" ]; then
        print_warning ".env file not found. Creating from template..."
        
        cat > backend/.env << EOL
DATABASE_URL=postgresql://user:password@postgres/whatsapp_scheduler
REDIS_URL=redis://redis:6379/0
SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || echo "your-secret-key-here")

# WhatsApp API Credentials (Replace with your actual credentials)
WHATSAPP_ACCESS_TOKEN=test-access-token
WHATSAPP_APP_ID=test-app-id
WHATSAPP_APP_SECRET=test-app-secret
WHATSAPP_PHONE_NUMBER_ID=test-phone-number-id
WHATSAPP_VERIFY_TOKEN=test-verify-token
WHATSAPP_API_VERSION=v22.0
EOL
        
        print_success ".env file created"
        print_warning "Please update the WhatsApp API credentials in backend/.env"
    else
        print_success ".env file already exists"
    fi
}

# Clean up existing containers and volumes
cleanup() {
    print_info "Cleaning up existing containers..."
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    
    # Ask if user wants to remove volumes
    read -p "Do you want to remove existing data volumes? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $COMPOSE_CMD down -v
        print_success "Volumes removed"
    fi
}

# Pull or build images
prepare_images() {
    print_info "Preparing Docker images..."
    
    # Pull base images in parallel for faster setup
    print_info "Pulling base images..."
    docker pull postgres:15-alpine &
    docker pull redis:7-alpine &
    docker pull python:3.11-slim &
    docker pull node:18-alpine &
    wait
    
    print_success "Base images pulled"
    
    # Build application images
    print_info "Building application images..."
    COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 $COMPOSE_CMD build --parallel
    
    print_success "Application images built"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    # Start infrastructure services first
    print_info "Starting PostgreSQL and Redis..."
    $COMPOSE_CMD up -d postgres redis
    
    # Wait for them to be healthy
    print_info "Waiting for databases to be ready..."
    sleep 5
    
    timeout=30
    while [ $timeout -gt 0 ]; do
        if $COMPOSE_CMD exec -T postgres pg_isready -U user -d whatsapp_scheduler &>/dev/null && \
           $COMPOSE_CMD exec -T redis redis-cli ping &>/dev/null; then
            print_success "Databases are ready"
            break
        fi
        timeout=$((timeout - 1))
        sleep 1
    done
    
    if [ $timeout -eq 0 ]; then
        print_error "Databases failed to start"
        exit 1
    fi
    
    # Start all services
    print_info "Starting all services..."
    $COMPOSE_CMD up -d
    
    print_success "All services started"
}

# Check service health
check_health() {
    print_info "Checking service health..."
    
    # Wait a bit for services to fully start
    sleep 10
    
    # Check each service
    services=("postgres" "redis" "backend" "celery_worker" "celery_beat" "frontend")
    all_healthy=true
    
    for service in "${services[@]}"; do
        if $COMPOSE_CMD ps | grep -q "${service}.*Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            all_healthy=false
        fi
    done
    
    # Check API endpoint
    if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API is not responding yet (might still be starting)"
        all_healthy=false
    fi
    
    return $([ "$all_healthy" = true ] && echo 0 || echo 1)
}

# Show access information
show_info() {
    echo
    print_success "WhatsApp Scheduler is running!"
    echo
    echo -e "${GREEN}Access URLs:${NC}"
    echo -e "  ${BLUE}Frontend:${NC}          http://localhost:3000"
    echo -e "  ${BLUE}Backend API:${NC}       http://localhost:8000"
    echo -e "  ${BLUE}API Documentation:${NC} http://localhost:8000/docs"
    echo
    echo -e "${GREEN}Development Tools:${NC}"
    echo -e "  ${BLUE}Database Admin:${NC}    http://localhost:8080 (run with --dev-tools)"
    echo -e "  ${BLUE}Redis Commander:${NC}   http://localhost:8081 (run with --dev-tools)"
    echo -e "  ${BLUE}Mail Testing:${NC}      http://localhost:8025 (run with --dev-tools)"
    echo
    echo -e "${GREEN}Useful Commands:${NC}"
    echo -e "  ${BLUE}View logs:${NC}         $COMPOSE_CMD logs -f [service]"
    echo -e "  ${BLUE}Stop services:${NC}     $COMPOSE_CMD down"
    echo -e "  ${BLUE}Restart service:${NC}   $COMPOSE_CMD restart [service]"
    echo -e "  ${BLUE}Shell access:${NC}      $COMPOSE_CMD exec [service] bash"
    echo
}

# Main execution
main() {
    # Parse arguments
    DEV_TOOLS=false
    SKIP_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev-tools)
                DEV_TOOLS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --dev-tools    Include development tools (Adminer, Redis Commander, MailHog)"
                echo "  --skip-build   Skip building images (use existing ones)"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run setup steps
    check_docker
    setup_env
    cleanup
    
    if [ "$SKIP_BUILD" = false ]; then
        prepare_images
    fi
    
    # Set profile for dev tools
    if [ "$DEV_TOOLS" = true ]; then
        export COMPOSE_PROFILES="dev-tools"
        print_info "Including development tools..."
    fi
    
    start_services
    
    # Check health
    if check_health; then
        show_info
    else
        print_warning "Some services may still be starting. Check logs with: $COMPOSE_CMD logs -f"
        show_info
    fi
}

# Run main function
main "$@"