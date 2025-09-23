#!/bin/bash

# Telehealth Platform Startup Script
# This script sets up and starts all necessary services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ASCII Art Header
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║      TELEHEALTH PLATFORM STARTUP        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_success ".env file created from template"
        print_warning "Please review .env file and update values if needed"
    else
        print_success ".env file exists"
    fi
    
    # Create logs directory
    mkdir -p logs
    print_success "Logs directory ready"
}

# Install dependencies
install_dependencies() {
    print_info "Installing backend dependencies..."
    
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Backend dependencies installed"
    else
        print_info "Dependencies already installed. Checking for updates..."
        npm install
    fi
    cd ..
}

# Start Docker services
start_docker_services() {
    print_info "Starting Docker services..."
    
    # Check if containers are already running
    if docker-compose ps | grep -q "Up"; then
        print_warning "Docker services are already running"
        read -p "Do you want to restart them? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Restarting Docker services..."
            docker-compose down
            docker-compose up -d
        fi
    else
        docker-compose up -d
    fi
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 5
    
    # Check PostgreSQL
    print_info "Checking PostgreSQL..."
    for i in {1..30}; do
        if docker exec telehealth_postgres pg_isready -U telehealth_user -d telehealth_db &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done
    
    # Check Redis
    print_info "Checking Redis..."
    if docker exec telehealth_redis redis-cli ping &> /dev/null; then
        print_success "Redis is ready"
    else
        print_error "Redis failed to start"
        exit 1
    fi
    
    print_success "All Docker services are running"
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    
    # Check if database is already initialized
    if docker exec telehealth_postgres psql -U telehealth_user -d telehealth_db -c "SELECT 1 FROM patients LIMIT 1;" &> /dev/null; then
        print_info "Database already initialized"
    else
        print_info "Creating database schema..."
        docker exec -i telehealth_postgres psql -U telehealth_user -d telehealth_db < database/init.sql
        print_success "Database schema created"
    fi
}

# Start backend server
start_backend() {
    print_info "Starting backend server..."
    
    cd backend
    
    # Kill any existing Node.js process on port 3001
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 3001 is already in use. Killing existing process..."
        kill -9 $(lsof -Pi :3001 -sTCP:LISTEN -t)
        sleep 2
    fi
    
    # Start the server in the background
    print_info "Starting backend server on port 3001..."
    npm run dev &
    
    # Store the PID
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # Wait for server to start
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Backend server is running"
    else
        print_warning "Backend server may still be starting..."
    fi
}

# Display status
display_status() {
    echo
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}    TELEHEALTH PLATFORM IS RUNNING!    ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo
    echo "📍 Services:"
    echo "   • Backend API: http://localhost:3001"
    echo "   • Health Check: http://localhost:3001/health"
    echo "   • Database UI: http://localhost:8080"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo
    echo "📝 Default Credentials:"
    echo "   • Database: telehealth_user / secure_password"
    echo
    echo "🛑 To stop all services:"
    echo "   ./stop.sh"
    echo
    echo "📖 Check README.md for API documentation"
    echo
}

# Cleanup function
cleanup() {
    print_warning "Shutting down..."
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    docker-compose down
    print_success "All services stopped"
}

# Set trap for cleanup on script exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    check_prerequisites
    setup_environment
    install_dependencies
    start_docker_services
    init_database
    start_backend
    display_status
    
    # Keep script running
    print_info "Press Ctrl+C to stop all services"
    
    # Wait for user interrupt
    while true; do
        sleep 1
    done
}

# Run main function
main
